package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/store"
	internal_types "github.com/Ghaby-X/tasork/internal/types"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/MicahParks/keyfunc/v3"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	cip_types "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthService struct {
	store       *store.AuthStore
	Authkeyfunc keyfunc.Keyfunc
}

type TokenClaims struct {
	UserID     string `json:"sub"`
	TenantName string `json:"tenantName"`
	TenantID   string `json:"tenantID"`
	Email      string `json:"email"`
	Username   string `json:"userName"`
	Role       string `json:"role"`
}

func NewAuthService(authStore *store.AuthStore) *AuthService {
	jwkUrl := utils.ConstructTokenVerifyURL()
	AuthKeyfunc, err := keyfunc.NewDefault([]string{jwkUrl})
	if err != nil {
		log.Fatalf("Failed to create a keyfunc.Keyfunc from the server's URL.\nError: %s", err)

	}
	return &AuthService{
		authStore,
		AuthKeyfunc,
	}
}

// method to set cookies on client
func (s *AuthService) SetCookies(w http.ResponseWriter, tokens *internal_types.TokenResponse) {
	// set cookies with token
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "id_token",
		Value:    tokens.IDToken,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: false,
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Path:     "/auth",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: false,
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
	})
}

type ErrorMessage struct {
	Message string `json:"message"`
}

// authorize registration middleware
func (s *AuthService) AuthorizeRegistrationMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// extract and verify jwt structure
		Cookie := r.CookiesNamed("id_token")
		if len(Cookie) == 0 {
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("cookie not in request"))
			return
		}
		token := Cookie[0].Value

		// Parse the JWT.
		parsedToken, err := jwt.Parse(token, s.Authkeyfunc.Keyfunc)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("failed to parse the JWT.\nError: %w", err))
			return
		}

		if !parsedToken.Valid {
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("invalid access token"))
			return
		}

		// extract claims from json body
		jsonBody, err := json.Marshal(parsedToken.Claims.(jwt.MapClaims))
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to parse json"))
			return
		}

		var user internal_types.TokenClaims
		_ = json.Unmarshal(jsonBody, &user)

		// store claims in user context
		userContextKey := internal_types.ContextKey("user")
		ctx := context.WithValue(r.Context(), userContextKey, user)

		// onto the next handler
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// retrieve tokens from refresh token
func (s *AuthService) RetrieveTokensFromRefreshToken(r *http.Request, cognitoClient *utils.CognitoClient, ClientId, ClientSecret string) (*internal_types.AllTokens, error) {
	// extract refresh from request after parsing token in middleware
	cookie := r.CookiesNamed("refresh_token")
	if len(cookie) == 0 {
		log.Println("refresh cookie not in request")
		return nil, fmt.Errorf("refresh token not in request")
	}
	refresh_token := cookie[0].Value
	tokenOutput, err := cognitoClient.Client.GetTokensFromRefreshToken(context.Background(), &cognitoidentityprovider.GetTokensFromRefreshTokenInput{
		ClientId:     &ClientId,
		RefreshToken: &refresh_token,
	})
	if err != nil {
		log.Printf("failed to retrieve token from refresh token\nError: %v\n", err)
		return nil, err
	}
	// viewing all tokens
	tokens := &internal_types.AllTokens{
		AccessToken: *tokenOutput.AuthenticationResult.AccessToken,
		IDToken:     *tokenOutput.AuthenticationResult.IdToken,
	}

	return tokens, nil
}

// Register tenant in cognito and in dynamodb
func (s *AuthService) RegisterAdminTenant(cognitoClient *cognitoidentityprovider.Client, claims internal_types.TokenClaims, RequestBody internal_types.RegisterTenantDTO) (*dynamodb.PutItemOutput, error) {
	// extract variables from request as well as claims
	userId := fmt.Sprintf("USER#%s", claims["sub"])
	tenantName := RequestBody.TenantName
	tenantId := "TENANT#" + uuid.NewString()

	// update attributes in cognito
	poolId := env.GetString("COGNITO_USER_POOL_ID", "")
	userName := claims["cognito:username"]
	tenantNameStr := "custom:tenantName"
	tenantIDStr := "custom:tenantId"
	roleStr := "custom:role"
	roleValue := "admin"

	tenantNameAttribute := cip_types.AttributeType{Name: &tenantNameStr, Value: &tenantName}
	tenantIDAttribute := cip_types.AttributeType{Name: &tenantIDStr, Value: &tenantId}
	roleAttribute := cip_types.AttributeType{Name: &roleStr, Value: &roleValue}

	if userName == "" || poolId == "" {
		fmt.Print("failed to get user attributes. username and poolid is missing")
		return nil, fmt.Errorf("invalid username")
	}
	updateAttribute := &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserAttributes: []cip_types.AttributeType{tenantNameAttribute, tenantIDAttribute, roleAttribute},
		UserPoolId:     &poolId,
		Username:       &userName,
	}

	_, err := cognitoClient.AdminUpdateUserAttributes(context.Background(), updateAttribute)
	if err != nil {
		log.Printf("failed to update user attributes in cognito\nError: %v\n", err)
		return nil, err
	}

	// store attributes in database
	inputItem := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: tenantId},
		"SortKey":      &types.AttributeValueMemberS{Value: userId},
		"role":         &types.AttributeValueMemberS{Value: "admin"},
	}

	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	output, err := s.store.RegisterAdminTenant(tableName, inputItem)
	if err != nil {
		log.Printf("failed to create tenant in database\nError: %v\n", err)
		return nil, err
	}

	return output, err
}
