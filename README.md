# my-ts-template

A TanStack Start template with React 19, shadcn/ui, and a full dev toolchain ready to go.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + React Compiler)
- **Routing:** [TanStack Router](https://tanstack.com/router) (file-based, SSR-ready)
- **Data:** [TanStack Query](https://tanstack.com/query) (server state) + [TanStack Form](https://tanstack.com/form) (form state with Zod validation)
- **UI:** [shadcn/ui](https://ui.shadcn.com) (radix-nova preset, 52 components pre-installed)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) + Inter font
- **Linting:** [Biome](https://biomejs.dev) (formatting + linting) + ESLint (React hooks)
- **Testing:** [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- **Runtime:** [Bun](https://bun.sh)

## Using This Template

1. **Copy or clone** this repo into your project directory:

   ```bash
   cp -r my-ts-template my-new-app
   cd my-new-app
   ```

2. **Rename the project** in `package.json` and `.cta.json`:

   ```bash
   # Update "name" in package.json
   # Update "projectName" in .cta.json
   ```

3. **Update the page title** in `src/routes/__root.tsx` (the `title` meta tag).

4. **Install dependencies and start dev server:**

   ```bash
   bun install
   bun dev
   ```

5. Open `http://localhost:3000` — you should see a Hello World card with a theme toggle.

## Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests (Vitest) |
| `bun run check:biome` | Lint and format (Biome) |
| `bun run check:eslint` | Lint React hooks (ESLint) |
| `bun run typecheck` | Type-check (TypeScript) |
| `bun run deploy` | Build and deploy to Cloudflare Workers |

## Project Structure

```text
src/
├── routes/           # File-based routes (TanStack Router)
│   ├── __root.tsx    # Root layout (theme, providers, 404)
│   └── index.tsx     # Home page (Hello World)
├── components/
│   ├── ui/           # shadcn/ui components (52 pre-installed)
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── hooks/            # Shared hooks
├── integrations/     # TanStack Query provider + devtools
├── lib/              # Utilities (cn, etc.)
├── styles.css        # Tailwind config + theme variables
├── env.ts            # Environment variable validation (t3-env)
└── router.tsx        # Router instance
```

## Adding shadcn Components

All 52 shadcn components are already installed. To add new ones:

```bash
bunx shadcn@latest add <component-name>
```

## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Install Wrangler: `bun add -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy: `bun run deploy`

For production env vars, run `wrangler secret put MY_VAR` for each secret listed in `.env.example`. Public (non-secret) vars go in `wrangler.jsonc` under `vars`.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc` — see https://developers.cloudflare.com/workers/wrangler/configuration/.

## Conventions

- **Always use `bun`/`bunx`.** No npm, yarn, or pnpm.
- **Absolute imports** with `~/` prefix (e.g., `~/components/ui/button`).
- **Biome** for formatting and linting. Run `bun run check` before committing.
- **No `useEffect`** unless escape hatch. No `useMemo`/`useCallback` — React Compiler handles it.
- **Zod** for all validation.
- **Feature folders** for self-contained features: `*.server.ts` (server functions), `use-*.ts` (hooks), `*.tsx` (UI).
- **Tailwind sizing:** use `size-x` instead of `h-x w-x` for square dimensions.
