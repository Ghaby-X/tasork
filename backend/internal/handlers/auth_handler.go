package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/types"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	service       *services.AuthService
	cognitoConfig *types.CongitoConfig
	cognitoClient *utils.CognitoClient
}

func NewAuthHandler(services *services.AuthService, cognitoConfig *types.CongitoConfig) *AuthHandler {
	cognitoClient, err := utils.NewCognitoClient(cognitoConfig.ClientId)
	if err != nil {
		log.Fatalf("could not create cognito client")
	}

	return &AuthHandler{
		services,
		cognitoConfig,
		cognitoClient,
	}
}

func (h *AuthHandler) RegisterRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Get("/login", h.handleLogin)
		r.Get("/ping", h.handlePing)
	})
}

type LoginResponse struct {
	Url string `json:"login_url"`
}

// returns a json consisting of amazon hosted login url for our application
func (h *AuthHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	login_url := h.cognitoClient.GetAuthURL(h.cognitoConfig.Domain, h.cognitoConfig.Region, h.cognitoConfig.ClientId, h.cognitoConfig.RedirectURL)
	result := &LoginResponse{login_url}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(false)

	encoder.Encode(result)
}

// check if auth handler is live
func (h *AuthHandler) handlePing(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("successfully pinged auth handler"))
}
