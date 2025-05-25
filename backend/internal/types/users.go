package types

// DTO for user creation and retrieving
type CreateUser struct {
	Username string `json:"userName"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	SortKey  string `json:"userId"`
}

// DTO for user invite
type UserInvite struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

// Invite user DTO
type InviteUserDTo struct {
	Username string `json:"userName"`
	Password string `json:"password"`
}

// InviteDetailsRetrievte
type RetrievedInviteDetails struct {
	PartitionKey string `json:"inviteId"`
	SortKey      string `json:"tenantId"`
	Email        string `json:"email"`
	Role         string `json:"role"`
}
