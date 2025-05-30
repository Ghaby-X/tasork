package services

import (
	"fmt"
	"log"
	"time"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/store"
	internal_types "github.com/Ghaby-X/tasork/internal/types"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
)

type TasksService struct {
	store *store.TasksStore
}

func NewTaskService(taskstore *store.TasksStore) *TasksService {
	return &TasksService{taskstore}
}

func (s *TasksService) CreateTask(data *internal_types.CreateTaskDTO, user internal_types.TokenClaims, taskUUID string, customMessage ...string) error {
	taskId := "TASK#" + taskUUID
	createdBy := "USER#" + user["sub"]
	tenantId := user["custom:tenantId"]

	// creation of task
	inputItem := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: tenantId},
		"SortKey":      &types.AttributeValueMemberS{Value: taskId},
		"tasktitle":    &types.AttributeValueMemberS{Value: data.Tasktitle},
		"description":  &types.AttributeValueMemberS{Value: data.TaskDescription},
		"status":       &types.AttributeValueMemberS{Value: data.Status},
		"deadline":     &types.AttributeValueMemberS{Value: data.Deadline},
		"createdAt":    &types.AttributeValueMemberS{Value: data.CreatedAt},
		"createdby":    &types.AttributeValueMemberS{Value: createdBy},
	}

	// write request for batch writes
	writeRequests := []types.WriteRequest{
		{
			PutRequest: &types.PutRequest{
				Item: inputItem,
			},
		},
	}

	for _, userStruct := range data.Assignees {
		writeRequests = append(writeRequests,
			// write tasks users
			types.WriteRequest{
				PutRequest: &types.PutRequest{
					Item: map[string]types.AttributeValue{
						"PartitionKey": &types.AttributeValueMemberS{Value: taskId},
						"SortKey":      &types.AttributeValueMemberS{Value: userStruct.UserId},
						"tasktitle":    &types.AttributeValueMemberS{Value: data.Tasktitle},
						"description":  &types.AttributeValueMemberS{Value: data.TaskDescription},
						"status":       &types.AttributeValueMemberS{Value: data.Status},
						"deadline":     &types.AttributeValueMemberS{Value: data.Deadline},
						"createdAt":    &types.AttributeValueMemberS{Value: data.CreatedAt},
						"createdby":    &types.AttributeValueMemberS{Value: createdBy},
						"userName":     &types.AttributeValueMemberS{Value: userStruct.Username},
						"email":        &types.AttributeValueMemberS{Value: userStruct.Email},
					},
				},
			},

			types.WriteRequest{
				PutRequest: &types.PutRequest{
					Item: map[string]types.AttributeValue{
						"PartitionKey": &types.AttributeValueMemberS{Value: userStruct.UserId},
						"SortKey":      &types.AttributeValueMemberS{Value: taskId},
						"tasktitle":    &types.AttributeValueMemberS{Value: data.Tasktitle},
						"description":  &types.AttributeValueMemberS{Value: data.TaskDescription},
						"status":       &types.AttributeValueMemberS{Value: data.Status},
						"deadline":     &types.AttributeValueMemberS{Value: data.Deadline},
						"createdAt":    &types.AttributeValueMemberS{Value: data.CreatedAt},
						"createdby":    &types.AttributeValueMemberS{Value: createdBy},
						"email":        &types.AttributeValueMemberS{Value: userStruct.Email},
						"userName":     &types.AttributeValueMemberS{Value: userStruct.Username},
					},
				},
			},
			// Notification Item
			types.WriteRequest{
				PutRequest: &types.PutRequest{
					Item: map[string]types.AttributeValue{
						"PartitionKey": &types.AttributeValueMemberS{Value: userStruct.UserId},
						"SortKey":      &types.AttributeValueMemberS{Value: "NOTIFICATION#" + uuid.NewString()},
						"message":      &types.AttributeValueMemberS{Value: fmt.Sprintf("'%s' has been assigned to you", data.Tasktitle)},
						"time":         &types.AttributeValueMemberS{Value: time.Now().Format(time.RFC3339)},
					},
				},
			},
		)
	}

	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	WriteItemInput := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			tableName: writeRequests,
		},
	}
	_, err := s.store.BatchWriteData(WriteItemInput)
	if err != nil {
		log.Printf("failed to create tenant in database\nError: %v\n", err)
		return err
	}
	return nil
}

func (s *TasksService) GetAllTaskBytenant(tenantId string, tableName string) ([]internal_types.GetTasksOutput, error) {
	taskQuery := dynamodb.QueryInput{
		TableName:              &tableName,
		KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pkey":     &types.AttributeValueMemberS{Value: tenantId},
			":skprefix": &types.AttributeValueMemberS{Value: "TASK#"},
		},
	}

	taskQueryOutput, err := s.store.QueryTask(taskQuery)
	if err != nil {
		return nil, err
	}

	// converts task to go struct
	var tasks []internal_types.QueryTasksOutput
	if err := attributevalue.UnmarshalListOfMaps(taskQueryOutput.Items, &tasks); err != nil {
		return nil, fmt.Errorf("failed to unmarshal tasks: %w", err)
	}

	var results []internal_types.GetTasksOutput // defining results

	// append tasks and their assignees
	for _, task := range tasks {
		userPK := task.SortKey // gets task id
		userInput := dynamodb.QueryInput{
			TableName:              &tableName,
			KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":pkey":     &types.AttributeValueMemberS{Value: userPK},
				":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
			},
		}

		userOutput, err := s.store.QueryTask(userInput)
		if err != nil {
			return nil, err
		}

		var TaskAssignee []internal_types.TaskAssignee
		if err := attributevalue.UnmarshalListOfMaps(userOutput.Items, &TaskAssignee); err != nil {
			return nil, fmt.Errorf("failed to unmarshal users for task %s: %w", task.SortKey, err)
		}

		results = append(results, internal_types.GetTasksOutput{
			Task:     task,
			Assignee: TaskAssignee,
		})
	}

	return results, nil
}

func (s *TasksService) GetOneTaskBytenant(tenantId string, tableName string, taskId string) (*internal_types.GetTasksOutput, error) {
	taskIdRefactor := "TASK#" + taskId
	taskQuery := dynamodb.QueryInput{
		TableName:              &tableName,
		KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pkey":     &types.AttributeValueMemberS{Value: tenantId},
			":skprefix": &types.AttributeValueMemberS{Value: taskIdRefactor},
		},
	}

	// query for tasks
	taskQueryOutput, err := s.store.QueryTask(taskQuery)
	if err != nil {
		return nil, err
	}

	// converts task to go struct
	var tasks []internal_types.QueryTasksOutput
	if err := attributevalue.UnmarshalListOfMaps(taskQueryOutput.Items, &tasks); err != nil {
		return nil, fmt.Errorf("failed to unmarshal tasks: %w", err)
	}

	if len(tasks) == 0 {
		return nil, nil
	}

	resultTask := tasks[0]
	var results internal_types.GetTasksOutput // defining results

	results.Task = resultTask

	// append tasks and their assignees
	taskPK := resultTask.SortKey // gets task id
	userInput := dynamodb.QueryInput{
		TableName:              &tableName,
		KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pkey":     &types.AttributeValueMemberS{Value: taskPK},
			":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
		},
	}

	// get assignees
	userOutput, err := s.store.QueryTask(userInput)
	if err != nil {
		return nil, err
	}

	var TaskAssignee []internal_types.TaskAssignee
	if err := attributevalue.UnmarshalListOfMaps(userOutput.Items, &TaskAssignee); err != nil {
		return nil, fmt.Errorf("failed to unmarshal users for task %s: %w", resultTask.SortKey, err)
	}

	log.Printf("%v", TaskAssignee)

	results = internal_types.GetTasksOutput{
		Task:     resultTask,
		Assignee: TaskAssignee,
	}

	return &results, nil
}

func (s *TasksService) GetAllTaskByUser(tenantId string, tableName string, userpKey string) ([]internal_types.GetTasksOutput, error) {
	userpKeyRefactored := "USER#" + userpKey

	// define query input
	taskQuery := dynamodb.QueryInput{
		TableName:              &tableName,
		KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pkey":     &types.AttributeValueMemberS{Value: userpKeyRefactored},
			":skprefix": &types.AttributeValueMemberS{Value: "TASK#"},
		},
	}

	taskQueryOutput, err := s.store.QueryTask(taskQuery) // make query
	if err != nil {
		return nil, err
	}

	// converts task to go struct
	var tasks []internal_types.QueryTasksOutput
	if err := attributevalue.UnmarshalListOfMaps(taskQueryOutput.Items, &tasks); err != nil {
		return nil, fmt.Errorf("failed to unmarshal tasks: %w", err)
	}

	var results []internal_types.GetTasksOutput // defining results

	// append tasks and their assignees
	for _, task := range tasks {
		userPK := task.SortKey // gets task id
		userInput := dynamodb.QueryInput{
			TableName:              &tableName,
			KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":pkey":     &types.AttributeValueMemberS{Value: userPK},
				":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
			},
		}

		userOutput, err := s.store.QueryTask(userInput)
		if err != nil {
			return nil, err
		}

		var TaskAssignee []internal_types.TaskAssignee
		if err := attributevalue.UnmarshalListOfMaps(userOutput.Items, &TaskAssignee); err != nil {
			return nil, fmt.Errorf("failed to unmarshal users for task %s: %w", task.SortKey, err)
		}

		results = append(results, internal_types.GetTasksOutput{
			Task:     task,
			Assignee: TaskAssignee,
		})
	}

	return results, nil
}

func (s *TasksService) DeleteTask(taskId, tenantId, tableName string) error {
	tenantKey := tenantId
	taskKey := fmt.Sprintf("TASK#%s", taskId)

	// Delete the task item
	_, err := s.store.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PartitionKey": &types.AttributeValueMemberS{Value: tenantKey},
			"SortKey":      &types.AttributeValueMemberS{Value: taskKey},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	// Get All users assigned to task
	queryInput := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("PartitionKey = :pk AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":       &types.AttributeValueMemberS{Value: taskKey},
			":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
		},
	}
	queryOutput, err := s.store.QueryTask(queryInput)
	if err != nil {
		return fmt.Errorf("failed to query user assignments: %w", err)
	}

	// Delete all User#... entries from Task#<taskId> and Task#<taskId> entries from User#...
	for _, item := range queryOutput.Items {
		var userId string
		if skAttr, ok := item["SortKey"].(*types.AttributeValueMemberS); ok {
			log.Printf("userId: %v", skAttr.Value)
			userId = skAttr.Value
		}

		// Delete User# from Task#
		_, err := s.store.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(tableName),
			Key: map[string]types.AttributeValue{
				"PartitionKey": &types.AttributeValueMemberS{Value: taskKey},
				"SortKey":      &types.AttributeValueMemberS{Value: userId},
			},
		})
		if err != nil {
			log.Printf("warning: failed to delete user-task assignment: %v", err)
		}

		// Delete Task# from User# (reverse mapping)
		_, err = s.store.DeleteItem(&dynamodb.DeleteItemInput{
			TableName: aws.String(tableName),
			Key: map[string]types.AttributeValue{
				"PartitionKey": &types.AttributeValueMemberS{Value: userId},
				"SortKey":      &types.AttributeValueMemberS{Value: taskKey},
			},
		})
		if err != nil {
			log.Printf("warning: failed to delete reverse user-task mapping: %v", err)
		}
	}

	return nil
}

func (s *TasksService) UpdateTaskStatus(data internal_types.CreateTaskHistory, user internal_types.TokenClaims, tableName, taskUUID string) error {
	taskId := "TASK#" + taskUUID
	createdBy := "USER#" + user["sub"]
	tenantId := user["custom:tenantId"]

	historyUUID := uuid.NewString()
	historyId := "HISTORY#" + historyUUID

	// update status of particular task
	inputItem := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: tenantId},
		"SortKey":      &types.AttributeValueMemberS{Value: taskId},
		"status":       &types.AttributeValueMemberS{Value: data.Status},
	}

	HistoryInputItem := map[string]types.AttributeValue{
		"PartitionKey":      &types.AttributeValueMemberS{Value: taskId},
		"SortKey":           &types.AttributeValueMemberS{Value: historyId},
		"status":            &types.AttributeValueMemberS{Value: data.Status},
		"updatedby":         &types.AttributeValueMemberS{Value: createdBy},
		"updatedAt":         &types.AttributeValueMemberS{Value: data.UpdatedAt},
		"updateDescription": &types.AttributeValueMemberS{Value: data.UpdateDescription},
	}

	// write request for batch writes
	writeRequests := []types.WriteRequest{
		{
			PutRequest: &types.PutRequest{
				Item: inputItem,
			},
		},
		{
			PutRequest: &types.PutRequest{
				Item: HistoryInputItem,
			},
		},
	}

	// update status of User-task
	// Get All users assigned to task
	queryInput := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("PartitionKey = :pk AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":       &types.AttributeValueMemberS{Value: taskId},
			":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
		},
	}
	queryOutput, err := s.store.QueryTask(queryInput)
	if err != nil {
		return fmt.Errorf("failed to query user assignments: %w", err)
	}

	status := data.Status

	// update status for all users
	for _, item := range queryOutput.Items {
		var userId string
		if skAttr, ok := item["SortKey"].(*types.AttributeValueMemberS); ok {
			log.Printf("userId: %v", skAttr.Value)
			userId = skAttr.Value
		}

		// append write requests
		writeRequests = append(writeRequests,
			types.WriteRequest{
				PutRequest: &types.PutRequest{
					Item: map[string]types.AttributeValue{
						"PartitionKey": &types.AttributeValueMemberS{Value: taskId},
						"SortKey":      &types.AttributeValueMemberS{Value: userId},
						"status":       &types.AttributeValueMemberS{Value: status},
					},
				},
			},
			types.WriteRequest{
				PutRequest: &types.PutRequest{
					Item: map[string]types.AttributeValue{
						"PartitionKey": &types.AttributeValueMemberS{Value: userId},
						"SortKey":      &types.AttributeValueMemberS{Value: taskId},
						"status":       &types.AttributeValueMemberS{Value: status},
					},
				},
			},
		)
	}

	WriteItemInput := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			tableName: writeRequests,
		},
	}

	_, err = s.store.BatchWriteData(WriteItemInput)
	if err != nil {
		return err
	}

	return nil
}

func (s *TasksService) GetTaskHistory(taskId, tableName string) ([]internal_types.GetTaskHistory, error) {
	taskKeyRefactored := "TASK#" + taskId

	inputItem := dynamodb.QueryInput{
		TableName:              &tableName,
		KeyConditionExpression: aws.String("PartitionKey = :pkey AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pkey":     &types.AttributeValueMemberS{Value: taskKeyRefactored},
			":skprefix": &types.AttributeValueMemberS{Value: "HISTORY#"},
		},
	}

	taskQueryOutput, err := s.store.QueryTask(inputItem)
	if err != nil {
		return nil, err
	}

	// converts task to go struct
	var taskHistory []internal_types.GetTaskHistory
	if err := attributevalue.UnmarshalListOfMaps(taskQueryOutput.Items, &taskHistory); err != nil {
		return nil, fmt.Errorf("failed to unmarshal tasks: %w", err)
	}

	return taskHistory, nil
}
