# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is a freshly-scaffolded `create-next-app` project (Next.js App Router + TypeScript + Tailwind CSS v4). `app/page.tsx` and `app/layout.tsx` are still the default template — no application-specific routes, components, or logic exist yet.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@10.10.0` in [package.json](package.json)) — use `pnpm`, not `npm`/`yarn`.

- `pnpm dev` — start the dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next`)

There is no test setup (no test runner installed, no test files) as of now.

## Architecture

- **App Router** under [app/](app/): [app/layout.tsx](app/layout.tsx) is the root layout (loads Geist fonts, sets global HTML/body structure); [app/page.tsx](app/page.tsx) is the `/` route; [app/globals.css](app/globals.css) holds Tailwind's `@import "tailwindcss"` plus theme tokens (`@theme inline`) and the dark-mode color overrides via `prefers-color-scheme`.
- **Styling**: Tailwind v4, configured entirely through CSS (`@theme` in `globals.css` + [postcss.config.mjs](postcss.config.mjs)) — there is no `tailwind.config.*` file to edit.
- **Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)).
- **pnpm workspace**: [pnpm-workspace.yaml](pnpm-workspace.yaml) exists only to declare `ignoredBuiltDependencies` (`sharp`, `unrs-resolver`); it does not currently define any workspace packages.

## Important: non-standard Next.js version

Per [AGENTS.md](AGENTS.md) (imported above), this project's Next.js version has APIs/conventions that diverge from typical training data. Before writing routing, data-fetching, or config code, check `node_modules/next/dist/docs/` (`01-app/`, `02-pages/`, `03-architecture/`, `04-community/`) for the current API rather than assuming past-known Next.js behavior.

One concrete example already present in this repo: [app/layout.tsx](app/layout.tsx) types its props via the generated `LayoutProps<"/">` helper (from Next's route typegen in `.next/types`) instead of hand-writing `{ children: React.ReactNode }`. Follow this generated-types convention (`LayoutProps<Route>` / `PageProps<Route>`) for new layouts and pages rather than manual prop typing.
