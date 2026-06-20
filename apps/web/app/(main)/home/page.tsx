"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import WorkflowGrid from "@/components/workflow-grid"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, SparklesIcon, AlertCircleIcon, ArrowUp02Icon } from "@hugeicons/core-free-icons"
import Loader from "@/components/loader"
import axios from "axios"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

type AgentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; isOutOfScope?: boolean; reason?: string }

const messages = [
  "let's save you some time, shall we?",
  "got an idea? let's make it real.",
  "tell me the dream. i'll build the system.",
  "what problem are we solving today?",
  "got a wild idea? i'm listening.",
  "say the word. let's automate it.",
  "let me cook.",
  "what should run on autopilot next?"
]

export default function Home() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [agentState, setAgentState] = useState<AgentState>({ status: "idle" })
  const [isFocused, setIsFocused] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.get("/api/workflows")
        setWorkflows(response.data)
      } catch (error) {
        console.error("Failed to fetch workflows", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
    setWelcomeMessage(messages[Math.floor(Math.random() * messages.length)])
  }, [])

  const handleAgentSubmit = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) return

    setAgentState({ status: "loading" })

    try {
      const response = await axios.post("/api/agent", { prompt: trimmed })
      const { workflowId } = response.data

      if (workflowId) {
        router.push(`/workflow/${workflowId}`)
      } else {
        setAgentState({
          status: "error",
          message: "This workflow can't be created. Contact support for more.",
          isOutOfScope: true,
        })
      }
    } catch (error: any) {
      const isOutOfScope = error?.response?.data?.code === "OUT_OF_SCOPE"
      const reason = error?.response?.data?.reason
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong. Please try again."
      setAgentState({ status: "error", message, isOutOfScope, reason })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAgentSubmit()
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  const isDialogOpen =
    agentState.status === "loading" || agentState.status === "error"

  // Button is always visible, embedded in input container

  return (
    <div className="min-h-screen w-full">
      <div className="h-full w-full px-4 sm:px-6">
        <div className="h-1/2 w-full flex flex-col items-center justify-center gap-8 sm:gap-10">
          <div className="h-8 flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              {welcomeMessage && (
                <motion.h1
                  key={welcomeMessage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="text-lg sm:text-2xl text-center"
                >
                  {welcomeMessage}
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
          <div className="w-full max-w-xl px-2">
            <motion.div
              layout
              className="bg-sidebar shadow-xl border-t rounded-xl px-2 py-2 flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 min-w-0 border-none active:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input bg-transparent!"
                placeholder="create a github issue to notion workflow."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={agentState.status === "loading"}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAgentSubmit}
                disabled={agentState.status === "loading" || !prompt.trim()}
                className={
                  cn(
                    "shrink-0 shadow-sm border-t rounded-xl p-1 transition-all duration-150",
                    prompt.length !== 0
                      ? "cursor-pointer rounded-lg bg-linear-to-b from-blue-500 to-blue-700 font-medium text-white ring-1 ring-white/20 ring-offset-1 ring-offset-blue-500 ring-inset"
                      : "cursor-not-allowed opacity-40"
                  )
                }
              >
                <HugeiconsIcon icon={ArrowUp02Icon} />
              </motion.button>
            </motion.div>
          </div>
        </div>
        <WorkflowGrid workflows={workflows} />
      </div>
      <Dialog
        open={isDialogOpen}
        onOpenChange={() => {
          if (agentState.status === "error") {
            setAgentState({ status: "idle" })
          }
        }}
      >
        <DialogContent
          showCloseButton={agentState.status === "error"}
          onInteractOutside={(e) => {
            if (agentState.status === "loading") e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (agentState.status === "loading") e.preventDefault()
          }}
          className="max-w-sm"
        >
          {agentState.status === "loading" && (
            <>
              <div className="flex items-center justify-center py-6">
                <Loader
                  messages={[
                    "cooking up some automation sauce",
                    "connecting all the shiny things",
                    "speedrunning your automation",
                    "making APIs talk it out",
                    "letting the AI cook",
                    "almost done trust the process",
                    "one sec, the AI is yapping",
                    "compiling pure automation aura",
                    "making magic behind the scenes",
                    "crafting a workflow masterpiece",
                  ]}
                />
              </div>
              <DialogDescription className="text-center text-xs">
                agent is still in beta so it can make mistakes.
              </DialogDescription>
            </>
          )}

          {agentState.status === "error" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center flex items-center justify-center gap-2">
                  {agentState.isOutOfScope ? "Workflow Out of Scope" : "Something went wrong"}
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground mt-1 flex flex-col gap-2">
                  This workflow cant be created.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center gap-2 pt-2">
                {agentState.isOutOfScope ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setAgentState({ status: "idle" })}
                      className="cursor-pointer"
                    >
                      Try another search
                    </Button>
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm cursor-pointer"
                    >
                      <Link href={`https://zync.abhee.dev/help`}>
                        Contact Support
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setAgentState({ status: "idle" })}
                  >
                    Try again
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
