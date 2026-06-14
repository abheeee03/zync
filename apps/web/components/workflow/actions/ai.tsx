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
import { VariableSuggestions, type VariableInfo } from "../variable-suggestions";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
    variables?: VariableInfo[];
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

function AiActionContents({ value, onChange, variables }: NodeEditorProps) {
    const provider = typeof value.provider === "string" ? value.provider : "gemini";
    const model = typeof value.model === "string" ? value.model : "gemini-1.5-flash";
    const prompt = typeof value.prompt === "string" ? value.prompt : "";

    const [status, setStatus] = useState<{ connected: boolean; workspaceName?: string | null } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [apiKey, setApiKey] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoadingStatus(true);
            try {
                const res = await axios.get(`/api/llm/${provider}`);
                setStatus(res.data);
            } catch (err) {
                console.error(err);
                setStatus({ connected: false });
            } finally {
                setLoadingStatus(false);
            }
        };
        void fetchStatus();
    }, [provider]);

    const handleConnect = async () => {
        if (!apiKey.trim()) return;
        setIsConnecting(true);
        try {
            await axios.post(`/api/llm/${provider}`, { apiKey });
            setStatus({ connected: true, workspaceName: provider === "gemini" ? "Gemini API" : provider === "chatgpt" ? "OpenAI API" : "Anthropic API" });
            setApiKey("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await axios.delete(`/api/llm/${provider}`);
            setStatus({ connected: false });
        } catch (err) {
            console.error(err);
        }
    };

    const handleProviderChange = (newProvider: string) => {
        let defaultModel = "gemini-1.5-flash";
        if (newProvider === "chatgpt") {
            defaultModel = "gpt-4o";
        } else if (newProvider === "claude") {
            defaultModel = "claude-3-5-sonnet";
        }
        onChange({
            ...value,
            provider: newProvider,
            model: defaultModel,
        });
    };

    const renderModelOptions = () => {
        if (provider === "chatgpt") {
            return (
                <>
                    <option value="gpt-4o">GPT-4o (Recommended)</option>
                    <option value="gpt-4o-mini">GPT-4o mini</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </>
            );
        }
        if (provider === "claude") {
            return (
                <>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                </>
            );
        }
        return (
            <>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </>
        );
    };

    const getProviderLabel = () => {
        if (provider === "chatgpt") return "ChatGPT (OpenAI)";
        if (provider === "claude") return "Claude (Anthropic)";
        return "Gemini";
    };

    const getApiKeyPlaceholder = () => {
        if (provider === "chatgpt") return "sk-...";
        if (provider === "claude") return "sk-ant-...";
        return "AIzaSy...";
    };

    return (
        <div className="space-y-6">
            <VariableSuggestions variables={variables ?? []} />

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Provider</label>
                <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    <option value="gemini">Gemini</option>
                    <option value="chatgpt">ChatGPT (OpenAI)</option>
                    <option value="claude">Claude (Anthropic)</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
                <select
                    value={model}
                    onChange={(e) => onChange({ ...value, model: e.target.value })}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    {renderModelOptions()}
                </select>
            </div>

            {loadingStatus ? (
                <div className="flex justify-center py-6">
                    <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={24} />
                </div>
            ) : !status?.connected ? (
                <div className="space-y-4 rounded-xl border border-dashed border-border/70 p-4">
                    <p className="text-xs text-muted-foreground">
                        Your {getProviderLabel()} API key is not connected. Connect it below to execute this action:
                    </p>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder={getApiKeyPlaceholder()}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <Button onClick={handleConnect} disabled={isConnecting} className="w-full h-9 text-xs">
                            {isConnecting ? "Connecting..." : `Connect ${getProviderLabel()} Key`}
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
                                {getProviderLabel()} Connected
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
                            placeholder={`Describe what ${getProviderLabel()} should do. You can use dynamic variables...`}
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
