package handler

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/services"
	internal_types "github.com/Ghaby-X/tasork/internal/types"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/go-chi/chi/v5"
)

type UserHandler struct {
	service     *services.UsersService
	AuthService *services.AuthService
}

func NewUserHandler(services *services.UsersService, AuthService *services.AuthService) *UserHandler {
	return &UserHandler{
		services,
		AuthService,
	}
}

func (h *UserHandler) RegisterRoutes(r chi.Router) {
	r.With(h.AuthService.AuthorizeRegistrationMiddleWare).Route("/users", func(r chi.Router) {
		r.Get("/", h.GetAllUsers)
		r.Post("/invite", h.handleInviteUsers)
		r.Post("/notification", h.handleGetNotifications)
	})
}

// r.Post("/{userId}/deleteUser", h.handleDeleteUser)

// get users from tenantId
func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	tokenUser := utils.GetUserFromRequest(r)
	tenantId := tokenUser["custom:tenantId"]
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "")

	// get users from service
	users, err := h.service.GetAllUsers(tenantId, tableName)
	if err != nil {
		log.Printf("failed to retrieve users: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to retrieve users"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, users)
}

// create user in db and send token/url
func (h *UserHandler) handleInviteUsers(w http.ResponseWriter, r *http.Request) {
	user := utils.GetUserFromRequest(r)
	tenantId := user["custom:tenantId"]
	tenantName := user["custom:username"]

	var InviteUserDTO internal_types.UserInvite

	// parse json body
	err := utils.ParseJSONBody(r, &InviteUserDTO)
	if err != nil {
		log.Printf("could not parse user body: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("all fields are required"))
		return
	}

	// create invite in database and send email
	err = h.service.CreateInviteUser(InviteUserDTO, tenantId, tenantName)
	if err != nil {
		log.Printf("failed to create invite user: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("failed to send invite"))
	}

	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "Invite sent successfully"})
}

// get notifications of a user
func (h *UserHandler) handleGetNotifications(w http.ResponseWriter, r *http.Request) {
	user := utils.GetUserFromRequest(r)
	userId := "USER#" + user["sub"]
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "")

	// get notifications from service
	notifications, err := h.service.GetNotifications(userId, tableName)
	if err != nil {
		log.Printf("failed to retrieve notifications: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to retrieve notifications"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, notifications)
}
