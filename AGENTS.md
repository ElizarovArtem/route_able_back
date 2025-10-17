# Repository Guidelines

## Project Structure & Module Organization
- `src/main.ts` boots NestJS AppModule and wires middleware.
- `src/modules/` houses feature modules (e.g., `auth`, `chat`, `plannedMeals`, `plannedExercises`, `clientCoach`); keep controllers/services/DTOs inside the matching domain folder.
- `src/entities/` keeps TypeORM entities shared across modules; update associated migrations when altering these files.
- `src/libs/` collects cross-cutting helpers (like file or auth utilities); prefer importing from here before duplicating logic.
- `src/config/` stores configuration helpers (connections, decorators, enums, interfaces); secrets live in `.env`.
- `uploads/` stores user-uploaded assets served at `/uploads`; `dist/` is generated output—never edit directly.

## Build, Test, and Development Commands
- `npm run start:dev` starts the API with hot reload at http://localhost:3001.
- `npm run start:prod` bootstraps from the compiled `dist/` build.
- `npm run build` compiles TypeScript via Nest CLI; run before deploying.
- `npm run lint` applies ESLint checks (auto-fix enabled); pair with `npm run format` for Prettier.
- `npm run migration:generate --name=<MigrationName>` scaffolds TypeORM migrations, `npm run migration:run` applies them, and `npm run migration:revert` rolls back the latest.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation, and single quotes are enforced through `.prettierrc`.
- Follow Nest patterns: `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dto/` folders for schemas.
- Use PascalCase for classes/enums, camelCase for methods and variables, and UPPER_SNAKE_CASE for env keys.
- Always run `npm run lint` and address diagnostics before opening a PR.

## Testing Guidelines
- Jest and ts-jest are configured in `package.json`; colocate `*.spec.ts` beside the code they verify.
- Prefer descriptive test names (`describe('ChatGateway')`, `it('rejects unauthenticated clients')`).
- Run `npx jest` locally; add `--coverage` to ensure important modules remain covered.
- Mock external services (S3, Gigachat) via `@nestjs/testing` utilities to keep tests deterministic.

## Commit & Pull Request Guidelines
- Use short, imperative subject lines mirroring the history (`add chat functionality`, `add connections to lk`); scope commits to a single concern.
- Reference tickets with `[#123]` when relevant and include context in the body (migrations, new env vars, breaking changes).
- PRs need a concise summary, test evidence (`npx jest` or manual steps), and screenshots for API-facing changes that affect external clients.
- Ensure database updates include a migration and doc updates before requesting review.

## Configuration Tips
- Duplicate `.env` to `.env.local` for personal settings; keep secrets out of commits.
- Update `src/config/connections/s3.config.ts` when introducing new buckets; verify CORS to match the frontend origin in `src/main.ts`.
