package store

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type UsersStore struct {
	db *dynamodb.Client
}

func (s *UsersStore) Create(ctx context.Context) error {
	return nil
}
