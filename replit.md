# DocuAI — AI-Powered Technical Documentation Generator

A SaaS-grade developer tool that generates professional technical documentation from code files or GitHub URLs using OpenAI GPT.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port assigned by workflow)
- `pnpm --filter @workspace/docgen run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-provisioned via Replit AI integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI GPT via Replit AI Integrations (gpt-5.1)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (docRecords, conversations, messages)
- `artifacts/api-server/src/routes/docs/` — documentation generation routes
- `artifacts/api-server/src/routes/openai/` — AI chat routes
- `artifacts/docgen/src/` — React frontend
- `lib/integrations-openai-ai-server/` — OpenAI server SDK wrapper

## Architecture decisions

- Contract-first OpenAPI spec drives all typed hooks (Orval codegen)
- Single shared Express API server for all artifacts
- OpenAI via Replit AI Integrations proxy — no user API key needed
- PostgreSQL for doc history persistence; Drizzle ORM for type-safe queries
- SSE (Server-Sent Events) for streaming AI responses

## Product

DocuAI lets developers generate 6 types of technical documentation (README, API docs, function explanations, setup guides, changelogs, project overview) from pasted code or GitHub URLs. All generated docs are stored in history and can be downloaded as Markdown.

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after editing schema files in `lib/db/src/schema/`
- The SSE endpoints (`POST /api/openai/conversations/:id/messages`) cannot use Orval-generated hooks — use raw fetch + ReadableStream
