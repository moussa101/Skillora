#!/usr/bin/env bash
# ============================================================
#  Skillora — Pre-Push Checklist
#  Run this script before pushing to main to catch issues early.
#
#  Usage:
#    chmod +x pre-push-checklist.sh
#    ./pre-push-checklist.sh          # run all checks
#    ./pre-push-checklist.sh --quick  # skip Docker builds
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PASS=0
FAIL=0
WARN=0
QUICK=false

[[ "${1:-}" == "--quick" ]] && QUICK=true

header() {
  echo ""
  echo -e "${BLUE}${BOLD}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}${BOLD}  $1${NC}"
  echo -e "${BLUE}${BOLD}═══════════════════════════════════════${NC}"
}

step() {
  echo -e "\n${BOLD}➤ $1${NC}"
}

pass() {
  echo -e "  ${GREEN}✔ $1${NC}"
  PASS=$((PASS + 1))
}

fail() {
  echo -e "  ${RED}✘ $1${NC}"
  FAIL=$((FAIL + 1))
}

warn() {
  echo -e "  ${YELLOW}⚠ $1${NC}"
  WARN=$((WARN + 1))
}

# ============================================================
header "1. Git Status"
# ============================================================

step "Checking for uncommitted changes..."
if [[ -z "$(git status --porcelain)" ]]; then
  pass "Working tree is clean"
else
  warn "You have uncommitted changes — commit or stash them first"
  git status --short
fi

step "Checking current branch..."
BRANCH=$(git branch --show-current)
echo "  Branch: $BRANCH"
if [[ "$BRANCH" == "main" ]]; then
  warn "You are on 'main'. Consider using a feature branch."
else
  pass "On branch '$BRANCH' (not main directly)"
fi

# ============================================================
header "2. Backend Checks (NestJS)"
# ============================================================

pushd backend > /dev/null

step "Installing dependencies..."
if npm ci --silent 2>/dev/null; then
  pass "npm ci succeeded"
else
  if npm install --silent 2>/dev/null; then
    pass "npm install succeeded"
  else
    fail "npm install failed"
  fi
fi

step "Linting backend..."
if npx eslint "{src,test}/**/*.ts" --max-warnings=0 2>/dev/null; then
  pass "ESLint passed (0 warnings)"
elif npx eslint "{src,test}/**/*.ts" 2>/dev/null; then
  warn "ESLint passed with warnings"
else
  fail "ESLint found errors"
fi

step "Compiling TypeScript..."
if npx tsc --noEmit 2>/dev/null; then
  pass "TypeScript compilation OK"
else
  fail "TypeScript compilation errors"
fi

step "Running unit tests..."
if npx jest --passWithNoTests --forceExit 2>/dev/null; then
  pass "Unit tests passed"
else
  fail "Unit tests failed"
fi

step "Running e2e tests..."
if npx jest --config ./test/jest-e2e.json --passWithNoTests --forceExit 2>/dev/null; then
  pass "E2E tests passed"
else
  warn "E2E tests failed (may need running services)"
fi

step "Checking Prisma schema..."
if npx prisma validate 2>/dev/null; then
  pass "Prisma schema is valid"
else
  fail "Prisma schema validation failed"
fi

step "Building backend..."
if npm run build 2>/dev/null; then
  pass "Backend build succeeded"
else
  fail "Backend build failed"
fi

popd > /dev/null

# ============================================================
header "3. Frontend Checks (Next.js)"
# ============================================================

pushd frontend > /dev/null

step "Installing dependencies..."
if npm ci --silent 2>/dev/null; then
  pass "npm ci succeeded"
else
  if npm install --silent 2>/dev/null; then
    pass "npm install succeeded"
  else
    fail "npm install failed"
  fi
fi

step "Linting frontend..."
if npx eslint . 2>/dev/null; then
  pass "ESLint passed"
else
  warn "ESLint found issues"
fi

step "Type-checking frontend..."
if npx tsc --noEmit 2>/dev/null; then
  pass "TypeScript compilation OK"
else
  fail "TypeScript compilation errors"
fi

step "Building frontend..."
if NEXT_PUBLIC_API_URL=https://backend-production-e2f3.up.railway.app npm run build 2>/dev/null; then
  pass "Frontend build succeeded"
else
  fail "Frontend build failed"
fi

popd > /dev/null

# ============================================================
header "4. ML Service Checks (Python)"
# ============================================================

pushd ml_service > /dev/null

step "Checking Python availability..."
if command -v python3 &>/dev/null; then
  pass "Python3 found: $(python3 --version)"
else
  fail "Python3 not found"
fi

step "Running pytest..."
if python3 -m pytest tests/ -v --tb=short 2>/dev/null; then
  pass "ML service tests passed"
else
  warn "ML service tests failed (may need dependencies installed)"
fi

step "Checking for syntax errors..."
SYNTAX_ERRORS=0
for f in *.py; do
  if ! python3 -c "import ast; ast.parse(open('$f').read())" 2>/dev/null; then
    fail "Syntax error in $f"
    SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
  fi
done
if [[ $SYNTAX_ERRORS -eq 0 ]]; then
  pass "No syntax errors in Python files"
fi

popd > /dev/null

# ============================================================
header "5. Docker Builds"
# ============================================================

if $QUICK; then
  echo -e "  ${YELLOW}Skipped (--quick mode)${NC}"
else
  step "Building backend Docker image..."
  if docker build -t skillora-backend-test ./backend 2>/dev/null; then
    pass "Backend Docker build OK"
  else
    warn "Backend Docker build failed"
  fi

  step "Building frontend Docker image..."
  if docker build --build-arg NEXT_PUBLIC_API_URL=https://backend-production-e2f3.up.railway.app -t skillora-frontend-test ./frontend 2>/dev/null; then
    pass "Frontend Docker build OK"
  else
    warn "Frontend Docker build failed"
  fi

  step "Building ML service Docker image..."
  if docker build -t skillora-ml-test ./ml_service 2>/dev/null; then
    pass "ML service Docker build OK"
  else
    warn "ML service Docker build failed"
  fi
fi

# ============================================================
header "6. Environment & Config Checks"
# ============================================================

step "Checking for .env files that shouldn't be committed..."
if git ls-files --cached | grep -q '\.env$'; then
  fail ".env file is tracked by git — add it to .gitignore!"
else
  pass "No .env files tracked in git"
fi

step "Checking .gitignore..."
for pattern in "node_modules" ".env" "dist" "__pycache__" "uploads/"; do
  if grep -q "$pattern" .gitignore 2>/dev/null; then
    pass ".gitignore includes $pattern"
  else
    warn ".gitignore missing $pattern"
  fi
done

step "Checking for TODO/FIXME/HACK in code..."
TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.py" --include="*.tsx" backend/src frontend/src ml_service/*.py 2>/dev/null | wc -l | tr -d ' ')
if [[ "$TODO_COUNT" -gt 0 ]]; then
  warn "Found $TODO_COUNT TODO/FIXME/HACK comments in source code"
else
  pass "No TODO/FIXME/HACK comments found"
fi

step "Checking for console.log in production code..."
CONSOLE_COUNT=$(grep -rn "console\.log" --include="*.ts" --include="*.tsx" backend/src frontend/src 2>/dev/null | grep -v "spec\.\|test\.\|\.spec\.\|\.test\." | wc -l | tr -d ' ')
if [[ "$CONSOLE_COUNT" -gt 5 ]]; then
  warn "Found $CONSOLE_COUNT console.log statements (consider removing)"
else
  pass "console.log count is acceptable ($CONSOLE_COUNT)"
fi

# ============================================================
header "RESULTS"
# ============================================================

echo ""
echo -e "  ${GREEN}Passed:   $PASS${NC}"
echo -e "  ${YELLOW}Warnings: $WARN${NC}"
echo -e "  ${RED}Failed:   $FAIL${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}${BOLD}✘ PRE-PUSH CHECK FAILED — Fix the above issues before pushing.${NC}"
  exit 1
elif [[ $WARN -gt 0 ]]; then
  echo -e "${YELLOW}${BOLD}⚠ PRE-PUSH CHECK PASSED WITH WARNINGS — Review before pushing.${NC}"
  exit 0
else
  echo -e "${GREEN}${BOLD}✔ ALL CHECKS PASSED — Safe to push!${NC}"
  exit 0
fi
