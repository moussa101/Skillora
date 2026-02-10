# Deployment Guide

Complete guide for deploying Skillora in development, production, and demo environments.

**Last Updated:** February 10, 2026

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Local Development (Docker)](#local-development-docker)
- [Environment Variables](#environment-variables)
- [Quick Demo Deployment](#quick-demo-deployment)
  - [Option 1: Railway (Recommended)](#option-1-railway-recommended)
  - [Option 2: Render](#option-2-render)
- [Production Deployment](#production-deployment)
  - [VPS / Cloud VM](#vps--cloud-vm)
- [Quick Sharing (ngrok)](#quick-sharing-ngrok)
- [SSL & Domain Configuration](#ssl--domain-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker Desktop | 20.10+ | Container runtime (local dev only) |
| Docker Compose | 2.0+ | Service orchestration (local dev only) |
| Git | 2.30+ | Source control |
| Supabase account | — | Managed PostgreSQL database |
| GitHub account | — | Repository hosting + OAuth (optional) |

**Optional:**
- GitHub Personal Access Token — increases GitHub API rate limits (60 → 5,000 req/hr)
- Resend API key — for email verification and password reset
- OAuth app credentials — for GitHub/Google sign-in

---

## Architecture Overview

Skillora runs as **3 services** backed by a **Supabase** (hosted PostgreSQL) database:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Frontend        │     │  Backend API     │     │  ML Service      │
│  Next.js 16      │────▶│  NestJS 11       │────▶│  FastAPI         │
│  Port: 3001      │     │  Port: 3000      │     │  Port: 8000      │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                          ┌───────▼────────┐
                          │   Supabase     │
                          │  (PostgreSQL)  │
                          │  (External)    │
                          └────────────────┘
```

| Service | Base Image | Memory | Notes |
|---------|-----------|--------|-------|
| `ml-service` | `python:3.11-slim` | ~2GB | Loads NLP models (sentence-transformers) on startup |
| `backend-api` | `node:20-alpine` | ~256MB | Runs Prisma migrations + seeds admin/recruiter accounts on start |
| `frontend-client` | `node:20-alpine` | ~128MB | Next.js standalone build |

> **Important:** The database is **not** containerized — it runs on Supabase (external PostgreSQL). The backend auto-detects Supabase URLs and enables SSL accordingly.

---

## Database Setup (Supabase)

Skillora uses [Supabase](https://supabase.com) as its managed PostgreSQL database. **This must be set up first** before any deployment.

### 1. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. Choose a region close to your deployment (e.g., `eu-central-1` for Europe, `us-east-1` for US)
3. Set a strong database password and **save it** — you'll need it for connection strings

### 2. Get connection strings

Go to **Settings → Database → Connection string** and copy both URIs:

| Connection Type | Env Variable | Port | Use Case |
|----------------|-------------|------|----------|
| **Transaction / Pooler** | `DATABASE_URL` | 6543 | Runtime queries (append `?pgbouncer=true`) |
| **Session / Direct** | `DIRECT_URL` | 5432 | Prisma migrations |

```env
# Example (replace with your actual values)
DATABASE_URL=postgresql://postgres.abcdef123456:YourPassword@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abcdef123456:YourPassword@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 3. How it works

- **Prisma 6** uses `prisma.config.ts` to resolve the database URL (reads `DIRECT_URL` → falls back to `DATABASE_URL`)
- **SSL is auto-enabled** when the connection string contains `supabase` (handled in `prisma.service.ts` and `seed.ts`)
- **Migrations run automatically** when the backend starts (`npx prisma migrate deploy` in the Dockerfile CMD)
- **Seed accounts** (admin + recruiter) are created on first migration

### 4. Manual migration (if needed)

```bash
cd backend
npx prisma migrate deploy
```

### 5. Verify database connection

After starting the backend, check the logs for successful migration:

```bash
# Docker
docker compose logs backend-api | grep -i "prisma\|migration\|seed"

# Railway/Render
# Check the service logs in the dashboard
```

You should see:
```
✅ Admin account created: admin@skillora.com
✅ Recruiter account created: recruiter@skillora.com
```

---

## Local Development (Docker)

### 1. Clone and configure

```bash
git clone https://github.com/moussa101/AI-Resume-Analyzer.git
cd AI-Resume-Analyzer
cp .env.example .env
```

### 2. Set required environment variables

Edit `.env` and add your Supabase credentials (see [Database Setup](#database-setup-supabase)):

```env
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Build and start

```bash
docker compose up --build
```

> **First build takes ~5 minutes** (downloads NLP models, installs dependencies). Subsequent builds are cached.

### 4. Verify services

| Service | URL | Check |
|---------|-----|-------|
| Frontend | http://localhost:3001 | Web UI loads |
| Backend API | http://localhost:3000 | API responds |
| ML Service | http://localhost:8000/docs | FastAPI docs page |
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

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## Environment Variables

### Required (all services)

| Variable | Used By | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Backend | Supabase direct connection (port 5432, for migrations) |
| `JWT_SECRET` | Backend | Secret key for JWT signing — **use a strong random string in production** |

### Optional

| Variable | Used By | Description | Default |
|----------|---------|-------------|---------|
| `RESEND_API_KEY` | Backend | Resend API key for email | _(disabled)_ |
| `RESEND_FROM_EMAIL` | Backend | Sender email address. **Must be from a verified domain on Resend to send to all users.** Using `onboarding@resend.dev` only delivers to the account owner. See [Custom Domain Setup](#custom-domain-for-email). | `onboarding@resend.dev` |
| `GITHUB_CLIENT_ID` | Backend | GitHub OAuth app client ID | _(disabled)_ |
| `GITHUB_CLIENT_SECRET` | Backend | GitHub OAuth app secret | _(disabled)_ |
| `GITHUB_CALLBACK_URL` | Backend | GitHub OAuth callback URL | `http://localhost:3000/auth/github/callback` |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth client ID | _(disabled)_ |
| `GOOGLE_CLIENT_SECRET` | Backend | Google OAuth client secret | _(disabled)_ |
| `GOOGLE_CALLBACK_URL` | Backend | Google OAuth callback URL | `http://localhost:3000/auth/google/callback` |
| `GITHUB_TOKEN` | ML Service | GitHub PAT for profile analysis | _(60 req/hr)_ |
| `FRONTEND_URL` | Backend | Frontend URL for OAuth redirects | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL for API calls | `http://localhost:3000` |
| `NEXT_PUBLIC_ML_URL` | Frontend | ML service URL (if direct calls) | `http://localhost:8000` |

> **⚠️ Important:** `NEXT_PUBLIC_*` variables are **baked into the frontend at build time** (Next.js). The frontend Dockerfile uses a Docker `ARG` to accept `NEXT_PUBLIC_API_URL` at build time. On Railway/Render, set the variable _before_ the build runs, or trigger a rebuild after adding it.

---

## Quick Demo Deployment

### Option 1: Railway (Recommended)

Best for: **fastest setup**, generous free tier ($5/mo credit), auto-detects Docker, built-in public URLs.

> **Free tier:** $5/month credit (enough for a demo). No credit card required to start.

#### Step-by-step

1. **Push your code to GitHub** (if not already)

2. **Sign up at [railway.app](https://railway.app)** with your GitHub account

3. **Create a new project** → "Deploy from GitHub Repo" → select `AI-Resume-Analyzer`

4. **Railway will detect `docker-compose.yml`** and create 3 services automatically:
   - `ml-service` (port 8000)
   - `backend-api` (port 3000)
   - `frontend-client` (port 3001 → mapped to 3000 internally)

   **Current production domains:**
   | Service | URL |
   |---------|-----|
   | Frontend | https://skillora1.up.railway.app |
   | Backend API | https://backend-production-e2f3.up.railway.app |
   | ML Service | https://ml-service-production-8b08.up.railway.app |

5. **Add environment variables** — click each service and go to **Variables**:

   **For `backend-api`:**
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Supabase pooled URL (port 6543) |
   | `DIRECT_URL` | Your Supabase direct URL (port 5432) |
   | `JWT_SECRET` | A strong random string (e.g., `openssl rand -hex 32`) |
   | `ML_SERVICE_URL` | `http://ml-service.railway.internal:8000` _(Railway internal networking)_ |
   | `FRONTEND_URL` | The Railway-assigned URL of your frontend (e.g., `https://skillora-frontend-xxx.up.railway.app`) |
   | `NODE_ENV` | `production` |

   **For `frontend-client`:**
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | The Railway-assigned URL of your backend (e.g., `https://skillora-backend-xxx.up.railway.app`) |
   | `NEXT_PUBLIC_ML_URL` | The Railway-assigned URL of your ML service (e.g., `https://skillora-ml-xxx.up.railway.app`) |

   **For `ml-service`:**
   | Variable | Value |
   |----------|-------|
   | `GITHUB_TOKEN` | _(optional)_ Your GitHub PAT for higher rate limits |

6. **Generate public domains** — for each service, go to **Settings → Networking → Generate Domain**

7. **Trigger a rebuild** of `frontend-client` after setting `NEXT_PUBLIC_*` vars (these are build-time vars)

8. **Verify deployment:**
   - Visit the frontend URL → should load the Skillora web UI
   - Visit `<backend-url>/health` → should return OK
   - Visit `<ml-service-url>/health` → should return `{"status":"healthy"}`

#### Railway Tips

- **Internal networking:** Services within the same Railway project can communicate via `<service-name>.railway.internal:<port>` — use this for `ML_SERVICE_URL` to avoid public network hops
- **Logs:** Click any service → "Logs" tab for real-time streaming
- **Memory:** The ML service needs ~2GB RAM. Railway's free tier may throttle — upgrade to the Hobby plan ($5/mo) if you hit limits
- **Custom domain:** Settings → Networking → Custom Domain (free on all plans)

---

### Option 2: Render

Best for: easy deployment with a **persistent free tier** (spins down after inactivity).

> **Note:** Render free tier has cold starts (~30-60s after inactivity). The ML service is heavy and may take 2-3 minutes to cold-start due to model loading.

#### Step-by-step

1. **Push your code to GitHub**

2. **Sign up at [render.com](https://render.com)** with your GitHub account

3. **Create 3 Web Services** — for each, click **New → Web Service → Connect Repository**:

   #### Service 1: ML Service
   | Setting | Value |
   |---------|-------|
   | Name | `skillora-ml` |
   | Root Directory | `ml_service` |
   | Runtime | Docker |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | Free (or Starter for better performance) |

   **Environment variables:**
   | Variable | Value |
   |----------|-------|
   | `GITHUB_TOKEN` | _(optional)_ GitHub PAT |
   | `PORT` | `8000` |

   #### Service 2: Backend API
   | Setting | Value |
   |---------|-------|
   | Name | `skillora-backend` |
   | Root Directory | `backend` |
   | Runtime | Docker |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | Free (or Starter) |

   **Environment variables:**
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Supabase pooled URL (port 6543) |
   | `DIRECT_URL` | Your Supabase direct URL (port 5432) |
   | `JWT_SECRET` | A strong random string |
   | `ML_SERVICE_URL` | Render URL of `skillora-ml` (e.g., `https://skillora-ml.onrender.com`) |
   | `FRONTEND_URL` | Render URL of `skillora-frontend` (e.g., `https://skillora-frontend.onrender.com`) |
   | `NODE_ENV` | `production` |

   #### Service 3: Frontend
   | Setting | Value |
   |---------|-------|
   | Name | `skillora-frontend` |
   | Root Directory | `frontend` |
   | Runtime | Docker |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | Free (or Starter) |

   **Environment variables:**
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Render URL of `skillora-backend` (e.g., `https://skillora-backend.onrender.com`) |
   | `NEXT_PUBLIC_ML_URL` | Render URL of `skillora-ml` (e.g., `https://skillora-ml.onrender.com`) |

4. **Deploy order matters:** Deploy `ml-service` first, then `backend-api`, then `frontend-client`

5. **Verify deployment:**
   - Visit `<ml-url>/health` → `{"status":"healthy"}`
   - Visit `<backend-url>/health` → OK
   - Visit `<frontend-url>` → Skillora web UI

#### Render Tips

- **Cold starts:** Free tier spins down after 15 min of inactivity. The ML service takes longest to restart (~2-3 min for model loading). Consider the Starter plan ($7/mo per service) to avoid this
- **Build failures:** If the frontend build fails, ensure `NEXT_PUBLIC_API_URL` is set _before_ the first deploy (it's a build-time variable)
- **Health checks:** Render monitors `/health` by default — the ML service has this built in. For the backend, add a health check path of `/health`
- **Disk:** Free tier has no persistent disk. Uploaded resumes are stored in-container and lost on restart. For production, use a VPS or add a Render Disk ($0.25/GB/mo)
- **Custom domain:** Available on paid plans — Settings → Custom Domains

---

## Production Deployment

### VPS / Cloud VM

Best for: full control, persistent deployment, custom domains, and file storage.

**Recommended providers:** DigitalOcean ($12/mo), Hetzner (€4.5/mo), AWS EC2, Google Cloud.

**Minimum specs:** 4GB RAM, 2 vCPUs, 20GB disk.

#### Steps

1. **Provision a VM** with Docker installed (Ubuntu 22.04+ recommended)

   ```bash
   # Install Docker on Ubuntu
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone and configure**
   ```bash
   git clone https://github.com/moussa101/AI-Resume-Analyzer.git
   cd AI-Resume-Analyzer
   cp .env.example .env
   nano .env  # Add production credentials
   ```

3. **Update environment for production**
   ```env
   DATABASE_URL=postgresql://postgres.xxx:pwd@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.xxx:pwd@aws-0-region.pooler.supabase.com:5432/postgres
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
   ```bash
   sudo apt install nginx
   ```

   ```nginx
   # /etc/nginx/sites-available/skillora
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 10M;  # For file uploads
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/skillora /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **Add SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

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

> This only works while your machine is running. For persistent access, use Railway or Render.

---

## SSL & Domain Configuration

### Custom Domain for Email

Resend's default sender (`onboarding@resend.dev`) can **only deliver to the account owner's email**. To send verification and password reset emails to all users, you need a custom domain:

1. **Purchase a domain** (e.g., `skillora.xyz` for ~$1-2/year on [Namecheap](https://namecheap.com) or [Cloudflare](https://dash.cloudflare.com))
2. **Add domain to Resend** at [resend.com/domains](https://resend.com/domains)
3. **Add DNS records** — Resend will provide MX, TXT (SPF), and DKIM records to add to your domain's DNS
4. **Verify domain** in Resend dashboard
5. **Update Railway env var** on the backend service:
   ```
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
6. **Redeploy** the backend service

> **Note:** Railway's `*.up.railway.app` subdomains cannot be used for email — you don't control their DNS.

### SSL for Custom Domains

For production, always use HTTPS:

1. **Domain:** Point your domain's A record to your server IP
2. **SSL:** Use Let's Encrypt with Certbot (free) or Cloudflare (free proxy)
3. **Update `.env`:** Set all URLs to use `https://`
4. **Update OAuth:** Update callback URLs in GitHub/Google OAuth app settings
5. **Railway/Render:** SSL is automatic with their provided domains

---

## Monitoring & Health Checks

### Built-in health endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| ML Service | `GET /health` | `{"status":"healthy","version":"1.1.0"}` |
| Backend API | `GET /health` | `200 OK` |

### Docker health checks (local/VPS)

Docker Compose is configured with automatic health checks:
- **Interval:** Every 10–15 seconds
- **Timeout:** 5 seconds
- **Retries:** 3
- **Start period:** 20–30 seconds (allows ML model loading)

```bash
docker compose ps          # View running containers + health status
docker stats               # Live CPU/memory usage
docker compose logs -f     # Stream all logs
```

### Railway/Render monitoring

Both platforms provide:
- Real-time log streaming in the dashboard
- Automatic restart on crash
- Build + deploy history

---

## Troubleshooting

### Database connection errors

```bash
# Verify Supabase credentials
echo $DATABASE_URL

# Test connection (local)
docker compose logs backend-api | grep -i "prisma\|database\|migration\|seed"

# Check Supabase dashboard → Database → active connections
```

> **Tip:** If you see SSL errors, ensure the connection URL contains `supabase` — the backend auto-enables SSL based on this.

### ML service runs out of memory

The ML service loads sentence-transformer models (~500MB+). Minimum **2GB RAM** for the ML container.

- **Docker Desktop:** Settings → Resources → Memory → set to 4GB+
- **Railway:** Upgrade to Hobby plan for more RAM
- **Render:** Use Starter tier or higher

### Frontend can't reach backend

`NEXT_PUBLIC_API_URL` must be accessible from the **user's browser** (not server-side):

| Environment | `NEXT_PUBLIC_API_URL` should be |
|-------------|-------------------------------|
| Local Docker | `http://localhost:3000` |
| Railway | `https://skillora-backend-xxx.up.railway.app` |
| Render | `https://skillora-backend.onrender.com` |
| VPS + Nginx | `https://yourdomain.com/api` |

> **Reminder:** `NEXT_PUBLIC_*` vars are baked in at build time. If you change them, you must rebuild the frontend.

### Backend migration errors

```bash
# Check for schema conflicts
docker compose logs backend-api | grep -i "error\|migration"

# Reset and redeploy (use with caution — this is destructive)
npx prisma migrate reset
```

### OAuth callback errors

Update callback URLs in your GitHub/Google OAuth app settings to match your deployment:

| Provider | Local | Production (Railway) |
|----------|-------|---------------------|
| GitHub | `http://localhost:3000/auth/github/callback` | `https://backend-production-e2f3.up.railway.app/auth/github/callback` |
| Google | `http://localhost:3000/auth/google/callback` | `https://backend-production-e2f3.up.railway.app/auth/google/callback` |

**Important notes:**
- GitHub OAuth Apps only allow **one** callback URL. You need separate OAuth Apps for local dev and production.
- Google OAuth allows multiple redirect URIs in the same app.
- When switching between local and production, make sure `GITHUB_CALLBACK_URL`, `GOOGLE_CALLBACK_URL`, and `FRONTEND_URL` env vars match the deployment.
- After changing Railway env vars, you must **trigger a redeploy** for the changes to take effect.

### Render cold starts

The ML service takes 2-3 minutes to cold-start on Render free tier (model loading). Options:
1. Use a cron service to ping `/health` every 10 minutes to keep it warm
2. Upgrade to Starter plan ($7/mo) to disable spin-down

### Railway "build failed" errors

- Check the build logs — common issue is missing `NEXT_PUBLIC_*` env vars during frontend build
- Ensure the Dockerfile context is correct for each service
- For memory issues, Railway may kill builds that exceed plan limits

---

## Deployment Comparison

| Feature | Local + ngrok | Render (Free) | Render (Starter) | Railway (Hobby) | VPS |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Cost** | Free | Free | ~$21/mo (3 services) | ~$5/mo | $4.5–12/mo |
| **Uptime** | While laptop on | 24/7 (cold starts) | 24/7 | 24/7 | 24/7 |
| **Cold starts** | None | 30-180s | None | None | None |
| **Custom domain** | No | Paid only | Yes | Yes (free) | Yes |
| **SSL** | ngrok provides | Automatic | Automatic | Automatic | Certbot |
| **File persistence** | Yes | No (in-memory) | With Disk add-on | With Volume | Yes |
| **Setup time** | 5 min | 30 min | 30 min | 15 min | 1 hour |
| **Best for** | Quick demos | Free preview | Persistent demo | **Best demo option** | Production |

> **Recommendation for demos:** Railway Hobby ($5/mo) gives the best experience — no cold starts, free custom domains, internal networking between services, and simple setup.

---

## Pre-seeded Accounts

After deployment, these accounts are available for testing:

| Account | Email | Password | Access |
|---------|-------|----------|--------|
| **Admin** | `admin@skillora.com` | `Admin@123` | Admin dashboard, user management, subscription approval |
| **Recruiter** | `recruiter@skillora.com` | `Recruiter@123` | Recruiter dashboard, batch processing |

> **⚠️ Change these passwords in production!** Set `ADMIN_PASSWORD` and `RECRUITER_PASSWORD` env vars to override defaults.
