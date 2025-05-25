package services

import (
	"fmt"
	"log"
	"strings"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/store"
	internal_types "github.com/Ghaby-X/tasork/internal/types"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
)

type UsersService struct {
	store *store.UsersStore
}

func NewUserService(userstore *store.UsersStore) *UsersService {
	return &UsersService{userstore}
}

type User struct {
	Id   int64  `json:"user_id"`
	Name string `json:"user_name"`
	Age  int64  `json:"user_age"`
}

// service to get all users
func (s *UsersService) GetAllUsers(tenantId, tableName string) ([]internal_types.CreateUser, error) {
	queryInput := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("PartitionKey = :pk AND begins_with(SortKey, :skprefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":       &types.AttributeValueMemberS{Value: tenantId},
			":skprefix": &types.AttributeValueMemberS{Value: "USER#"},
		},
	}

	// get users with query input
	retrievedUsers, err := s.store.QueryDB(queryInput)
	if err != nil {
		return nil, err
	}

	// marshal users
	var UserStruct []internal_types.CreateUser
	err = attributevalue.UnmarshalListOfMaps(retrievedUsers.Items, &UserStruct)
	if err != nil {
		return nil, err
	}

	return UserStruct, nil
}

// creating user invite
func (s *UsersService) CreateInviteUser(userDto internal_types.UserInvite, tenantId string) error {
	inviteUUID := uuid.NewString()
	tenantUUID, err := getUUIDfromString(tenantId)
	if err != nil {
		log.Printf("could not extract uuid")
		return err
	}

	inviteURL := createUserInviteTokenURL(inviteUUID, tenantUUID)
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	// create invite in db
	PartionKey := "INVITE#" + inviteUUID
	SortKey := tenantId

	item := map[string]types.AttributeValue{
		"PartitionKey": &types.AttributeValueMemberS{Value: PartionKey},
		"SortKey":      &types.AttributeValueMemberS{Value: SortKey},
		"role":         &types.AttributeValueMemberS{Value: userDto.Role},
		"email":        &types.AttributeValueMemberS{Value: userDto.Email},
	}

	inputItem := dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tableName),
	}

	// put items in database
	err = s.store.CreateItem(&inputItem)
	if err != nil {
		log.Printf("error storing user in database %v", err)
		return err
	}
	fmt.Printf("%s", inviteURL)
	return nil
}

func createUserInviteTokenURL(inviteUUID string, tenantId string) string {
	base_url := env.GetString("WEB_URL", "")
	url := fmt.Sprintf("%s/invite/%s/%s", base_url, tenantId, inviteUUID)
	return url
}

func getUUIDfromString(IdStr string) (string, error) {
	res := strings.Split(IdStr, "#")
	if len(res) < 2 {
		return "", fmt.Errorf("tenantId is not split")
	}

	return res[1], nil
}
