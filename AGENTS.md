# Agent Handbook – Bluelearn

This document provides the essential context an agent needs to work effectively in the Bluelearn repository. It focuses on non‑obvious knowledge that saves time and avoids common pitfalls.

## Project Overview

Bluelearn is an open‑source, prerequisite‑graph education platform. It is a **pnpm workspace monorepo** containing:

- **`app/`** – React 19 frontend with TanStack Start (SSR), TanStack Router, Tailwind CSS v4, and shadcn/ui components.
- **`api/`** – Hono‑based API running on Cloudflare Workers, using Supabase for authentication and data.
- **`supabase/`** – Local PostgreSQL database, migrations, and configuration (auth, storage, RLS).

The stack is fully typed end‑to‑end: Hono exports `AppType` that the frontend can import for type‑safe API calls (not yet wired in the initial code).

## Getting Started

### Prerequisites
- **Node.js ≥20** and **pnpm ≥10.33.1** (see `packageManager` in root `package.json`)
- **Docker** (required for `supabase start`)
- **Supabase CLI** (`npm install -g supabase`)

### Setup
1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Start the Supabase local stack (this will spin up PostgreSQL, Auth, Storage, etc.):
   ```bash
   pnpm supabase:start
   ```
   Wait for it to be ready, then run `supabase status` to see the URLs and keys.
3. Copy environment variables:
   ```bash
   cp app/.env.example app/.env
   cp api/.dev.vars.example api/.dev.vars
   ```
   Fill in the values from `supabase status` (or `supabase status -o env`).
4. Start the API in a separate terminal:
   ```bash
   pnpm dev:api
   ```
   This runs `wrangler dev` on `localhost:8787`.
5. Start the frontend in another terminal:
   ```bash
   pnpm dev:app
   ```
   The app will be available at `http://localhost:3000`.

## Essential Commands

All commands are run from the **root** of the monorepo unless noted.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start **both** app and API in parallel (aggregated output). |
| `pnpm dev:app` | Start the frontend dev server (Vite, port 3000). |
| `pnpm dev:api` | Start the API dev server (Wrangler, port 8787). |
| `pnpm build` | Build all packages (`app/` and `api/`). |
| `pnpm typecheck` | Run TypeScript type checking across the workspace. |
| `pnpm lint` | Run ESLint on all packages. |
| `pnpm format` | Format code with Prettier (includes Tailwind CSS plugin). |
| `pnpm test` | Run Vitest tests (currently only `app/` has tests). |
| `pnpm supabase:start` | Start the local Supabase stack (requires Docker). |
| `pnpm supabase:stop` | Stop the Supabase stack. |
| `pnpm supabase:reset` | Reset the database (applies migrations again). |
| `pnpm api:deploy` | Deploy the API to Cloudflare Workers (uses `wrangler deploy`). |

> **Note:** The root `package.json` uses `pnpm -r` (recursive) and `--filter` to target specific packages. Use `pnpm --filter app <script>` if you need to run a script only on the frontend.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              browser                                │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTPS
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  app/   React 19 · TanStack Start · TanStack Router/Query           │
│         shadcn/ui · Tailwind 4 · Vite                                │
│                                                                      │
│  Routes call the API via the Hono `hc<AppType>` client — fully       │
│  type‑safe end‑to‑end from handler to component.                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  fetch (typed via hc<AppType>)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  api/   Hono on Cloudflare Workers                                   │
│         Routes: /subjects · /walkthroughs · /guides                  │
│         Middleware: cors, supabaseMiddleware (auth)                  │
│         Validation: @hono/zod‑validator                              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  PostgREST / RPC
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  supabase/   Postgres · Auth · Storage                               │
│              Migrations in supabase/migrations/                      │
│              RLS policies enforce per‑user access                    │
└──────────────────────────────────────────────────────────────────────┘
```

Key architectural decisions:

- **Frontend never talks to Supabase directly.** All data and auth flows go through the API.
- **API is stateless.** State lives in Postgres; cached state will later use Workers KV.
- **Authentication:** Supabase issues JWTs, the frontend sends them in the `Authorization` header, `supabaseMiddleware` verifies the token and attaches a scoped client to the request context.
- **Row‑Level Security (RLS)** does the heavy lifting; the API only proxies requests with the user‑scoped client.

## Code Organization

### `app/`
- `src/routes/` – TanStack Router file‑based routes (each route is a `.tsx` file).
- `src/components/` – React components; `ui/` contains shadcn/ui primitives.
- `src/lib/` – Utility functions (e.g., `cn()` for Tailwind class merging).
- `src/styles.css` – Global Tailwind CSS entry point.
- `vite.config.ts` – Vite configuration with TanStack Start plugin, Tailwind, and path aliases.

**Path alias:** `@/` → `src/` (configured in `tsconfig.json`).

### `api/`
- `src/index.ts` – Main Hono app with CORS, supabaseMiddleware, and route mounting.
- `src/routes/` – Route handlers (`subjects.ts`, `walkthroughs.ts`, `guides.ts`).
- `src/middleware/` – Authentication middleware (`auth.middleware.ts`).
- `src/types.ts` – TypeScript bindings for Cloudflare Workers environment.
- `src/database.types.ts` – **Stub** – regenerate with `supabase gen types`.
- `wrangler.jsonc` – Cloudflare Workers configuration.

### `supabase/`
- `migrations/` – PostgreSQL migration files (only `profiles` table exists initially).
- `config.toml` – Local Supabase configuration (ports, features, auth settings).
- **Note:** The complete schema is described in `docs/database‑schema.md`. The actual database currently contains only the `profiles` table.

### `docs/`
- `architecture.md` – High‑level architecture diagram and rationale.
- `database‑schema.md` – Detailed schema design (not yet implemented).
- `overall‑system.md` – Product vision, terminology, and user flows.
- `monorepo.md` – Why the monorepo exists and what it solves.

## Development Patterns

### Frontend
- **Routing:** Use TanStack Router’s file‑based routing. Each route exports a `Route` component created with `createFileRoute`.
- **Styling:** Use Tailwind CSS with `cn()` helper for conditional classes.
- **Components:** Follow shadcn/ui patterns; add new components via `npx shadcn@latest add`.
- **API calls:** Not yet implemented; the plan is to use Hono’s `hc<AppType>` client for type‑safe requests.
- **SSR:** The app uses TanStack Start (built on Nitro) for server‑side rendering. The `vite.config.ts` includes the `tanstackStart()` plugin.

### API
- **Routes:** Each resource (e.g., `subjects`) is a separate Hono instance mounted on the main app.
- **Middleware:** `supabaseMiddleware` attaches a Supabase client to `c.var.supabase`. Use `getAuthenticatedUser(c)` to retrieve the current user.
- **Validation:** Use `@hono/zod‑validator` for request validation (not yet used in the initial routes).
- **Environment variables:** Bindings are defined in `src/types.ts` and must match the keys in `.dev.vars` (local) and Cloudflare secrets (production).

### Database
- **Migrations:** Add new SQL files in `supabase/migrations/` with a timestamp prefix (e.g., `20260513193000_name.sql`). Apply with `supabase db reset` or `supabase db push`.
- **Type generation:** After modifying the schema, run `supabase gen types typescript --local > api/src/database.types.ts` to update the TypeScript definitions.
- **RLS:** Always enable RLS and write policies that reflect the desired access pattern. The API uses a per‑request Supabase client with the user’s JWT, so RLS works automatically.

### Shared Types
Currently there is no shared `packages/types` folder. The API’s `AppType` (exported from `api/src/index.ts`) is intended to be imported by the frontend for type‑safe API calls. This integration is not yet wired up.

## Typical Feature Development

When adding a new feature that touches the database, API, and frontend, follow this sequence to keep changes atomic and maintain type safety:

1. **Database migration**
   - Create a new SQL file in `supabase/migrations/` (timestamped).
   - Apply locally: `pnpm supabase:reset` (or `supabase db push`).
   - Regenerate TypeScript types: `supabase gen types typescript --local > api/src/database.types.ts`.

2. **API route**
   - Add a new file in `api/src/routes/` or extend an existing one.
   - Use `@hono/zod‑validator` for request validation.
   - Import `supabase` from `c.var` and query the new tables.
   - Export the route and mount it in `api/src/index.ts`.

3. **Frontend integration**
   - Create or update a TanStack Router route in `app/src/routes/`.
   - Add a React component that fetches data using the typed Hono client (once wired).
   - Use shadcn/ui components for consistent UI.

4. **Type checking and linting**
   - Run `pnpm typecheck` and `pnpm lint` to catch any errors.
   - Format with `pnpm format`.

5. **Test**
   - Add Vitest tests for the frontend component.
   - (Future) Add unit tests for the API route.

Keep the PR scope limited to one feature across the stack—the monorepo enables atomic changes.

## Testing

- **Frontend:** Uses Vitest and React Testing Library. Run with `pnpm test` in the `app/` directory.
- **API:** No test suite is currently set up.
- **End‑to‑end:** None yet.

## Gotchas & Non‑Obvious Things

1. **Supabase requires Docker.** You must have Docker running before `pnpm supabase:start`. If Docker is not installed, the command will fail silently.
2. **Environment variables differ between app and API.** The frontend uses `VITE_`‑prefixed variables (exposed to the browser), while the API uses plain names (stored in Cloudflare secrets). Copy the example files and fill them with values from `supabase status`.
3. **CORS is configured in the API middleware.** The API only allows requests from `APP_URL` (set in `.dev.vars`). If you change the frontend port, update `APP_URL` accordingly.
4. **Database types are a stub.** The file `api/src/database.types.ts` currently contains empty interfaces. Regenerate it after any schema change.
5. **The API runs on `localhost:8787` in dev**, not the default Cloudflare Workers port (8788). The frontend’s `VITE_API_BASE` points to `http://localhost:8787`.
6. **The root `package.json` scripts use `pnpm -r` (recursive).** If you need to run a command only in one package, use `pnpm --filter <package> <script>`.
7. **Prettier is configured with a Tailwind plugin.** It sorts classes automatically; don’t manually reorder them.
8. **Only the `profiles` table exists.** The extensive schema described in `docs/database‑schema.md` is not yet implemented. Start by adding migrations for the missing tables when building new features.

## Environment Variables

### `app/.env`
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (local or remote) | `http://127.0.0.1:54321` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | (from `supabase status`) |
| `VITE_API_BASE` | Base URL of the API (Wrangler dev server) | `http://localhost:8787` |

### `api/.dev.vars`
| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `http://127.0.0.1:54321` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | (from `supabase status`) |
| `SUPABASE_SECRET_KEY` | Supabase service‑role key (bypasses RLS) | (from `supabase status`) |
| `APP_URL` | Frontend origin for CORS | `http://localhost:5173` |

**Production:** These variables become Cloudflare Workers secrets (set via `wrangler secret`).

## Adding a New Package

If you need to create a shared package (e.g., `packages/types` for shared TypeScript interfaces):

1. Create a new directory under `packages/` (the folder does not exist yet; create it).
2. Add a `package.json` with `"name": "@bluelearn/types"`, `"type": "module"`, and `"exports"`.
3. Update `pnpm‑workspace.yaml` to include the new package.
4. Install dependencies with `pnpm install`.
5. Import from other packages using the workspace protocol (`"@bluelearn/types": "workspace:*"`).

## CI/CD

The repository uses GitHub Actions defined in `.github/workflows/ci.yml`. Two jobs run in parallel:

- **`app`** – Type checking, linting, testing, and building the frontend.
- **`api`** – Type checking and a dry‑run deployment (`wrangler deploy --dry-run`).

The workflow triggers on pushes to `main` and on pull requests.

## Where to Look Next

- **`docs/architecture.md`** for the high‑level architecture diagram and rationale.
- **`docs/database‑schema.md`** for the complete, planned database schema (not yet implemented).
- **`docs/overall‑system.md`** for product vision, terminology, and user flows.
- **`docs/monorepo.md`** for why the repository is structured as a monorepo.
- **`docs/open‑questions.md`** for unresolved design decisions.

---

*This document was generated by analyzing the repository. Update it as the codebase evolves.*