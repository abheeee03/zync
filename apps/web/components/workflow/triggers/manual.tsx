"use client"
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { useParams } from "next/navigation";
import axios from "axios";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function ManualTriggerNodeView(props: NodeProps<WorkflowNode>) {    
    const params = useParams<{ id: string }>();
    const workflowId = params.id;
    const [isLoading, setIsLoading] = useState(false);

    const handleRun = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!workflowId || isLoading) return;
        setIsLoading(true);
        try {
            await axios.post(`/api/workflow/${workflowId}/run`);
        } catch (error) {
            console.error("Failed to run workflow:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative group">
            <BaseNode {...props}>
                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-primary/80">
                        Manual trigger
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Run the connected flow directly from this node.
                    </p>
                </div>
            </BaseNode>
            <Button
                onClick={handleRun}
                disabled={isLoading}
                type="button"
                variant="accent"
                size="sm"
                className="mt-3 absolute w-full nodrag group-hover:opacity-100 transition-opacity duration-300 opacity-0"
            >
                {isLoading ? "Running..." : "Run"}
            </Button>
        </div>
    );
}

function ManualTriggerContents({ value }: NodeEditorProps) {
    const metaData = value;

    return (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground/90">No metadata required</p>
            <p className="mt-1 text-xs text-muted-foreground">
                The manual trigger starts workflows without extra configuration.
            </p>
            <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground/80">Current metadata</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap wrap-break-words">
                    {JSON.stringify(metaData, null, 2)}
                </pre>
            </div>
        </div>
    );
}

export const ManualTriggerNode = memo(ManualTriggerNodeView);
export { ManualTriggerContents };
