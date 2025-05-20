package store

import (
	"context"
	"database/sql"
	"fmt"
)

type TasksStore struct {
	db *sql.DB
}

type Task struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func (s *TasksStore) Create(ctx context.Context, task *Task) error {
	query := `
				INSERT INTO tasks (title, description)
				WHERE ($1, $2) RETURNING id, created_at, updated_at;
	`

	fmt.Println(query)

	return nil
}

func (s *TasksStore) GetAllTasks() (*Task, error) {
	sample_task := Task{
		100,
		"Get your hair done",
		"My first task",
		"2024-12-12",
		"2024-12-12",
	}

	return &sample_task, nil
}
