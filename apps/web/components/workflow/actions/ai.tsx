"use client";

import { memo, useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Loading03Icon,
    Tick02Icon,
    AiBrain01Icon,
} from "@hugeicons/core-free-icons";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function AiActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const provider = typeof metaData.provider === "string" ? metaData.provider : "gemini";
    const model = typeof metaData.model === "string" ? metaData.model : "gemini-1.5-flash";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded bg-gradient-to-tr from-blue-600 to-indigo-400 text-white font-bold text-xs select-none">
                        <HugeiconsIcon icon={AiBrain01Icon} size={12} />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            AI Action
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground capitalize">
                            {provider} • {model}
                        </p>
                    </div>
                </div>
            </div>
        </BaseNode>
    );
}

function AiActionContents({ value, onChange }: NodeEditorProps) {
    const provider = typeof value.provider === "string" ? value.provider : "gemini";
    const model = typeof value.model === "string" ? value.model : "gemini-1.5-flash";
    const prompt = typeof value.prompt === "string" ? value.prompt : "";

    const [status, setStatus] = useState<{ connected: boolean } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [apiKey, setApiKey] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get("/api/gemini/status");
                setStatus(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingStatus(false);
            }
        };
        void fetchStatus();
    }, []);

    const handleConnect = async () => {
        if (!apiKey.trim()) return;
        setIsConnecting(true);
        try {
            await axios.post("/api/gemini/connect", { apiKey });
            setStatus({ connected: true });
            setApiKey("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await axios.delete("/api/gemini/status");
            setStatus({ connected: false });
        } catch (err) {
            console.error(err);
        }
    };

    if (loadingStatus) {
        return (
            <div className="flex justify-center py-6">
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Provider</label>
                <select
                    value={provider}
                    onChange={(e) => onChange({ ...value, provider: e.target.value })}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    <option value="gemini">Gemini</option>
                    <option value="chatgpt" disabled>ChatGPT (Coming soon)</option>
                    <option value="claude" disabled>Claude (Coming soon)</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
                <select
                    value={model}
                    onChange={(e) => onChange({ ...value, model: e.target.value })}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                </select>
            </div>

            {!status?.connected ? (
                <div className="space-y-4 rounded-xl border border-dashed border-border/70 p-4">
                    <p className="text-xs text-muted-foreground">
                        Your Gemini API key is not connected. Connect it below to execute this action:
                    </p>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <Button onClick={handleConnect} disabled={isConnecting} className="w-full h-9 text-xs">
                            {isConnecting ? "Connecting..." : "Connect API Key"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <HugeiconsIcon icon={Tick02Icon} size={10} />
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                                Gemini Connected
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-xs text-destructive hover:bg-destructive/10">
                            Disconnect
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
                            className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                            placeholder="Describe what Gemini should do. You can use dynamic fields inside here..."
                        />
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1.5">
                            <p className="font-semibold text-foreground">💡 Variable Output</p>
                            <p>
                                The result from the LLM is captured in the <code className="font-mono text-primary font-semibold">{`{data.message}`}</code> field.
                            </p>
                            <p>
                                You can catch this field in subsequent action nodes (e.g. paste <code className="font-mono text-primary font-semibold">{`{data.message}`}</code> in a Webhook Body or Notion Property).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export const AiActionNode = memo(AiActionNodeView);
export { AiActionContents };
