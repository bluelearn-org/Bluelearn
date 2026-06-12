# Copilot Instructions – Bluelearn

## Project Overview
Bluelearn is an open‑source, prerequisite‑graph education platform built as a pnpm monorepo with:
- **Frontend (app/)**: React 19, TanStack Start (SSR), TanStack Router, Tailwind CSS v4, shadcn/ui
- **API (api/)**: Hono on Cloudflare Workers, TypeScript, Supabase for auth/data
- **Database (supabase/)**: PostgreSQL with Row‑Level Security (RLS), migrations

## Development Workflow
1. **Prerequisites**: Docker, Node.js ≥20, pnpm ≥10.33.1, Supabase CLI
2. **Setup**:
   - `pnpm install`
   - `pnpm supabase:start` (requires Docker)
   - Copy `app/.env.example` → `.env` and `api/.dev.vars.example` → `.dev.vars`
   - Fill environment variables from `supabase status`
   - `pnpm dev:api` then `pnpm dev:app`
3. **Common Commands** (run from root):
   - `pnpm dev` – start both frontend and API
   - `pnpm build` – build all packages
   - `pnpm typecheck` – TypeScript check across workspace
   - `pnpm lint` – ESLint
   - `pnpm format` – Prettier (with Tailwind plugin)
   - `pnpm test` – Vitest tests (frontend only)
   - `pnpm supabase:reset` – reset database

## Architectural Constraints
- **Frontend never calls Supabase directly** – all data flows through the API.
- **API is stateless** – state lives in Postgres, cached state will use Workers KV later.
- **Authentication**: Supabase JWTs sent in `Authorization` header, verified by `supabaseMiddleware`.
- **RLS** does access control; API uses per‑request Supabase client with user's token.
- **Database types** are generated: `supabase gen types typescript --local > api/src/database.types.ts`

## Code Conventions
- **Frontend routing**: File‑based (TanStack Router) in `app/src/routes/`.
- **Styling**: Tailwind CSS, use `cn()` from `app/src/lib/utils.ts` for conditional classes.
- **Components**: shadcn/ui primitives in `app/src/components/ui/`. Add via `npx shadcn@latest add`.
- **API routes**: Each resource has its own Hono router in `api/src/routes/`. Use `@hono/zod‑validator` for validation.
- **Migrations**: Timestamp‑prefixed `.sql` files in `supabase/migrations/`. Apply with `supabase db reset` or `supabase db push`.
- **Type safety**: API exports `AppType` (from `api/src/index.ts`) for end‑to‑end type‑safe calls (not yet wired).

## Environment Variables
- **Frontend** (`app/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE`
- **API** (`api/.dev.vars`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_URL`
- **Production**: API variables become Cloudflare Workers secrets.

## Feature Development Sequence
1. **Database**: Create migration → apply → regenerate types.
2. **API**: Add route with validation → mount in `index.ts`.
3. **Frontend**: Create/update route → fetch data (typed client when available) → UI with shadcn.
4. **Validation**: Run `pnpm typecheck`, `pnpm lint`, `pnpm format`.
5. **Testing**: Add Vitest tests for frontend components.

## Gotchas
- Docker must be running for `supabase start`.
- Environment variables differ between app (VITE_ prefix) and API (plain).
- CORS allows only `APP_URL` (set in `.dev.vars`).
- `api/src/database.types.ts` is a stub; regenerate after schema changes.
- Only `profiles` table exists currently; full schema described in `docs/database‑schema.md`.

## Full Documentation
See `AGENTS.md` for comprehensive agent‑focused guidance.