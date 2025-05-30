# Tasork Backend API

The backend for Tasork is built with Go and uses AWS serverless services including Lambda, API Gateway, DynamoDB, and Cognito.

## Architecture

- **API Gateway**: Routes HTTP requests to Lambda functions
- **Lambda**: Serverless functions handling business logic
- **DynamoDB**: NoSQL database for storing tasks, users, and notifications
- **Cognito**: User authentication and authorization

## Directory Structure

```
/backend
├── bin/            # Compiled binaries
├── cmd/            # Entry points for applications
├── docs/           # API documentation
├── internal/       # Private application code
│   ├── env/        # Environment configuration
│   ├── handlers/   # HTTP request handlers
│   ├── models/     # Data models
│   ├── repository/ # Data access layer
│   ├── services/   # Business logic
│   ├── types/      # Type definitions
│   └── utils/      # Utility functions
├── scripts/        # Build and deployment scripts
├── .air.toml       # Air configuration for live reload
├── .env            # Environment variables (development)
├── .env.production # Environment variables (production)
├── Dockerfile      # Docker configuration
├── go.mod          # Go module definition
└── Makefile        # Build automation
```

## Setup Instructions

### Prerequisites

- Go 1.18+
- AWS CLI configured with appropriate permissions
- DynamoDB (local or AWS)
- Docker (optional)

### Local Development

1. Install dependencies:
   ```
   go mod download
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run locally with hot reload:
   ```
   make dev
   ```

4. Run tests:
   ```
   make test
   ```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/register` - Register a new tenant

### Users

- `GET /users` - Get all users for a tenant
- `POST /users/invite` - Invite a user
- `POST /users/notification` - Get user notifications

### Tasks

- `GET /tasks` - Get all tasks for a tenant
- `POST /tasks` - Create a new task
- `GET /tasks/{taskId}/view` - Get task details
- `POST /tasks/{taskId}/update` - Update a task
- `POST /tasks/{taskId}/history` - Update task status and history

## Deployment

### Using Docker

1. Build the Docker image:
   ```
   docker build -t tasork-backend .
   ```

2. Run the container:
   ```
   docker run -p 8080:8080 -e ENV=production tasork-backend
   ```

### Using AWS Lambda

1. Build for Lambda:
   ```
   make build-lambda
   ```

2. Deploy to AWS:
   ```
   make deploy
   ```

## Environment Variables

- `AWS_REGION` - AWS region
- `DYNAMODB_TABLE_NAME` - DynamoDB table name
- `COGNITO_USER_POOL_ID` - Cognito user pool ID
- `COGNITO_CLIENT_ID` - Cognito client ID
- `JWT_SECRET` - Secret for JWT signing
- `PORT` - Port for local development (default: 8080)
- `ENV` - Environment (development, production)

## Using Production Environment

To use the production environment variables:

1. Create a `.env.production` file with your production settings
2. Run with production environment:
   ```
   ENV=production go run cmd/api/main.go
   ```
3. For Docker, use:
   ```
   docker run -p 8080:8080 -e ENV=production tasork-backend
   ```