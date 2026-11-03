# Minimal School Locker Reservation System

A minimal, full-stack **School Locker Reservation System** built for the **HBO-ICT 2.1 Web Advanced** assignment.

## Purpose

- **Guests** can view all school lockers, filter them by size, floor, and location, search by locker code (e.g. `L-001`), and check availability for a chosen date, time, and duration.
- **Regular Users (`USER`)** can register, log in, select one or multiple lockers, reserve them atomically for a future time period, and view their own reservations.
- **Administrators (`ADMIN`)** can create, update, and delete lockers, search users by email, look up reservations by ID, and filter reservations per locker. Admin-only accounts cannot reserve lockers.
- **Multi-role Accounts (`USER`, `ADMIN`)** can both administer lockers and make reservations.

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Vue Router, Tailwind CSS v4, Vite, native `fetch` and `EventSource` (SSE).
- **Backend:** Node.js, Express 5, JSON Web Tokens (`jsonwebtoken`, HS256), `node:crypto` salted `scrypt` password hashing, Swagger UI (`swagger-ui-express` + `yaml`).
- **Database:** SQLite (`sqlite3`) via Sequelize ORM (`sequelize`).
- **Testing:** Vitest + Supertest (`server/src/tests/api.test.js`).

## Setup Instructions

Run commands in two separate terminals from the project root (`npm.cmd` can be used in Windows PowerShell if `npm.ps1` execution is restricted).

### 1. Backend (`server/`)

```powershell
cd server
npm install
Copy-Item .env.example .env.dev
```

Ensure `server/.env.dev` contains:

```env
NODE_ENV=dev
PORT=3000
JWT_SECRET=local-demo-only-change-this-secret-before-deployment-123456
```

*(Note: `JWT_SECRET` must be at least 32 characters long.)*

Seed the demonstration accounts and lockers, then start the backend server:

```powershell
npm run seed
npm run dev
```

- **Backend API:** `http://localhost:3000/api`
- **Swagger UI (OpenAPI Docs):** `http://localhost:3000/api-docs`

### 2. Frontend (`client/`)

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

- **Frontend App:** `http://localhost:5173` (Vite proxies `/api` requests to `http://localhost:3000`)

### Troubleshooting login and registration

Keep both terminals running: `npm run dev` inside `server/` and `npm run dev` inside `client/`.
The backend's `npm start` command is for production and loads `.env.prod`; it does not load `.env.dev`.
If it reports `Set JWT_SECRET to at least 32 characters`, use `npm run dev` for local development with the existing `.env.dev` file.
Login and registration both require the backend on port 3000. Passwords must contain 8–128 characters.
The seeded demo user is `user@example.com` with password `DemoPass123!` (run `npm run seed` inside `server/` if it is missing).

## Test & Lint Commands

Run the automated API test suite (14 end-to-end HTTP + SQLite tests) inside `server/`:

```powershell
cd server
npx vitest run
```

Or run in watch mode with `npm test`.

Run linters / production build check:

```powershell
# Backend lint
cd server
npm run lint

# Frontend lint & build
cd ../client
npm run lint
npm run build
```

## Documentation Links

- **[Oral Assessment Study Guide (`documentation/PROJECT_GUIDE.md`)](documentation/PROJECT_GUIDE.md)** — Complete project tree, file-by-file explanations, execution flows, API reference, database guide, security guide, Vue/Express guides, testing/OpenAPI/SSE guides, requirement traceability, and oral exam Q&A cheat sheet.
- **[Requirements Checklist (`documentation/REQUIREMENTS.md`)](documentation/REQUIREMENTS.md)** — Checklist of all MUST functional/non-functional requirements and rubric-supporting features with file mappings and demonstration steps.
- **[Demo Accounts (`documentation/accounts.md`)](documentation/accounts.md)** — Seeded login credentials for `USER`, `ADMIN`, and `USER + ADMIN` demonstration accounts.
- **[OpenAPI Specification (`server/src/docs/openapi.yaml`)](server/src/docs/openapi.yaml)** — OpenAPI 3.0.3 YAML specification served at `/api-docs`.
