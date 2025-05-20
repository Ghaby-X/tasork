package user

import (
	"fmt"
	"net/http"

	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/utils"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *services.UsersService
}

func NewHandler(services *services.UsersService) *Handler {
	return &Handler{
		services,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		r.Get("/", h.GetAllUsers)
		r.Get("/id", h.GetUserById)
	})
}

func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello world"))
}

func (h *Handler) GetUserById(w http.ResponseWriter, r *http.Request) {
	sample_user := h.service.GetUserById(109)
	fmt.Println(sample_user)
	utils.WriteJSON(w, 200, sample_user)
}
