# Tasork - Task Management System

Tasork is a serverless task management system built for field teams using AWS services. It allows admins to create and assign tasks to team members, while team members can view and update their assigned tasks.

## Project Structure

- `/backend` - Go backend API using AWS Lambda and DynamoDB
- `/infrastructure` - Terraform IaC for AWS resources

## Project Architecture

![image](https://github.com/user-attachments/assets/3a70a6a1-04d5-4ef1-9ff3-41eda4e0a491)


## Features

- User authentication and role-based access control
- Task creation and assignment
- Task status updates and history tracking
- User invitations and management
- Real-time notifications
- Deadline tracking and monitoring

## Getting Started

### Prerequisites

- Node.js 16+
- Go 1.18+
- AWS CLI configured
- Terraform (for infrastructure deployment)

### Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tasork.git
   cd tasork
   ```

2. Set up the backend:
   ```
   cd backend
   make setup
   ```

3. Set up the frontend:
   ```
   cd ../web-new
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the values according to your environment

5. Run locally:
   - Backend: `cd backend && make run`

## Deployment

### Backend Deployment

```
cd backend
make deploy
```

### Infrastructure Deployment

```
cd infrastructure
terraform init
terraform apply
```

## Documentation

For more detailed documentation:
- Backend API: See `/backend/README.md`
- Infrastructure: See `/infrastructure/README.md`

## License

[MIT License](LICENSE)
