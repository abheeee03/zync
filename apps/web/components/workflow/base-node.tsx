import React, { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Calendar01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";

export type BaseNodeData = {
    label: string;
    kind: "trigger" | "action";
    icon?: IconSvgElement;
    metaData?: Record<string, unknown>;
} & Record<string, unknown>;

export type BaseWorkflowNode = Node<BaseNodeData, "workflow">;

export interface BaseNodeProps extends NodeProps<BaseWorkflowNode> {
    children?: React.ReactNode;
    className?: string;
}

export const BaseNode = memo(({
    data,
    isConnectable,
    selected,
    children,
    className,
}: BaseNodeProps) => {
    const isTrigger = data.kind === "trigger";
    const icon = data.icon ?? (isTrigger ? Calendar01Icon : FloppyDiskIcon);

    return (
        <div className={cn(
            "bg-background border-accent border-2 min-w-64 rounded-xl px-4 py-3 text-sm text-card-foreground transition-all duration-300",
            selected && "border-primary shadow-[0_0_25px_rgba(var(--primary),0.15)] ring-2 ring-primary/20 scale-[1.02]",
            className,
        )}>
            {!isTrigger && (
                <Handle
                    type="target"
                    position={Position.Left}
                    isConnectable={isConnectable}
                    className="!size-3 !border-2 !border-background !bg-primary"
                />
            )}
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        isTrigger ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted",
                    )}
                >
                    <HugeiconsIcon icon={icon} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider leading-none mb-1">
                        {isTrigger ? "Trigger" : "Action"}
                    </p>
                    <p className="truncate font-semibold text-foreground/90">{data.label}</p>
                </div>
            </div>

            {children}

            {data.metaData && Object.keys(data.metaData).length > 0 && (
                <div className="mt-3 pt-3 border-t border-accent/30 space-y-1">
                    {Object.entries(data.metaData).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                            <span className="font-medium uppercase tracking-tighter opacity-70">{key}</span>
                            <span className="truncate max-w-[120px] font-mono">{String(value) || "-"}</span>
                        </div>
                    ))}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!size-3 !border-2 !border-background !bg-primary"
            />
        </div>
    );
});

BaseNode.displayName = "BaseNode";
