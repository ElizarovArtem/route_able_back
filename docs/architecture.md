# Backend Architecture

This backend is a NestJS modular application. Domain logic lives in modules, persistence lives in TypeORM entities, and shared cross-cutting pieces live in `config` and `libs`.

## Application Bootstrap

`src/main.ts` creates the Nest app and configures:

- CORS from `CORS_ORIGIN`
- global `ValidationPipe` with transform and whitelist enabled
- cookie parsing
- static file serving from `/uploads`
- listen port from `PORT` or `3000`

`src/modules/app/app.module.ts` is the root module. It loads `.env`, configures TypeORM, registers entities, and imports all domain modules.

## Module Ownership

Each folder under `src/modules` should own one domain or integration boundary:

- `auth`: login/code flows, JWT setup, email/SMS/Telegram auth helpers.
- `user`: user profile and upload-related user operations.
- `clientCoach`: coach-client relation management.
- `chat`: HTTP chat APIs and Socket.IO gateway.
- `meal`: actual consumed meals, day summaries, AI meal text/photo analysis.
- `plannedMeals`: coach-assigned planned meals and consuming a planned meal into a real meal.
- `plannedExercises`: planned workout/exercise assignments.
- `coachWorkoutSessions`: scheduled workout session windows and lesson access checks.
- `video`: LiveKit tokens and video room access.
- `ai`: GigaChat-backed AI workout and nutrition helpers.
- `products`: barcode product lookup/cache backed by Open Food Facts.
- `coachBilling`, `payment`, `subscriptions`: monetization, orders, payments, platform subscriptions, feature usage.
- `feedback`: feedback creation/listing and Telegram delivery support.
- `timeSlots`, `day`, `coachReview`, `coachVerification`: their respective domain flows.

Keep controllers thin. Controllers should validate routing/auth concerns and delegate business logic to services.

## Entities And Persistence

Shared TypeORM entities live in `src/entities`. They are registered in `AppModule` TypeORM config and used through `TypeOrmModule.forFeature([...])` inside domain modules.

Rules:

- Add or update a migration whenever an entity shape changes.
- Do not edit `dist`.
- Prefer explicit relations and `JoinColumn` names when the database column name matters to API behavior.
- Keep entity classes free of request-specific business logic.

The app currently has `synchronize: true` in root TypeORM config for development. Treat that as a local convenience, not a replacement for migrations.

## DTOs And Validation

DTOs should live in the owning module under `dto/`.

Use `class-validator` and the global validation pipe for request validation. Keep route params validated in controllers when they are simple, such as barcode or UUID checks, and move reusable validation into DTOs/helpers when it grows.

## Authentication And Authorization

JWT auth is configured in `auth.module.ts` through `JwtModule.registerAsync`. Guards live under `src/libs/guards`.

Common patterns:

- Use `JwtAuthGuard` for authenticated HTTP endpoints.
- Use `RolesGuard` and `RolesDecorator` for role-restricted endpoints.
- Use `WsJwtGuard` for websocket authentication concerns.
- Use `CurrentUser` when only a user field is needed in controller methods.

Cookie and bearer-token handling both appear in the codebase. Preserve existing client compatibility unless intentionally migrating auth transport.

## Realtime

Realtime chat lives in `src/modules/chat/chat.gateway.ts` and uses Socket.IO. CORS should stay aligned with HTTP CORS through `CORS_ORIGIN`.

Keep websocket event contracts close to the chat module or the entity-specific websocket helper that owns the event.

## External Integrations

External services should stay behind service classes:

- GigaChat access belongs in `ai/gigachat.service.ts`.
- LiveKit token creation belongs in `video/videoChat.service.ts`.
- Payment provider behavior is abstracted by `PaymentProvider` and provided through `PAYMENT_PROVIDER`.
- Open Food Facts lookup belongs in `products/products.service.ts`.
- S3 configuration belongs under `src/config/connections`.

Do not call external APIs directly from unrelated domain services when an integration service already exists.

## Barcode Product Lookup

Barcode scanning itself happens on the frontend. The backend owns product lookup and normalization:

```text
GET /products/barcode/:barcode
```

The `products` module checks local `products` cache first. If missing, it requests Open Food Facts, normalizes nutrients to per-100g values, saves the product, and returns a frontend-friendly DTO.

This module is intentionally separate from `meal`: products are reusable catalog/cache data, while meals are user diary entries.

## Adding A New Domain Module

1. Create `src/modules/<domain>/<domain>.module.ts`.
2. Add controllers/services and `dto/` files inside the module folder.
3. Add or reuse TypeORM entities under `src/entities`.
4. Register entities in `TypeOrmModule.forFeature` for the module.
5. Import the module in `AppModule`.
6. Add migrations for schema changes.
7. Add focused tests for service logic, guards, or external integration behavior when feasible.

## Build And Generated Files

`dist/` is generated by `npm run build`. Do not edit generated files manually.

`uploads/` contains local uploaded assets. Avoid committing real user data or sensitive files.
