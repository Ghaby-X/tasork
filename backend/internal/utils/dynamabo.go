package utils

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func InsertIntoDB(database *dynamodb.Client, tableName string, Item map[string]types.AttributeValue) (*dynamodb.PutItemOutput, error) {
	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      Item,
	}

	// create context
	ctx := context.Background()
	result, err := database.PutItem(ctx, input)
	if err != nil {
		return nil, err
	}

	return result, nil
}
