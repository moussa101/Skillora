# Skillora — Entity Relationship Diagram

> Auto-generated from `backend/prisma/schema.prisma` — Last updated: February 9, 2026

---

## ERD

```mermaid
erDiagram
    User {
        int id PK
        string email UK
        string password "nullable - OAuth users"
        string name "nullable"
        string image "nullable"
        UserRole role "CANDIDATE | RECRUITER | ADMIN"
        UserTier tier "GUEST | PRO | RECRUITER"
        boolean emailVerified
        UserType userType "STUDENT | PROFESSIONAL | RECRUITER"
        boolean onboardingComplete
        AuthProvider provider "EMAIL | GITHUB | GOOGLE | APPLE"
        string providerId "nullable"
        string githubId "nullable"
        string googleId "nullable"
        string stripeCustomerId "nullable"
        SubscriptionStatus subscriptionStatus "NONE | ACTIVE | CANCELLED | PAST_DUE"
        datetime subscriptionEndDate "nullable"
        int analysesThisMonth
        datetime analysesResetDate
        int organizationId FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Organization {
        int id PK
        string name
        string billingEmail
        string stripeCustomerId "nullable"
        string apiKey UK
        datetime createdAt
        datetime updatedAt
    }

    Resume {
        int id PK
        int userId FK
        string filePath
        string fileName
        int fileSize
        text parsedText "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Analysis {
        int id PK
        int resumeId FK
        text jobDescText
        float matchScore
        string_array skillsFound
        string_array missingSkills
        json feedback "nullable"
        datetime createdAt
    }

    VerificationCode {
        int id PK
        string email
        string code
        VerificationCodeType type "EMAIL_VERIFICATION | PASSWORD_RESET"
        datetime expiresAt
        boolean used
        datetime createdAt
    }

    Organization ||--o{ User : "has members"
    User ||--o{ Resume : "uploads"
    Resume ||--o{ Analysis : "has"
```

---

## Relationships

| Relationship | Type | Description |
|---|---|---|
| Organization → User | One-to-Many | An organization has many member users (Recruiter tier) |
| User → Resume | One-to-Many | A user uploads many resumes (cascade delete) |
| Resume → Analysis | One-to-Many | A resume has many analyses against different job descriptions (cascade delete) |
| VerificationCode | Standalone | Linked by email string (not FK) for email verification and password reset codes |

## Enums

| Enum | Values | Used By |
|------|--------|---------|
| `UserRole` | CANDIDATE, RECRUITER, ADMIN | User.role |
| `UserTier` | GUEST, PRO, RECRUITER | User.tier |
| `SubscriptionStatus` | NONE, ACTIVE, CANCELLED, PAST_DUE | User.subscriptionStatus |
| `AuthProvider` | EMAIL, GITHUB, GOOGLE, APPLE | User.provider |
| `UserType` | STUDENT, PROFESSIONAL, RECRUITER | User.userType |
| `VerificationCodeType` | EMAIL_VERIFICATION, PASSWORD_RESET | VerificationCode.type |

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| User | `email` | Fast lookups by email |
| User | `providerId` | Fast OAuth provider lookups |
| Resume | `userId` | Fast user resume listing |
| Analysis | `resumeId` | Fast resume analysis listing |
| VerificationCode | `email, code, type` | Fast code verification lookups |
