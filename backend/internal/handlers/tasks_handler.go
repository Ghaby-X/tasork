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
	"github.com/google/uuid"
)

type TaskHandler struct {
	service     *services.TasksService
	AuthService *services.AuthService
}

func NewTaskHandler(services *services.TasksService, AuthService *services.AuthService) *TaskHandler {
	return &TaskHandler{
		services,
		AuthService,
	}
}

func (h *TaskHandler) RegisterRoutes(r chi.Router) {
	r.With(h.AuthService.AuthorizeRegistrationMiddleWare).Route("/tasks", func(r chi.Router) {
		r.Get("/", h.handleGetAllTasks) // handle if a user or an id
		r.Post("/", h.CreateTask)
		r.Get("/{taskId}/view", h.handleGetTaskById)
		r.Get("/user/{userId}", h.handleGetTaskForUser)
		r.Get("/{taskId}/history", h.handleGetTaskHistoryById)
		r.Post("/{taskId}/update", h.handleUpdateTask)  // invoke by admins to update task
		r.Post("/{taskId}/history", h.handleTaskStatus) // update tasks status - normally invoked by non-admins
		r.Delete("/{taskId}", h.handleDeleteTask)

	})
}

// function to create task
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	// Get user from JWT token and dto objects from body
	var RequestDTO internal_types.CreateTaskDTO
	user := utils.GetUserFromRequest(r)

	err := utils.ParseJSONBody(r, &RequestDTO)
	if err != nil {
		log.Printf("could not parse user body: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("all fields are required"))
		return
	}

	// verify dto objects
	if len(RequestDTO.Tasktitle) < 3 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("task title should be greater than 3"))
		return
	}

	taskUUID := uuid.NewString()

	// create task
	err = h.service.CreateTask(&RequestDTO, user, taskUUID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	log.Printf("Creation of task has been successful")
	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "task created successfully"})
}

// function to get all task - either by tenant
func (h *TaskHandler) handleGetAllTasks(w http.ResponseWriter, r *http.Request) {
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	tokenUser := utils.GetUserFromRequest(r)
	pkey := tokenUser["custom:tenantId"]

	output, err := h.service.GetAllTaskBytenant(pkey, tableName)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, output)
}

// Get one particular task
func (h *TaskHandler) handleGetTaskById(w http.ResponseWriter, r *http.Request) {
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	tokenUser := utils.GetUserFromRequest(r)
	pkey := tokenUser["custom:tenantId"]
	taskId := chi.URLParam(r, "taskId")

	log.Printf("%s", taskId)
	output, err := h.service.GetOneTaskBytenant(pkey, tableName, taskId)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, output)
}

// Get Tasks For users
func (h *TaskHandler) handleGetTaskForUser(w http.ResponseWriter, r *http.Request) {
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")
	tokenUser := utils.GetUserFromRequest(r)
	pkey := tokenUser["custom:tenantId"]
	userpKey := chi.URLParam(r, "userId")

	output, err := h.service.GetAllTaskByUser(pkey, tableName, userpKey)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, output)
}

// handler to delete task
func (h *TaskHandler) handleDeleteTask(w http.ResponseWriter, r *http.Request) {
	taskId := chi.URLParam(r, "taskId")
	tokenUser := utils.GetUserFromRequest(r)
	tenantId := tokenUser["custom:tenantId"]
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	// Delete Task
	err := h.service.DeleteTask(taskId, tableName, tenantId)
	if err != nil {
		log.Printf("could not delete: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("failed to update task"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "task updated successfully"})
}

// Handle Task update
func (h *TaskHandler) handleUpdateTask(w http.ResponseWriter, r *http.Request) {
	taskId := chi.URLParam(r, "taskId")
	tokenUser := utils.GetUserFromRequest(r)
	tenantId := tokenUser["custom:tenantId"]
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	// Delete Task
	err := h.service.DeleteTask(taskId, tenantId, tableName)
	if err != nil {
		log.Printf("could not delete: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("failed to update task"))
		return
	}

	// get DTO from request body
	var RequestDTO internal_types.CreateTaskDTO
	user := utils.GetUserFromRequest(r)

	err = utils.ParseJSONBody(r, &RequestDTO)
	if err != nil {
		log.Printf("could not parse user body: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("all fields are required"))
		return
	}

	// verify dto objects
	if len(RequestDTO.Tasktitle) < 3 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("task title should be greater than 3"))
		return
	}

	// create task
	err = h.service.CreateTask(&RequestDTO, user, taskId)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	log.Printf("Updating of task has been successful")
	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "task updated successfully"})
}

// for tracking purpose we create task history
func (h *TaskHandler) handleTaskStatus(w http.ResponseWriter, r *http.Request) {
	// update task status for tenants as well as user (USER -TASK, TENANT - USER)
	// create task history - tasktitle, historyid, taskid, edited by,
	taskId := chi.URLParam(r, "taskId")
	tokenUser := utils.GetUserFromRequest(r)
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	var RequestDTO internal_types.CreateTaskHistory

	err := utils.ParseJSONBody(r, &RequestDTO)
	if err != nil {
		log.Printf("could not parse user body: %v", err)
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("all fields are required"))
		return
	}

	err = h.service.UpdateTaskStatus(RequestDTO, tokenUser, tableName, taskId)
	if err != nil {
		log.Printf("failed to update status, %v", err)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to update status"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, internal_types.SendJsonResponse{Message: "task updated successfully"})
}

// function to handle get task history
func (h *TaskHandler) handleGetTaskHistoryById(w http.ResponseWriter, r *http.Request) {
	taskId := chi.URLParam(r, "taskId")
	tableName := env.GetString("DYNAMODB_TABLE_NAME", "tasork")

	// invoke get tasks service
	data, err := h.service.GetTaskHistory(taskId, tableName)
	if err != nil {
		log.Printf("failed to get task history data: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Errorf("failed to get task history"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, data)
}
