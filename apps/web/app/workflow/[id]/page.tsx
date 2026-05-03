"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import axios from "axios"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AvailableActions, AvailableTriggers, Json } from "@repo/shared/types"

type SelectedTrigger = {
  triggerId: string
  name: string
  metaData: Json
}

type SelectedAction = {
  localId: string
  actionId: string
  name: string
  metaData: Json
}

type DialogTarget =
  | { kind: "trigger"; triggerId: string; name: string }
  | { kind: "action"; actionId: string; name: string; localId: string }

type WorkflowTriggerResponse = {
  id: string
  triggerId: string
  name: string
  metaData?: Json
}

type WorkflowActionResponse = {
  id: string
  actionId: string
  name: string
  metaData?: Json
  order?: number
}

const formatMetaData = (metaData: Json | null | undefined) => {
  try {
    return JSON.stringify(metaData ?? {}, null, 2)
  } catch {
    return "{}"
  }
}

const parseMetaData = (raw: string) => {
  if (!raw.trim()) {
    return {}
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const createLocalId = () => {
  return `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function Workflow() {
  const params = useParams()
  const workflowId = typeof params?.id === "string" ? params.id : ""

  const [availableTriggers, setAvailableTriggers] = useState<
    AvailableTriggers[]
  >([])
  const [availableActions, setAvailableActions] = useState<AvailableActions[]>(
    []
  )
  const [selectedTrigger, setSelectedTrigger] = useState<SelectedTrigger | null>(
    null
  )
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([])
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null)
  const [dialogMetaRaw, setDialogMetaRaw] = useState("{}")
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    if (!workflowId) {
      return
    }
    try {
      setPageError(null)
      const [availableResponse, workflowResponse] = await Promise.all([
        axios.get("/api/workflow"),
        axios.get(`/api/workflow/${workflowId}`),
      ])

      setAvailableTriggers(availableResponse.data?.triggers ?? [])
      setAvailableActions(availableResponse.data?.actions ?? [])

      const workflowData = workflowResponse.data as {
        trigger?: WorkflowTriggerResponse | null
        actions?: WorkflowActionResponse[]
      }
      if (workflowData?.trigger) {
        setSelectedTrigger({
          triggerId: workflowData.trigger.triggerId,
          name: workflowData.trigger.name,
          metaData: workflowData.trigger.metaData ?? {},
        })
      } else {
        setSelectedTrigger(null)
      }

      if (Array.isArray(workflowData?.actions)) {
        setSelectedActions(
          workflowData.actions.map((action) => ({
            localId: action.id ?? createLocalId(),
            actionId: action.actionId,
            name: action.name,
            metaData: action.metaData ?? {},
          }))
        )
      } else {
        setSelectedActions([])
      }
    } catch (error) {
      setPageError("Failed to load workflow data.")
    }
  }

  useEffect(() => {
    void loadData()
  }, [workflowId])

  const resetDialog = () => {
    setDialogTarget(null)
    setDialogMetaRaw("{}")
    setDialogError(null)
  }

  const openTriggerDialog = (trigger: AvailableTriggers) => {
    const currentMeta =
      selectedTrigger?.triggerId === trigger.id
        ? selectedTrigger.metaData
        : {}
    setDialogTarget({ kind: "trigger", triggerId: trigger.id, name: trigger.name })
    setDialogMetaRaw(formatMetaData(currentMeta))
    setDialogError(null)
  }

  const openEditTriggerDialog = () => {
    if (!selectedTrigger) {
      return
    }
    setDialogTarget({
      kind: "trigger",
      triggerId: selectedTrigger.triggerId,
      name: selectedTrigger.name,
    })
    setDialogMetaRaw(formatMetaData(selectedTrigger.metaData))
    setDialogError(null)
  }

  const openActionDialog = (action: AvailableActions) => {
    setDialogTarget({
      kind: "action",
      actionId: action.id,
      name: action.name,
      localId: createLocalId(),
    })
    setDialogMetaRaw("{}")
    setDialogError(null)
  }

  const openEditActionDialog = (action: SelectedAction) => {
    setDialogTarget({
      kind: "action",
      actionId: action.actionId,
      name: action.name,
      localId: action.localId,
    })
    setDialogMetaRaw(formatMetaData(action.metaData))
    setDialogError(null)
  }

  const handleDialogSave = () => {
    if (!dialogTarget) {
      return
    }
    const metaData = parseMetaData(dialogMetaRaw)
    if (metaData === null) {
      setDialogError("Metadata must be valid JSON.")
      return
    }
    if (dialogTarget.kind === "trigger") {
      setSelectedTrigger({
        triggerId: dialogTarget.triggerId,
        name: dialogTarget.name,
        metaData,
      })
    } else {
      setSelectedActions((prev) => {
        const existingIndex = prev.findIndex(
          (action) => action.localId === dialogTarget.localId
        )
        if (existingIndex === -1) {
          return [
            ...prev,
            {
              localId: dialogTarget.localId,
              actionId: dialogTarget.actionId,
              name: dialogTarget.name,
              metaData,
            },
          ]
        }
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          metaData,
        }
        return updated
      })
    }
    resetDialog()
  }

  const removeTrigger = () => {
    setSelectedTrigger(null)
  }

  const removeAction = (localId: string) => {
    setSelectedActions((prev) =>
      prev.filter((action) => action.localId !== localId)
    )
  }

  const saveWorkflow = async () => {
    if (!workflowId) {
      return
    }
    setIsSaving(true)
    setPageError(null)
    try {
      await axios.post(`/api/workflow/${workflowId}`, {
        trigger: selectedTrigger
          ? {
              triggerId: selectedTrigger.triggerId,
              metaData: selectedTrigger.metaData,
            }
          : null,
        actions: selectedActions.map((action, index) => ({
          actionId: action.actionId,
          metaData: action.metaData,
          order: index,
        })),
      })
    } catch (error) {
      setPageError("Failed to save workflow.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full gap-6 px-6 py-6 lg:grid lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-lg font-medium">Triggers</h1>
          <div className="mt-3 flex flex-col gap-3">
            {availableTriggers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No triggers found.</p>
            ) : (
              availableTriggers.map((trigger) => (
                <Card key={trigger.id}>
                  <CardContent className="p-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => openTriggerDialog(trigger)}
                    >
                      {trigger.name}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        <div>
          <h1 className="text-lg font-medium">Actions</h1>
          <div className="mt-3 flex flex-col gap-3">
            {availableActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions found.</p>
            ) : (
              availableActions.map((action) => (
                <Card key={action.id}>
                  <CardContent className="p-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => openActionDialog(action)}
                    >
                      {action.name}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">Workflow</h1>
          <Button onClick={saveWorkflow} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        {pageError ? (
          <p className="text-sm text-destructive">{pageError}</p>
        ) : null}

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>Trigger</CardTitle>
              {selectedTrigger ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={openEditTriggerDialog}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={removeTrigger}>
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
            {selectedTrigger ? (
              <div>
                <p className="font-medium">{selectedTrigger.name}</p>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">
                  {formatMetaData(selectedTrigger.metaData)}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No trigger selected.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>Actions</CardTitle>
              <span className="text-xs text-muted-foreground">
                {selectedActions.length} selected
              </span>
            </div>
            {selectedActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No actions selected.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedActions.map((action) => (
                  <div
                    key={action.localId}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{action.name}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditActionDialog(action)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAction(action.localId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">
                      {formatMetaData(action.metaData)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTarget?.kind === "trigger"
                ? "Configure trigger"
                : "Configure action"}
            </DialogTitle>
            <DialogDescription>
              {dialogTarget?.name
                ? `Add metadata for ${dialogTarget.name}.`
                : "Add metadata for this step."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Metadata (JSON)</label>
            <textarea
              className="min-h-35 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={dialogMetaRaw}
              onChange={(event) => setDialogMetaRaw(event.target.value)}
              placeholder='{"key": "value"}'
            />
            {dialogError ? (
              <p className="text-sm text-destructive">{dialogError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button onClick={handleDialogSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Workflow