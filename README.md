# 📋 Weekly Plan Tracker

A team planning tool where a software team plans their weekly work every Tuesday. The Team Lead sets category distribution, team members pick backlog items and commit hours, the plan gets frozen, and progress is tracked through the work period.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 19 (TypeScript) |
| **Backend** | ASP.NET Core 8 Web API (C#) |
| **Database** | Azure SQL Server + Entity Framework Core |
| **CI/CD** | GitHub Actions → Azure App Services |

## Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://weekly-plan-tracker-app.azurewebsites.net |
| **Backend API** | https://weekly-plan-tracker-api.azurewebsites.net |

## Features Implemented

### ✅ Screens (8 of 14 complete)

| Screen | Description |
|--------|-------------|
| **Initial Team Setup** | Add team members, assign Lead role, auto-login on completion |
| **Login ("Who Are You?")** | Grid of member cards with role badges, click to login |
| **Home Dashboard** | Dynamic menu cards based on user role + plan state, navbar with Switch/Home |
| **Manage Team Members** | Add, remove, make lead, role badges |
| **Manage Backlog** | List view with category badges, add/edit items |
| **Set Up This Week's Plan** | Date picker (Tuesday), member selection, category % split, open planning |
| **Plan My Work** | Hours summary, category budgets, My Plan section, done-planning toggle (persisted to DB) |
| **Backlog Item Picker** | Category filter pills with budget remaining, Pick Item → modal with hour validation |
| **Review & Freeze the Plan** | Category summary table, member cards with Ready/Not Ready badges, freeze validation, cancel planning |

### ✅ Backend API Endpoints

| Group | Endpoints |
|-------|-----------|
| **Team Members** `/api/team-members` | GET all, GET by ID, POST, PUT, DELETE, PUT make-lead |
| **Backlog Items** `/api/backlog-items` | GET all (with filters), GET by ID, POST, PUT, PUT archive, DELETE |
| **Weekly Plans** `/api/weekly-plans` | GET current, GET past, POST, PUT setup, PUT open-planning, PUT freeze, PUT complete, DELETE cancel, PUT toggle-planning-done |
| **Plan Assignments** `/api/plan-assignments` | GET by week/member, POST, PUT, DELETE |

### ✅ State Machine

```
NO_ACTIVE_WEEK → SETUP → PLANNING_OPEN → FROZEN → COMPLETED
```

All state transitions are implemented with full validation.

### ✅ Data Model

- **TeamMember** — Name, Role (Lead/Member), IsActive
- **BacklogItem** — Title, Description, Category, EstimatedHours, IsArchived
- **WeeklyPlan** — PlanningDate, State, Category percentages, computed budget hours
- **WeeklyPlanMember** — Join table with IsPlanningDone status
- **PlanAssignment** — Member-Item link with CommittedHours, HoursCompleted, Status
- **ProgressUpdate** — History log with timestamp, hours, status, notes

## Features Remaining

| Priority | Feature |
|----------|---------|
| P1 | Update My Progress (per-task hours + status update) |
| P1 | Progress API (4 endpoints) |
| P2 | See Team Progress Dashboard |
| P2 | Past Weeks screen |
| P2 | Finish This Week button |
| P3 | Data Management API (seed/export/import/reset) |
| P3 | Theme Toggle (light/dark), Backlog search/filter |
| P4 | Unit + Integration Tests |

## Project Structure

```
WeeklyPlanTracker/
├── client/                          # Angular 19 frontend
│   └── src/app/
│       ├── core/                    # Models, services, enums
│       ├── features/                # Screen components
│       │   ├── team-setup/
│       │   ├── login/
│       │   ├── home/
│       │   ├── manage-team/
│       │   ├── manage-backlog/
│       │   ├── week-setup/
│       │   ├── plan-my-work/
│       │   ├── backlog-picker/
│       │   └── review-freeze/
│       └── shared/                  # Toast, footer components
├── server/                          # .NET 8 backend
│   └── src/
│       ├── WeeklyPlanTracker.API/   # Controllers, DTOs
│       ├── WeeklyPlanTracker.Core/  # Entities, Enums, Interfaces
│       └── WeeklyPlanTracker.Infrastructure/  # EF Core, Repositories
└── .github/workflows/deploy.yml    # CI/CD pipeline
```

## Running Locally

### Backend
```bash
cd server
dotnet run --project src/WeeklyPlanTracker.API
# API runs on http://localhost:5297
```

### Frontend
```bash
cd client
npm install
npx ng serve
# App runs on http://localhost:4200
```

## Deployment

Pushing to `main` triggers GitHub Actions which builds and deploys both frontend and backend to Azure App Services. Database migrations run automatically on startup.
