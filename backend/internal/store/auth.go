package store

import (
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
