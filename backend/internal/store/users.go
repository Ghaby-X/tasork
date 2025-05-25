package store

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type UsersStore struct {
	db *dynamodb.Client
}

// get all users from database
func (s *UsersStore) QueryDB(queryInput dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	result, err := s.db.Query(context.Background(), &queryInput)
	if err != nil {
		log.Printf("failed to query input\n %v", err)
		return nil, err
	}

	return result, nil
}

// queries dynamodb based on query input
func (s *UsersStore) CreateItem(item *dynamodb.PutItemInput) error {
	_, err := s.db.PutItem(context.Background(), item)
	if err != nil {
		return err
	}

	return nil
}
