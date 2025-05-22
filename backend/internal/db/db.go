package db

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

// function to create a new dynamodb client
func NewDynamoDbClient(aws_region string) (*dynamodb.Client, error) {
	// configuration for dynamodb NewDynamoDbClient
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(aws_region))
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	return client, nil
}
