
# TaskForge — Full-Stack Project & Task Management Dashboard

TaskForge is a full-stack web application designed to help users organise projects, manage tasks, and track progress through a responsive dashboard.

Built using React, TypeScript, Node.js, Express, and PostgreSQL, the application demonstrates modern frontend development, REST API integration, session-based authentication, and cloud deployment.

## Live Demo

**Live Application:** https://taskflow-dashboard-eight-rouge.vercel.app

**GitHub Repository:** https://github.com/EVANGELIN16/taskflow-dashboard

## Features

- User registration, login, and logout
- Session-based authentication with protected routes
- Responsive dashboard for desktop and mobile devices
- Project creation, viewing, editing, and deletion
- Task creation, viewing, editing, and deletion
- Project and task status management
- Integration with RESTful backend APIs
- Persistent data storage using PostgreSQL
- Secure session cookies for authentication
- Cloud-hosted frontend, backend, and database

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit and RTK Query
- React Router

### Backend
- Node.js
- Express.js
- TypeScript
- REST APIs
- Express Session
- connect-pg-simple

### Database
- PostgreSQL
- Prisma ORM
- Neon PostgreSQL

### Deployment
- Vercel — Frontend hosting
- Render — Backend hosting
- Neon — Cloud PostgreSQL database
- Git and GitHub — Version control

## Application Architecture

```text
User Browser
     |
     v
Vercel (React + TypeScript)
     |
     | /api requests
     v
Vercel API Reverse Proxy
     |
     v
Render (Node.js + Express)
     |
     v
Neon PostgreSQL Database
```

The frontend communicates with the Express backend through a Vercel reverse proxy. Authentication uses server-side sessions stored in PostgreSQL.

## Authentication

TaskForge implements session-based authentication with:

- User registration and login
- Protected frontend routes
- HTTP-only session cookies
- Server-side session storage
- Logout and session invalidation
- Cross-device browser support

## Project Management

Users can create, view, update, and delete projects, with project statuses such as:

- Planning
- In Progress
- Completed

## Task Management

Users can manage tasks through the application's task management interface, with data stored in PostgreSQL and accessed through REST APIs.

## Local Development

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Backend environment variables

### Frontend Setup

```bash
git clone https://github.com/EVANGELIN16/taskflow-dashboard.git
cd taskflow-dashboard
npm install
npm run dev
```

The frontend development server runs using Vite.

The backend must also be configured and running for authentication and data operations.

## Deployment

The application is deployed using three cloud services:

1. **Vercel:** Hosts the React frontend and proxies API requests.
2. **Render:** Hosts the Express backend.
3. **Neon:** Provides the PostgreSQL database.

## What I Learned

Developing TaskForge strengthened my experience in:

- Building reusable React components with TypeScript
- Managing server data using RTK Query
- Designing and integrating RESTful APIs
- Implementing session-based authentication
- Working with PostgreSQL and Prisma
- Deploying full-stack applications
- Troubleshooting cross-origin cookies and mobile authentication
- Debugging production deployment issues

## Future Improvements

- Advanced task filtering and search
- Team collaboration and role-based permissions
- Dashboard analytics and reporting
- Automated testing and CI/CD enhancements

## Author

**Evangelin Shamona**

GitHub: https://github.com/EVANGELIN16
