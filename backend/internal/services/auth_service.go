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
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
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
		Path:     "/",
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
			log.Printf("id_token does not exist on cookie")
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("cookie not in request"))
			return
		}
		token := Cookie[0].Value

		// Parse the JWT.
		parsedToken, err := jwt.Parse(token, s.Authkeyfunc.Keyfunc)
		if err != nil {
			log.Printf("failed to pass token as jwt\n Error: %v", err)
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("failed to parse the JWT.\nError: %w", err))
			return
		}

		if !parsedToken.Valid {
			log.Printf("token is not valid %v", parsedToken)
			utils.WriteError(w, http.StatusUnauthorized, fmt.Errorf("invalid access token"))
			return
		}

		// extract claims from json body
		jsonBody, err := json.Marshal(parsedToken.Claims.(jwt.MapClaims))
		if err != nil {
			log.Printf("failed to extract claims from parsedToken: %v", err)
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
		ClientSecret: &ClientSecret,
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
	userNameStr := "custom:username"
	email := claims["email"]
	preferred_username := RequestBody.UserName
	tenantNameStr := "custom:tenantName"
	tenantIDStr := "custom:tenantId"
	roleStr := "custom:role"
	roleValue := "admin"

	tenantNameAttribute := cip_types.AttributeType{Name: &tenantNameStr, Value: &tenantName}
	tenantIDAttribute := cip_types.AttributeType{Name: &tenantIDStr, Value: &tenantId}
	roleAttribute := cip_types.AttributeType{Name: &roleStr, Value: &roleValue}
	userNameAttribute := cip_types.AttributeType{Name: &userNameStr, Value: &preferred_username}

	if poolId == "" {
		fmt.Print("failed to get poolid is missing")
		return nil, fmt.Errorf("invalid username")
	}
	updateAttribute := &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserAttributes: []cip_types.AttributeType{tenantNameAttribute, tenantIDAttribute, roleAttribute, userNameAttribute},
		UserPoolId:     &poolId,
		Username:       &email,
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
		"userName":     &types.AttributeValueMemberS{Value: preferred_username},
		"email":        &types.AttributeValueMemberS{Value: email},
	}

	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	output, err := s.store.RegisterAdminTenant(tableName, inputItem)
	if err != nil {
		log.Printf("failed to create tenant in database\nError: %v\n", err)
		return nil, err
	}

	// notification item
	notificationUUID := uuid.NewString()
	now := time.Now().UTC()
	isoString := now.Format(time.RFC3339)
	notificationItem := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: userId},
		"SortKey":      &types.AttributeValueMemberS{Value: "NOTIFICATION#" + notificationUUID},
		"message":      &types.AttributeValueMemberS{Value: "Welcome to tasork, a place for efficient task management"},
		"time":         &types.AttributeValueMemberS{Value: isoString},
	}

	_, err = s.store.CreateItem(tableName, notificationItem)
	if err != nil {
		log.Printf("failed to write notification: %s", err)
		return nil, err
	}

	// send Welcome message
	customMessage := fmt.Sprintf(
		`Welcome to Tasork!

	Organization "%s" has been created for you.

	You can now invite users and explore how Tasork makes task management effortless, efficient, and enjoyable.

	Log in to get started!`,
		tenantName, // replace with your actual variable
	)
	err = SendWelcomeMail(email, customMessage)
	if err != nil {
		log.Printf("failed to send welcome mail\nError: %v\n", err)
		return nil, err
	}

	return output, err
}

// Create User from invite
func (s *AuthService) CreateUserFromInvite(cognitoClient *utils.CognitoClient, InviteTokenDetails *internal_types.RetrievedInviteDetails, RequestBody internal_types.InviteUserDTo) error {
	userpoolId := env.GetString("COGNITO_USER_POOL_ID", "")
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	// create user in cognito
	userInput := cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId: &userpoolId,
		Username:   aws.String(InviteTokenDetails.Email),
		UserAttributes: []cip_types.AttributeType{
			{Name: aws.String("email"), Value: aws.String(InviteTokenDetails.Email)},
			{Name: aws.String("email_verified"), Value: aws.String("true")},
			{Name: aws.String("custom:role"), Value: aws.String(InviteTokenDetails.Role)},
			{Name: aws.String("custom:tenantId"), Value: aws.String(InviteTokenDetails.SortKey)},
			{Name: aws.String("custom:username"), Value: aws.String(RequestBody.Username)},
		},
	}
	output, err := cognitoClient.Client.AdminCreateUser(context.Background(), &userInput)
	if err != nil {
		return err
	}

	log.Printf("%v", output)

	// Extract the "sub" from the response
	var userID string
	for _, attr := range output.User.Attributes {
		if *attr.Name == "sub" {
			userID = *attr.Value
			break
		}

	}
	if userID == "" {
		return fmt.Errorf("sub not found in Cognito response")
	}

	// set password
	_, err = cognitoClient.Client.AdminSetUserPassword(context.Background(), &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(userpoolId),
		Username:   aws.String(InviteTokenDetails.Email),
		Password:   aws.String(RequestBody.Password),
		Permanent:  true,
	})

	if err != nil {
		return fmt.Errorf("failed to set permanent password: %w", err)
	}

	// input items to create user and also delete invite
	writeRequests := dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			tableName: {
				// Put user item
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"PartitionKey": &types.AttributeValueMemberS{Value: InviteTokenDetails.SortKey},
							"SortKey":      &types.AttributeValueMemberS{Value: "USER#" + userID},
							"role":         &types.AttributeValueMemberS{Value: InviteTokenDetails.Role},
							"userName":     &types.AttributeValueMemberS{Value: RequestBody.Username},
							"email":        &types.AttributeValueMemberS{Value: InviteTokenDetails.Email},
						},
					},
				},
				// Put notification item
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"PartitionKey": &types.AttributeValueMemberS{Value: "USER#" + userID},
							"SortKey":      &types.AttributeValueMemberS{Value: "NOTIFICATION#" + uuid.NewString()},
							"message":      &types.AttributeValueMemberS{Value: "Welcome to the team"},
							"time":         &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
						},
					},
				},
				// Delete invite item
				{
					DeleteRequest: &types.DeleteRequest{
						Key: map[string]types.AttributeValue{
							"PartitionKey": &types.AttributeValueMemberS{Value: InviteTokenDetails.PartitionKey},
							"SortKey":      &types.AttributeValueMemberS{Value: InviteTokenDetails.SortKey},
						},
					},
				},
			},
		},
	}

	// create user in db - item
	err = s.store.BatchWriteItem(&writeRequests)
	if err != nil {
		log.Printf("failed to create user from invite %v", err)
		return err
	}

	customMessage := `Welcome to Tasork!

		You've been added  to an organization on tasork, Experience a smarter way to manage tasks.

		Tasork is a powerful and efficient task management system built to help you stay organized, collaborate better, and get things done.

		Log in to explore your workspace and start contributing!`

	err = SendWelcomeMail(InviteTokenDetails.Email, customMessage)
	if err != nil {
		log.Printf("failed to send welcome mail %v", err)
		return err
	}

	return nil
}

func (s *AuthService) FetchInvite(inviteToken, tenantId string) (*internal_types.RetrievedInviteDetails, error) {
	PartitionKey := "INVITE#" + inviteToken
	SortKey := "TENANT#" + tenantId
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	queryInput := dynamodb.GetItemInput{
		Key: map[string]types.AttributeValue{
			"PartitionKey": &types.AttributeValueMemberS{Value: PartitionKey},
			"SortKey":      &types.AttributeValueMemberS{Value: SortKey},
		},
		TableName: &tableName,
	}

	// get output from db
	output, err := s.store.GetItem(queryInput)
	if err != nil {
		log.Printf("failed to get item: %v", err)
		return nil, err
	}

	// marshal output
	var inviteDetails internal_types.RetrievedInviteDetails
	err = attributevalue.UnmarshalMap(output.Item, &inviteDetails)
	if err != nil {
		log.Printf("failed to parse json: %v", err)
		return nil, err
	}

	return &inviteDetails, nil
}
