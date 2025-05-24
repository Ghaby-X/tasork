package main

// importing necessary packages
import (
	"log"
	"net/http"
	"time"

	"github.com/Ghaby-X/tasork/internal/env"
	handler "github.com/Ghaby-X/tasork/internal/handlers"
	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/types"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// config to store server configuration
type config struct {
	addr          string
	cognitoConfig *types.CongitoConfig
}

// application definition
type application struct {
	config  config
	service *services.Services
}

// Using chi router to handle requests
func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// use logger and recoverer middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.GetString("WEB_URL", "http://localhost:3000")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	// Defining user routes
	userHandler := handler.NewUserHandler(app.service.Users)
	userHandler.RegisterRoutes(r)

	// Defining task routes
	taskHandler := handler.NewTaskHandler(app.service.Tasks)
	taskHandler.RegisterRoutes(r)

	// Defining auth routes
	authHandler := handler.NewAuthHandler(app.service.Auth, app.config.cognitoConfig)
	authHandler.RegisterRoutes(r)

	return r
}

// runs server
func (app *application) run(mux http.Handler) error {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	log.Printf("Server has started at %s", app.config.addr)
	return srv.ListenAndServe()
}
