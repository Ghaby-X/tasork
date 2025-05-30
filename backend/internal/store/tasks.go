package store

import (
	"context"
	"errors"
	"log"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type TasksStore struct {
	db *dynamodb.Client
}

type Task struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func (s *TasksStore) Create(ctx context.Context, task *Task) (*dynamodb.PutItemOutput, error) {
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	item := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: "Task1"},
		"SortKey":      &types.AttributeValueMemberS{Value: "taskSort"},
		"taskId":       &types.AttributeValueMemberN{Value: "123"},
		"taskTitle":    &types.AttributeValueMemberS{Value: "Get your hair done"},
		"age":          &types.AttributeValueMemberN{Value: "30"},
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	}

	result, err := s.db.PutItem(ctx, input)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *TasksStore) BatchWriteData(item *dynamodb.BatchWriteItemInput) (*dynamodb.BatchWriteItemOutput, error) {
	batchWriteOutput, err := s.db.BatchWriteItem(context.Background(), item)
	if err != nil {
		log.Printf("failed to write items, %v", err)
		return nil, errors.New("could not create task")
	}
	return batchWriteOutput, nil
}

// function to get tasks from queryInput
func (s *TasksStore) QueryTask(queryInput dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	result, err := s.db.Query(context.Background(), &queryInput)
	if err != nil {
		log.Printf("failed to query input\n %v", err)
		return nil, err
	}

	return result, nil
}

// function to batch delete item
func (s *TasksStore) DeleteItem(deleteInput *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error) {
	result, err := s.db.DeleteItem(context.Background(), deleteInput)
	if err != nil {
		return nil, err
	}

	return result, err
}
