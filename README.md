# Route Able Backend

Backend API for Route Able, a fitness and coaching application with authentication, coach-client relations, meal and workout tracking, subscriptions, coach billing, realtime chat, video lessons, feedback, and AI-assisted nutrition/workout flows.

## Stack

- NestJS 11 and TypeScript
- TypeORM with PostgreSQL
- Passport JWT authentication with cookie support
- Socket.IO gateway for realtime chat
- LiveKit server SDK for video lesson tokens
- GigaChat integration for AI text/photo analysis
- Axios for external HTTP integrations, including Open Food Facts product lookup
- Sharp and Multer for image/file processing
- Optional S3 client configuration for uploaded assets

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local `.env` file with database, auth, CORS, and integration values. The minimum local API setup usually needs:

```bash
PORT=3000
CORS_ORIGIN=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=route_able
JWT_SECRET_KEY=local-secret
```

Start the API in watch mode:

```bash
npm run start:dev
```

The API listens on `PORT` or `3000` by default.

## Available Scripts

- `npm run start`: start the Nest app once.
- `npm run start:dev`: start the Nest app in watch mode.
- `npm run start:debug`: start watch mode with debugger enabled.
- `npm run start:prod`: run the compiled app from `dist/`.
- `npm run build`: compile the app with Nest CLI.
- `npm run lint`: run ESLint with auto-fix.
- `npm run format`: run Prettier over source and test files.
- `npm run migration:generate --name=<MigrationName>`: generate a TypeORM migration.
- `npm run migration:run`: apply pending migrations.
- `npm run migration:revert`: revert the latest migration.

## Project Structure

- `src/main.ts`: Nest bootstrap, CORS, validation pipe, cookies, static `/uploads`.
- `src/modules/app`: root module, global config, TypeORM setup, domain module registration.
- `src/modules`: feature/domain modules with controllers and services.
- `src/entities`: shared TypeORM entities.
- `src/migrations`: TypeORM migrations.
- `src/config`: decorators, enums, interfaces, constants, and external connection helpers.
- `src/libs`: cross-cutting guards and shared infrastructure.
- `uploads`: local uploaded assets served through `/uploads`.
- `dist`: generated build output.

See `docs/architecture.md` for module and data ownership rules.

## Core Domains

The API currently includes modules for auth, users, coach-client relations, chats, meals, planned meals, planned exercises, workout sessions, video lessons, coach billing, payments, subscriptions, feedback, AI flows, and products.

The `products` module is a product lookup/cache layer used by barcode food logging. It exposes `GET /products/barcode/:barcode` and uses Open Food Facts as the external source when the product is not already cached locally.

## Database

The app uses TypeORM with PostgreSQL. Entities are registered explicitly in `src/modules/app/app.module.ts`.

The root module currently has `synchronize: true` for development, but schema changes should still include migrations so the database is reproducible outside local dev.

## API And Integrations

See `docs/api-and-env.md` for environment variables and integration notes for CORS, JWT, PostgreSQL, LiveKit, GigaChat, SendSay, Telegram, S3, payment stubs, Open Food Facts, uploads, and Socket.IO.

## Verification

For backend changes, run:

```bash
npm run build
```

Run focused Jest tests when adding or changing test-covered services. The current `package.json` config expects `*.spec.ts` files under `src/`.
