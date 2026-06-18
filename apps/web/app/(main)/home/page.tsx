"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import WorkflowGrid from "@/components/workflow-grid"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, SparklesIcon, AlertCircleIcon } from "@hugeicons/core-free-icons"
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

type AgentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }

export default function Home() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [agentState, setAgentState] = useState<AgentState>({ status: "idle" })
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
          message: "Agent did not return a workflow. Please try again.",
        })
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong. Please try again."
      setAgentState({ status: "error", message })
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

  return (
    <div className="">
      <div className="h-full w-full px-6">
        <div className="flex w-full items-center justify-between">
          <h1>Workflows</h1>
          <Button variant={"accent"} asChild>
            <Link
              className="flex gap-2 items-center justify-center"
              href={"/workflow"}
            >
              New Workflow
              <HugeiconsIcon icon={PlusSignIcon} />
            </Link>
          </Button>
        </div>

        <div className="h-1/2 w-full flex flex-col items-center justify-center gap-10">
          <h1 className="text-2xl">What's in your mind abhee?</h1>
          <div className="flex items-center justify-center gap-4">
            <Input
              ref={inputRef}
              className="w-3xl"
              placeholder="create a github issue to notion workflow."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={agentState.status === "loading"}
            />
            <Button
              onClick={handleAgentSubmit}
              disabled={agentState.status === "loading" || !prompt.trim()}
              className="flex gap-2 items-center"
            >
              <HugeiconsIcon icon={SparklesIcon} size={16} />
              Generate
            </Button>
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
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    size={18}
                    className="text-destructive"
                  />
                  Something went wrong
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground mt-1">
                  {agentState.message}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAgentState({ status: "idle" })}
                >
                  Try again
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
