package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	internal_types "github.com/Ghaby-X/tasork/internal/types"
)

func ParseJSONBody(r *http.Request, payload any) error {
	if r.Body == nil {
		return fmt.Errorf("missing request body")
	}

	return json.NewDecoder(r.Body).Decode(payload)
}

func WriteJSON(w http.ResponseWriter, status int, v any) error {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(v)
}

func WriteError(w http.ResponseWriter, status int, err error) {
	WriteJSON(w, status, map[string]string{"error": err.Error()})
}

// extract user from request context only works after authorization middleware
func GetUserFromRequest(r *http.Request) internal_types.TokenClaims {
	ctxkey := internal_types.ContextKey("user")
	claims := r.Context().Value(ctxkey).(internal_types.TokenClaims)

	return claims
}

func ParseDateToISOString(dateStr string) (string, error) {
	formats := []string{
		"2006-01-02",      // ISO date
		"02/01/2006",      // dd/mm/yyyy
		"2006/01/02",      // yyyy/mm/dd
		"02-01-2006",      // dd-mm-yyyy
		"January 2, 2006", // long form
		time.RFC3339,      // ISO full date/time
	}

	var parsed time.Time
	var err error

	for _, format := range formats {
		parsed, err = time.Parse(format, dateStr)
		if err == nil {
			// Convert to ISO 8601 (UTC)
			return parsed.UTC().Format(time.RFC3339), nil
		}
	}

	return "", errors.New("invalid date format")
}
