# Task Management System UI

A Next.js-based UI for a Task Management System designed for field teams. This application allows admins to create and assign tasks to team members, while team members can view and update their assigned tasks.

## Features

- User authentication (admin and team member roles)
- Dashboard with task overview
- Task listing with filtering by status
- Task creation and assignment
- Task status updates
- Team member management

## Tech Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd task-management-ui
npm install
```

3. Create a `.env.local` file in the root directory with your API endpoint:

```
NEXT_PUBLIC_API_URL=https://your-api-endpoint.com
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - Reusable React components
- `/lib` - Utility functions and API services
- `/public` - Static assets

## Development Notes

- This UI is designed to work with a serverless backend API
- For development purposes, the application uses mock data
- To connect to a real API, update the API_URL in `/lib/api.ts`

## Deployment

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## License

MIT