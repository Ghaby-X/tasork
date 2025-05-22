package services

import (
	"github.com/Ghaby-X/tasork/internal/store"
)

type TasksService struct {
	store *store.TasksStore
}

func NewTaskService(taskstore *store.TasksStore) *TasksService {
	return &TasksService{taskstore}
}
