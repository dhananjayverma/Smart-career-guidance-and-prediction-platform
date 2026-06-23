# Job Prediction

A complete career guidance platform for students, built with a React + Vite frontend and an Express backend. This project provides career recommendations, college comparisons, roadmaps, AI chat help, dashboards, simulations, and study resources.

## Project Overview

- `backend/` contains the Node.js Express server and all API routes.
- `frontend/` contains the React + TypeScript application built with Vite.
- The backend loads optional environment variables from a `.env` file at the repository root.

## What this app does

- Provides career suggestion and prediction data
- Lets users explore colleges and compare options
- Builds roadmaps and study plans
- Includes an AI-powered chat assistant
- Displays dashboard metrics, simulations, and materials

## Prerequisites

Before you start, make sure you have:

- Node.js 18 or higher installed
- npm available (`npm --version`)
- Optional: `yarn` if you prefer it instead of npm

## Setup Instructions

Follow these steps one by one. Do not skip any part.

### 1. Install backend dependencies

1. Open a terminal.
2. Go to the backend folder:

```bash
cd /Users/laptopbazaar/Desktop/job-predction/backend
```
3. Install packages:

```bash
npm install
```

This installs the backend dependencies like `express`, `cors`, `mongoose`, `socket.io`, and `nodemon`.

### 2. Configure backend environment variables

The backend can read settings from a `.env` file in the repository root. Create a file named `.env` if it does not exist.

Example `.env` values:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/job_prediction
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=your_model_name
CORS_ORIGIN=http://localhost:5173
```

Important:

- `PORT` controls the backend port.
- `MONGO_URI` defines the MongoDB connection string.
- `AI_PROVIDER` can be `groq` or another supported provider.
- `CORS_ORIGIN` controls which frontend origins can call the backend.

### 3. Start the backend server

Run this command from the backend folder:

```bash
npm run dev
```

This starts the server with `nodemon`, which reloads automatically when backend files change.

If you want to run the server without automatic reload:

```bash
npm start
```

### 4. Verify backend is running

Open your browser or use a tool like `curl` to check the health endpoint:

```bash
curl http://localhost:5001/health
```

The response should include JSON with status and AI provider details.

### 5. Install frontend dependencies

Open another terminal and go to the frontend folder:

```bash
cd /Users/laptopbazaar/Desktop/job-predction/frontend
npm install
```

This installs the frontend dependencies like `react`, `react-dom`, `vite`, `typescript`, and `tailwindcss`.

### 6. Start the frontend app

Run the frontend dev server:

```bash
npm run dev
```

Vite will show a local development URL, usually `http://localhost:5173`.

### 7. Open the app in your browser

Visit the URL shown by Vite. The frontend should connect to the backend APIs automatically if the backend is running.

## Folder Structure Explained

### backend/

- `server.js` - starts the HTTP server and connects to the database
- `app.js` - defines Express routes and middleware
- `config/env.js` - loads environment variables from `.env`
- `config/db.js` - connects to MongoDB
- `routes/` - route definitions for chat, career, college, roadmap, and content APIs
- `controllers/` - controller functions for each route
- `services/` - business logic and data processing services
- `data/` - static JSON data used by the app
- `models/` - Mongoose models for database entities
- `utils/` - utility helpers like prompt builders and response formatters

### frontend/

- `src/` - main React application code
- `src/pages/` - page components such as Home, Chat, College, Career, Roadmap, Dashboard, etc.
- `src/lib/api.ts` - frontend API helper functions
- `index.css` - global CSS and Tailwind setup
- `vite.config.ts` - Vite build configuration

## Common commands

### Backend commands

```bash
cd backend
npm install
npm run dev      # run with nodemon
npm start        # run once
npm run health   # check health endpoint
```

### Frontend commands

```bash
cd frontend
npm install
npm run dev      # run development server
npm run build    # build production files
npm run preview  # preview production build
npm run lint     # run ESLint checks
npm run typecheck# run TypeScript type check
```

## Troubleshooting

- If the backend fails to start, verify your `.env` file and MongoDB connection.
- If the frontend cannot connect to the backend, make sure `CORS_ORIGIN` includes the frontend host.
- If dependencies fail to install, update Node.js to version 18 or newer.

## Final Notes

This README gives complete step-by-step instructions for both backend and frontend. Update the file if you add new features, deployment steps, or environment variables.
