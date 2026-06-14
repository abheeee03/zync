import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { sileo } from "sileo";

export type VariableInfo = {
    label: string;
    variable: string;
    nodeLabel: string;
};

interface VariableSuggestionsProps {
    variables: VariableInfo[];
}

export function getAncestors(currentNodeId: string | null, nodes: any[], edges: any[]): any[] {
    if (!currentNodeId) return [];
    const ancestors: any[] = [];
    const visited = new Set<string>();
    const queue = [currentNodeId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        // Find edges targeting the current node (incoming edges)
        const incomingEdges = edges.filter((e) => e.target === currentId);
        for (const edge of incomingEdges) {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (sourceNode) {
                if (!ancestors.some((a) => a.id === sourceNode.id)) {
                    ancestors.push(sourceNode);
                }
                queue.push(sourceNode.id);
            }
        }
    }
    return ancestors;
}

export function getAvailableVariables(currentNodeId: string | null, nodes: any[], edges: any[]): VariableInfo[] {
    if (!currentNodeId) return [];
    const ancestors = getAncestors(currentNodeId, nodes, edges);
    const variables: VariableInfo[] = [];

    for (const node of ancestors) {
        const nodeName = (node.data?.label ?? "").toLowerCase();
        const catalogId = (node.data?.catalogId ?? "").toLowerCase();
        const kind = node.data?.kind;

        if (nodeName.includes("ai")) {
            variables.push({
                label: "AI Output Message",
                variable: "{data.message}",
                nodeLabel: node.data?.label ?? "AI Action",
            });
        } else if (nodeName.includes("webhook") && kind === "trigger") {
            variables.push({
                label: "Webhook Body",
                variable: "{trigger.body}",
                nodeLabel: node.data?.label ?? "Webhook Trigger",
            });
            variables.push({
                label: "Webhook Query",
                variable: "{trigger.query}",
                nodeLabel: node.data?.label ?? "Webhook Trigger",
            });
        } else if (nodeName.includes("manual")) {
            variables.push({
                label: "Trigger Timestamp",
                variable: "{trigger.timestamp}",
                nodeLabel: node.data?.label ?? "Manual Trigger",
            });
        } else if (nodeName.includes("schedule")) {
            variables.push({
                label: "Scheduled Time",
                variable: "{trigger.time}",
                nodeLabel: node.data?.label ?? "Schedule Trigger",
            });
        } else if (nodeName.includes("webhook") && kind === "action") {
            variables.push({
                label: "Webhook Response Data",
                variable: "{webhook.response}",
                nodeLabel: node.data?.label ?? "Webhook Action",
            });
        } else if (nodeName.includes("notion")) {
            variables.push({
                label: "Notion Page ID",
                variable: "{notion.pageId}",
                nodeLabel: node.data?.label ?? "Notion Action",
            });
            variables.push({
                label: "Notion Page URL",
                variable: "{notion.url}",
                nodeLabel: node.data?.label ?? "Notion Action",
            });
        }
    }

    return variables;
}

export function VariableSuggestions({ variables }: VariableSuggestionsProps) {
    const [copiedVar, setCopiedVar] = useState<string | null>(null);

    if (!variables || variables.length === 0) return null;

    const handleCopy = async (variable: string) => {
        try {
            await navigator.clipboard.writeText(variable);
            setCopiedVar(variable);
            sileo.success({ title: `Copied ${variable} to clipboard` });
            setTimeout(() => setCopiedVar(null), 2000);
        } catch {
            sileo.error({ title: "Failed to copy variable" });
        }
    };

    return (
        <div className="space-y-2 rounded-xl border border-border/80 bg-muted/15 p-3.5 mt-2 mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Available Context Variables
            </h4>
            <p className="text-[11px] text-muted-foreground leading-snug">
                Click any badge to copy. Paste it into your node configurations below to dynamically interpolate dynamic inputs.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
                {variables.map((v, i) => {
                    const isCopied = copiedVar === v.variable;
                    return (
                        <button
                            key={`${v.variable}-${i}`}
                            type="button"
                            onClick={() => handleCopy(v.variable)}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all cursor-pointer select-none"
                        >
                            <code className="text-primary font-mono font-semibold">{v.variable}</code>
                            <span className="text-[10px] text-muted-foreground">({v.nodeLabel})</span>
                            <HugeiconsIcon
                                icon={isCopied ? Tick02Icon : Copy01Icon}
                                size={12}
                                className={isCopied ? "text-emerald-500" : "text-muted-foreground"}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
