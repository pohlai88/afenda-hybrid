# @afenda/web

AFENDA HCM web application built with Next.js 15 (App Router).

## Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** @afenda/ui (design system)
- **Database:** @afenda/db (Drizzle ORM)
- **State:** Zustand + React Server Components
- **Forms:** React Hook Form + Zod
- **Deployment:** Vercel

## Development

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

## Structure

```
src/
  app/
    (auth)/         -- login, register
    (dashboard)/    -- authenticated shell
      core/         -- /core/* routes
      hr/           -- /hr/* routes
      ...
    layout.tsx      -- root layout
    page.tsx        -- landing/redirect
```
