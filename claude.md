# Bluelearn – Context for Claude

## Quick Start
- **Repo**: pnpm monorepo with `app/` (React 19 frontend), `api/` (Hono on Workers), `supabase/` (PostgreSQL).
- **Setup**: 
  1. `pnpm install`
  2. `pnpm supabase:start` (needs Docker)
  3. Copy env files and fill from `supabase status`
  4. `pnpm dev:api` (port 8787) then `pnpm dev:app` (port 3000)
- **Key scripts**: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm supabase:reset`.

## Architectural Principles
- Frontend → API → Supabase (no direct frontend‑Supabase calls).
- API uses `supabaseMiddleware` to attach authenticated Supabase client to `c.var.supabase`.
- Row‑Level Security (RLS) in Postgres enforces access; API passes user's JWT.
- Database types are generated: `supabase gen types typescript --local > api/src/database.types.ts`.
- Type‑safe API via Hono's `hc<AppType>` (planned, not yet wired).

## Development Patterns
- **Frontend**: TanStack Router file‑based routes (`app/src/routes/`), Tailwind CSS with `cn()` helper, shadcn/ui components.
- **API**: Resource‑specific Hono routers in `api/src/routes/`, validate with `@hono/zod‑validator`.
- **Database**: Migrations in `supabase/migrations/` (timestamp‑prefixed `.sql`), apply with `supabase db reset`.
- **Shared types**: None yet; `packages/types` can be added later.

## Common Tasks
1. **Add a table**: Write migration → apply → regenerate types → add API route → add frontend UI.
2. **Modify existing feature**: Check if migration needed → update types → update API → update frontend.
3. **Fix a bug**: Reproduce locally (use `supabase:reset` if DB issues) → run `pnpm typecheck` and `pnpm lint`.

## Important Notes
- Docker required for Supabase local development.
- Environment variables: frontend uses `VITE_` prefix, API uses plain names.
- CORS is restricted to `APP_URL` (set in `api/.dev.vars`).
- Current DB schema is minimal (`profiles` only); full schema described in `docs/database‑schema.md`.

## Full Documentation
- `AGENTS.md` – detailed handbook for AI agents
- `docs/architecture.md` – architecture diagram and rationale
- `docs/database‑schema.md` – planned database schema
- `docs/overall‑system.md` – product vision and user flows
- `docs/monorepo.md` – why the monorepo exists