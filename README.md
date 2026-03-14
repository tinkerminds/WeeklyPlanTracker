# Weekly Plan Tracker

The Weekly Plan Tracker is a collaborative application designed to streamline team work planning. Every Tuesday, development teams can allocate their upcoming work cycle. Team Leads parameterize the cycle by setting category distribution percentages (e.g., Client Focused, Tech Debt, R&D), while team members select individual backlog items and commit their estimated hours.

## Application Environments

- App: https://wp-tracker-app-ganesh.azurewebsites.net
- API: https://wp-tracker-api-ganesh.azurewebsites.net

## Recent Updates
- **Complete Test Coverage**: Achieved 100% unit test coverage across both the frontend (169 tests across 23 suites using Vitest + Angular Testing Library) and backend (xUnit + Moq).
- **UI & Accessibility Improvements**: Refined the "Update Progress" and "Past Weeks" screens with better progress bars, color-coded badges, and accessible ARIA attributes.
- **Enhanced Data Reactivity**: Changes to team members and lead assignments now reflect instantly across the application without requiring a page refresh.
- **Production Ready**: Fixed compilation issues, excluded test files from production bundles, and optimized the build pipeline for deployment.

## Key Features

- **Cycle Initialization**: Team leads commence a new weekly cycle and define the effort split across work categories.
- **Work Planning**: Team members select tasks from the backlog and commit their available weekly hours.
- **Plan Review & Freezing**: Leads review the aggregate team plan, validate hour matches, and lock the plan for execution.
- **Progress Tracking**: Members provide continuous updates on their completed hours and task statuses throughout the cycle.
- **Cycle Archival**: Completed weeks are formally archived for historical reference.

## Technology Stack

- **Frontend**: Angular 19 (TypeScript), Tailwind CSS (Custom Styling)
- **Backend**: ASP.NET Core 8 (C#)
- **Database**: SQL Server with Entity Framework Core
- **Testing**: Vitest + @analogjs for Frontend, xUnit + Moq + FluentAssertions for Backend
- **Deployment**: Azure App Services with GitHub Actions

## Application Screens

The application implements 14 distinct screens conforming strictly to the PRD:

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

## State Machine

The weekly planning cycle transitions through the following states:

```
NO_ACTIVE_WEEK → SETUP → PLANNING_OPEN → FROZEN → COMPLETED
                   ↓           ↓
                 CANCEL      CANCEL (back to no active week)
```

## Testing & Quality Assurance

The application currently enforces **100% line coverage** for all business logic, services, commands, and components.
- **Frontend Coverage**: 169 unit tests passing across 23 different test suites utilizing Vitest via `@analogjs/vite-plugin-angular` ensuring components render correctly and services handle API communication flawlessly. Tested services include `auth`, `confirm`, `toast`, `data`, `navigation`, and `weekly-plan`.
- **Backend Coverage**: Comprehensive xUnit tests covering all controllers, using InMemory EF Core databases and rigorous Moq dependency injection. Fully covers `[Authorize]` logic and business validation endpoints like `Freeze` rules.

## Local Development Setup

### Backend (ASP.NET Core)
```bash
cd server
dotnet run --project src/WeeklyPlanTracker.API
```
runs on http://localhost:5297

### Frontend (Angular)
```bash
cd client
npm install
npx ng serve
```
runs on http://localhost:4200

### Running Tests
**Frontend**: `cd client && npx ng test --watch=false`
**Backend**: `cd server && dotnet test tests/WeeklyPlanTracker.UnitTests`

## Project Directory Structure

```text
WeeklyPlanTracker/
├── client/                     # angular frontend
│   ├── src/app/
│   │   ├── core/              # services, models, enums
│   │   ├── features/          # all the screens
│   │   └── shared/            # reusable components & pipes
│   └── src/tests/             # frontend unit tests (vitest)
│       ├── core/              # tests for services
│       └── features/          # tests for components
│
├── server/                     # .net backend
│   ├── src/
│   │   ├── WeeklyPlanTracker.API/            # controllers, DTOs
│   │   ├── WeeklyPlanTracker.Core/           # entities, enums, interfaces
│   │   └── WeeklyPlanTracker.Infrastructure/ # ef core, repositories
│   └── tests/                 # backend unit tests (xUnit)
│       └── WeeklyPlanTracker.UnitTests/      # tests for controllers & services
│
└── .github/workflows/         # ci/cd pipeline
```

## API Endpoints

| area | endpoints |
|------|-----------|
| Team Members | GET/POST/PUT/DELETE `/api/team-members`, PUT make-lead |
| Backlog Items | GET/POST/PUT/DELETE `/api/backlog-items`, PUT archive |
| Weekly Plans | GET current/past, POST, PUT setup/open/freeze/complete, DELETE cancel |
| Plan Assignments | GET by week/member, POST, PUT, DELETE |
| Progress | GET team/member progress, PUT update, GET history |
| Data | GET export, POST import/seed, DELETE reset |

## Data Entity Model

- **TeamMember** - name, role (Lead or Member), active flag
- **BacklogItem** - title, description, category (Client/TechDebt/R&D), estimated hours
- **WeeklyPlan** - planning date, state, category percentages
- **WeeklyPlanMember** - which members are in this week's plan
- **PlanAssignment** - who's working on what, committed hours, hours done, status
- **ProgressUpdate** - history log of progress updates with timestamps

## Additional Features

- dark mode and light mode (toggle in navbar)
- download all your data as json backup
- load data back from a backup file (with confirmation warning)
- seed sample data to try it out
- reset everything and start fresh
- role-based menus (lead sees different options than members)
- 30 hours per member budget with category budget tracking

## CI/CD Pipeline & Deployment

Pushes to the `main` branch trigger automated GitHub Actions workflows. These compile the application, execute the test suites, and deploy directly to Azure App Services. Database schema migrations execute seamlessly upon application startup.
