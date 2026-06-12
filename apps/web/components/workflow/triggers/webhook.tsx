"use client"
import { memo } from "react";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function WebhookTriggerNodeView(props: NodeProps<WorkflowNode>) {
    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary/80">
                    Webhook trigger
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Workflow runs when the webhook URL is hit.
                </p>
            </div>
        </BaseNode>
    );
}

function WebhookTriggerContents({ value }: NodeEditorProps) {
    const params = useParams<{ id: string }>();
    const workflowId = params.id;
    const { data: session } = authClient.useSession();
    const userId = session?.user?.id;
    const [copied, setCopied] = useState(false);

    const webhookUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/hook/${userId}/${workflowId}`
        : `/hook/${userId}/${workflowId}`;

    const copyToClipboard = () => {
        void navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Webhook URL</label>
                <div className="flex gap-2">
                    <Input readOnly value={webhookUrl} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Send a POST request to this URL to trigger the workflow.
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

export const WebhookTriggerNode = memo(WebhookTriggerNodeView);
export { WebhookTriggerContents };
