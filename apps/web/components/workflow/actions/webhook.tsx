import { memo } from "react";
import { Input } from "@/components/ui/input";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function WebhookActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const url = typeof metaData.url === "string" ? metaData.url : "";
    const method = typeof metaData.method === "string" ? metaData.method : "POST";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Webhook action
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {method} {url || "No URL set"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Sends the workflow payload to an external endpoint.
                </p>
            </div>
        </BaseNode>
    );
}

function WebhookActionContents({ value, onChange }: NodeEditorProps) {
    const metaData = value;
    const url = typeof metaData.url === "string" ? metaData.url : "";
    const method = typeof metaData.method === "string" ? metaData.method : "POST";
    const body = typeof metaData.body === "string" ? metaData.body : "";

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Webhook URL</label>
                <Input
                    value={url}
                    type="url"
                    placeholder="https://test.com/webhook"
                    onChange={(event) =>
                        onChange({
                            ...metaData,
                            url: event.target.value,
                        })
                    }
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Method</label>
                <Input
                    value={method}
                    type="text"
                    placeholder="POST"
                    onChange={(event) =>
                        onChange({
                            ...metaData,
                            method: event.target.value.toUpperCase(),
                        })
                    }
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Body</label>
                <textarea
                    value={body}
                    placeholder='{"hello":"world"}'
                    onChange={(event) =>
                        onChange({
                            ...metaData,
                            body: event.target.value,
                        })
                    }
                    className="min-h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
            </div>
        </div>
    );
}

export const WebhookActionNode = memo(WebhookActionNodeView);
export { WebhookActionContents };
