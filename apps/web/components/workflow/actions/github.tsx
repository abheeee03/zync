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
    GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { VariableSuggestions, type VariableInfo } from "../variable-suggestions";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
    variables?: VariableInfo[];
};

function GithubActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const actionType = typeof metaData.actionType === "string" ? metaData.actionType : "create_issue";
    const repo = typeof metaData.repo === "string" ? metaData.repo : "";

    const typeLabels: Record<string, string> = {
        create_issue: "Create Issue",
        create_comment: "Create Comment",
        create_pr: "Create Pull Request",
        create_branch: "Create Branch",
        get_repo: "Get Repository Details",
    };

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded bg-zinc-900 text-white dark:bg-zinc-800 dark:border dark:border-zinc-700 font-bold text-xs select-none">
                        Git
                    </div>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            GitHub Action
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                            {typeLabels[actionType] || actionType}
                        </p>
                    </div>
                </div>
                {repo && (
                    <p className="mt-2 text-[10px] text-muted-foreground truncate font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                        {repo}
                    </p>
                )}
            </div>
        </BaseNode>
    );
}

function GithubActionContents({ value, onChange, variables }: NodeEditorProps) {
    const actionType = typeof value.actionType === "string" ? value.actionType : "create_issue";
    const repo = typeof value.repo === "string" ? value.repo : "";
    const title = typeof value.title === "string" ? value.title : "";
    const body = typeof value.body === "string" ? value.body : "";
    const issueNumber = typeof value.issueNumber === "string" ? value.issueNumber : "";
    const head = typeof value.head === "string" ? value.head : "";
    const base = typeof value.base === "string" ? value.base : "main";
    const branchName = typeof value.branchName === "string" ? value.branchName : "";
    const baseBranch = typeof value.baseBranch === "string" ? value.baseBranch : "main";

    const [status, setStatus] = useState<{ connected: boolean; workspaceName: string | null } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get("/api/github/status");
                setStatus(res.data);
            } catch (err) {
                console.error("Failed to fetch GitHub status", err);
            } finally {
                setLoadingStatus(false);
            }
        };
        void fetchStatus();
    }, []);

    const handleConnect = () => {
        window.location.href = "/api/github/connect";
    };

    const handleDisconnect = async () => {
        try {
            await axios.delete("/api/github/status");
            setStatus({ connected: false, workspaceName: null });
            onChange({
                actionType: "create_issue",
                repo: "",
                title: "",
                body: "",
                issueNumber: "",
                head: "",
                base: "main",
                branchName: "",
                baseBranch: "main",
            });
        } catch (err) {
            console.error("Failed to disconnect GitHub", err);
        }
    };

    const handleActionTypeChange = (type: string) => {
        onChange({
            ...value,
            actionType: type,
        });
    };

    if (loadingStatus) {
        return (
            <div className="flex justify-center py-6">
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    if (!status?.connected) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Connect your GitHub account to enable repository automations.
                    </p>
                    <Button onClick={handleConnect} className="mt-4 w-full">
                        Connect GitHub
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <VariableSuggestions variables={variables ?? []} />

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-zinc-900 text-white text-[10px] font-bold">
                        Git
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                        {status.workspaceName || "Connected"}
                    </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-xs text-destructive hover:bg-destructive/10">
                    Disconnect
                </Button>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action Type</label>
                <select
                    value={actionType}
                    onChange={(e) => handleActionTypeChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    <option value="create_issue">Create Issue</option>
                    <option value="create_comment">Create Comment</option>
                    <option value="create_pr">Create Pull Request</option>
                    <option value="create_branch">Create Branch</option>
                    <option value="get_repo">Get Repository Details</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repository</label>
                <Input
                    value={repo}
                    onChange={(e) => onChange({ ...value, repo: e.target.value })}
                    placeholder="owner/repo (e.g. facebook/react or {trigger.repository})"
                    className="font-mono"
                />
            </div>

            {actionType === "create_issue" && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Title</label>
                        <Input
                            value={title}
                            onChange={(e) => onChange({ ...value, title: e.target.value })}
                            placeholder="Issue title (supports variables)"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => onChange({ ...value, body: e.target.value })}
                            placeholder="Describe the issue..."
                            className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </>
            )}

            {actionType === "create_comment" && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue / PR Number</label>
                        <Input
                            value={issueNumber}
                            onChange={(e) => onChange({ ...value, issueNumber: e.target.value })}
                            placeholder="e.g. 42 or {trigger.pr_number}"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comment Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => onChange({ ...value, body: e.target.value })}
                            placeholder="Write your comment..."
                            className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </>
            )}

            {actionType === "create_pr" && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PR Title</label>
                        <Input
                            value={title}
                            onChange={(e) => onChange({ ...value, title: e.target.value })}
                            placeholder="Pull request title"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Head Branch (Source)</label>
                        <Input
                            value={head}
                            onChange={(e) => onChange({ ...value, head: e.target.value })}
                            placeholder="e.g. feature-branch-name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base Branch (Target)</label>
                        <Input
                            value={base}
                            onChange={(e) => onChange({ ...value, base: e.target.value })}
                            placeholder="e.g. main"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PR Description</label>
                        <textarea
                            value={body}
                            onChange={(e) => onChange({ ...value, body: e.target.value })}
                            placeholder="Describe your pull request..."
                            className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </>
            )}

            {actionType === "create_branch" && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Branch Name</label>
                        <Input
                            value={branchName}
                            onChange={(e) => onChange({ ...value, branchName: e.target.value })}
                            placeholder="e.g. patch-1"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base Branch (Source)</label>
                        <Input
                            value={baseBranch}
                            onChange={(e) => onChange({ ...value, baseBranch: e.target.value })}
                            placeholder="e.g. main"
                        />
                    </div>
                </>
            )}

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={GitBranchIcon} size={14} className="text-primary" />
                    Context Output Variables
                </p>
                <p>
                    Execution results are saved to context variables for downstream nodes:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-1 font-mono text-[10px]">
                    <li>{`{github.response}`} - Raw JSON response string</li>
                    <li>{`{github.url}`} - HTML URL of issue/PR/comment</li>
                    <li>{`{github.issueNumber}`} / {`{github.prNumber}`}</li>
                    <li>{`{github.sha}`} - Created branch head commit SHA</li>
                </ul>
            </div>
        </div>
    );
}

export const GithubActionNode = memo(GithubActionNodeView);
export { GithubActionContents };
