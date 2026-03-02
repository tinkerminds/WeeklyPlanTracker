# 📋 Weekly Plan Tracker

A team planning tool for managing weekly work cycles. Built with **ASP.NET Core (.NET 10)** and **Angular 19**.

## 📁 Project Structure

```
WeeklyPlanTracker/
├── server/                          # .NET Backend
│   ├── src/
│   │   ├── WeeklyPlanTracker.API/           # Web API (Controllers, DTOs)
│   │   ├── WeeklyPlanTracker.Core/          # Domain (Entities, Enums, Services, Interfaces)
│   │   └── WeeklyPlanTracker.Infrastructure/# Data Access (EF Core, Repositories)
│   ├── tests/
│   │   ├── WeeklyPlanTracker.UnitTests/
│   │   └── WeeklyPlanTracker.IntegrationTests/
│   └── WeeklyPlanTracker.sln
├── client/                          # Angular Frontend
│   ├── src/app/
│   └── angular.json
├── .github/workflows/               # CI/CD Pipelines
├── PRD.md                           # Product Requirements Document
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Angular CLI](https://angular.dev/)

### Backend
```bash
cd server
dotnet restore
dotnet build
dotnet run --project src/WeeklyPlanTracker.API
```

### Frontend
```bash
cd client
npm install
ng serve
```

### Run Tests
```bash
# Backend
cd server
dotnet test

# Frontend
cd client
ng test
```

## 🏗️ Architecture

- **Backend**: ASP.NET Core Web API with Clean Architecture (Core → Infrastructure → API)
- **Frontend**: Angular 19 with standalone components
- **Database**: SQL Server with Entity Framework Core
- **Deployment**: Azure App Service + Azure SQL
- **CI/CD**: GitHub Actions

## 📄 Documentation
- [Product Requirements Document (PRD)](./PRD.md)
