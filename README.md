# Skillora

> An intelligent, AI-powered platform that analyzes resumes against job descriptions using advanced NLP to provide match scoring, skill extraction, and actionable feedback.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## About

**Skillora** is a comprehensive full-stack application designed to help job seekers optimize their resumes and increase their chances of landing interviews. Built with modern web technologies and powered by advanced natural language processing, it bridges the gap between candidate qualifications and employer requirements.

### Why This Project Exists

In today's competitive job market, many qualified candidates are filtered out by Applicant Tracking Systems (ATS) before their resumes ever reach human recruiters. Skillora solves this problem by:

- **Analyzing semantic similarity** between your resume and target job descriptions
- **Identifying skill gaps** that might cause rejection
- **Providing actionable feedback** to improve resume effectiveness
- **Detecting profile strengths** through GitHub integration
- **Ensuring resume authenticity** with built-in security scanning

### Who Is This For?

- **Job Seekers**: Optimize your resume for specific roles and understand what recruiters are looking for
- **Career Switchers**: Identify transferable skills and areas where you need to upskill
- **Recruiters**: Quickly assess candidate-job fit with objective scoring metrics
- **Students**: Learn what skills and keywords are valued in your target industry
- **Developers**: Showcase your open-source contributions with integrated GitHub analysis

### What Makes It Different?

Unlike simple keyword matchers, Skillora uses:
- **Semantic understanding** via Sentence Transformers to capture context and meaning
- **Comprehensive skill databases** covering 100+ technologies and frameworks
- **Profile enrichment** by extracting and analyzing GitHub developer profiles
- **Security features** to detect resume manipulation attempts
- **Full transparency** with detailed breakdowns of scoring methodology

This is an **open-source**, **self-hosted** solution that gives you complete control over your data and privacy.

---

## Overview

Skillora helps job seekers optimize their resumes by comparing them against target job descriptions. Using semantic similarity algorithms and NLP techniques, it identifies skill gaps, suggests improvements, and provides a comprehensive match score to increase your chances of landing interviews.

**Key capabilities:**
- 🎯 **Smart Matching** - Semantic similarity scoring using spaCy and Sentence Transformers
- � **ATS Compatibility Scoring** - Evaluates resume formatting, structure, keywords, and content for ATS readiness
- �🔍 **Skill Detection** - Automatic extraction of technical skills, languages, and tools
- 🌐 **Multi-Language Support** - Analyze resumes in English, Spanish, French, German, Arabic, Chinese & more
- 📊 **GitHub Profile Analysis** - Evaluates developer profiles with repo stats, activity, and scoring
- 🛡️ **Security Scanning** - Detects resume manipulation attempts (invisible text, homoglyphs)
- 📝 **Multi-Format Support** - PDF, DOCX, TXT, RTF, and HTML file uploads
- 🔐 **Authentication** - OAuth (GitHub, Google), email verification, password reset
- 📧 **Email System** - Automated verification and password reset via Resend
- 👤 **User Profiles** - Profile page with avatar upload, usage stats, and tier management
- 🖼️ **Secure Image Upload** - Profile images with Sharp resizing and security validation
- 🛡️ **Upload Security** - File size limits, MIME validation, filename sanitization
- 💡 **Actionable Feedback** - Detailed suggestions to improve resume-job alignment

## Table of Contents

- [Screenshots](#-screenshots)
- [About](#about)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [Support](#support)
- [Roadmap](#roadmap)
- [License](#license)

## Features

### Core Functionality

- **Intelligent Resume Matching**
  - Calculates semantic similarity between resume content and job descriptions
  - Uses NLP models (spaCy + Sentence Transformers) for context-aware analysis
  - Provides percentage-based match scores with detailed breakdowns

- **Skill Extraction & Analysis**
  - Identifies 100+ technical skills, programming languages, and frameworks
  - Highlights missing keywords critical for the target role
  - Maps found vs. required skills for easy comparison

- **Enhanced Profile Analysis**
  - **GitHub Integration**: Automatically extracts GitHub usernames and fetches profile data (repositories, stars, followers, recent activity)
  - **LinkedIn Detection**: Identifies and links to LinkedIn profiles
  - **Profile Scoring**: Calculates a developer profile score based on open-source contributions

- **ATS Compatibility Scoring**
  - Evaluates resume formatting and parsability for ATS systems
  - Checks for standard section headers (Experience, Education, Skills, etc.)
  - Measures keyword optimization and match rate against job description
  - Validates contact information completeness (email, phone, LinkedIn, name)
  - Assesses content quality (action verbs, quantified achievements, dates)
  - Provides overall ATS score with per-category breakdowns and actionable tips

- **Security & Anti-Cheat**
  - Detects invisible text (white text on white background)
  - Identifies homoglyph character substitution attacks
  - Flags suspiciously high matches that indicate copy-pasting

- **Modern User Interface**
  - Clean, responsive design inspired by Apple's design language
  - Animated multilingual greeting (Hello in 12 languages)
  - Drag-and-drop file upload
  - Real-time analysis results with interactive visualizations

- **Authentication & User Management**
  - Email/password registration with strong password requirements
  - OAuth login with GitHub, Google, and Apple
  - Email verification for new accounts
  - Password reset via email
  - JWT-based session management

- **File Upload Security**
  - 10MB file size limit (DoS prevention)
  - MIME type validation (prevents extension spoofing)
  - Filename sanitization (path traversal protection)
  - Rate limiting (abuse prevention)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, CSS Variables |
| **Backend API** | NestJS 11, TypeScript, Prisma ORM 6, Sharp (image processing) |
| **Database** | Supabase (PostgreSQL) |
| **ML Service** | FastAPI, Python 3.11+, spaCy 3.7, Sentence-Transformers, langdetect |
| **Authentication** | JWT, Passport.js, OAuth 2.0 (GitHub, Google) |
| **Email** | Resend API |
| **Infrastructure** | Docker, Docker Compose |
| **Security** | bcrypt, python-magic (MIME validation), slowapi (rate limiting), Sharp (image security) |

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (v20.10+) - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Git** - For cloning the repository

**Optional:**
- **GitHub Personal Access Token** - For enhanced GitHub profile analysis (increases rate limits from 60 to 5,000 requests/hour)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/moussa101/AI-Resume-Analyzer.git
   cd AI-Resume-Analyzer
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   The app uses **Supabase** (hosted PostgreSQL) as its database. You must set `DATABASE_URL` and `DIRECT_URL` in `.env` with your Supabase project credentials.

   Edit `.env` to configure:
   - `DATABASE_URL` / `DIRECT_URL` — your Supabase connection strings (**required**)
   - `JWT_SECRET` — change for production
   - `RESEND_API_KEY` — for email verification & password reset
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — for GitHub OAuth login
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google OAuth login
   - `GITHUB_TOKEN` — for enhanced GitHub profile analysis (increases rate limits)

### Running the Application

**Start all services with Docker Compose:**

```bash
docker compose up --build
```

This command will:
1. Build all Docker images (frontend, backend, ML service)
2. Run database migrations against your Supabase database
3. Launch all services

**Access the application:**

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:3000 |
| **API Docs (Swagger)** | http://localhost:3000/api |
| **ML Service Docs** | http://localhost:8000/docs |
| **Database** | Your Supabase PostgreSQL (see `.env`) |

**To stop the services:**

```bash
docker compose down
```

**To stop and remove all data (including the database):**

```bash
docker compose down -v
```

**To rebuild a single service after changes:**

```bash
docker compose up --build backend-api    # rebuild backend only
docker compose up --build frontend-client # rebuild frontend only
docker compose up --build ml-service      # rebuild ML service only
```

## Usage

### Analyzing a Resume

1. **Open the dashboard** at http://localhost:3001

2. **Upload your resume**
   - Drag and drop a file (PDF, DOCX, or TXT)
   - Or click the upload area to browse files

3. **Enter the job description**
   - Paste the complete job posting text
   - Include requirements, responsibilities, and desired skills

4. **Click "Analyze Resume"**

5. **Review the results:**
   - **Match Score**: Overall compatibility percentage (0-100%)
   - **ATS Score**: ATS compatibility rating with category breakdowns (Formatting, Sections, Keywords, Contact, Content)
   - **Skills Found**: Technical skills detected in your resume
   - **Missing Keywords**: Important skills from the job description not found in your resume
   - **GitHub Profile**: Developer stats and profile score (if GitHub link detected)
   - **Feedback**: Actionable suggestions to improve your resume

### Example Workflow

```bash
# 1. Upload: senior_software_engineer_resume.pdf
# 2. Paste job description for "Senior Backend Engineer at Google"
# 3. Results:
#    - Match Score: 87%
#    - Skills Found: Python, Docker, Kubernetes, PostgreSQL, REST APIs
#    - Missing: Go, gRPC, Prometheus
#    - Suggestions: Add distributed systems experience, quantify impact
```

## Project Structure

```
AI-Resume-Analyzer/
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # App router pages
│   │   └── components/        # React components
│   ├── Dockerfile
│   └── package.json
│
├── backend/                    # NestJS backend API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── resumes/           # Resume management
│   │   └── ml-service/        # ML service integration
│   ├── prisma/                # Database schema
│   ├── Dockerfile
│   └── package.json
│
├── ml_service/                 # Python ML analysis service
│   ├── main.py                # FastAPI endpoints
│   ├── analyzer.py            # Core NLP analysis logic
│   ├── ats_scorer.py          # ATS compatibility scoring engine
│   ├── profile_analyzer.py    # GitHub/LinkedIn extraction
│   ├── security/              # Resume security scanning
│   ├── skills/                # Language-specific skill dictionaries
│   ├── Dockerfile
│   └── requirements.txt
│
├── test_data/                  # Test resumes and job descriptions
│   ├── resumes/               # Sample resume files
│   ├── job_descriptions/      # Sample job postings
│   └── real_world/            # Realistic test scenarios
│       └── run_tests.py       # Automated test runner
│
├── uploads/                    # Uploaded resume storage
├── Documentation/              # Project documentation
│   ├── PRD.md                 # Product Requirements Document
│   └── Images/                # Screenshots and diagrams
├── docker-compose.yml          # Service orchestration
├── DEPLOYMENT.md              # Deployment guide
├── CONTRIBUTING.md            # Contribution guidelines
├── .env.example               # Environment template
└── README.md
```

### Key Components

- **`frontend/`**: User-facing web application built with Next.js and Tailwind CSS
- **`backend/`**: REST API handling authentication, file uploads, and database operations
- **`ml_service/`**: Python service performing NLP analysis, skill extraction, and profile scanning
- **`test_data/`**: Comprehensive test suite with real-world resumes and job descriptions

## Testing

### Automated Testing

Run the comprehensive test suite to verify analysis accuracy:

```bash
python3 test_data/real_world/run_tests.py
```

This script tests the analyzer against multiple scenarios:

| Scenario | Resume | Job Description | Expected Score |
|----------|--------|-----------------|----------------|
| High Match | Senior SWE | Google Senior Engineer | 85-100% |
| Medium Match | Data Scientist | Amazon Backend Engineer | 50-75% |
| Low Match | Junior Developer | Meta Senior Architect | 20-40% |

### Manual Testing

Sample test data is provided in `test_data/`:

```bash
test_data/
├── resumes/
│   ├── software_engineer_resume.pdf
│   ├── data_scientist_resume.pdf
│   └── junior_developer_resume.pdf
└── job_descriptions/
    ├── google_senior_swe.txt
    ├── amazon_backend_engineer.txt
    └── meta_data_scientist.txt
```

Upload any combination to test different match scenarios.

## Configuration

### Environment Variables

#### Root `.env`
```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Backend
JWT_SECRET=your-secret-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Email (optional)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### ML Service Configuration
```env
# ml_service/.env
ML_PORT=8000
GITHUB_TOKEN=ghp_your_token_here  # Optional, increases API rate limits
```

### Docker Compose Customization

Modify `docker-compose.yml` to adjust:
- Port mappings
- Resource limits
- Volume mounts
- Environment variables

## Security Features

The analyzer includes built-in protection against common resume manipulation techniques:

| Feature | Detection Method | Impact |
|---------|-----------------|--------|
| **Invisible Text** | Analyzes PDF text rendering properties to detect white-on-white text | Flags suspicious resumes |
| **Homoglyph Attacks** | Identifies Unicode character substitutions (e.g., Cyrillic 'а' vs Latin 'a') | Prevents fake skill injection |
| **Copy-Paste Detection** | Flags matches >95% that suggest direct JD copying | Identifies unoriginal applications |
| **Metadata Analysis** | Checks PDF metadata for manipulation signs | Enhanced fraud detection |

**Note**: Security features are informational and help recruiters identify potentially manipulated resumes.

### File Upload Security

The ML service includes comprehensive file upload protection:

| Feature | Description | Default |
|---------|-------------|--------|
| **File Size Limit** | Maximum upload size to prevent DoS | 10MB |
| **MIME Validation** | Verifies file content matches extension | Enabled |
| **Filename Sanitization** | Removes path traversal characters | Enabled |
| **Extension Whitelist** | Only allows safe file types | PDF, DOCX, TXT, RTF, HTML |
| **Rate Limiting** | Limits requests per IP | Configurable |

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (ESLint/Prettier for TS, Black for Python)
- Add tests for new features
- Update documentation as needed
- Ensure Docker builds succeed

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md) (if available).

## Support

### Getting Help

- **PRD**: See the [Product Requirements Document](Documentation/PRD.md) for full feature specifications
- **Documentation**: Check the [Documentation](Documentation/) folder for detailed guides
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions
- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/moussa101/AI-Resume-Analyzer/issues)

### Common Issues

**Problem**: Docker containers fail to start
```bash
# Solution: Reset Docker environment
docker compose down -v
docker compose up --build
```

**Problem**: ML service can't load models
```bash
# Solution: Ensure sufficient memory allocated to Docker (recommend 4GB+)
# Check Docker Desktop → Settings → Resources
```

**Problem**: Database connection errors
```bash
# Solution: Verify your Supabase credentials in .env
# Ensure DATABASE_URL and DIRECT_URL are correctly set
cat .env | grep DATABASE_URL
```

**Problem**: Backend fails with migration errors
```bash
# Solution: Check Supabase dashboard for schema conflicts, then re-run
docker compose up --build backend-api
```

## Roadmap

### Completed
- [x] Support for more file formats (RTF, HTML)
- [x] OAuth authentication (GitHub, Google)
- [x] Email verification system
- [x] Password reset functionality
- [x] File upload security (size limits, MIME validation)
- [x] Multi-language resume analysis (12+ languages)
- [x] User profile page with usage stats
- [x] Secure profile image upload with resizing
- [x] Resend email integration
- [x] Supabase database integration
- [x] ATS (Applicant Tracking System) compatibility scoring
- [x] Admin dashboard with user management
- [x] Recruiter dashboard with batch processing (up to 50 resumes)
- [x] Candidate ranking & CSV export
- [x] Plans & pricing page
- [x] Tier-based usage limits (Free: 5/mo, Pro: unlimited, Recruiter: 1000/mo)

### Subscriptions & Payments (Planned)
- [ ] Payment gateway integration (Paymob for Egyptian market — Vodafone Cash, Fawry, cards)
- [ ] Stripe integration for international payments
- [ ] Plan upgrade/downgrade flow with billing management
- [ ] Subscription lifecycle (active, cancelled, past_due, renewal)
- [ ] Usage-based billing and invoice generation

### Feature Gating (Planned)
- [ ] Tier-gated PDF export (Pro & Recruiter only)
- [ ] Recruiter Team dashboard (multi-user organizations)
- [ ] API key authentication for Recruiter tier
- [ ] Feature flags system for tier-based access control

### Future
- [ ] Resume template suggestions
- [ ] Cover letter analysis
- [ ] Browser extension for one-click analysis
- [ ] Interview preparation assistant
- [ ] Webhook notifications for batch processing completion

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Maintainers

- **moussa101** - [GitHub Profile](https://github.com/moussa101)

---

**⭐ If you find this project useful, please consider giving it a star!**
