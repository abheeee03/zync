"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Json } from "@repo/shared/types"
import { Handle, NodeProps, Position } from "@xyflow/react"

export type WorkflowNodeCardData = {
  kind: "trigger" | "action"
  label: string
  metaData: Json
}

const getMetaSummary = (metaData: Json) => {
  if (!metaData) {
    return "No metadata"
  }
  if (Array.isArray(metaData)) {
    return `${metaData.length} items`
  }
  if (typeof metaData === "object") {
    return `${Object.keys(metaData as Record<string, unknown>).length} fields`
  }
  return "Metadata set"
}

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNodeCardData>) {
  return (
    <Card
      size="sm"
      className={cn(
        "relative min-w-55 border-2 transition",
        selected ? "border-primary shadow-sm" : "border-border"
      )}
    >
      {data.kind === "action" ? (
        <Handle type="target" position={Position.Left} className="bg-primary!" />
      ) : null}
      <Handle type="source" position={Position.Right} className="bg-primary!" />
      <CardHeader className="pb-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {data.kind === "trigger" ? "Trigger" : "Action"}
        </div>
        <CardTitle className="text-sm">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {getMetaSummary(data.metaData)}
      </CardContent>
    </Card>
  )
}
