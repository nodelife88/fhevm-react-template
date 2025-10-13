# Confidential Chat FE (Next.js)

Frontend application for Confidential Chat, built with Next.js 15, React 19, Tailwind CSS v4, and shadcn/ui (Radix UI). Optimized for fast development, easy extension, and deployment to Vercel.

## Stack

- Next.js 15 (App Router, `app/` directory)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- shadcn/ui + Radix UI (`components/ui/*`)
- Vercel Analytics

## Requirements

- Node.js ≥ 18 (20+ recommended)
- npm or pnpm (repo includes `pnpm-lock.yaml`, scripts use npm — pnpm works as well)

## Install

```bash
# with npm
npm install

# (optional) with pnpm
pnpm install
```

## Develop

```bash
npm run dev
```
Open the URL printed in the terminal (typically `http://localhost:3000`).

## Build & Start (production)

```bash
npm run build
npm start
```

Note: `next.config.mjs` currently disables build-time failures for faster iteration:
- `eslint.ignoreDuringBuilds = true`
- `typescript.ignoreBuildErrors = true`

## Scripts

- `dev`: start the development server
- `build`: build the application
- `start`: start the production server
- `lint`: run ESLint (Next.js)

Example:
```bash
npm run lint
```

## Directory Structure

```
confidential-chat-fe/
  app/
    globals.css
    layout.tsx
    page.tsx
    messages/
      page.tsx
  components/
    ui/                 # shadcn/ui (Radix) components
    *.tsx               # feature components: chat, modals, layout, etc.
  hooks/
  lib/
  public/
  styles/
    globals.css         # (if used, depends on your setup)
  package.json
  tsconfig.json
  next.config.mjs
  postcss.config.mjs
  components.json       # shadcn/ui config, aliases, tailwind
```

### Aliases & shadcn/ui

`components.json` defines aliases:
- `components` → `@/components`
- `ui` → `@/components/ui`
- `utils` → `@/lib/utils`
- `lib` → `@/lib`
- `hooks` → `@/hooks`

Add new UI components under `components/ui/` and import via `@/components/ui/...`.

## Tailwind CSS v4

PostCSS config:
```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```
Global styles: `app/globals.css` (ensure it is imported in `app/layout.tsx`).

## TypeScript

`tsconfig.json` enables `strict` and sets `@/*` → `./*` path alias. Module resolution uses `bundler` (fits Next 15).

## Images & optimization

`next.config.mjs` sets `images.unoptimized = true` to skip runtime image optimization (useful for static deploys or environments without Image Optimization configured).

## Environment Variables

Frontend usually should not use secrets. For public variables, prefix with `NEXT_PUBLIC_` so they are available on the client.

Example:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```
In code: `process.env.NEXT_PUBLIC_API_BASE_URL`.

## Deploy (Vercel recommended)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the project to Vercel, select Next.js framework.
3. Configure environment variables (if any), keep default build command.
4. Deploy. Vercel will run `next start` for production.

## UI Development Notes

- Reusable primitives live in `components/ui/*` (shadcn/ui).
- Feature components live in `components/*` (e.g., `message-composer.tsx`, `messaging-layout.tsx`).
- Main page: `app/page.tsx`; messages page: `app/messages/page.tsx`.

## Quality Notes

- Build currently ignores ESLint/TypeScript errors for speed; once stable, consider enabling failures to improve quality.
- Keep component/file names clear and discoverable.

## Troubleshooting

- Node version mismatch: check `node -v` (>= 18).
- CSS not applied: ensure `app/globals.css` is imported and PostCSS config is correct.
- Import path errors: verify `@/*` alias in `tsconfig.json` matches your folder structure.

---
If you want to add BE integration details or specific env variables, share the API endpoints and I’ll update the ENV and data flow sections accordingly.
