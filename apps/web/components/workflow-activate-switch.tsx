"use client"

import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function WorkflowActivateSwitch() {
  const pathname = usePathname()
  const params = useParams()
  const workflowId = params?.id as string | undefined

  const isWorkflowPage = pathname?.includes("/workflow/") && !!workflowId

  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!isWorkflowPage || !workflowId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    axios
      .get(`/api/workflow/${workflowId}`)
      .then((res) => {
        setIsActive(res.data.isActive ?? false)
      })
      .catch(() => {
        setIsActive(false)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [workflowId, isWorkflowPage])

  if (!isWorkflowPage) return null

  const handleToggle = async (checked: boolean) => {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE || "active"
    if (checked && isDemo === "active") {
      setIsDialogOpen(true)
      return
    }

    setIsActive(checked)
    setIsSaving(true)
    try {
      await axios.patch(`/api/workflow/${workflowId}`, { isActive: checked })
    } catch {
      setIsActive(!checked)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-[18px] w-8 rounded-full bg-muted" />
        <div className="h-3 w-14 rounded bg-muted" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 select-none">
        <label
          htmlFor="workflow-activate-switch"
          className={cn(
            "text-xs font-semibold cursor-pointer transition-colors duration-200",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </label>
        <Switch
          id="workflow-activate-switch"
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          aria-label={isActive ? "Deactivate workflow" : "Activate workflow"}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="py-2">
              Workers are Down {":)"}
            </DialogTitle>
            <DialogDescription>
              This project is built as a side project and isn't hosted. But the project is completed and you can self host or watch demo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Okay
            </Button>
            <Button
              onClick={() => {
                window.open("https://github.com/abheeee03/zync", "_blank")
                setIsDialogOpen(false)
              }}
            >
              Self Host
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

