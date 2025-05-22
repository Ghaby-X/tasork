package handler

import (
	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/go-chi/chi/v5"
)

type TaskHandler struct {
	service *services.TasksService
}

func NewTaskHandler(services *services.TasksService) *TaskHandler {
	return &TaskHandler{
		services,
	}
}

func (h *TaskHandler) RegisterRoutes(r chi.Router) {
	r.Route("/tasks", func(r chi.Router) {
		// r.Get("/", h.CreateTask)
	})
}

// func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
// 	result, err := h.service.CreateTask()
// 	if err != nil {
// 		utils.WriteError(w, http.StatusInternalServerError, err)
// 		return
// 	}

// 	utils.WriteJSON(w, http.StatusOK, result.Attributes)
// }
