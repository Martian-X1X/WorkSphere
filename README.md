# WorkSphere

> **Enterprise-grade multi-tenant project management platform** built for teams that demand reliability, scalability, and real-time collaboration — designed to be licensed and deployed across organizations of any size.

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)]()
[![Build](https://img.shields.io/badge/Build-Passing-22C55E?style=flat-square)]()

---

## 📌 Overview

WorkSphere is a **multi-tenant SaaS platform** that enables organizations to manage projects, assign tasks, collaborate in real time, and track progress — all within a fully isolated, role-based workspace.

Built for **B2B commercial licensing**, WorkSphere is architected to serve multiple independent organizations from a single deployment, with strict data isolation, JWT-based authentication, and a fully auditable activity system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│          React 18 + Vite + Tailwind CSS + TanStack          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS / WebSocket (SignalR)
┌─────────────────────▼───────────────────────────────────────┐
│                        API LAYER                            │
│         ASP.NET Core 9 Web API  |  JWT Auth  |  SignalR     │
│         FluentValidation  |  Serilog  |  Global Error       │
└─────────────────────┬───────────────────────────────────────┘
                      │ EF Core 9
┌─────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                             │
│         PostgreSQL 18  |  Redis Cache  |  EF Core ORM       │
│         Multi-Tenant Isolation via TenantId (OrgId)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer            | Technology                                                   |
|------------------|--------------------------------------------------------------|
| **Backend**      | .NET 9, ASP.NET Core Web API, EF Core 9                      |
| **Database**     | PostgreSQL 18, Redis (caching), EF Core Migrations           |
| **Auth**         | JWT Bearer Tokens, Refresh Token Rotation, BCrypt, RBAC      |
| **Real-Time**    | ASP.NET Core SignalR                                         |
| **Validation**   | FluentValidation                                             |
| **Logging**      | Serilog (structured, file sink)                              |
| **Frontend**     | React 18, Vite, Tailwind CSS, TanStack Query, React Router v6|
| **UI**           | dnd-kit, Recharts, React Hook Form, Zod                      |
| **DevOps**       | Docker, GitHub Actions CI/CD, Render/Railway, Vercel         |
| **Storage**      | AWS S3 / Cloudinary, Supabase / Neon (PostgreSQL cloud)      |
| **Docs**         | Swagger / OpenAPI 3.0                                        |

---

## 📦 Backend Dependencies

| Package                                        | Version  | Purpose                        |
|------------------------------------------------|----------|--------------------------------|
| `Npgsql.EntityFrameworkCore.PostgreSQL`        | 9.0.4    | PostgreSQL provider for EF Core|
| `Microsoft.EntityFrameworkCore.Design`         | 9.0.4    | Migrations & tooling           |
| `Microsoft.EntityFrameworkCore.Tools`          | 9.0.4    | EF Core CLI                    |
| `Microsoft.AspNetCore.Authentication.JwtBearer`| 9.0.4    | JWT authentication             |
| `BCrypt.Net-Next`                              | 4.1.0    | Password hashing               |
| `FluentValidation.AspNetCore`                  | 11.3.1   | Request validation             |
| `Serilog.AspNetCore`                           | 10.0.0   | Structured logging             |
| `Swashbuckle.AspNetCore`                       | 6.9.0    | Swagger / OpenAPI docs         |

---

## 🗂️ Project Structure

```
WorkSphere/
├── WorkHub.API/
│   ├── Controllers/              # API route handlers
│   ├── Data/
│   │   └── AppDbContext.cs       # EF Core DbContext + SaveChanges override
│   ├── DTOs/                     # Request & response transfer objects
│   ├── Migrations/               # EF Core auto-generated migrations
│   ├── Models/
│   │   ├── BaseEntity.cs         # Abstract base: Id, CreatedAt, UpdatedAt
│   │   ├── Organization.cs       # Tenant / organization model
│   │   ├── User.cs               # Platform user model
│   │   └── UserRole.cs           # Role constants: Owner, Admin, Member
│   ├── Services/                 # Business logic layer
│   ├── appsettings.json          # App configuration
│   └── Program.cs                # Application entry point & DI setup
├── docs/                         # Architecture & ER diagrams
├── .gitignore
└── WorkHub.sln
```

---

## 🗄️ Database Schema

### BaseEntity *(inherited by all models)*

| Column      | Type        | Notes                        |
|-------------|-------------|------------------------------|
| `Id`        | `UUID`      | Primary key, auto-generated  |
| `CreatedAt` | `TIMESTAMP` | Set automatically on insert  |
| `UpdatedAt` | `TIMESTAMP` | Auto-updated on every save   |

> All models inherit `BaseEntity`. `UpdatedAt` is automatically refreshed on every `SaveChangesAsync` call via the DbContext override — no manual tracking required.

---

### Organizations

| Column      | Type           | Constraints       |
|-------------|----------------|-------------------|
| `Id`        | `UUID`         | PK                |
| `Name`      | `VARCHAR(100)` | Required          |
| `Slug`      | `VARCHAR(100)` | Required, Unique  |
| `CreatedAt` | `TIMESTAMP`    | Auto              |
| `UpdatedAt` | `TIMESTAMP`    | Auto              |

---

### Users

| Column           | Type           | Constraints               |
|------------------|----------------|---------------------------|
| `Id`             | `UUID`         | PK                        |
| `FirstName`      | `VARCHAR(50)`  | Required                  |
| `LastName`       | `VARCHAR(50)`  | Required                  |
| `Email`          | `VARCHAR(100)` | Required, Unique          |
| `PasswordHash`   | `TEXT`         | BCrypt hashed             |
| `OrganizationId` | `UUID`         | FK → Organizations.Id     |
| `Role`           | `VARCHAR(20)`  | Owner / Admin / Member    |
| `IsActive`       | `BOOLEAN`      | Default: true             |
| `CreatedAt`      | `TIMESTAMP`    | Auto                      |
| `UpdatedAt`      | `TIMESTAMP`    | Auto                      |

---

### Role Permissions

| Role     | Capabilities                                         |
|----------|------------------------------------------------------|
| `Owner`  | Full platform control — billing, settings, all data  |
| `Admin`  | Manage members, projects, tasks within the org       |
| `Member` | Create and update tasks assigned to them             |

---

### Entity Relationships

```
Organizations (1) ──────────────── (many) Users
     │
     └── All data is isolated per OrganizationId (multi-tenancy)
```

---

## ⚙️ Local Development Setup

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [PostgreSQL 18](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)
- [Node.js 20+](https://nodejs.org/) *(required for frontend — Phase 3)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/Martian-X1X/WorkSphere.git
cd WorkSphere
```

### 2. Create the Database

Using PostgreSQL CLI or pgAdmin 4:
```sql
CREATE DATABASE workhub_db;
```

### 3. Configure Connection String

Edit `WorkHub.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=workhub_db;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

> ⚠️ Never commit `appsettings.json` with real credentials. Use environment variables or secrets management in production.

### 4. Install EF Core CLI Tool

```bash
dotnet tool install --global dotnet-ef
```

### 5. Apply Migrations

```bash
cd WorkHub.API
dotnet ef database update
```

### 6. Run the API

```bash
dotnet run
```

### 7. Open Swagger UI

```
http://localhost:5210/swagger
```

---

## 🗺️ Full Database Roadmap

| # | Table             | Phase   | Day     | Purpose                          |
|---|-------------------|---------|---------|----------------------------------|
| 1 | `Organizations`   | Phase 1 | Day 2   | Tenant isolation                 |
| 2 | `Users`           | Phase 1 | Day 2   | Authentication & roles           |
| 3 | `Projects`        | Phase 2 | Day 18  | Project containers               |
| 4 | `Tasks`           | Phase 2 | Day 19  | Work items inside projects       |
| 5 | `TaskAssignees`   | Phase 2 | Day 22  | User-task assignments            |
| 6 | `Comments`        | Phase 2 | Day 27  | Task-level discussions           |
| 7 | `ActivityLogs`    | Phase 2 | Day 28  | Full audit trail                 |
| 8 | `Notifications`   | Phase 4 | Day 61  | In-app notification system       |
| 9 | `ChatRooms`       | Phase 5 | Day 70  | Real-time team messaging         |
|10 | `Messages`        | Phase 5 | Day 70  | Chat messages per room           |
|11 | `FileAttachments` | Phase 5 | Day 77  | Files linked to tasks            |

---

## 📅 Development Log

### ✅ Day 1 — Infrastructure Setup
- Initialized .NET 9 Web API project and solution
- Configured PostgreSQL 18 connection via EF Core
- Installed and pinned all NuGet packages to .NET 9 compatible versions
- Created `AppDbContext` with PostgreSQL provider
- Ran initial EF Core migration — database connected and verified
- Swagger UI operational at `http://localhost:5210/swagger`
- Repository published to GitHub

### ✅ Day 2 — Core Domain Modeling
- Designed full database schema for Phase 1 (Organizations + Users)
- Implemented `BaseEntity` abstract class — all models inherit `Id`, `CreatedAt`, `UpdatedAt`
- Built `Organization` model with slug-based unique identification
- Built `User` model with BCrypt-ready password hash field and FK to Organization
- Created `UserRole` constants: `Owner`, `Admin`, `Member`
- Configured EF Core fluent API: unique indexes, max lengths, cascade deletes
- Added automatic `UpdatedAt` refresh in `SaveChangesAsync` override
- Ran named migration `AddOrganizationAndUserTables` — tables verified in pgAdmin 4

---

### ✅ Day 3 — Full Schema Design & ER Diagram

## 📊 ER Diagram

<p align="center">
  <img src="docs/er-diagram.png" alt="WorkSphere ER Diagram" width="900"/>
</p>

<details open>
- Designed the **complete 11-table database schema** covering all platform features
- Defined all entities: `Projects`, `Tasks`, `Comments`, `FileAttachments`, `ActivityLogs`, `Notifications`, `ChatRooms`, `Messages`
- Mapped all **foreign key relationships** with `DEFERRABLE INITIALLY IMMEDIATE` constraints
- Documented column types, constraints, and enum values (`Status`, `Priority`, `Role`)
- Generated the **full ER Diagram** — visualizing all tables, columns, and relationships
- Published schema as `.sql` source file and diagram to `docs/`
</details>


### ✅ Day 4 — Database Connection Hardening
 
> 🎯 **Goal:** Make the database layer secure, resilient, and production-observable
 
| Task | Status |
|------|--------|
| Migrated credentials to `.NET User Secrets` — connection string removed from source control | ✅ |
| Added EF Core **retry resilience** — 3 retries with 5-second delay on transient failures | ✅ |
| Enabled **SQL query logging** in development — every EF Core command visible in console | ✅ |
| Enabled **detailed EF Core error messages** for development debugging | ✅ |
| Installed `HealthChecks.EntityFrameworkCore` package | ✅ |
| Registered and mapped `/health` endpoint — returns `Healthy` confirming DB connectivity | ✅ |
| Verified both applied migrations via `dotnet ef migrations list` | ✅ |
| Verified all table columns, constraints, and indexes in pgAdmin 4 | ✅ |
| Confirmed FK constraint: `FK_Users_Organizations_OrganizationId` | ✅ |
| Confirmed unique indexes: `IX_Users_Email`, `IX_Organizations_Slug` | ✅ |
| Tested raw SQL insert / read / delete in pgAdmin Query Tool — passed | ✅ |
 
**Migration Status:**
```
✔  20260419_InitialCreate                    [Applied]
✔  20260420_AddOrganizationAndUserTables     [Applied]
```
 
**Active Endpoints after Day 4:**
 
| Method | Endpoint   | Description           | Auth   |
|--------|------------|-----------------------|--------|
| `GET`  | `/health`  | Database health check | Public |
| `GET`  | `/swagger` | API documentation UI  | Public |
 
---
### ✅ Day 5 — Production-Grade Model Upgrade
 
> 🎯 **Goal:** Upgrade all models, introduce DTOs, soft delete, and service layer foundation
 
| Task | Status |
|---|---|
| Upgraded `BaseEntity` with soft delete — `IsDeleted`, `DeletedAt` | ✅ |
| Intercepted hard deletes in `SaveChangesAsync` → converted to soft delete | ✅ |
| Added EF Core global query filters — deleted records excluded from all queries | ✅ |
| Upgraded `Organization` model — `Description`, `LogoUrl`, `Plan` fields | ✅ |
| Upgraded `User` model — `IsEmailVerified`, `LastLoginAt`, `ProfilePictureUrl` | ✅ |
| Added auth token fields to `User` — `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken` | ✅ |
| Added `FullName` computed property (not persisted to DB) | ✅ |
| Upgraded `UserRole` with `IsValid()` helper and `All` array | ✅ |
| Created `RegisterRequestDto` with full validation annotations | ✅ |
| Created `LoginRequestDto` | ✅ |
| Created `AuthResponseDto` + `UserDto` — safe API response shapes | ✅ |
| Created `OrganizationDto` + `CreateOrganizationDto` | ✅ |
| Created `ISlugService` interface in `Interfaces/` | ✅ |
| Implemented `SlugService` — generates URL slugs + ensures uniqueness in DB | ✅ |
| Registered `ISlugService` / `SlugService` in DI container | ✅ |
| Ran migration `UpgradeModelsDay5` — all new columns verified in pgAdmin 4 | ✅ |
 
**Migration History after Day 5:**
```
✔  20260419_InitialCreate                      [Applied]
✔  20260420_AddOrganizationAndUserTables        [Applied]
✔  20260421_UpgradeModelsDay5                   [Applied]
```
 
**New Columns Added — Organizations:**
```
+ Description          VARCHAR(500)    nullable
+ LogoUrl              VARCHAR(255)    nullable
+ Plan                 VARCHAR(20)     default: 'Free'
+ IsDeleted            BOOLEAN         default: false
+ DeletedAt            TIMESTAMP       nullable
```
 
**New Columns Added — Users:**
```
+ IsEmailVerified          BOOLEAN      default: false
+ LastLoginAt              TIMESTAMP    nullable
+ ProfilePictureUrl        TEXT         nullable
+ RefreshToken             TEXT         nullable
+ RefreshTokenExpiry       TIMESTAMP    nullable
+ EmailVerificationToken   TEXT         nullable
+ EmailVerificationExpiry  TIMESTAMP    nullable
+ PasswordResetToken       TEXT         nullable
+ PasswordResetExpiry      TIMESTAMP    nullable
+ IsDeleted                BOOLEAN      default: false
+ DeletedAt                TIMESTAMP    nullable
```
 
**Live Endpoints after Day 5:**
 
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Database health check | Public |
| `GET` | `/swagger` | API documentation UI | Public |
 
---

### ✅ Day 6 — User Registration API
 
> 🎯 **Goal:** Build `POST /api/auth/register` — the first real working endpoint with full validation, BCrypt hashing, auto slug generation, and atomic DB writes
 
| Task | Status |
|---|---|
| Created `ApiResponse<T>` universal response wrapper in `DTOs/Common/` | ✅ |
| Suppressed ASP.NET default validation format — all errors use `ApiResponse<T>` | ✅ |
| Created `IAuthService` interface in `Interfaces/` | ✅ |
| Implemented `AuthService` with full registration logic | ✅ |
| Email normalization — trimmed + lowercased before DB check | ✅ |
| Email uniqueness check — `409 Conflict` if already registered | ✅ |
| Auto slug generation via `ISlugService` — `"Martian Labs"` → `"martian-labs"` | ✅ |
| BCrypt password hashing — work factor `12` (~300ms, production-safe) | ✅ |
| Organization + User created atomically in single `SaveChangesAsync` | ✅ |
| First registered user automatically assigned `Owner` role | ✅ |
| Created `AuthController` — thin controller, all logic in service | ✅ |
| Correct HTTP status codes: `201 Created`, `400 Bad Request`, `409 Conflict` | ✅ |
| Registered `IAuthService` / `AuthService` in DI container | ✅ |
| All edge cases tested in Postman — all passing | ✅ |
| BCrypt hash verified in pgAdmin — `$2a$12$...` format confirmed | ✅ |
 
---
 
#### 🔌 Endpoint Reference
 
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new org + owner account | Public |
| `GET` | `/health` | Database health check | Public |
| `GET` | `/swagger` | API documentation UI | Public |
 
---
 
#### 📬 Postman Test Suite — `POST /api/auth/register`
 
**Base URL:** `http://localhost:5210/api/auth/register`
**Headers:** `Content-Type: application/json`
 
---
 
##### ✅ Test 1 — Happy Path: Successful Registration
 
**Request Body:**
```json
{
  "firstName": "Abdul",
  "lastName": "Martian",
  "email": "abdul@worksphere.io",
  "password": "SecurePass123!",
  "organizationName": "Martian Labs"
}
```
 
**Response — `201 Created`:**
```json
{
  "success": true,
  "message": "Registration successful. Welcome to WorkSphere!",
  "data": {
    "accessToken": "",
    "refreshToken": "",
    "expiresAt": "2026-05-04T10:44:12.4607028Z",
    "user": {
      "id": "1f91c17c-c2f8-48ff-90f6-c09c7e8fda55",
      "firstName": "Abdul",
      "lastName": "Martian",
      "fullName": "Abdul Martian",
      "email": "abdul@worksphere.io",
      "role": "Owner",
      "organizationId": "c85699b6-5cb3-4ca9-9107-287ed66e3caf",
      "organizationName": "Martian Labs",
      "isEmailVerified": false,
      "profilePictureUrl": null
    }
  },
  "errors": [],
  "timestamp": "2026-05-04T10:44:12.46139Z"
}
```
 
> 🟢 Organization created with slug `martian-labs`. User assigned `Owner` role. Password stored as BCrypt hash `$2a$12$...`. Tokens will be populated on Day 8 (JWT).
 
---
 
##### ❌ Test 2 — Duplicate Email: Conflict
 
**Request Body:**
```json
{
  "firstName": "Abdul",
  "lastName": "Martian",
  "email": "abdul@worksphere.io",
  "password": "SecurePass123!",
  "organizationName": "Another Labs"
}
```
 
**Response — `409 Conflict`:**
```json
{
  "success": false,
  "message": "An account with this email address already exists.",
  "data": null,
  "errors": [
    "An account with this email address already exists."
  ],
  "timestamp": "2026-05-04T10:15:24.001749Z"
}
```
 
> 🔴 Email uniqueness enforced at service level before any DB write. No duplicate organizations created.
 
---
 
##### ❌ Test 3 — Missing All Required Fields: Validation Error
 
**Request Body:**
```json
{
  "firstName": "",
  "email": "notvalid",
  "password": "123"
}
```
 
**Response — `400 Bad Request`:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "Invalid email address",
    "Last name is required",
    "Password must be at least 8 characters",
    "First name is required",
    "Organization name is required"
  ],
  "timestamp": "2026-05-04T10:44:58.8296049Z"
}
```
 
> 🔴 All validation errors returned in a single response. Custom `ApiResponse<T>` format used — no ASP.NET default error shape.
 
---
 
##### ❌ Test 4 — Invalid Email Format
 
**Request Body:**
```json
{
  "firstName": "Abdul",
  "lastName": "Martian",
  "email": "not-an-email",
  "password": "SecurePass123!",
  "organizationName": "Martian Labs"
}
```
 
**Response — `400 Bad Request`:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "Invalid email address"
  ],
  "timestamp": "2026-05-04T10:45:13.6631008Z"
}
```
 
---
 
##### ❌ Test 5 — Password Too Short
 
**Request Body:**
```json
{
  "firstName": "Abdul",
  "lastName": "Martian",
  "email": "test2@worksphere.io",
  "password": "123",
  "organizationName": "Martian Labs"
}
```
 
**Response — `400 Bad Request`:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "Password must be at least 8 characters"
  ],
  "timestamp": "2026-05-04T10:45:30.3277028Z"
}
```
 
---
 
#### 🗄️ Database State After Registration — pgAdmin Verified
 
**Organizations table:**
 
| Field | Value |
|---|---|
| `Id` | `d712cfa7-32d5-4088-8405-863b34c63133` |
| `Name` | `Martian Labs` |
| `Slug` | `martian-labs` ← auto-generated |
| `Plan` | `Free` |
| `IsActive` | `true` |
| `IsDeleted` | `false` |
| `CreatedAt` | `2026-05-04 16:14:49` |
 
**Users table:**
 
| Field | Value |
|---|---|
| `Id` | `1dc1ec78-ae24-4f1c-a087-a0cee8bd5092` |
| `Email` | `abdul@worksphere.io` |
| `Role` | `Owner` |
| `PasswordHash` | `$2a$12$6LxNRO1XNmnckaUOPAFE4.d4lwK...` ← BCrypt |
| `IsEmailVerified` | `false` |
| `IsDeleted` | `false` |
| `OrganizationId` | `d712cfa7-...` ← FK to org above |
 
> 🔐 Plain text password is **never stored**. The `$2a$12$` prefix confirms BCrypt with work factor 12.
 
---
 
#### 🔄 Registration Flow Diagram
 
```
Client                    AuthController              AuthService                PostgreSQL
  │                            │                          │                          │
  │─── POST /api/auth/register ──>│                          │                          │
  │                            │── RegisterAsync(dto) ────>│                          │
  │                            │                          │── Normalize email         │
  │                            │                          │── Check email exists ────>│
  │                            │                          │<── false ─────────────────│
  │                            │                          │── GenerateUniqueSlug()    │
  │                            │                          │── BCrypt.HashPassword()   │
  │                            │                          │── Create Organization     │
  │                            │                          │── Create User (Owner)     │
  │                            │                          │── SaveChangesAsync() ────>│
  │                            │                          │<── Saved ─────────────────│
  │                            │<── ApiResponse<T> ────────│                          │
  │<── 201 Created ─────────────│                          │                          │
```
 
--- 
 
> No new migration required on Day 6 — no schema changes, only new service and controller code.
 
---

## 🛣️ Product Roadmap

| Phase | Days     | Milestone                                              | Status      |
|-------|----------|--------------------------------------------------------|-------------|
| 1     | 1 – 15   | Backend foundation: auth, JWT, roles, multi-tenancy    | 🟡 In Progress |
| 2     | 16 – 30  | Project & task API: CRUD, filtering, pagination, logs  | 🔲 Upcoming |
| 3     | 31 – 50  | React frontend: dashboard, kanban, drag & drop         | 🔲 Upcoming |
| 4     | 51 – 65  | Fullstack: notifications, invites, search, permissions | 🔲 Upcoming |
| 5     | 66 – 80  | Real-time: SignalR chat, presence, file uploads        | 🔲 Upcoming |
| 6     | 81 – 90  | DevOps: Docker, CI/CD, cloud deployment                | 🔲 Upcoming |
| 7     | 91 – 100 | Production hardening, security audit, launch           | 🔲 Upcoming |

---

## 🔑 Key Milestones

| Day | Deliverable                                                          |
|-----|----------------------------------------------------------------------|
| 15  | Complete auth system — register, login, JWT, roles, multi-tenancy   |
| 30  | Full project & task API with filtering, pagination, activity logs    |
| 50  | Complete React frontend — dashboard, kanban, drag & drop            |
| 65  | Production-like platform with notifications, invites, permissions    |
| 80  | Real-time chat, SignalR notifications, file uploads, analytics       |
| 90  | Dockerized, deployed to cloud, CI/CD pipeline live                   |
| 100 | Production-ready SaaS — fully deployed, secured, and documented     |

---


## 📄 License

This project is **proprietary software**. All rights reserved.
Unauthorized copying, distribution, or commercial use without explicit written permission is prohibited.

---

*WorkSphere — Built for scale. Designed for teams.*