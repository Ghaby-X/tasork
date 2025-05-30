package store

import (
	"context"

	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type AuthStore struct {
	db *dynamodb.Client
}

func (s *AuthStore) RegisterAdminTenant(tableName string, Item map[string]types.AttributeValue) (*dynamodb.PutItemOutput, error) {
	output, err := utils.InsertIntoDB(s.db, tableName, Item)
	if err != nil {
		return nil, err
	}
	return output, nil
}

// get item from database
func (s *AuthStore) GetItem(input dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	result, err := s.db.GetItem(context.Background(), &input)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// batch write item
func (s *AuthStore) BatchWriteItem(BatchInput *dynamodb.BatchWriteItemInput) error {
	_, err := s.db.BatchWriteItem(context.Background(), BatchInput)
	return err
}

func (s *AuthStore) CreateItem(tableName string, Item map[string]types.AttributeValue) (*dynamodb.PutItemOutput, error) {
	output, err := utils.InsertIntoDB(s.db, tableName, Item)
	if err != nil {
		return nil, err
	}
	return output, nil
}
