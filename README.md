# Job Application Tracker

A full-stack application for managing a job-search pipeline. Users can track opportunities from initial interest through offer or rejection, store recruiter and compensation details, search and filter applications, and review status history from a responsive dashboard.

## Features

- JWT-based registration and login
- Protected frontend routes and authenticated API requests
- Dashboard totals, status breakdowns, and recent applications
- Create, view, edit, and delete job applications
- Server-side search, status filtering, sorting, and pagination
- Application status history
- Compensation, recruiter, location, source, and job-posting details
- Responsive desktop and mobile interface
- Intentional null-clearing behavior for optional fields during updates

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, React Router, CSS |
| Backend | NestJS 12, TypeScript, Passport JWT, class-validator |
| Database | PostgreSQL 15+, Prisma ORM 7, Prisma PostgreSQL adapter |
| Authentication | Argon2 password hashing and signed JWT access tokens |
| Tooling | ESLint, Oxlint, Vitest |

## Repository structure

```text
job-app-tracker/
├── backend/
│   ├── prisma/                 # Prisma schema and migrations
│   ├── src/
│   │   ├── applications/       # Application CRUD and status history
│   │   ├── auth/               # Registration, login, guards, and DTOs
│   │   ├── dashboard/          # Dashboard aggregation endpoint
│   │   ├── database/           # Shared Prisma service
│   │   └── users/              # User persistence
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared shell and status components
│   │   ├── features/           # Auth, applications, and dashboard logic
│   │   ├── pages/              # Route-level pages
│   │   ├── types/              # API domain types
│   │   └── lib/api.ts          # Authenticated API client
│   └── .env
└── README.md
```

## Prerequisites

- Node.js 22 or a compatible current LTS release
- npm
- PostgreSQL 15 or newer

## Local development

### 1. Clone and install dependencies

The frontend and backend are separate npm projects.

```bash
git clone <repository-url>
cd job-app-tracker

cd backend
npm install

cd ../frontend
npm install
```

### 2. Create the backend environment file

```bash
cd backend
cp .env.example .env
```

Set both values in `backend/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5432/job_app_tracker"
JWT_SECRET="replace-with-a-long-random-secret"
```

`JWT_SECRET` signs access tokens and must not be used as a bearer token. Generate and use a strong value, keep it out of version control, and rotate it if it is exposed.

### 3. Create the database schema

Create the PostgreSQL database referenced by `DATABASE_URL`, then run:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

Prisma migrations live in `backend/prisma/migrations` and should be committed when the schema changes.

### 4. Configure the frontend API URL

Create the frontend environment file:

```bash
cd frontend
cp .env.example .env
```

The example configures the local API URL:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Vite exposes only variables prefixed with `VITE_` to frontend code. Restart the frontend development server after changing this file.

### 5. Start both development servers

In one terminal:

```bash
cd backend
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:3000/api`.

The backend currently allows browser requests from `http://localhost:5173`. Update the CORS origin in `backend/src/main.ts` when using a different frontend origin.

## Create the first user

The frontend currently provides a login screen but no registration screen. Register a local user through the API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"developer@example.com","password":"change-me-123"}'
```

Passwords must contain at least eight characters. You can then sign in through the frontend with the same credentials.

## Authentication behavior

Login returns an `accessToken`, which the frontend keeps in React state and sends as:

```http
Authorization: Bearer <accessToken>
```

Authentication is intentionally memory-only. Refreshing the browser clears the token and returns the user to the login page. Persistent sessions and refresh-token handling are outside the current implementation.

## Application form data flow

The create and edit screens share `ApplicationFormState` and conversion helpers in `frontend/src/features/applications/form.ts`:

```text
JobApplication API model
          ↕
ApplicationFormState
          ↕
CreateApplicationInput / UpdateApplicationInput
```

This distinction is important:

- On create, an empty optional field becomes `undefined` and is omitted from the JSON request.
- On update, an empty optional field becomes `null`, explicitly clearing its PostgreSQL column.
- Salary input strings become numbers before requests are sent.
- API dates are converted to `YYYY-MM-DD` for date inputs.
- Enum values such as `INTERVIEW` remain unchanged in API payloads even though the UI displays human-friendly labels.

Preserve these semantics when changing application forms or PATCH behavior.

## API overview

All routes use the `/api` prefix.

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Register a user |
| `POST` | `/auth/login` | No | Sign in and receive an access token |
| `GET` | `/auth/me` | Yes | Return the authenticated user |
| `GET` | `/dashboard/summary` | Yes | Return totals, status groups, and recent applications |
| `GET` | `/applications` | Yes | List applications with filtering and pagination |
| `POST` | `/applications` | Yes | Create an application |
| `GET` | `/applications/:id` | Yes | Fetch one application owned by the user |
| `PATCH` | `/applications/:id` | Yes | Update or clear application fields |
| `DELETE` | `/applications/:id` | Yes | Delete an application |
| `GET` | `/applications/:id/history` | Yes | Fetch chronological status history |

Supported list query parameters include `page`, `limit`, `search`, `status`, `sort`, and `order`.

## Useful commands

### Backend

```bash
cd backend
npm run start:dev     # Start NestJS in watch mode
npm run build         # Compile the backend
npm run lint          # Run Oxlint
npm test              # Run unit tests
npm run test:e2e      # Run end-to-end tests
npx prisma generate   # Regenerate Prisma Client
npx prisma migrate dev
```

### Frontend

```bash
cd frontend
npm run dev       # Start Vite development server
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

## Development guidelines

- Keep backend responses and frontend types synchronized.
- Scope every application query by the authenticated user ID.
- Use DTO validation for new or changed API inputs.
- Add Prisma migrations for database schema changes; do not edit an applied migration.
- Reuse `ApplicationFields` and the form conversion helpers for create/edit changes.
- Never commit `.env` files, database credentials, JWT secrets, or access tokens.
- Run the relevant build and lint commands before opening a pull request.

## Troubleshooting

### `401 Unauthorized` from a protected endpoint

Log in and use the returned JWT `accessToken`. Do not send `JWT_SECRET` as the bearer token. Access tokens expire after 15 minutes.

### Prisma cannot connect

Confirm PostgreSQL is running, the database exists, and `DATABASE_URL` is correct. Then rerun `npx prisma migrate dev`.

### Browser request blocked by CORS

The backend development CORS origin is `http://localhost:5173`. Ensure Vite is using that origin or update the backend CORS configuration.

### Frontend changes to environment variables are ignored

Restart the Vite development server after editing `frontend/.env`.

## License

This repository is currently marked as private and the backend package is unlicensed. Add a license before distributing or accepting external contributions.
