# Changelog

All notable changes to Skillora will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-10

### 🎉 Initial Release

This is the first stable release of Skillora, an AI-powered resume analysis platform that helps job seekers optimize their resumes for specific roles.

### ✨ Features

#### Core Analysis Engine
- **Resume-Job Matching**: Semantic similarity scoring using Sentence Transformers with multilingual support
- **Skill Extraction**: Automatic detection of 100+ technical skills, languages, and frameworks
- **ATS Compatibility Scoring**: Comprehensive evaluation across 5 weighted categories:
  - Formatting & Parsability (25%)
  - Section Structure (20%)
  - Keyword Optimization (25%)
  - Contact Information (10%)
  - Content Quality (20%)
- **Gap Analysis**: Identifies missing skills and keywords with actionable feedback

#### Multi-Language Support
- Resume analysis in 12+ languages: English, Spanish, French, German, Arabic, Chinese, Japanese, Korean, Portuguese, Russian, Italian, Dutch
- Language auto-detection
- Language-specific skill dictionaries and variants

#### File Format Support
- PDF parsing with layout preservation
- Microsoft Word (DOCX) support
- Plain text (TXT) files
- Rich Text Format (RTF)
- HTML documents

#### Security Features
- **Resume Manipulation Detection**: 
  - Invisible text detection
  - Unicode homoglyph detection
  - Hidden character scanning
  - Zero-width character detection
- **Security Scoring**: Flags suspicious patterns and manipulation attempts

#### GitHub Integration
- Developer profile analysis
- Repository activity tracking
- Contribution statistics
- Language usage analysis
- Profile enrichment for technical candidates

#### Authentication & User Management
- OAuth integration (GitHub, Google, Apple)
- JWT-based authentication
- Email verification
- Password reset functionality
- Session management

#### User Features
- **Profile Management**: 
  - Avatar upload and management
  - Usage statistics tracking
  - Tier-based limits (Free: 5 analyses/month)
- **Analysis History**: View past resume analyses
- **Real-time Feedback**: Detailed scoring breakdowns and improvement suggestions

#### API & Integration
- RESTful API built with NestJS
- Swagger/OpenAPI documentation
- Rate limiting and throttling
- Multi-part form data support for file uploads
- CORS configuration for cross-origin requests

#### Infrastructure
- **Backend**: NestJS 11 (TypeScript)
- **Frontend**: Next.js 16 with React 19
- **ML Service**: FastAPI (Python)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase integration
- **Deployment**: Docker-ready with Railway hosting
- **Email**: Resend integration for transactional emails
- **Storage**: Sharp for image processing

### 🔧 Technical Highlights

- **NLP Models**: 
  - spaCy for text processing
  - Sentence Transformers (paraphrase-multilingual-MiniLM-L12-v2)
  - Custom skill extraction algorithms
- **Performance**: 
  - Average analysis time < 8 seconds
  - Skill extraction accuracy ≥ 90%
  - Support for documents up to 10MB
- **Security**:
  - Helmet.js for HTTP headers
  - Input validation with class-validator
  - Rate limiting to prevent abuse
  - Secure file upload handling

### 📚 Documentation

- Product Requirements Document (PRD)
- API Documentation (Swagger)
- Deployment Guide
- Contributing Guidelines
- Entity-Relationship Diagrams
- README with quickstart guide

### 🌐 Live Deployment

- **Frontend**: https://skillora1.up.railway.app
- **Backend API**: https://backend-production-e2f3.up.railway.app
- **API Documentation**: Available at `/api` endpoint

### 📦 Components

- `backend/`: NestJS backend service with PostgreSQL
- `frontend/`: Next.js frontend application
- `ml_service/`: FastAPI-based ML analysis service
- `Documentation/`: Comprehensive project documentation
- `test_data/`: Sample resumes and test files

### 🔐 License

MIT License - See LICENSE file for details

### 🙏 Acknowledgments

This project uses several open-source libraries and frameworks:
- Next.js, React, NestJS
- FastAPI, spaCy, Sentence Transformers
- PostgreSQL, Prisma
- Docker, Railway

---

## [Unreleased]

### Planned Features
- Advanced analytics dashboard
- Resume template suggestions
- Industry-specific skill databases
- Multi-resume comparison
- Interview question generation based on skills
- Integration with job boards

---

For more details, see the [Product Requirements Document](Documentation/PRD.md).
