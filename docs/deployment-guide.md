# Production Deployment Guide

> Step-by-step instructions for deploying the **Employee Task Dashboard** full-stack application (FastAPI backend and React frontend) to modern cloud platforms.

---

## 1. Architecture Overview for Deployment

The Employee Task Dashboard consists of two components:
1. **FastAPI Backend**:
   - Host: Python 3.10+ runtime.
   - Entry point: `backend.app.main:app`.
   - Production web server: `uvicorn` listening on dynamic `$PORT`.
   - Health check: `GET /health`.
   - Integrated Mock Services: Runs both CRM (`/api/crm/tasks`) and Helpdesk (`/api/helpdesk/tasks`) mock services within the same ASGI instance, avoiding the overhead and failure risks of separate hosting.
2. **React Frontend**:
   - Host: Static site host (Vercel, Render Static, Netlify, GitHub Pages, or Cloudflare Pages).
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - API target: Configured via `VITE_API_BASE_URL`.

---

## 2. Option A: Automated Blueprint Deployment on Render (Recommended)

The repository includes a ready-to-use `render.yaml` blueprint.

### Steps:
1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository. Render automatically reads `render.yaml` and provisions:
   - `workflow-backend` (FastAPI Web Service)
   - `workflow-dashboard` (Static Site connected to the backend)
5. Click **Apply**.
6. Render builds the Python dependencies, starts Uvicorn, builds the Vite frontend bundle, and links `VITE_API_BASE_URL` automatically.

---

## 3. Option B: Split Deployment (Render for Backend + Vercel for Frontend)

### Part 1: Deploy FastAPI Backend on Render
1. In Render, select **New +** > **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `workflow-backend`
   - **Region**: Closest region (e.g. Oregon or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `ENVIRONMENT`: `production`
   - `FRONTEND_ORIGIN`: `https://your-frontend-app.vercel.app,http://localhost:3000`
   - `REQUEST_TIMEOUT_SECONDS`: `3.5`
   - `BUSINESS_TIMEZONE`: `UTC`
5. Click **Create Web Service**.
6. Note the generated public URL (e.g., `https://workflow-backend.onrender.com`).
7. Verify health: `curl https://workflow-backend.onrender.com/health`.

### Part 2: Deploy React Frontend on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and import the repository.
3. Framework Preset: **Vite** (detected automatically).
4. Build and Output Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables:
   - Add `VITE_API_BASE_URL` with the value set to your backend URL: `https://workflow-backend.onrender.com`
6. Click **Deploy**.
7. Test the live site: Verify all tasks load, filter by employee, test search, and verify responsive design on mobile and desktop.

---

## 4. Option C: Containerized Deployment (Google Cloud Run / Docker)

The application can be packaged into an OCI container image:

### Dockerfile
```dockerfile
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.10-slim AS runner
WORKDIR /app
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist

ENV PORT=8080
ENV ENVIRONMENT=production
EXPOSE 8080

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Cloud Run Deploy Command
```bash
gcloud run deploy workflow-dashboard \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production,FRONTEND_ORIGIN=*
```

---

## 5. Post-Deployment Verification Checklist

Once deployed, execute the following smoke tests:

1. **Health Probe**:
   ```bash
   curl -s -i https://<YOUR-BACKEND-URL>/health
   # Must return HTTP 200 with status: "ok"
   ```
2. **Unified Tasks API**:
   ```bash
   curl -s https://<YOUR-BACKEND-URL>/api/tasks | jq '.total'
   # Must return 24
   ```
3. **CORS Validation**:
   - Open browser developer tools on the frontend domain.
   - Check Network tab for `/api/tasks` response headers: verify `access-control-allow-origin` is present.
4. **Interactive Dashboard**:
   - Filter by an employee (e.g., "Alex Rivera").
   - Filter by status ("In Progress").
   - Search for "webhook" (results must update reactively).
   - Click a task detail link (must open mock detail viewer in new tab).
   - Resize window to mobile view (must toggle hamburger drawer and render touch cards).
