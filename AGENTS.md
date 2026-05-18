# AGENTS.md

This file provides guidance to AI coding assistants working in this project. Read it in full before making modifications.

NOTE: `CLAUDE.md` is a symlink to `AGENTS.md`.

**Self-maintaining:** After any meaningful change to the project (new conventions, architectural shifts, updated flows), update this file with concise edits to keep it accurate.

## Project Overview

TanStack Start template with React 19, shadcn/ui, and a full dev toolchain. Currently a Hello World — add your features in `src/routes/` and `src/features/`.

## Architecture

- **Frontend:** React 19 (with React Compiler), TanStack Router (file-based), TanStack Query, TanStack Form, shadcn/ui + Tailwind CSS 4
- **Server:** TanStack Start server functions (`createServerFn`) for RPC
- **Config:** t3-env for environment variable validation

## Project Structure

```text
src/
├── routes/                     # TanStack Router file-based routes
│   ├── __root.tsx              # Root layout
│   └── index.tsx               # Home page
├── features/                   # Feature modules (create as needed)
├── lib/                        # Shared utilities
└── components/ui/              # shadcn components
```

## Conventions

- **Always use `bun` and `bunx`.** Never use `npm`, `npx`, `yarn`, `pnpm`, or any other package manager/runner.
- Feature folders are self-contained: `*.server.ts` (server functions), `use-*.ts` (hooks), `*.tsx` (UI)
- **Zod-first types:** Define Zod schemas for all external data (API responses, user input, URL params, env vars) and infer TypeScript types with `z.infer<>`. Only use plain `type`/`interface` for internal-only structures with no validation boundary.
- **React Query:**
  - Default `staleTime: 30_000` (30s) is set globally. Override per-query as needed — use `Infinity` for truly static data, lower values for rapidly changing data.
  - Wrap every query in a custom hook (`use-*.ts`) — never call `useQuery` directly in components. Colocate the hook, query key factory, and fetch function in the same feature folder.
  - Use `queryOptions` helper to define query config objects; share them between `useQuery`, `useSuspenseQuery`, prefetching, and cache reads.
  - **Query key factories** per feature, structured most-generic to most-specific:

    ```ts
    export const todoKeys = {
      all: ['todos'] as const,
      lists: () => [...todoKeys.all, 'list'] as const,
      list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
      details: () => [...todoKeys.all, 'detail'] as const,
      detail: (id: number) => [...todoKeys.details(), id] as const,
    }
    ```

  - Every variable passed to `queryFn` must also appear in the `queryKey` (treat keys like dependency arrays).
  - Never copy query data into local state — it breaks background updates. Exception: form initial data with `staleTime: Infinity`.
  - Use `queryClient.setQueryData` only for optimistic updates and writing mutation responses — never as local state storage.
  - Keep `refetchOnWindowFocus` enabled (default) — it provides free data freshness without loading spinners.
- No useEffect unless escape hatch. No useMemo/useCallback (React Compiler handles it) except when using an incompatible library.
- Zod for all validation. Biome for linting/formatting. Vitest + Testing Library for tests.
- **Forms:** TanStack Form (`useForm`) with Zod validators and shadcn Field components (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`). Use `form.Field` render props for field binding.
- shadcn components preferred over custom. TanStack Table for data tables.
- **Tailwind sizing:** Use `size-x` instead of `h-x w-x` for square dimensions. Never add `className="mr-2 h-4 w-4"` or similar sizing/spacing to icons inside `<Button>` or `<TabsTrigger>` — the component handles it.
- **Accessibility:** Icon-only buttons (`size="icon"`) must include a `<span className="sr-only">` with a descriptive label.
