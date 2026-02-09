# Skillora — Product Requirements Document (PRD)

**Product Name:** Skillora
**Version:** 1.2.0
**Last Updated:** February 9, 2026
**Author:** moussa101
**Status:** Active Development

---

## 1. Executive Summary

Skillora is an AI-powered resume analysis platform that helps job seekers optimize their resumes for specific roles. It uses advanced NLP (Natural Language Processing) to compare resumes against job descriptions, providing match scores, skill gap analysis, ATS compatibility scoring, and actionable improvement suggestions.

The platform serves job seekers, career switchers, recruiters, and students by closing the gap between candidate qualifications and employer expectations — particularly around Applicant Tracking Systems (ATS) that filter resumes before human review.

---

## 2. Problem Statement

### The Challenge

- **75% of resumes** are rejected by ATS before a human ever sees them.
- Candidates lack visibility into how their resume ranks against job requirements.
- Keyword optimization is a manual, error-prone process.
- Profile signals (GitHub contributions, LinkedIn) are underutilized in self-assessment.
- Resume manipulation (invisible text, character substitution) undermines hiring integrity.

### The Opportunity

An intelligent, self-hosted platform that gives candidates transparent, data-driven feedback on their resume's strengths and weaknesses relative to a target role — while also providing recruiters with tools to assess candidate fit objectively.

---

## 3. Target Users

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **Job Seeker** | Actively applying for roles | Maximize resume match score and ATS pass rate |
| **Career Switcher** | Transitioning between industries | Identify transferable skills and gaps |
| **Recruiter** | Hiring manager or talent acquisition | Quickly assess candidate-job fit at scale |
| **Student / New Grad** | Entering the job market | Understand what skills and keywords matter |
| **Developer** | Technical professional | Showcase open-source contributions alongside resume |

---

## 4. Product Goals & Success Metrics

### Goals

1. **Accuracy** — Achieve ≥85% correlation between Skillora match scores and human recruiter assessments.
2. **ATS Readiness** — Help users increase their ATS pass rate through actionable formatting and keyword feedback.
3. **Speed** — Return full analysis results in under 10 seconds.
4. **Multi-language** — Support resume analysis in 12+ languages.
5. **Security** — Detect and flag manipulated resumes with zero false negatives on known attack vectors.

### Key Performance Indicators (KPIs)

| Metric | Target |
|--------|--------|
| Average analysis time | < 8 seconds |
| Skill extraction accuracy | ≥ 90% |
| ATS scoring coverage (categories) | 5 categories |
| Supported file formats | 5 (PDF, DOCX, TXT, RTF, HTML) |
| Supported languages | 12+ |
| Monthly analyses per free user | 5 |
| Uptime (self-hosted) | 99.5%+ |

---

## 5. Features & Requirements

### 5.1 Core Features (Implemented)

#### FR-01: Resume-Job Description Matching
- **Description:** Calculate semantic similarity between a resume and a target job description.
- **Implementation:** Sentence Transformers (`paraphrase-multilingual-MiniLM-L12-v2`) for embedding-based similarity, supplemented by word overlap and skill-count bonuses.
- **Output:** Match score (0–100%), skills found, missing keywords, feedback summary.

#### FR-02: Skill Extraction & Gap Analysis
- **Description:** Automatically identify technical skills, languages, and frameworks present in the resume and cross-reference against job requirements.
- **Implementation:** Pattern-matched skill dictionaries (100+ technologies) with language-specific variants (EN, ES, FR, DE, AR, ZH).
- **Output:** Skills found list (up to 10), missing keywords list (up to 8).

#### FR-03: ATS Compatibility Scoring
- **Description:** Evaluate how well a resume will parse and rank in common Applicant Tracking Systems.
- **Implementation:** Rule-based scoring engine (`ats_scorer.py`) evaluating 5 weighted categories:

| Category | Weight | What It Checks |
|----------|--------|----------------|
| Formatting & Parsability | 25% | Problematic characters, whitespace, resume length |
| Section Structure | 20% | Standard section headers (Experience, Education, Skills, Summary, etc.) |
| Keyword Optimization | 25% | Skill match rate, dedicated skills section, keyword stuffing |
| Contact Information | 10% | Email, phone, LinkedIn URL, name placement |
| Content Quality | 20% | Action verbs, quantified achievements, date entries |

- **Output:** Overall ATS score (0–100), per-category breakdowns, critical issues, actionable suggestions, keyword match rate.

#### FR-04: Multi-Language Resume Analysis
- **Description:** Detect resume language automatically and apply language-appropriate skill dictionaries.
- **Implementation:** `langdetect` for language detection, language-specific skill databases, multilingual sentence-transformer model.
- **Supported:** English, Spanish, French, German, Arabic, Chinese, and more.

#### FR-05: GitHub Profile Analysis
- **Description:** Extract GitHub URLs from resumes and fetch developer profile data.
- **Implementation:** GitHub API integration with rate-limit-aware fetching.
- **Output:** Public repos, stars, followers, top languages, recent commits, notable repositories, profile score.

#### FR-06: Security & Anti-Manipulation
- **Description:** Detect resume fraud techniques.
- **Checks:**
  - Invisible text (white-on-white)
  - Homoglyph character substitution
  - Copy-paste detection (scores ≥ 95%)
  - PDF metadata analysis
- **Output:** Safety flag, security flags list, detailed scan results.

#### FR-07: Authentication & User Management
- **Description:** Full authentication system with multiple sign-in methods.
- **Methods:** Email/password, GitHub OAuth, Google OAuth.
- **Features:** Email verification, password reset (via Resend), JWT sessions, account linking (OAuth + email).

#### FR-08: User Profiles & Tier System
- **Description:** User dashboard with profile management and usage tracking.
- **Tiers:**

| Tier | Monthly Analyses | Features |
|------|-----------------|----------|
| Guest (Free) | 5 | Basic parsing, skill extraction |
| Pro | Unlimited | + AI critique, ATS scoring, PDF export |
| Recruiter | Unlimited | + Batch processing, API access, candidate management |

- **Profile Features:** Avatar upload (Sharp-processed), usage stats, tier management.

#### FR-09: File Upload & Processing
- **Description:** Multi-format resume upload with security validation.
- **Formats:** PDF, DOCX, TXT, RTF, HTML.
- **Security:** 10MB size limit, MIME validation, filename sanitization, rate limiting.

### 5.2 Planned Features (Roadmap)

| Feature | Priority | Description |
|---------|----------|-------------|
| Resume Templates | High | Suggest ATS-friendly resume templates based on analysis |
| Cover Letter Analysis | Medium | Analyze cover letters with the same NLP pipeline |
| Batch Processing for Recruiters | Medium | Upload multiple resumes and rank against a single JD |
| Browser Extension | Low | One-click analysis from job posting pages |
| Stripe Subscriptions | High | Payment integration for Pro and Recruiter tiers |
| PDF Export | Medium | Export analysis results as a formatted PDF report |

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend       │     │   Backend API    │     │   ML Service     │
│   (Next.js 16)   │────▶│   (NestJS 11)    │────▶│   (FastAPI)      │
│   Port: 3001     │     │   Port: 3000     │     │   Port: 8000     │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                          ┌───────▼────────┐
                          │   Supabase     │
                          │  (PostgreSQL)  │
                          └────────────────┘
```

### 6.2 Service Responsibilities

| Service | Technology | Responsibility |
|---------|-----------|----------------|
| **Frontend** | Next.js 16, React 19, TypeScript | User interface, file upload, results display |
| **Backend API** | NestJS 11, Prisma ORM 6, Sharp | Auth, user management, file storage, DB operations |
| **ML Service** | FastAPI, spaCy, Sentence-Transformers | NLP analysis, ATS scoring, profile scanning, security |
| **Database** | Supabase (PostgreSQL) | Users, resumes, analyses, verification codes |

### 6.3 Data Models

#### User
- Email, password (optional for OAuth), name, image
- Role (Candidate / Recruiter / Admin), Tier (Guest / Pro / Recruiter)
- OAuth linking: `githubId`, `googleId`, `provider`
- Usage tracking: `analysesThisMonth`, `analysesResetDate`
- Subscription fields (Stripe-ready)

#### Resume
- File metadata (path, name, size)
- Parsed text content
- Linked to User (cascade delete)

#### Analysis
- Job description text
- Match score, skills found, missing skills
- Feedback JSON (summary + suggestions)
- Linked to Resume (cascade delete)

### 6.4 API Endpoints

#### ML Service (FastAPI — Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Analyze resume text against job description |
| `POST` | `/analyze-file` | Upload file + analyze against job description |
| `POST` | `/extract-text` | Extract text from uploaded file |
| `POST` | `/analyze-profiles` | Analyze GitHub/LinkedIn profiles |
| `POST` | `/security-scan` | Security scan a file |
| `GET` | `/health` | Health check |

#### Backend API (NestJS — Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register with email/password |
| `POST` | `/auth/login` | Login with email/password |
| `POST` | `/auth/verify-email` | Verify email with code |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password with code |
| `GET` | `/auth/github` | GitHub OAuth redirect |
| `GET` | `/auth/google` | Google OAuth redirect |
| `POST` | `/auth/profile-image` | Upload profile image |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/resumes` | Upload resume file |
| `POST` | `/resumes/:id/analyze` | Analyze an uploaded resume |
| `GET` | `/resumes` | List user's resumes |
| `GET` | `/resumes/:id` | Get resume details |

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **NFR-PERF-01:** Analysis response time < 10 seconds for a standard resume (400–800 words).
- **NFR-PERF-02:** File upload processing < 3 seconds for files up to 10MB.
- **NFR-PERF-03:** Frontend page load (LCP) < 2 seconds.

### 7.2 Security
- **NFR-SEC-01:** All passwords hashed with bcrypt (10+ rounds).
- **NFR-SEC-02:** JWT tokens expire after 7 days.
- **NFR-SEC-03:** File uploads validated (MIME, size, extension, filename sanitization).
- **NFR-SEC-04:** Anomaly detection flags scores ≥ 95% as suspicious.
- **NFR-SEC-05:** Profile images processed through Sharp (strip metadata, resize).
- **NFR-SEC-06:** Rate limiting on all public endpoints.

### 7.3 Reliability
- **NFR-REL-01:** Graceful degradation — if ML service is unavailable, return informative error.
- **NFR-REL-02:** If profile analysis fails, continue with core analysis.
- **NFR-REL-03:** If ATS scoring fails, return results without ATS data.

### 7.4 Scalability
- **NFR-SCALE-01:** Stateless services — all three services can be horizontally scaled.
- **NFR-SCALE-02:** Database connection pooling via Supabase PgBouncer.

### 7.5 Privacy
- **NFR-PRIV-01:** Self-hosted option available — users retain full data ownership.
- **NFR-PRIV-02:** No resume data sent to third-party AI services.
- **NFR-PRIV-03:** File uploads stored locally on the server, not in cloud storage.

---

## 8. Technical Dependencies

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | 5+ | Type safety |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| NestJS | 11 | Node.js framework |
| Prisma | 6 | ORM for PostgreSQL |
| Passport.js | — | Authentication strategies |
| Sharp | — | Image processing |
| Resend | — | Transactional email |
| bcrypt | — | Password hashing |

### ML Service
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.109.2 | Python web framework |
| spaCy | 3.7.4 | NLP pipeline |
| sentence-transformers | 2.3.1 | Semantic similarity |
| scikit-learn | 1.4.0 | ML utilities |
| PyMuPDF | 1.23.8 | PDF processing & security |
| langdetect | 1.0.9 | Language detection |
| python-magic | 0.4.27 | MIME validation |
| slowapi | 0.1.9 | Rate limiting |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker & Docker Compose | Containerization & orchestration |
| Supabase | Managed PostgreSQL database |
| GitHub Actions (planned) | CI/CD pipeline |

---

## 9. Deployment

The application is deployed as three Docker containers orchestrated via `docker-compose.yml`, backed by a Supabase-hosted PostgreSQL database.

| Container | Image Base | Port |
|-----------|-----------|------|
| `skillora_ml` | `python:3.11-slim` | 8000 |
| `skillora_backend` | `node:20-alpine` | 3000 |
| `skillora_frontend` | `node:20-alpine` | 3001 |

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment instructions.

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| NLP model inaccuracy for non-English | Medium | Medium | Multilingual model + language-specific skill dicts |
| ATS scoring false positives | Low | Medium | Conservative scoring with clear category breakdowns |
| GitHub API rate limits | Low | High | Optional `GITHUB_TOKEN` increases limit to 5000/hr |
| Large file DoS attacks | High | Low | 10MB limit, MIME validation, rate limiting |
| Database connection failures | High | Low | Supabase managed infra, connection pooling |
| ML service memory usage | Medium | Medium | Recommend 4GB+ Docker memory allocation |

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **ATS** | Applicant Tracking System — software used by employers to filter resumes |
| **NLP** | Natural Language Processing — AI techniques for understanding text |
| **Semantic Similarity** | Measuring how alike two pieces of text are in meaning, not just keywords |
| **Sentence Transformers** | Pre-trained models that encode text into dense vector embeddings |
| **spaCy** | Industrial-strength NLP library for Python |
| **Homoglyph** | Characters from different scripts that look identical (e.g., Cyrillic 'а' vs Latin 'a') |
| **OAuth** | Open Authorization — protocol for delegated access (GitHub, Google sign-in) |
| **JWT** | JSON Web Token — compact token format for stateless authentication |
| **Prisma** | Type-safe ORM for Node.js and TypeScript |
| **Supabase** | Open-source Firebase alternative with managed PostgreSQL |

---

## 12. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release — core analysis, auth, multi-language |
| 1.1.0 | Jan 2026 | OAuth account linking, tier system, GitHub profile analysis |
| 1.2.0 | Feb 2026 | ATS compatibility scoring, Resend email, profile image upload, Supabase migration |
