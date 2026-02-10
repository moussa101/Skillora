# Contributing to Skillora

Thank you for your interest in contributing to Skillora! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Docker Desktop** (v20.10+)
- **Node.js** (v18+) for local development
- **Python** (3.11+) for ML service development
- **Git** for version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AI-Resume-Analyzer.git
   cd AI-Resume-Analyzer
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/moussa101/AI-Resume-Analyzer.git
   ```

## Development Setup

### Using Docker (Recommended)

```bash
# Start all services
docker compose up --build

# Services available at:
# - Frontend: http://localhost:3001
# - Backend API: http://localhost:3000
# - ML Service: http://localhost:8000/docs
```

> **Production URLs (Railway):**
> - Frontend: https://skillora1.up.railway.app
> - Backend API: https://backend-production-e2f3.up.railway.app
> - ML Service: https://ml-service-production-8b08.up.railway.app

### Local Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

#### ML Service
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "import spacy; spacy.cli.download('en_core_web_sm')"
uvicorn main:app --reload
```

## Making Changes

### Branch Naming

Create descriptive branch names:

```bash
# Feature branches
git checkout -b feature/add-resume-templates

# Bug fixes
git checkout -b fix/login-redirect-issue

# Documentation
git checkout -b docs/update-api-reference

# Refactoring
git checkout -b refactor/simplify-auth-flow
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add password strength indicator
fix(ml): handle empty resume text gracefully
docs(readme): update installation instructions
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   # Frontend
   cd frontend && npm run lint
   
   # Backend
   cd backend && npm run lint
   
   # ML Service
   cd ml_service && python -m pytest
   ```

3. **Ensure Docker builds:**
   ```bash
   docker compose build
   ```

4. **Check environment variables:**
   - `NEXT_PUBLIC_*` vars are baked into the frontend at **build time**. If you change them, you must rebuild.
   - OAuth callback URLs must match between your provider (GitHub/Google) settings and your env vars.
   - For local dev, use `http://localhost:3000/auth/{provider}/callback`.
   - For production, use `https://backend-production-e2f3.up.railway.app/auth/{provider}/callback`.

### PR Guidelines

- Fill out the PR template completely
- Link related issues using `Fixes #123` or `Closes #123`
- Include screenshots for UI changes
- Keep PRs focused and reasonably sized
- Respond to review feedback promptly

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. All discussions must be resolved
4. Branch must be up-to-date with main

## Coding Standards

### TypeScript/JavaScript (Frontend & Backend)

```typescript
// Use ESLint and Prettier
// Run: npm run lint

// Naming conventions
const userProfile = {};           // camelCase for variables
function getUserById() {}         // camelCase for functions
class UserService {}              // PascalCase for classes
const MAX_RETRIES = 3;           // SCREAMING_SNAKE_CASE for constants

// Prefer explicit types
function processUser(user: User): Promise<UserResponse> {
  // ...
}
```

### Python (ML Service)

```python
# Follow PEP 8 and use Black formatter
# Run: black . && isort .

# Naming conventions
user_profile = {}                 # snake_case for variables
def get_user_by_id():            # snake_case for functions
class UserService:               # PascalCase for classes
MAX_RETRIES = 3                  # SCREAMING_SNAKE_CASE for constants

# Use type hints
def process_resume(text: str) -> AnalysisResult:
    ...
```

### CSS

```css
/* Use CSS Variables for theming */
.component {
    color: var(--foreground);
    background: var(--background);
}

/* Mobile-first responsive design */
@media (min-width: 768px) {
    .component {
        /* Desktop styles */
    }
}
```

## Testing Guidelines

### Frontend Tests
```bash
cd frontend
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests (if available)
```

### Backend Tests
```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # Integration tests
```

### ML Service Tests
```bash
cd ml_service
python -m pytest tests/
python test_data/real_world/run_tests.py  # Integration tests
```

### Test Coverage

- Aim for >80% coverage on new code
- Write tests for bug fixes to prevent regression
- Include edge cases and error scenarios

## Documentation

### Code Comments

```typescript
/**
 * Analyzes a resume against a job description.
 * 
 * @param resumeText - The plain text content of the resume
 * @param jobDescription - The target job description
 * @returns Analysis results with match score and feedback
 * @throws {ValidationError} If inputs are empty or invalid
 */
async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  // ...
}
```

### README Updates

- Update README.md for new features
- Keep examples current and working
- Update screenshots when UI changes

### API Documentation

- ML Service: FastAPI auto-generates docs at `/docs`
- Backend: Use Swagger decorators for NestJS endpoints

## Project Structure

```
AI-Resume-Analyzer/
├── frontend/          # Next.js frontend
├── backend/           # NestJS backend API
├── ml_service/        # Python ML service
├── test_data/         # Test files and scenarios
└── docs/              # Additional documentation
```

## Getting Help

- **Questions:** Open a Discussion on GitHub
- **Bugs:** Open an Issue with reproduction steps
- **Features:** Open an Issue describing the use case

## Recognition

Contributors are recognized in:
- Release notes for significant contributions
- README.md contributors section
- GitHub's contributor graph

---

Thank you for contributing to Skillora! 
