"use client";

import { memo, useState } from "react";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { GithubIcon } from "@/components/icons";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function GithubTriggerNodeView(props: NodeProps<WorkflowNode>) {
    const triggerName = props.data.label.toLowerCase();
    
    let label = "GitHub Event";
    if (triggerName.includes("push")) label = "GitHub Push";
    else if (triggerName.includes("pull_request")) label = "GitHub Pull Request";
    else if (triggerName.includes("issue_opened")) label = "GitHub Issue Opened";
    else if (triggerName.includes("release_published")) label = "GitHub Release Published";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-dashed border-zinc-500/40 bg-zinc-500/5 px-3 py-3">
                <div className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-zinc-900 dark:bg-zinc-800 text-white select-none">
                        <GithubIcon width={12} height={12} />
                    </span>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Runs on repository webhook events.
                </p>
            </div>
        </BaseNode>
    );
}

function GithubTriggerContents({ value, onChange }: NodeEditorProps) {
    const repository = typeof value.repository === "string" ? value.repository : "";
    const [copied, setCopied] = useState(false);

    // General GitHub webhook receiver URL
    const webhookUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/github/webhook`
        : "/api/github/webhook";

    const copyToClipboard = () => {
        void navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Repository</label>
                <Input
                    value={repository}
                    onChange={(e) => onChange({ ...value, repository: e.target.value })}
                    placeholder="owner/repo (e.g. facebook/react)"
                    className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                    Matches incoming webhook events by repository name (case-insensitive).
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook URL</label>
                <div className="flex gap-2">
                    <Input readOnly value={webhookUrl} className="flex-1 font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0">
                        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/15 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-primary" />
                    GitHub Webhook Setup
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-muted-foreground leading-normal">
                    <li>
                        Go to your GitHub repository <strong className="text-foreground">Settings</strong> &rarr; <strong className="text-foreground">Webhooks</strong> &rarr; <strong className="text-foreground">Add webhook</strong>.
                    </li>
                    <li>
                        Paste the Webhook URL above into the <strong className="text-foreground">Payload URL</strong>.
                    </li>
                    <li>
                        Set <strong className="text-foreground">Content type</strong> to <strong className="text-foreground">application/json</strong>.
                    </li>
                    <li>
                        Under "Which events would you like to trigger this webhook?", select:
                        <ul className="list-disc pl-4 space-y-1 mt-1">
                            <li>For <strong className="text-foreground">push</strong> trigger: Just the push event.</li>
                            <li>For <strong className="text-foreground">pull_request</strong> trigger: select "Let me select individual events" &rarr; check <strong className="text-foreground">Pull requests</strong>.</li>
                            <li>For <strong className="text-foreground">issue_opened</strong> trigger: check <strong className="text-foreground">Issues</strong>.</li>
                            <li>For <strong className="text-foreground">release_published</strong> trigger: check <strong className="text-foreground">Releases</strong>.</li>
                        </ul>
                    </li>
                    <li>
                        Click <strong className="text-foreground">Add webhook</strong> to save.
                    </li>
                </ol>
            </div>
        </div>
    );
}

export const GithubTriggerNode = memo(GithubTriggerNodeView);
export { GithubTriggerContents };
