package services

import "github.com/Ghaby-X/tasork/internal/store"

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

func (s *UsersService) GetUserById(id int64) *User {
	return &User{
		13,
		"gabby",
		23,
	}
}
