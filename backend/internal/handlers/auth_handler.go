package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Ghaby-X/tasork/internal/services"
	internal_types "github.com/Ghaby-X/tasork/internal/types"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	service       *services.AuthService
	cognitoConfig *internal_types.CongitoConfig
	cognitoClient *utils.CognitoClient
}

func NewAuthHandler(services *services.AuthService, cognitoConfig *internal_types.CongitoConfig) *AuthHandler {
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

// register routes for auth handler
func (h *AuthHandler) RegisterRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Get("/login", h.handleLogin)
		r.Get("/ping", h.handlePing)
		r.Get("/token", h.handleToken)
		r.With(h.service.AuthorizeRegistrationMiddleWare).Post("/registerTenant", h.handleTenantRegistration)
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

// authorize code oauth flow and send back tokens
func (h *AuthHandler) handleToken(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing authorization code in query"))
		return
	}

	// extract tokens from authorization code
	tokens, err := h.cognitoClient.RetrieveTokensFromAuthorizationCode(
		code,
		h.cognitoConfig.Domain,
		h.cognitoConfig.ClientId,
		h.cognitoConfig.ClientSecret,
		h.cognitoConfig.RedirectURL,
	)

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to retrieve token %w", err))
		return
	}

	h.service.SetCookies(w, tokens) // write cookies to header
	w.WriteHeader(http.StatusOK)
}

// handles registration of tenant
func (h *AuthHandler) handleTenantRegistration(w http.ResponseWriter, r *http.Request) {
	var err error

	// extract user from request after parsing token in middleware
	ctxkey := internal_types.ContextKey("user")
	claims := r.Context().Value(ctxkey).(internal_types.TokenClaims)

	// get request body
	var RequestBody internal_types.RegisterTenantDTO
	err = json.NewDecoder(r.Body).Decode(&RequestBody)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("could not decode json input"))
		log.Printf("could not decode json: %v", err)
		return
	}

	// register tenant
	_, err = h.service.RegisterAdminTenant(h.cognitoClient.Client, claims, RequestBody)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("%w", err))
		return
	}

	// retrieve and set updated tokens from cognito
	tokens_updated, err := h.service.RetrieveTokensFromRefreshToken(r, h.cognitoClient, h.cognitoConfig.ClientId, h.cognitoConfig.ClientSecret)
	if err != nil {
		log.Print("failed to retrieve refresh token")
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("failed to retrieve token\n %w", err))
		return
	}

	h.service.SetCookies(w, &internal_types.TokenResponse{
		AccessToken:  tokens_updated.AccessToken,
		IDToken:      tokens_updated.IDToken,
		RefreshToken: tokens_updated.RefreshToken,
	})

	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "tenant registered successfully"})
}
