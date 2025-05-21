package db

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/lpernett/godotenv"
)

// function to create a new dynamodb client
func NewDynamoDbClient(aws_region string) (*dynamodb.Client, error) {
	// load environment variables containing aws credentials
	err := godotenv.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load env variables: %w", err)
	}

	// configuration for dynamodb NewDynamoDbClient
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(aws_region))
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	return client, nil
}
