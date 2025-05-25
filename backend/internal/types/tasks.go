package types

type CreateTaskDTO struct {
	Tasktitle       string     `json:"taskTitle"`
	TaskDescription string     `json:"description"`
	Status          string     `json:"status"`
	Deadline        string     `json:"deadline"`
	CreatedAt       string     `json:"createdAt"`
	CreatedBy       string     `json:"createdBy"`
	Assignees       []Assignee `json:"assignee"`
}

type Assignee struct {
	Username string `json:"username"`
	UserId   string `json:"userId"`
	Email    string `json:"email"`
}

type CreateTaskHistory struct {
	Tasktitle         string `json:"taskTitle"`
	Status            string `json:"status"`
	Deadline          string `json:"deadline"`
	UpdateDescription string `json:"updateDescription"`
	UpdatedBy         string `json:"updatedBy"`
	UpdatedAt         string `json:"updatedAt"`
	TaskId            string `json:"taskId"`
}

type Notifications struct {
	UserId              string `json:"userId"`
	NotificationId      string `json:"notificationId"`
	NotificationMessage string `json:"notificationMessage"`
	CreatedAt           string `json:"createdAt"`
	RecipientId         string `json:"recipientId"`
}

type QueryTasksOutput struct {
	PartitionKey string `json:"partitionKey"`
	SortKey      string `json:"sortKey"`
	CreatedAt    string `json:"createdAt"`
	Createdby    string `json:"createdby"`
	Deadline     string `json:"deadline"`
	Description  string `json:"description"`
	// Role         string `json:"role"`
	Status    string `json:"status"`
	Tasktitle string `json:"tasktitle"`
	// UserName  string `json:"userName"`
}

type TaskAssignee struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	SortKey  string `json:"userId"`
}

type GetTasksOutput struct {
	Task     QueryTasksOutput `json:"task"`
	Assignee []TaskAssignee   `json:"assignee"`
}

type GetTaskHistory struct {
}

type UpdateTask struct {
	Reason string `json:"reason"`
	Status string `json:"status"`
}
