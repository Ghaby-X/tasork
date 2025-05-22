package utils

import (
	"context"
	"fmt"
	"net/url"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
)

type CognitoClient struct {
	AppClientId string
	Client      *cognitoidentityprovider.Client
}

// return a new cognito client
func NewCognitoClient(appClientId string) (*CognitoClient, error) {
	cfg, err := config.LoadDefaultConfig(context.Background())
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
	q.Set("lang", "es")

	u.RawQuery = q.Encode()
	return u.String()
}
