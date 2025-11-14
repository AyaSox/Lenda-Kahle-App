# Lenda Kahle - South African Micro-Lending Platform

Professional, NCA-compliant lending platform for South Africa built with .NET 8 (API) and React + TypeScript (client).

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Lenda Kahle is a complete, production‑ready micro‑lending platform featuring:

- NCA compliance
- Loan calculator, applications, approvals
- Document verification and uploads
- Admin dashboard and audit logging
- Notifications (real-time + email)
- In‑app assistant/chatbot (optional, client-side only)

---

## Quick Start (Development)

1. Backend
   - Location: `LendaKahleApp.Server`
   - Commands:
     - `dotnet restore`
     - `dotnet run`
   - Default URL: `https://localhost:7176`

2. Frontend
   - Location: `lendakahleapp.client`
   - Commands:
     - `npm install`
     - `npm run dev`
   - Default URL: `http://localhost:5173`

---

## Deployment (Free Split Stack)

- Frontend: Vercel
- Backend: Render.com (Docker, .NET 8)
- Database: Supabase PostgreSQL

Documentation:
- `DEPLOY.md` (quick steps)
- `DEPLOYMENT_GUIDE_SPLIT_STACK.md` (complete guide)
- `POSTGRESQL_MIGRATION_GUIDE.md` (database setup)

---

## Key Features

For Borrowers
- Loan calculator and affordability
- Fast application with document upload (PDF/images, up to 30MB)
- Application status tracking
- Repayments and history

For Admins
- User management and loan approval workflow
- Document verification
- System settings (rates, limits)
- Audit logs and reporting (PDF/CSV)

For Developers
- .NET 8 Web API + EF Core
- React 18 + TypeScript + Vite + MUI
- Dockerized backend
- CI/CD friendly

---

## Technology Stack

Backend
- .NET 8, ASP.NET Core
- Entity Framework Core
- PostgreSQL
- JWT authentication
- SignalR (notifications)

Frontend
- React 18, TypeScript, Vite
- Material UI, Axios, React Router

---

## Security

- JWT token authentication
- HTTPS everywhere
- CORS configuration
- Input validation and SQL‑injection‑safe ORM
- Audit logging

---

## Testing

Backend
- `cd LendaKahleApp.Server`
- `dotnet test`

Frontend
- `cd lendakahleapp.client`
- `npm test`

---

## System Requirements

- .NET 8 SDK
- Node.js 18+
- PostgreSQL 15+ (local) or Supabase

---

## Roadmap (selected)

- Email and SMS notifications
- Credit bureau integration
- Multi‑language support
- Payment gateway integration
