# GS Insurance — Renewal Management System

Project 1 is a production-minded renewal workspace built with React, Express, and Sequelize ORM for MySQL.

## Features

- Secure login, account creation, forgot-password request, and one-time arithmetic CAPTCHA.
- Renewal dashboard with 30/60/90-day visibility and policy status workflow.
- Paginated policy table with customer/policy search, status filtering, and policy action details.
- CSV and Excel sheet import with the required headers: `name`, `policy no`, `policy end date`, `policy start date`, `dob of customer`.
- MySQL as the system of record through Sequelize.
- Database-backed header notifications for newly added policies and changed renewal dates.
- Docker Compose services for MySQL, Redis, Kafka, and LocalStack (S3/SQS/SNS).

## Run locally

1. Copy `.env.example` to `.env`.
2. Start infrastructure: `docker compose up -d`.
3. Install dependencies: `npm install`.
4. Start the API and UI: `npm run dev`.
5. Open `http://localhost:5173`.

The API listens on `http://localhost:4000`. Vite proxies `/api` requests through the development server's same origin.

## Architecture

The backend follows a layered boundary:

```text
backend/
  src/
    middleware/  # authentication, uploads, error handling
    routes/      # HTTP route definitions
    services/    # authentication and policy business logic
    utils/       # CAPTCHA, dates, JWT helpers
    application/
      ports/     # technology-independent repository/event contracts
      decorators/# caching/observability wrappers
    domain/      # domain event bus and domain concepts
    adapters/
      persistence/ # Sequelize/MySQL adapter
      cache/       # Redis adapter
      messaging/  # in-memory and Kafka adapters
      queue/       # SQS adapter
      notifications/# SNS adapter
      storage/    # S3 adapter
    config.js    # environment configuration
    db.js        # Sequelize models and connection
    index.js     # application composition and server bootstrap
```

The frontend follows the same feature-oriented separation:

```text
frontend/
  src/
    App.jsx      # application shell and session switch
    views/       # Auth and Dashboard screens
    components/  # reusable UI components
    services/    # API client
    interceptors/# frontend request/response interceptor
    main.jsx     # React entrypoint
```

The application core depends on ports, not infrastructure. `createPolicyService` receives a `PolicyRepository` port; `SequelizePolicyRepository` is the MySQL/Sequelize adapter. Redis caching is applied through a decorator, and the import event is observed through `DomainEventBus`. Kafka, SQS, SNS, and S3 adapters are available for the LocalStack development stack without leaking SDK calls into routes.

### Frontend-backend interceptor

`frontend/src/interceptors/apiInterceptor.js` is the explicit frontend HTTP interceptor. Every React request passes through it before reaching Express. It adds `Authorization`, `Accept`, and `X-Request-ID` headers, logs request/response timing, converts backend errors into consistent JavaScript errors, and reports unavailable backend services clearly.

```text
React view
  -> frontend/src/services/api.js
  -> frontend/src/interceptors/apiInterceptor.js
  -> /api request
  -> Vite proxy
  -> Express route
  -> service -> repository -> MySQL
```

The architecture includes:

- **Hexagonal architecture:** routes are driving adapters; services are the application core; Sequelize, Redis, Kafka, SQS, SNS, and S3 are replaceable driven adapters.
- **Decorator pattern:** `withObservability` adds renewal-summary caching and import event publication without changing policy business logic.
- **Observer pattern:** `DomainEventBus` allows notification, audit, and analytics observers to subscribe to renewal lifecycle events.
- **Event loop note:** route handlers return promises; Node runs I/O callbacks on the event loop while CPU work remains on the call stack. `process.nextTick` runs before the next event-loop phase and should be used sparingly so it does not starve I/O. Middleware calls `next()` to pass control through the Express pipeline, and spread syntax is used when composing request headers without mutating the original object.

Set `EVENT_TRANSPORT=kafka` in `.env` to publish renewal import events to the Kafka broker. The default `memory` transport keeps local development usable without Kafka. Redis is used by the policy-service decorator when available; cache failures are logged and fall back to MySQL. The SQS, SNS, and S3 adapters target LocalStack and are ready for reminder jobs, alerts, and renewal document storage.

The UI is a thin React client. Authentication tokens are stored in browser local storage for this demo; production deployment should use secure, HTTP-only cookies, a secret manager, rate limiting, email delivery for password reset, and database migrations.

## Policy sheet import

Use the dashboard's **Download template** action to download `gs-insurance-policy-template.csv`, fill one or more rows, and upload it. You can upload `.csv`, `.xlsx`, or `.xls` files. Required headers are `name`, `policy no`, `policy end date`, `policy start date`, and `dob of customer`; annotated template headers such as `policy end date (YYYY/MM/DD)` are accepted too. Dates can be `YYYY/MM/DD`, `YYYY-MM-DD`, or `MM/DD/YYYY`. Policy number is the idempotency key, so re-importing a policy updates its customer/date details.

The policy table loads 25 rows per page. Search matches customer names and policy numbers, and status and due-window filters (up to 45, 46-60, and 61-90 days) are applied by the backend. The Due in column displays these as 45 days, 60 days, or 90 days; overdue and 90+ day policies are labeled separately. Select the three-dot action on a row to view policy details and record a disposition after a call or email. Payment links and customer contact details require corresponding data/configuration.
