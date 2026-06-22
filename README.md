<h1>Zync</h1>

<p>Visual workflow automation that connects your favorite tools GitHub, Notion and AI without writing a single line of glue code.</p>
<img width="1200" height="630" alt="ogimg" src="https://github.com/user-attachments/assets/b2d26115-ff4b-42d2-b0bc-19b7b8d11982" />

<br /> <br />

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge&logo=bull&logoColor=white)

<br />

> [NOTE]
> 🚧 **This is a personal side project**, built for fun and learning. Expect rough edges, experimental features, and the occasional late-night commit message. PRs & issues are welcome!

</div>

---

## 📖 What is Zync?

**Zync** is a self-hosted, visual workflow automation platform. Think zapier or n8n.
You build workflows on a **drag-and-drop canvas** (powered by React Flow), connect nodes representing triggers and actions, and Zync handles the execution asynchronously via a dedicated background worker.

```
[Webhook Trigger] ──▶ [AI Transform] ──▶ [Create Notion Page] ──▶ [Post GitHub Issue]
```

---

## 🏗️ Project Structure

This is a **pnpm monorepo** powered by [Turborepo](https://turborepo.dev).

```
zync/
├── apps/
│   ├── web/          # Next.js 16 frontend + API routes
│   └── worker/       # BullMQ background job processor
│
└── packages/
    ├── prisma/        # Shared Prisma schema & generated client
    ├── shared/        # Shared utilities (queue, types, helpers)
    ├── eslint-config/ # Shared ESLint configuration
    └── typescript-config/ # Shared tsconfig bases
```

### `apps/web` — The Next.js App
The main user-facing application. Handles auth, the workflow canvas editor, credential management, and all API routes.

### `apps/worker` — The Background Worker
A long-running Node.js process that consumes jobs from a Redis queue (via BullMQ) and executes workflow runs step-by-step. Runs independently of the web server.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| **Animations** | Framer Motion, `tw-animate-css` |
| **Canvas** | [React Flow (`@xyflow/react`)](https://reactflow.dev) |
| **Auth** | [better-auth](https://better-auth.com) (Google & GitHub OAuth) |
| **Database** | PostgreSQL via [Prisma ORM](https://prisma.io) |
| **Queue** | [Redis](https://redis.io) + [BullMQ](https://bullmq.io) |
| **Icons** | Hugeicons |
| **Toasts** | [sileo](https://github.com/abheeee03/sileo) |
| **Validation** | Zod |
| **AI** | OpenRouter (via `@openrouter/agent`) |
| **Package Manager** | pnpm 9 |
| **Monorepo** | Turborepo |

---

## ✨ Features

- 🎨 **Visual Workflow Editor** — Drag-and-drop canvas to build automations
- ⚡ **Async Execution** — Workflows run in a dedicated worker process, never blocking the UI
- 🔗 **Integrations** — GitHub, Notion, Google (OAuth), Webhooks, and AI actions
- 🤖 **AI Actions** — Run prompts through OpenRouter and use the output as data
- 🔒 **Auth** — Secure OAuth login via Google & GitHub
- 🗝️ **Credential Vault** — Store & reuse OAuth tokens across workflows
- 📊 **Run History** — Track every workflow execution with status & step logging
- 🧩 **Modular Actions** — GitHub, Notion, Delay, Webhook, Transform, and AI nodes

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) `>= 18`
- [pnpm](https://pnpm.io) `9.x`  — `npm install -g pnpm@9`
- A running **PostgreSQL** database
- A running **Redis** instance (or an Upstash Redis URL)

### 1. Clone the repository

```sh
git clone https://github.com/abheeee03/zync.git
cd zync
```

### 2. Install dependencies

```sh
pnpm install
```

### 3. Set up environment variables

Copy the example files and fill in your credentials:

```sh
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env
cp packages/prisma/.env.example packages/prisma/.env
```

> See the [Environment Variables](#-environment-variables) section below for what each variable does.

### 4. Run database migrations

```sh
cd packages/prisma
pnpm prisma migrate dev
pnpm prisma db seed   # optional: seeds available triggers & actions
```

### 5. Start development servers

From the repo root, start everything at once:

```sh
pnpm dev
```

Or run apps individually:

```sh
# Web app only
pnpm dev --filter=web

# Worker only
pnpm dev --filter=worker
```

The web app will be available at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔐 Environment Variables

### `apps/web/.env`

```env
# ── Auth ──────────────────────────────────────────────────────────────────────
BETTER_AUTH_SECRET="your-random-secret-here"
BETTER_AUTH_URL=http://localhost:3000

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/zync?sslmode=require"

# ── Redis / Queue ─────────────────────────────────────────────────────────────
REDIS_HOST_URL="rediss://default:password@your-redis-host:6379"

# ── OAuth Providers ───────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# ── Notion OAuth ──────────────────────────────────────────────────────────────
NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"

# ── AI (OpenRouter) ───────────────────────────────────────────────────────────
OPENROUTER_API_KEY="sk-or-v1-..."
PRIMARY_MODEL="openai/gpt-4o-mini"
FALLBACK_MODEL="meta-llama/llama-3.3-70b-instruct:free"
```

### `apps/worker/.env`

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/zync?sslmode=require"

# ── Redis / Queue ─────────────────────────────────────────────────────────────
REDIS_HOST_URL="rediss://default:password@your-redis-host:6379"

# ── OAuth Providers (for re-authorization) ────────────────────────────────────
NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### `packages/prisma/.env`

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/zync?sslmode=require"
```

---

## 🧱 Database Schema (Overview)
| Model | Description |
|---|---|
| `User` | Authenticated user (via Google/GitHub) |
| `Workflows` | A user's automation workflow |
| `Trigger` | The event that starts a workflow (e.g., webhook) |
| `Action` | An ordered step in a workflow |
| `WorkflowRun` | A single execution instance of a workflow |
| `Credential` | Stored OAuth tokens for third-party services |
| `AvailableTriggers` | Registry of supported trigger types |
| `AvailableActions` | Registry of supported action types |

---

## 📜 Scripts

Run these from the **repo root**:

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all apps and packages |
| `pnpm format` | Format all TypeScript and Markdown files with Prettier |
| `pnpm check-types` | Type-check all packages |

---

## 🤝 Contributing

This is a side project, so there's no formal contribution process. but if you want to help out, Send yours PRs
