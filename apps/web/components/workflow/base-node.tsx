import type { ReactNode } from 'react';
import type { WorkflowNode } from './types';
import { cn } from '@/lib/utils';
import { Calendar01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Handle, NodeProps, Position } from '@xyflow/react';

type BaseNodeProps = NodeProps<WorkflowNode> & {
    children?: ReactNode;
};

function BaseNode({ data, isConnectable, selected, children }: BaseNodeProps) {
    const isTrigger = data.kind === "trigger";

    return (
        <div
            className={cn(
                "group workflow-node-card min-w-[240px] rounded-xl border-2 border-accent bg-background px-4 py-3 text-sm text-card-foreground shadow-sm transition-all duration-200",
                selected && "border-primary shadow-[0_0_20px_rgba(var(--primary),0.12)] ring-2 ring-primary/20 scale-[1.02]",
            )}
        >
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
                        isTrigger ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                >
                    <HugeiconsIcon icon={isTrigger ? Calendar01Icon : Globe02Icon} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider leading-none text-muted-foreground">
                        {isTrigger ? "Trigger" : "Action"}
                    </p>
                    <p className="truncate font-semibold text-foreground/90">{data.label}</p>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {children ?? (
                    <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                        {isTrigger
                            ? "Open the drawer to configure trigger metadata."
                            : "Open the drawer to configure action metadata."}
                    </p>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!size-3 !border-2 !border-background !bg-primary"
            />
        </div>
    );
}

export default BaseNode
