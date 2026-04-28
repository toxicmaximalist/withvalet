# Repository Guidelines

## Project Structure & Module Organization
This repository is a `Next.js 16` App Router app backed by Supabase. Keep route files under `src/app`, including nested workspace routes such as `src/app/workspaces/[workspaceSlug]`. Put server actions in `src/actions`, shared UI in `src/components`, and reusable logic in `src/lib`. Database types live in `src/types`, static assets in `public`, and checked-in schema changes in `supabase/migrations`.

## Build, Test, and Development Commands
Use `pnpm`; the repo includes `pnpm-lock.yaml`.

- `pnpm install` installs dependencies.
- `pnpm dev` starts the local Next.js dev server.
- `pnpm dev:full` pushes Supabase migrations, then starts the app.
- `pnpm lint` runs ESLint across the project.
- `pnpm build` creates a production build.
- `pnpm db:push` applies `supabase/migrations` to the linked Supabase project.

For first-time setup, copy `.env.example` to `.env.local`, then run `pnpm supabase:login` and `pnpm supabase:link --project-ref <ref>`.

## Coding Style & Naming Conventions
Follow the existing TypeScript style: 2-space indentation, semicolons, double quotes, and strict typing. Prefer the `@/*` import alias over long relative paths. Use `PascalCase` for React component exports, `camelCase` for functions and variables, and kebab-case filenames for reusable components such as `page-header.tsx`. Keep route file names aligned with App Router defaults like `page.tsx`, `layout.tsx`, and `loading.tsx`.

## Testing Guidelines
There is no dedicated automated test suite yet. Treat `pnpm lint` and `pnpm build` as the required verification baseline before opening a PR. When adding tests later, place them next to the feature or in a local `__tests__` folder and name them after the unit under test, for example `contacts.test.ts`.

## Commit & Pull Request Guidelines
The visible history is minimal, so keep commits short, imperative, and scoped, for example `Add folder filtering` or `Fix workspace redirect`. Avoid mixing schema, UI, and auth changes in one commit unless they are tightly coupled. PRs should include a brief summary, setup or migration notes, linked issues when applicable, and screenshots for UI changes under `src/app` or `src/components`.

## Security & Configuration Tips
Do not commit real secrets from `.env.local`. Keep Supabase schema changes in `supabase/migrations` so teammates can reproduce them with `pnpm db:push`. Validate new form inputs through the shared Zod schemas in `src/lib/validators.ts`.
