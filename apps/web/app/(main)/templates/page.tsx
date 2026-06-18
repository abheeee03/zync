"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Download04Icon,
  Tick02Icon,
  Loading03Icon,
  AlertCircleIcon,
  WebhookIcon,
  Time04Icon,
  AiBrain01Icon,
  GitCompareIcon,
} from "@hugeicons/core-free-icons"
import { GithubIcon, NotionIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type TemplateStep =
  | { type: "trigger"; label: string; icon: React.ReactNode; color: string }
  | { type: "action"; label: string; icon: React.ReactNode; color: string }

type Template = {
  id: string
  name: string
  description: string
  category: string
  steps: TemplateStep[]
  triggerName: string
  actionNames: string[]
}

const ICON_SIZE = 16

const templates: Template[] = [
  {
    id: "github-issue-to-notion",
    name: "GitHub Issue → Notion",
    description:
      "Automatically log every new GitHub issue into a Notion database. Keep your project tracking in sync without manual copy-pasting.",
    category: "Project Management",
    triggerName: "issue_opened",
    actionNames: ["notion"],
    steps: [
      {
        type: "trigger",
        label: "GitHub Issue Opened",
        icon: <GithubIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300",
      },
      {
        type: "action",
        label: "Create Notion Page",
        icon: <NotionIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-stone-500/20 to-stone-600/20 border-stone-500/30 text-stone-300",
      },
    ],
  },
  {
    id: "webhook-ai-notion",
    name: "Webhook → AI Summary → Notion",
    description:
      "Receive data via webhook, pass it through an AI model for a smart summary, then save the result to Notion automatically.",
    category: "AI Automation",
    triggerName: "webhook",
    actionNames: ["ai", "notion"],
    steps: [
      {
        type: "trigger",
        label: "Incoming Webhook",
        icon: <HugeiconsIcon icon={WebhookIcon} size={ICON_SIZE} />,
        color: "from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-300",
      },
      {
        type: "action",
        label: "AI Processing",
        icon: <HugeiconsIcon icon={AiBrain01Icon} size={ICON_SIZE} />,
        color: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300",
      },
      {
        type: "action",
        label: "Save to Notion",
        icon: <NotionIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-stone-500/20 to-stone-600/20 border-stone-500/30 text-stone-300",
      },
    ],
  },
  {
    id: "schedule-github-report",
    name: "Daily GitHub Digest",
    description:
      "Run on a schedule to fetch your GitHub repo info and send a summary to a webhook endpoint — perfect for daily Slack digests.",
    category: "Reporting",
    triggerName: "schedule",
    actionNames: ["github", "webhook"],
    steps: [
      {
        type: "trigger",
        label: "Scheduled Trigger",
        icon: <HugeiconsIcon icon={Time04Icon} size={ICON_SIZE} />,
        color: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-300",
      },
      {
        type: "action",
        label: "Fetch GitHub Repo",
        icon: <GithubIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300",
      },
      {
        type: "action",
        label: "Send via Webhook",
        icon: <HugeiconsIcon icon={WebhookIcon} size={ICON_SIZE} />,
        color: "from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-300",
      },
    ],
  },
  {
    id: "github-pr-ai-review",
    name: "PR Opened → AI Review Comment",
    description:
      "When a pull request is opened on GitHub, use AI to draft a review comment and post it back to the PR automatically.",
    category: "Developer Tools",
    triggerName: "pull_request",
    actionNames: ["ai", "github"],
    steps: [
      {
        type: "trigger",
        label: "Pull Request Opened",
        icon: <GithubIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300",
      },
      {
        type: "action",
        label: "AI Review Draft",
        icon: <HugeiconsIcon icon={AiBrain01Icon} size={ICON_SIZE} />,
        color: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300",
      },
      {
        type: "action",
        label: "Post GitHub Comment",
        icon: <GithubIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300",
      },
    ],
  },
  {
    id: "webhook-transform-notion",
    name: "Webhook → Transform → Notion",
    description:
      "Receive a raw webhook payload, transform or reshape the data fields, then push the cleaned result to Notion — no code required.",
    category: "Data Pipeline",
    triggerName: "webhook",
    actionNames: ["transform", "notion"],
    steps: [
      {
        type: "trigger",
        label: "Incoming Webhook",
        icon: <HugeiconsIcon icon={WebhookIcon} size={ICON_SIZE} />,
        color: "from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-300",
      },
      {
        type: "action",
        label: "Transform Data",
        icon: <HugeiconsIcon icon={GitCompareIcon} size={ICON_SIZE} />,
        color: "from-teal-500/20 to-teal-600/20 border-teal-500/30 text-teal-300",
      },
      {
        type: "action",
        label: "Save to Notion",
        icon: <NotionIcon width={ICON_SIZE} height={ICON_SIZE} />,
        color: "from-stone-500/20 to-stone-600/20 border-stone-500/30 text-stone-300",
      },
    ],
  },
]

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string }

function TemplateCard({ template }: { template: Template }) {
  const router = useRouter()
  const [importState, setImportState] = useState<ImportState>({ status: "idle" })

  const handleImport = async () => {
    if (importState.status === "loading") return
    setImportState({ status: "loading" })

    try {
      const res = await axios.post("/api/templates/import", {
        name: template.name,
        triggerName: template.triggerName,
        actionNames: template.actionNames,
      })
      setImportState({ status: "success" })
      setTimeout(() => {
        router.push(`/workflow/${res.data.workflowId}`)
      }, 600)
    } catch (err: any) {
      const message =
        err?.response?.data?.error ?? err?.message ?? "Failed to import template"
      setImportState({ status: "error", message })
      setTimeout(() => setImportState({ status: "idle" }), 3000)
    }
  }

  const isLoading = importState.status === "loading"
  const isSuccess = importState.status === "success"
  const isError = importState.status === "error"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "border-t border-secondary/90 rounded-xl shadow-sm px-5 py-6",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      )}
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {template.name}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {template.description}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-1.5 flex-wrap">
        {template.steps.map((step, idx) => (
          <Button key={idx} variant={"ghost"} className="">
            {step.icon}
          </Button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleImport}
        disabled={isLoading || isSuccess}
        className={cn(
          "relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
          "border border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary",
          isSuccess && "bg-primary text-primary-foreground border-primary",
          isError && "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50",
          (isLoading || isSuccess) && "cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
              Importing…
            </motion.span>
          )}
          {isSuccess && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Tick02Icon} size={15} />
              Redirecting…
            </motion.span>
          )}
          {isError && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={AlertCircleIcon} size={15} />
              {(importState as { status: "error"; message: string }).message.slice(0, 40)}
            </motion.span>
          )}
          {importState.status === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Download04Icon} size={15} />
              Use Template
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

export default function TemplatesPage() {
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? templates.filter((t) => {
      const q = query.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
    : templates

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar">
      <div className="px-6 max-w-6xl">
        <div className="mb-8 flex items-center justify-center gap-4">
          <Input
            placeholder="Search templates…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground"
            >
              <p className="text-sm">No templates match &ldquo;{query}&rdquo;</p>
              <button
                onClick={() => setQuery("")}
                className="text-xs underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Clear search
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.06 },
                },
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}