package handler

import (
	"fmt"
	"net/http"

	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/go-chi/chi/v5"
)

type UserHandler struct {
	service *services.UsersService
}

func NewUserHandler(services *services.UsersService) *UserHandler {
	return &UserHandler{
		services,
	}
}

func (h *UserHandler) RegisterRoutes(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		r.Get("/", h.GetAllUsers)
		r.Get("/id", h.GetUserById)
	})
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello world"))
}

func (h *UserHandler) GetUserById(w http.ResponseWriter, r *http.Request) {
	sample_user := h.service.GetUserById(109)
	fmt.Println(sample_user)
	utils.WriteJSON(w, 200, sample_user)
}
