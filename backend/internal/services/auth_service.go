package services

import (
	"github.com/Ghaby-X/tasork/internal/store"
)

type AuthService struct {
	store *store.AuthStore
}

func NewAuthService(authStore *store.AuthStore) *AuthService {
	return &AuthService{authStore}
}
