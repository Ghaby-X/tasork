package main

import (
	"log"

	"github.com/Ghaby-X/tasork/internal/db"
	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/store"
	"github.com/lpernett/godotenv"
)

func main() {
	// load envirounment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// define server configuration
	cfg := config{
		addr: env.GetString("ADDR", ":8080"),
		db: dbConfig{
			env.GetString("DB_ADDR", "root:root@tcp(localhost:3307)/tasork_db"),
			env.GetInt("DB_MAX_OPEN_CONNS", 30),
			env.GetInt("DB_MAX_IDLE_CONNS", 30),
			env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
	}

	// create database instance
	db, err := db.NewMySQLDB(cfg.db.addr)
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()
	log.Printf("database connection pool established")

	// connect database to store
	store := store.NewStorage(db)

	// connect store to server
	service := services.NewService(store)

	// create application
	app := &application{
		config:  cfg,
		service: service,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}
