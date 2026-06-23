# Job Prediction

A complete career guidance and prediction platform for students.

This project combines:
- **Backend**: Node.js + Express APIs for career data, college search, roadmaps, AI chat, and content pages.
- **Frontend**: React + TypeScript + Vite user interface for an interactive mentor-style experience.

---

## What this app does

This app helps students and job seekers to:
- discover career options and recommendations
- compare colleges and educational paths
- generate roadmaps and study plans
- chat with an AI guidance assistant
- view dashboards, simulations, and study materials

The frontend loads data from the backend via REST endpoints.

---

## Prerequisites

Before running the project, make sure you have:
- Node.js version **18 or higher**
- npm installed (`npm --version`)
- Optional: `yarn` if you prefer it
- Optional: MongoDB running locally or a database URI

You can verify Node.js with:

```bash
node --version
npm --version
```

---

## Project folders

- `backend/` - Express server and API implementation
- `frontend/` - Vite-powered React application
- `.env` - optional environment configuration file at the repository root

---

## Backend setup (step-by-step)

### 1. Install backend dependencies

Open a terminal and run:

```bash
cd /Users/laptopbazaar/Desktop/job-predction/backend
npm install
```

This installs backend packages including:
- `express`
- `cors`
- `mongoose`
- `socket.io`
- `nodemon`
- `@langchain/*`

### 2. Configure backend environment variables

The backend reads `.env` from the project root. Create a file named `.env` next to `backend/`.

Example `.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/job_prediction
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=your_model_name
CORS_ORIGIN=http://localhost:5173
```

Explanation of keys:
- `PORT` — server port for the backend (default: `5001`)
- `MONGO_URI` — MongoDB connection string
- `AI_PROVIDER` — AI provider identifier (`groq`, etc.)
- `GROQ_API_KEY` / `GROQ_API` — API key for GROQ AI
- `OPENAI_API_KEY` — API key for OpenAI
- `AI_MODEL` — AI model name to use
- `CORS_ORIGIN` — allowed frontend origin, usually `http://localhost:5173`

> If you do not have AI keys, the backend may still run, but AI-related endpoints may not function.

### 3. Start the backend server

From the `backend` folder run:

```bash
npm run dev
```

This command uses `nodemon` to restart automatically when backend files change.

If you want to run without auto-reload:

```bash
npm start
```

### 4. Verify backend health

After starting the backend, open a new terminal and run:

```bash
curl http://localhost:5001/health
```

You should receive JSON similar to:

```json
{
  "status": "ok",
  "service": "Career Mentor AI",
  "ai": {
    "provider": "groq",
    "model": "default",
    "configured": true
  },
  "timestamp": "..."
}
```

If the request fails:
- confirm backend is running
- confirm `PORT` is set correctly
- confirm `CORS_ORIGIN` includes the frontend URL

---

## Frontend setup (step-by-step)

### 1. Install frontend dependencies

Open a second terminal and run:

```bash
cd /Users/laptopbazaar/Desktop/job-predction/frontend
npm install
```

This installs frontend packages including:
- `react`
- `react-dom`
- `vite`
- `typescript`
- `tailwindcss`
- `lucide-react`
- `@supabase/supabase-js`

### 2. Start the frontend

In the `frontend` folder run:

```bash
npm run dev
```

Vite will display a local development URL, usually:

```bash
http://localhost:5173
```

Open that URL in your browser.

### 3. Frontend environment

The frontend uses `VITE_API_URL` if configured. By default it points to:

```text
http://localhost:5001
```

If your backend runs on a different port or host, create a `.env` file in `frontend/` with:

```env
VITE_API_URL=http://localhost:5001
```

---

## How to use the app

1. Start the backend first.
2. Start the frontend second.
3. Open the frontend URL in a browser.
4. Navigate through pages like:
   - Home
   - Career
   - College
   - Roadmap
   - Chat
   - Dashboard
   - Compare
   - Simulations
   - Study Material
5. Use the chat assistant for career questions and save recommended careers.

---

## Backend API endpoints

The backend exposes these REST endpoints:

### Chat
- `POST /api/chat` — send a user message and get AI career guidance
- `GET /api/chat/session/:userId` — retrieve saved chat session data
- `POST /api/chat/session/:userId/saved-careers` — save a career recommendation

### Career
- `GET /api/career` — list careers
- `GET /api/career/suggestions` — request career suggestions by filters

### College
- `GET /api/colleges` — get college listings and filter results

### Roadmap
- `GET /api/roadmap` — list roadmap templates
- `POST /api/roadmap` — create a roadmap for a selected career

### Content
- `GET /api/content/compare` — comparison data for colleges/careers
- `GET /api/content/dashboard` — dashboard content
- `GET /api/content/home` — home page content
- `GET /api/content/materials` — study materials
- `GET /api/content/navigation` — nav menu content
- `GET /api/content/quick-questions` — quick chat questions
- `GET /api/content/settings` — app settings content
- `GET /api/content/simulations` — simulation data

---

## Frontend API helper

The frontend uses `frontend/src/lib/api.ts` to call backend APIs.

Important functions include:
- `sendChatMessage(...)`
- `getChatSession(userId)`
- `saveCareerToSession(userId, input)`
- `getCareers(category)`
- `getCareerSuggestions(filters)`
- `getColleges(filters)`
- `getRoadmapTemplates()`
- `createRoadmap(career)`
- `getCompareOptions()`
- `getDashboard()`
- `getHome()`
- `getNavigation()`
- `getMaterials(filters)`
- `getQuickQuestions()`
- `getSimulations()`

---

## Folder structure explained

### backend/
- `server.js` — starts the HTTP server and connects MongoDB
- `app.js` — Express app, routes, middleware, error handling
- `config/env.js` — loads `.env` variables and exports config
- `config/db.js` — MongoDB connection logic
- `routes/` — route definitions for API endpoints
- `controllers/` — route handlers that process requests
- `services/` — business logic and data processing
- `models/` — Mongoose schemas and database models
- `data/` — static JSON datasets used by the app
- `utils/` — helper functions for language, prompts, responses

### frontend/
- `src/` — React application code
- `src/pages/` — page components like `HomePage`, `ChatPage`, `CollegePage`
- `src/lib/api.ts` — backend API calls and data fetching helpers
- `index.css` — global styling and Tailwind directives
- `vite.config.ts` — Vite configuration

---

## Common commands

### Backend
```bash
cd backend
npm install
npm run dev      # start backend in development mode with nodemon
npm start        # start backend once
npm run health   # check backend health endpoint
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # start frontend dev server
npm run build    # build frontend for production
npm run preview  # preview production build locally
npm run lint     # run ESLint
npm run typecheck # run TypeScript type check
```

---

## Troubleshooting

### Backend issues
- If the server fails to start, check `.env` values, especially `PORT` and `MONGO_URI`.
- If MongoDB is not running, start your local database or use a hosted MongoDB URI.
- If the backend cannot reach the AI service, confirm your API key variables are correct.

### Frontend issues
- If Vite fails to start, verify all dependencies installed successfully.
- If the frontend is blank or broken, open browser console for network and JavaScript errors.
- If the frontend cannot call backend APIs, make sure `VITE_API_URL` or `CORS_ORIGIN` settings are correct.

### Common fixes
- Run `npm install` again in the failing folder.
- Restart both backend and frontend servers.
- Clear browser cache or use an incognito window.

---

## Deployment notes

This repository is currently set up for local development.

For production deployment, you will need to:
- build the frontend with `npm run build`
- host the frontend static files on a web server
- host the backend on a Node.js server
- configure environment variables securely
- enable a production MongoDB database
- set `CORS_ORIGIN` to the production frontend URL

---

## Keep improving this README

Add details for:
- new environment variables
- deployment instructions
- backend database models
- frontend routing and pages
- any third-party services used

Thank you for using this project.










