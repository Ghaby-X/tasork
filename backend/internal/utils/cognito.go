package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/types"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
)

type CognitoClient struct {
	AppClientId string
	Client      *cognitoidentityprovider.Client
}

// return a new cognito client
func NewCognitoClient(appClientId string) (*CognitoClient, error) {
	// cognito_aws_access_key := env.GetString("COGNITO_ACCESS_KEY", "")
	// cognito_aws_secret_key := env.GetString("COGNITO_SECRET_KEY", "")
	// cognito_region := env.GetString("COGNITO_REGION", "")
	aws_region := env.GetString("AWS_REGION", "")
	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(aws_region))
	if err != nil {
		return nil, fmt.Errorf("could not load AWS config: %w", err)
	}

	client := cognitoidentityprovider.NewFromConfig(cfg)

	return &CognitoClient{
		AppClientId: appClientId,
		Client:      client,
	}, nil
}

// returns hosted login and signup url by cognito
func (c *CognitoClient) GetAuthURL(domain, region, clientId, redirectURL string) string {
	u := url.URL{
		Scheme: "https",
		Host:   domain,
		Path:   "/oauth2/authorize",
	}

	q := u.Query()
	q.Set("response_type", "code")
	q.Set("client_id", clientId)
	q.Set("redirect_uri", redirectURL)
	q.Set("lang", "en")

	u.RawQuery = q.Encode()
	return u.String()
}

// exchange authorization code for tokens url
func (c *CognitoClient) RetrieveTokensFromAuthorizationCode(authCode, domain, clientId, clientSecret, redirectURL string) (*types.TokenResponse, error) {
	tokenURL := fmt.Sprintf("https://%s/oauth2/token?grant_type=authorization_code&code=%s&redirect_uri=%s&client_id=%s", domain, authCode, redirectURL, clientId)

	// Prepare form data in the body
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("code", authCode)
	form.Set("redirect_uri", redirectURL)
	form.Set("client_id", clientId)

	req, err := http.NewRequest("POST", tokenURL, bytes.NewBufferString(""))
	if err != nil {
		return nil, fmt.Errorf("failed to create request %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientId, clientSecret)

	// Make request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make http request %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response, %w", err)
	}

	// Check for non-200 status
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed: status %d", resp.StatusCode)
	}

	var tokens types.TokenResponse
	if err := json.Unmarshal(body, &tokens); err != nil {
		return nil, fmt.Errorf("failed to parse token %w", err)
	}

	return &tokens, nil
}

func ConstructTokenVerifyURL() string {
	region := env.GetString("AWS_DEFAULT_REGION", "eu-west-1")
	poolId := env.GetString("COGNITO_USER_POOL_ID", "")
	url := fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, poolId)

	return url
}
