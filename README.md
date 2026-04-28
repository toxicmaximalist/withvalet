# WithValet

AI-native minimal sales CRM built with `Next.js App Router`, `TypeScript`, `TailwindCSS`, and `Supabase`.

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `TailwindCSS 4`
- `Supabase Auth + Postgres + RLS`

## Features

- Email/password auth with Supabase
- Multi-workspace CRM model
- Workspace create and invite-code join flow
- Contacts CRUD with automatic organization creation
- Organizations list and detail views
- Folders with many-to-many contact grouping
- Outreach activity timeline with automatic `last_contact_date` updates
- Dark, Linear-style UI with restrained fire-red accents
- AI-ready placeholder surfaces for future enrichment and summaries

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# or
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

3. One-time Supabase CLI setup for your remote project:

```bash
pnpm supabase:login
pnpm supabase:link --project-ref YOUR_PROJECT_REF
```

4. Push the checked-in schema to Supabase:

```bash
pnpm db:push
```

5. Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

Or use the combined local workflow after the one-time link step:

```bash
pnpm dev:full
```

`dev:full` runs the migration push first, then starts Next.js. This is intended for local development only. The app itself does not run schema migrations automatically at runtime.

If the Supabase CLI is not installed globally, these scripts will download and run it through `npx`.

## Important Paths

- `src/app` — App Router pages and layouts
- `src/actions` — server actions for auth and CRUD flows
- `src/components` — reusable UI primitives and CRM shell components
- `src/lib` — Supabase setup, workspace guards, queries, utils, validation
- `supabase/migrations` — database schema, triggers, helper functions, and RLS

## Verification

```bash
pnpm lint
pnpm build
```
