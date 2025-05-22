package store

import "github.com/aws/aws-sdk-go-v2/service/dynamodb"

type Storage struct {
	Tasks *TasksStore
	Users *UsersStore
	Auth  *AuthStore
}

func NewStorage(db *dynamodb.Client) *Storage {
	return &Storage{
		Tasks: &TasksStore{db},
		Users: &UsersStore{db},
		Auth:  &AuthStore{db},
	}
}
