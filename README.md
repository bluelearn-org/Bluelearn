<p align="center">
  <a href="https://bluelearn.org">
    <img src=".github/assets/logo.png" alt="Bluelearn" width="120" />
  </a>
</p>

<h1 align="center">Bluelearn</h1>

<p align="center">
  <strong>Free knowledge, structured from the ground up.</strong><br/>
  A nonprofit, open-source education platform where every concept maps to its prerequisites.
</p>

<p align="center">
  <a href="https://github.com/bluelearn-org/bluelearn/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/bluelearn-org/bluelearn/ci.yml?branch=main&label=CI&style=flat-square"/></a>
  <a href="LICENSE"><img alt="Code: AGPL-3.0" src="https://img.shields.io/badge/code-AGPL--3.0-blue?style=flat-square"/></a>
  <a href="LICENSE-CONTENT"><img alt="Content: CC BY-SA 4.0" src="https://img.shields.io/badge/content-CC%20BY--SA%204.0-green?style=flat-square"/></a>
  <a href="https://discord.gg/bluesystem"><img alt="Discord" src="https://badgen.net/discord/members/1504519272729149502?icon=discord&color=5865F2"/></a>
  <a href="https://github.com/bluelearn-org/bluelearn/stargazers"><img alt="Stars" src="https://badgen.net/github/stars/bluelearn-org/bluelearn?icon=github&color=yellow"/></a>
  <a href="https://github.com/bluelearn-org/bluelearn/network/members"><img alt="Forks" src="https://badgen.net/github/forks/bluelearn-org/bluelearn?icon=github"/></a>
  <a href="https://github.com/bluelearn-org/bluelearn/graphs/contributors"><img alt="Contributors" src="https://badgen.net/github/contributors/bluelearn-org/bluelearn?icon=github"/></a>
  <a href="https://github.com/bluelearn-org/bluelearn/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-005776?style=flat-square"/></a>
  <a href="https://bluelearn.org"><img alt="Homepage" src="https://img.shields.io/badge/site-bluelearn.org-005776?style=flat-square"/></a>
</p>

<p align="center">
  <a href="#-what-is-bluelearn"><b>What is it</b></a> ·
  <a href="#-watch-the-overview"><b>Overview</b></a> ·
  <a href="#-quick-start"><b>Quick start</b></a> ·
  <a href="#%EF%B8%8F-project-layout"><b>Layout</b></a> ·
  <a href="#%EF%B8%8F-tech-stack"><b>Stack</b></a> ·
  <a href="#-roadmap"><b>Roadmap</b></a> ·
  <a href="#-contributing"><b>Contributing</b></a> ·
  <a href="#-support-the-project"><b>Sponsor</b></a>
</p>

---

## 📚 What is Bluelearn

Most "free" knowledge online is organized for **retrieval**, not for **learning**.
You can look up what a Fourier transform is on Wikipedia in 30 seconds. 
Actually learning it without a class? That's a week of figuring out what to read first.

Bluelearn is **a graph of concepts** where every page declares its
prerequisites. Hit a term you don't know? The prerequisite is one click
away. Community-written, optionally expert-verified, AGPL-3.0, free forever.

This repository is the **product monorepo**: web client, API, and database.
The marketing site is closed-source.

**💬 [Join the Discord →](https://discord.gg/bluesystem)** · **🌐 [bluelearn.org →](https://bluelearn.org)** · **📺 [YouTube →](https://www.youtube.com/@blue-learn)**

---

## 🎥 Watch the overview

A 23-minute walkthrough of what Bluelearn is, why it's nonprofit, and how
the prerequisite graph changes how you read a concept page.

<p align="center">
  <a href="https://www.youtube.com/watch?v=qcRKmm3B25c">
    <img src="https://img.youtube.com/vi/qcRKmm3B25c/maxresdefault.jpg" alt="Bluelearn — 23-minute overview" width="640" />
  </a>
</p>

---

## 🚀 Quick start

You'll need [Node.js 20+](https://nodejs.org/), [pnpm 10+](https://pnpm.io/),
the [Supabase CLI](https://supabase.com/docs/guides/local-development),
and Docker (for the local Supabase stack).

```bash
# 1. Clone and install
git clone https://github.com/bluelearn-org/bluelearn.git
cd bluelearn
pnpm install

# 2. Start local Supabase (Postgres + Auth on docker)
pnpm supabase:start

# If your shell/OS does not resolve the local Supabase binary,
# use one of these instead:
# pnpm exec supabase start
# pnpx supabase start

# 3. Copy env files and fill in the values Supabase printed
cp api/.dev.vars.example api/.dev.vars
cp app/.env.example app/.env

# 4. Run app + api side-by-side
pnpm dev:api          # Workers dev   → http://localhost:8787
pnpm dev:app          # Vite dev      → http://localhost:3000
```

The app reads `VITE_API_BASE` from `app/.env` (default `http://localhost:8787`),
and the API uses `APP_URL` from `api/.dev.vars` for CORS (default `http://localhost:3000`).

> 💡 **Tip:** `pnpm dev` runs both `app` and `api` in parallel through pnpm
> workspaces.

---

## 🗂️ Project layout

```
bluelearn/
├── app/             React 19 · TanStack Start · TanStack Router/Query
│                    shadcn/ui · Tailwind 4 · Vite
├── api/             Hono on Cloudflare Workers
│                    Routes: /subjects · /walkthroughs · /guides
├── supabase/        Postgres · Auth · Storage — migrations + RLS policies
├── docs/
│   ├── architecture.md      System overview + diagram
│   ├── monorepo.md          Why one repo instead of three
│   ├── overall-system.md    Editorial pipeline + verifier design
│   ├── database-schema.md   ERD walkthrough
│   └── open-questions.md    Active design debates
└── .github/
    ├── workflows/ci.yml     app + api in parallel
    ├── ISSUE_TEMPLATE/      bug · feature · guide proposal
    ├── PULL_REQUEST_TEMPLATE.md
    ├── CODEOWNERS
    └── FUNDING.yml
```

**Why a monorepo?** See [`docs/monorepo.md`](docs/monorepo.md) — short
version: atomic cross-stack changes, one CI, one onboarding flow,
type-safety end-to-end via Hono's `hc<AppType>`.

---

## 🛠️ Tech stack

| Layer            | Tech                                                              | Why                                                                |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Frontend**     | React 19 · TanStack Start · TanStack Router/Query · shadcn/ui     | Type-safe routing, cache-aware data, accessible primitives         |
| **API**          | Hono on Cloudflare Workers · `@hono/zod-validator`                | Edge-fast, tiny, type-safe end-to-end with the frontend            |
| **Database**     | Supabase (Postgres 15 · GoTrue Auth · Storage)                    | Managed Postgres + RLS, JWT auth, file storage in one              |
| **Tooling**      | pnpm workspaces · TypeScript · ESLint · Prettier · Vitest         | One install, one CI, one style                                     |
| **CI/CD**        | GitHub Actions (parallel jobs per package)                        | Fast feedback, easy to extend                                      |
| **Wire types**   | Hono `AppType` exported from `api/src/index.ts`                   | `hc<AppType>` gives the frontend full request/response types       |

### Phase 3 R&D (bonus, not required)

Decentralized editorial verification: signing the canonical concept
history into a verifiable log. Tools under exploration:
**SUI** · **Move** · **Walrus**. Skills welcome from contributors
interested — these are not on the Phase 1 critical path.

---

## 🧭 Roadmap

| Phase | Status     | Focus                                                              |
| ----- | ---------- | ------------------------------------------------------------------ |
| **1** | 🟢 Active  | The Core — data model, graph traversal, basic UI, community seed   |
| **2** | ⚪ Next    | Universal Access — i18n, expert verification tooling, API formalize |
| **3** | ⚪ Future  | Decentralization — protocol extraction, self-host, independent mirrors |

Full roadmap: [bluelearn.org/roadmap](https://bluelearn.org/roadmap)

---

## 🤝 Contributing

Small project, tight loop. New contributors land their first PR within a
day on a good week. **[CONTRIBUTING.md](CONTRIBUTING.md)** is the full
guide.

The shortest path:

1. Find a [`good first issue`](https://github.com/bluelearn-org/bluelearn/labels/good%20first%20issue) or open one.
2. Comment that you'd like to take it.
3. [Set up locally](#-quick-start) and open a draft PR early.
4. Ping `#contributing` on [Discord](https://discord.gg/bluesystem) anytime.

### What we're hiring for (the contribution profile)

**Frontend** — TypeScript proficiency, React, TanStack ecosystem (router + query), UI/UX sense.
**Backend** — TypeScript on Workers (Hono), Supabase / Postgres, RLS familiarity.
**Generalist bonus skills** — accessibility, i18n, performance budgets.
**Phase 3 R&D bonus** — web3 smart contracts (SUI, Move), Walrus storage.

---

## 📈 Star history

<a href="https://star-history.com/#bluelearn-org/bluelearn&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=bluelearn-org/bluelearn&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=bluelearn-org/bluelearn&type=Date" />
    <img alt="Star history chart" src="https://api.star-history.com/svg?repos=bluelearn-org/bluelearn&type=Date" />
  </picture>
</a>

---

## 👥 Contributors

Thanks to everyone who has helped shape Bluelearn.

<a href="https://github.com/bluelearn-org/bluelearn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bluelearn-org/bluelearn" alt="Contributors" />
</a>

---

## 💛 Support the project

Bluelearn is fiscally sponsored — 501(c)(3) pending. Every dollar funds
infrastructure (Supabase, Cloudflare, Discord), editorial review, and
making content available offline in low-bandwidth regions.

- **One-time / recurring donation** → [bluelearn.org/donate](https://bluelearn.org/donate)
- **GitHub Sponsors** → coming once the org is live
- **Help in other ways** → star the repo, share the project, open an issue,
  send a PR

---

## 📊 At a glance

| | |
| --- | --- |
| **Stars** | ![Stars](https://badgen.net/github/stars/bluelearn-org/bluelearn?icon=github&color=yellow) |
| **Forks** | ![Forks](https://badgen.net/github/forks/bluelearn-org/bluelearn?icon=github) |
| **Open issues** | ![Issues](https://badgen.net/github/open-issues/bluelearn-org/bluelearn?icon=github) |
| **Open PRs** | ![PRs](https://badgen.net/github/open-prs/bluelearn-org/bluelearn?icon=github) |
| **Discord members** | ![Discord](https://badgen.net/discord/members/1504519272729149502?icon=discord&color=5865F2) |

---

## 📜 License

- **Code** — [AGPL-3.0-or-later](LICENSE). Any service that exposes this code over a network must publish its source.
- **Content** — [CC BY-SA 4.0](LICENSE-CONTENT). Concept pages and editorial material remix freely with attribution and share-alike.

By contributing you agree your work is licensed under the applicable
license above. See [CONTRIBUTING.md](CONTRIBUTING.md#licensing-and-sign-off)
for sign-off details.

<p align="center">
  <sub>Built openly · <a href="https://bluelearn.org">bluelearn.org</a> · <a href="https://discord.gg/bluesystem">Discord</a> · <a href="https://github.com/bluelearn-org">GitHub</a></sub>
</p>