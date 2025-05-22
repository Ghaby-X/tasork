package services

import (
	"github.com/Ghaby-X/tasork/internal/store"
)

type Services struct {
	Users *UsersService
	Tasks *TasksService
	Auth  *AuthService
}

func NewService(servicestore *store.Storage) *Services {
	return &Services{
		NewUserService(servicestore.Users),
		NewTaskService(servicestore.Tasks),
		NewAuthService(servicestore.Auth),
	}
}
