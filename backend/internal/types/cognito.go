package types

type TokenClaims map[string]string
type ContextKey string

type CongitoConfig struct {
	Domain       string
	ClientId     string
	ClientSecret string
	RedirectURL  string
	Region       string
}

// TokenResponse is the structure returned by Cognito
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	IDToken      string `json:"id_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

type AllTokens struct {
	AccessToken  string
	IDToken      string
	RefreshToken string
}

type RegisterTenantDTO struct {
	TenantName string `json:"tenantName"`
	UserName   string `json:"userName"`
}

type RegisterAdminTenantParam struct {
	TenantId string
	UserId   string
}

type SendJsonResponse struct {
	Message string `json:"message"`
}
