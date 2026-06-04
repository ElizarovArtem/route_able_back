# API And Environment

This document lists backend environment variables and integration boundaries used by the Route Able API.

## Core Runtime

### `PORT`

Port for the Nest HTTP server. Defaults to `3000` when unset.

### `NODE_ENV`

Used by production-sensitive paths such as auth cookie behavior and subscription/payment stub guards.

### `CORS_ORIGIN`

Comma-separated list of allowed frontend origins for HTTP and Socket.IO CORS.

Example:

```bash
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

## Database

TypeORM is configured in `src/modules/app/app.module.ts`.

Required variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`

`data-source.ts` is used for TypeORM CLI migrations. It currently contains local connection values directly; align it with `.env` before relying on migrations across multiple machines or environments.

## Authentication

### `JWT_SECRET_KEY`

JWT signing secret used by `JwtModule` and auth guards.

### `DOMAIN`

Used by auth cookie handling in `auth.controller.ts`.

Auth code delivery integrations:

- `SENDSAY_API_KEY`
- `SENDSAY_FROM_EMAIL`
- `TELEGRAM_API_KEY`

Keep auth provider secrets out of commits.

## Uploads And S3

Local uploads are served from:

```text
/uploads
```

S3 connection helper reads:

- `AWS_REGION`
- `AWS_ACCESS_KEY`
- `AWS_SECRET_KEY`
- `AWS_BUCKET`

The current user upload S3 config is commented out, but the shared S3 config exists under `src/config/connections/s3.config.ts`.

## LiveKit

Video lesson token generation uses `livekit-server-sdk` in `src/modules/video/videoChat.service.ts`.

Required variables:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_WS_URL`

`docker-compose.dev.yml` includes a local LiveKit server in dev mode. Its default dev credentials are provided by LiveKit itself; keep frontend/backend URLs aligned when testing video lessons locally.

## GigaChat

AI text and photo analysis use `src/modules/ai/gigachat.service.ts`.

Required variable:

- `GIGA_CHAT_API_KEY`

The service uses:

- `GigaChat` for text model calls.
- `GigaChat-Pro` for image-backed analysis.
- Sber OAuth/file upload endpoints for image flow.

Meal AI endpoints are guarded by subscription feature checks.

## Feedback Telegram Delivery

Feedback Telegram delivery support reads:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_FEEDBACK_CHAT_ID`

The delivery code is currently present but commented in `FeedbackService.create`. Keep docs and behavior aligned if Telegram delivery is re-enabled.

## Payments

Payment behavior is provided through the `PAYMENT_PROVIDER` injection token.

Current provider wiring uses the stub provider in `src/modules/payment/stub.provider.ts`. Production code should not rely on stub behavior unless explicitly allowed by `NODE_ENV` checks.

Relevant domains:

- `coachBilling`: coach offers, orders, and coach-client transaction lifecycle.
- `payment`: payment creation and webhook handling.
- `subscriptions`: platform subscription plans, payments, feature access, and usage limits.

## Product Barcode Lookup

Barcode product data is exposed through:

```http
GET /products/barcode/:barcode
```

The endpoint requires JWT auth. It validates numeric barcodes and returns cached product data or fetches from Open Food Facts when missing.

External source:

```text
https://world.openfoodfacts.org/api/v3/product/:barcode
```

The service sends a `User-Agent` header and requests only the fields needed for the app. Returned values are normalized to:

- `name`
- `brand`
- `imageUrl`
- `servingSize`
- `servingUnit`
- `caloriesPer100g`
- `proteinPer100g`
- `fatPer100g`
- `carbsPer100g`
- `source`

If Open Food Facts does not have the product or it lacks complete КБЖУ, the endpoint returns `404`.

## Socket.IO Chat

Socket.IO chat runs in `src/modules/chat/chat.gateway.ts`.

CORS uses `CORS_ORIGIN`, same as the HTTP app. Keep frontend socket URL and backend API URL aligned; the frontend currently connects to the `/chats` namespace based on its configured API URL.

## Local Development Checklist

1. Start PostgreSQL and make sure `.env` points to the correct database.
2. Start LiveKit if working on video lessons:

   ```bash
   docker compose -f docker-compose.dev.yml up livekit
   ```

3. Start backend:

   ```bash
   npm run start:dev
   ```

4. Start frontend with matching `VITE_API_URL`.

## Verification

Run:

```bash
npm run build
```

Run migration commands when entity/database changes are involved:

```bash
npm run migration:generate --name=<MigrationName>
npm run migration:run
```
