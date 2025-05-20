package services

import (
	"github.com/Ghaby-X/tasork/internal/store"
)

type Services struct {
	Users *UsersService
}

func NewService(servicestore *store.Storage) *Services {
	return &Services{
		NewUserService(servicestore.Users),
	}
}
