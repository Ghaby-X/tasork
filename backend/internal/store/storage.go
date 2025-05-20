package store

import (
	"database/sql"
)

type Storage struct {
	Tasks *TasksStore
	Users *UsersStore
}

func NewStorage(db *sql.DB) *Storage {
	return &Storage{
		Tasks: &TasksStore{db},
		Users: &UsersStore{db},
	}
}
