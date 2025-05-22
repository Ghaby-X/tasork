package store

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type AuthStore struct {
	db *dynamodb.Client
}
