package main

import (
	"log"

	"github.com/Ghaby-X/tasork/internal/db"
	"github.com/Ghaby-X/tasork/internal/env"
	"github.com/Ghaby-X/tasork/internal/services"
	"github.com/Ghaby-X/tasork/internal/store"
	"github.com/Ghaby-X/tasork/internal/types"
	"github.com/lpernett/godotenv"
)

func main() {
	// load envirounment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db, err := db.NewDynamoDbClient(env.GetString("AWS_REGION", "us-east-1"))
	if err != nil {
		log.Fatalf("Error creating dynamodb client: %v", err)
	}

	log.Printf("dynamodb client has been loaded successfully")
	// connect database to store
	store := store.NewStorage(db)

	// connect store to server
	service := services.NewService(store)

	// config for app
	cognitoConfig := &types.CongitoConfig{
		Domain:       env.GetString("COGNITO_DOMAIN", ""),
		ClientId:     env.GetString("COGNITO_CLIENTID", ""),
		ClientSecret: env.GetString("COGNITO_CLIENT_SECRET", ""),
		RedirectURL:  env.GetString("COGNITO_REDIRECT_URL", ""),
		Region:       env.GetString("COGNITO_REGION", ""),
	}

	config := config{
		addr:          env.GetString("ADDR", ":8080"),
		cognitoConfig: cognitoConfig,
	}

	// create application
	app := &application{
		service: service,
		config:  config,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}
