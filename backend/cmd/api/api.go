package main

// importing necessary packages
import (
	"log"
	"net/http"
	"time"

	user "github.com/Ghaby-X/tasork/internal/handlers"
	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// application definition
type application struct {
	config  config
	service *services.Services
}

// config to store server configuration
type config struct {
	addr string
	db   dbConfig
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  string
}

// Using chi router to handle requests
func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// use logger and recoverer middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	// Defining user routes
	userHandler := user.NewHandler(app.service.Users)
	userHandler.RegisterRoutes(r)

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
