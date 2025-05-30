# Tasork Web Application

A modern task management system built with Next.js that integrates with the Tasork backend API.

## Features

- User authentication with AWS Cognito
- Task management (create, view, update, delete)
- Dashboard with task statistics
- Responsive design

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand for state management
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Navigate to the web directory:
   ```bash
   cd web-new
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

## Deployment

This application can be deployed to AWS Amplify. See the Amplify documentation for details on deployment.

## Integration with Backend

This frontend is designed to work with the Tasork backend API. Make sure the backend is running and accessible at the URL specified in your `.env.local` file.