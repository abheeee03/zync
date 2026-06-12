"use client"
import { memo } from "react";
import { Input } from "@/components/ui/input";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

const PRESETS = [
    { label: "10s", cron: "*/10 * * * * *" },
    { label: "30s", cron: "*/30 * * * * *" },
    { label: "5m", cron: "*/5 * * * *" },
    { label: "10m", cron: "*/10 * * * *" },
    { label: "1h", cron: "0 * * * *" },
    { label: "4h", cron: "0 */4 * * *" },
];

function ScheduleTriggerNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const cron = typeof metaData.cron === "string" ? metaData.cron : "";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary/80">
                    Schedule trigger
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {cron || "No schedule set"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Automatically runs the workflow based on the schedule.
                </p>
            </div>
        </BaseNode>
    );
}

function ScheduleTriggerContents({ value, onChange }: NodeEditorProps) {
    const cron = typeof value.cron === "string" ? value.cron : "";

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 rounded-xl text-xs font-semibold transition-all",
                                cron === preset.cron && "border-primary bg-primary/5 text-primary"
                            )}
                            onClick={() => onChange({ ...value, cron: preset.cron })}
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cron Expression</label>
                <Input
                    value={cron}
                    placeholder="e.g. 0 * * * * (every hour)"
                    onChange={(event) =>
                        onChange({
                            ...value,
                            cron: event.target.value,
                        })
                    }
                />
                <p className="text-[11px] text-muted-foreground">
                    Use standard cron syntax (e.g., * * * * * for every minute).
                </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground/90">Current metadata</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap wrap-break-words text-xs text-muted-foreground">
                    {JSON.stringify(value, null, 2)}
                </pre>
            </div>
        </div>
    );
}

export const ScheduleTriggerNode = memo(ScheduleTriggerNodeView);
export { ScheduleTriggerContents };
