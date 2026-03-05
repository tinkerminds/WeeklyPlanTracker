# Weekly Plan Tracker

hey! this is my weekly plan tracker app that i built for my team. basically every Tuesday our team plans what work we're gonna do for the next 4 days (Wednesday to Monday). the Team Lead picks how much time goes to client stuff vs tech debt vs R&D, then everyone picks their tasks and commits hours.

## what it does

- team lead starts a new week and sets the category split (like 50% client, 30% tech debt, 20% R&D)
- team members pick backlog items and commit their 30 hours
- lead reviews everything and freezes the plan
- during the week everyone updates their progress
- at the end the week gets archived

## tech stack

- **Frontend**: Angular 19 (TypeScript)
- **Backend**: ASP.NET Core 8 (C#)
- **Database**: SQL Server with Entity Framework Core
- **Deployment**: Azure App Services with GitHub Actions

## live links

- App: https://weekly-plan-tracker-app.azurewebsites.net
- API: https://weekly-plan-tracker-api.azurewebsites.net

## screens i built

all 14 screens from the PRD are done:

1. **Team Setup** - first time setup, add members, pick the lead
2. **Who Are You** - click your name to login (no passwords, its a team app)
3. **Home Dashboard** - shows different menu options based on your role and what state the plan is in
4. **Manage Team Members** - add/remove people, change who's lead
5. **Manage Backlog** - add work items with categories and hour estimates, filter and search
6. **Start a New Week** - pick the tuesday date, select who's working, set category %
7. **Plan My Work** - pick items from backlog, commit hours, see your budget
8. **Backlog Picker** - shows available items with category budget remaining
9. **Review & Freeze** - lead sees everyone's plan, validates hours match, freezes it
10. **Update Progress** - update hours done and status (not started/in progress/done/blocked)
11. **Team Progress** - dashboard showing overall %, by category, by member with expandable details
12. **Past Weeks** - view completed weeks with category breakdown and member summaries
13. **Navbar** - blue top bar with user info, switch user, home, dark/light theme toggle
14. **Footer** - download data, load from file, seed sample data, reset app

## state machine

the weekly plan goes through these states:

```
NO_ACTIVE_WEEK → SETUP → PLANNING_OPEN → FROZEN → COMPLETED
                   ↓           ↓
                 CANCEL      CANCEL (back to no active week)
```

## how to run locally

### backend
```
cd server
dotnet run --project src/WeeklyPlanTracker.API
```
runs on http://localhost:5297

### frontend
```
cd client
npm install
npx ng serve
```
runs on http://localhost:4200

## project structure

```
WeeklyPlanTracker/
├── client/                     # angular frontend
│   └── src/app/
│       ├── core/              # services, models, enums
│       │   ├── services/      # api services, auth, theme, toast, navigation
│       │   ├── models/        # typescript interfaces
│       │   └── shared/        # toast component, confirm modal
│       └── features/          # all the screens
│           ├── team-setup/
│           ├── login/
│           ├── home/
│           ├── manage-team/
│           ├── manage-backlog/
│           ├── week-setup/
│           ├── plan-my-work/
│           ├── backlog-picker/
│           ├── review-freeze/
│           ├── update-progress/
│           ├── team-progress/
│           └── past-weeks/
│
├── server/                     # .net backend
│   └── src/
│       ├── WeeklyPlanTracker.API/            # controllers, DTOs, program.cs
│       ├── WeeklyPlanTracker.Core/           # entities, enums, interfaces
│       └── WeeklyPlanTracker.Infrastructure/ # ef core, repositories, migrations
│
└── .github/workflows/         # ci/cd pipeline
```

## api endpoints

| area | endpoints |
|------|-----------|
| Team Members | GET/POST/PUT/DELETE `/api/team-members`, PUT make-lead |
| Backlog Items | GET/POST/PUT/DELETE `/api/backlog-items`, PUT archive |
| Weekly Plans | GET current/past, POST, PUT setup/open/freeze/complete, DELETE cancel |
| Plan Assignments | GET by week/member, POST, PUT, DELETE |
| Data | GET export, POST import/seed, DELETE reset |

## data model

- **TeamMember** - name, role (Lead or Member), active flag
- **BacklogItem** - title, description, category (Client/TechDebt/R&D), estimated hours
- **WeeklyPlan** - planning date, state, category percentages
- **WeeklyPlanMember** - which members are in this week's plan
- **PlanAssignment** - who's working on what, committed hours, hours done, status
- **ProgressUpdate** - history log of progress updates with timestamps

## features

- dark mode and light mode (toggle in navbar)
- download all your data as json backup
- load data back from a backup file (with confirmation warning)
- seed sample data to try it out
- reset everything and start fresh
- role-based menus (lead sees different options than members)
- 30 hours per member budget with category budget tracking

## whats left to do

- unit tests (xunit for backend, jasmine for frontend)
- integration tests
- need to get 100% code coverage

## deployment

push to main → github actions builds everything → deploys to azure automatically. database migrations run on startup so no manual steps needed.
