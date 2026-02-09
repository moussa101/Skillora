# Deployment Guide

Complete guide for deploying Skillora in development, production, and demo environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Local Development (Docker)](#local-development-docker)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
  - [Option 1: VPS / Cloud VM](#option-1-vps--cloud-vm)
  - [Option 2: Render](#option-2-render)
  - [Option 3: Railway](#option-3-railway)
- [Quick Sharing (ngrok)](#quick-sharing-ngrok)
- [Database Setup (Supabase)](#database-setup-supabase)
- [SSL & Domain Configuration](#ssl--domain-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker Desktop | 20.10+ | Container runtime |
| Docker Compose | 2.0+ | Service orchestration |
| Git | 2.30+ | Source control |
| Supabase account | — | Managed PostgreSQL database |

**Optional:**
- GitHub Personal Access Token — increases GitHub API rate limits (60 → 5,000 req/hr)
- Resend API key — for email verification and password reset
- OAuth app credentials — for GitHub/Google sign-in

---

## Architecture Overview

Skillora runs as **3 Docker containers** backed by a **Supabase** (hosted PostgreSQL) database:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Frontend        │     │  Backend API     │     │  ML Service      │
│  Next.js 16      │────▶│  NestJS 11       │────▶│  FastAPI         │
│  Port: 3001      │     │  Port: 3000      │     │  Port: 8000      │
│  skillora_frontend│    │  skillora_backend │     │  skillora_ml     │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                          ┌───────▼────────┐
                          │   Supabase     │
                          │  (PostgreSQL)  │
                          └────────────────┘
```

| Container | Base Image | Memory | Notes |
|-----------|-----------|--------|-------|
| `skillora_ml` | `python:3.11-slim` | ~2GB | Loads NLP models on startup |
| `skillora_backend` | `node:20-alpine` | ~256MB | Runs Prisma migrations + seed on start |
| `skillora_frontend` | `node:20-alpine` | ~128MB | Static build served by Node |

> **Recommended Docker memory:** 4GB+ (the ML service loads sentence-transformer models)

---

## Local Development (Docker)

### 1. Clone and configure

```bash
git clone https://github.com/moussa101/AI-Resume-Analyzer.git
cd AI-Resume-Analyzer
cp .env.example .env
```

### 2. Set required environment variables

Edit `.env` and add your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Build and start

```bash
docker compose up --build
```

### 4. Verify services

| Service | URL | Check |
|---------|-----|-------|
| Frontend | http://localhost:3001 | Web UI loads |
| Backend API | http://localhost:3000 | Swagger at `/api` |
| ML Service | http://localhost:8000/docs | FastAPI docs |
| ML Health | http://localhost:8000/health | Returns `{"status":"healthy"}` |

### 5. Pre-seeded accounts

The backend automatically seeds these accounts on first run:

| Account | Email | Password | Role | Tier |
|---------|-------|----------|------|------|
| Admin | `admin@skillora.com` | `Admin@123` | ADMIN | PRO |
| Recruiter | `recruiter@skillora.com` | `Recruiter@123` | RECRUITER | RECRUITER |

### Useful commands

```bash
# Start in detached mode
docker compose up --build -d

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f ml-service

# Rebuild a single service
docker compose up --build backend-api
docker compose up --build frontend-client
docker compose up --build ml-service

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase pooled connection string | `postgresql://postgres.xxx:pwd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection string | `postgresql://postgres.xxx:pwd@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Secret key for JWT token signing | `change-this-in-production` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for email | _(disabled if empty)_ |
| `RESEND_FROM_EMAIL` | Sender email address | `onboarding@resend.dev` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | _(disabled if empty)_ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | _(disabled if empty)_ |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback | `http://localhost:3000/auth/github/callback` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | _(disabled if empty)_ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | _(disabled if empty)_ |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback | `http://localhost:3000/auth/google/callback` |
| `GITHUB_TOKEN` | GitHub PAT for profile analysis | _(60 req/hr without)_ |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:3000` |

---

## Production Deployment

### Option 1: VPS / Cloud VM

Best for: full control, persistent deployment, custom domains.

**Recommended providers:** DigitalOcean ($12/mo), Hetzner (€4.5/mo), AWS EC2, Google Cloud.

#### Steps

1. **Provision a VM** with Docker installed (Ubuntu 22.04+ recommended, 4GB RAM minimum)

2. **Clone and configure**
   ```bash
   git clone https://github.com/moussa101/AI-Resume-Analyzer.git
   cd AI-Resume-Analyzer
   cp .env.example .env
   nano .env  # Add production credentials
   ```

3. **Update environment for production**
   ```env
   JWT_SECRET=<strong-random-secret>
   FRONTEND_URL=https://yourdomain.com
   GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   ```

4. **Start with Docker Compose**
   ```bash
   docker compose up --build -d
   ```

5. **Set up reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api/ {
           proxy_pass http://localhost:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Add SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 2: Render

Best for: easy deployment, free tier for demos.

> **Note:** Render free tier spins down after inactivity (cold starts ~30s). Free PostgreSQL expires after 30 days.

1. Push code to GitHub
2. Sign up at [render.com](https://render.com) with GitHub
3. Create **3 Web Services** from your repository:

| Service | Root Directory | Docker Context | Port |
|---------|---------------|----------------|------|
| ml-service | `ml_service/` | `./ml_service` | 8000 |
| backend-api | `backend/` | `./backend` | 3000 |
| frontend-client | `frontend/` | `./frontend` | 3000 |

4. Add environment variables in each service's dashboard
5. Set `ML_SERVICE_URL` in backend to the Render URL of your ml-service

### Option 3: Railway

Best for: simple Docker deployments with a generous free tier.

1. Sign up at [railway.app](https://railway.app)
2. Create a new project from GitHub repo
3. Railway auto-detects `docker-compose.yml` and creates services
4. Add environment variables in the dashboard
5. Railway provides public URLs automatically

---

## Quick Sharing (ngrok)

For quick demos without deploying to a server:

1. **Install ngrok:** [ngrok.com/download](https://ngrok.com/download)

2. **Start your app locally:**
   ```bash
   docker compose up --build -d
   ```

3. **Expose the frontend:**
   ```bash
   ngrok http 3001
   ```

4. **Share the URL** — ngrok provides a public URL like `https://a1b2-c3d4.ngrok-free.app`

> This only works while your machine is running. For persistent access, use a production deployment.

---

## Database Setup (Supabase)

Skillora uses [Supabase](https://supabase.com) for its PostgreSQL database.

### 1. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. Note your project password

### 2. Get connection strings

Go to **Settings → Database → Connection string** and copy:

- **URI (Transaction / Pooler)** → use as `DATABASE_URL` (port 6543, append `?pgbouncer=true`)
- **URI (Session / Direct)** → use as `DIRECT_URL` (port 5432)

### 3. Migrations

Migrations run automatically when the backend container starts. To run manually:

```bash
cd backend
npx prisma migrate deploy
```

---

## SSL & Domain Configuration

For production, always use HTTPS:

1. **Domain:** Point your domain's A record to your server IP
2. **SSL:** Use Let's Encrypt with Certbot (free) or Cloudflare (free proxy)
3. **Update `.env`:** Set all URLs to use `https://`
4. **Update OAuth:** Update callback URLs in GitHub/Google OAuth app settings

---

## Monitoring & Health Checks

### Built-in health checks

The ML service has a health check endpoint used by Docker:

```bash
curl http://localhost:8000/health
# {"status":"healthy","version":"1.1.0"}
```

Docker Compose is configured with automatic health checks:
- **Interval:** Every 10 seconds
- **Timeout:** 5 seconds
- **Retries:** 3
- **Start period:** 30 seconds (allows model loading)

### Container status

```bash
docker compose ps          # View running containers
docker stats               # Live resource usage
docker compose logs -f     # Stream all logs
```

---

## Troubleshooting

### Containers fail to start

```bash
# Reset everything and rebuild
docker compose down -v
docker compose up --build
```

### ML service runs out of memory

The ML service loads sentence-transformer models (~500MB). Ensure Docker has at least **4GB RAM** allocated.

```bash
# Check Docker Desktop → Settings → Resources → Memory
```

### Database connection errors

```bash
# Verify Supabase credentials
cat .env | grep DATABASE_URL

# Test connection
docker compose logs backend-api | grep -i "prisma\|database\|migration"
```

### Backend migration errors

```bash
# Check for schema conflicts in Supabase dashboard
# Then rebuild
docker compose up --build backend-api
```

### Frontend can't reach backend

Ensure `NEXT_PUBLIC_API_URL` matches where the backend is accessible. In Docker, the frontend makes client-side requests, so this must be a URL the browser can reach (typically `http://localhost:3000`).

### OAuth callback errors

Ensure callback URLs in your GitHub/Google OAuth app settings match the values in `.env`:
- GitHub: `http://localhost:3000/auth/github/callback`
- Google: `http://localhost:3000/auth/google/callback`

---

## Deployment Comparison

| Feature | Local + ngrok | Render (Free) | VPS | Railway |
|---------|:---:|:---:|:---:|:---:|
| **Cost** | Free | Free (limited) | $4.5–12/mo | Free tier |
| **Uptime** | While laptop is on | 24/7 (cold starts) | 24/7 | 24/7 |
| **Custom domain** | No | Yes (paid) | Yes | Yes |
| **SSL** | ngrok provides | Automatic | Certbot | Automatic |
| **Setup time** | 5 min | 30 min | 1 hour | 15 min |
| **Best for** | Quick demos | Persistent demo | Production | Small production |
