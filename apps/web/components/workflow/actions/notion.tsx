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
    AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { VariableSuggestions, type VariableInfo } from "../variable-suggestions";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
    variables?: VariableInfo[];
};

type NotionProperty = {
    name: string;
    id: string;
    type: string;
    options?: Array<{ name: string; color?: string }>;
};

type DatabaseInfo = {
    id: string;
    title: string;
    icon: string | null;
    url?: string;
};

type PageInfo = {
    id: string;
    title: string;
};

function NotionActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const actionType = typeof metaData.actionType === "string" ? metaData.actionType : "create_page";
    const databaseTitle = typeof metaData.databaseTitle === "string" ? metaData.databaseTitle : "";

    const typeLabels: Record<string, string> = {
        create_page: "Create Page / Row",
        update_page: "Update Page Properties",
        append_block: "Append Content Block",
        query_database: "Query Database",
    };

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded bg-foreground text-background font-bold text-xs select-none">
                        N
                    </div>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Notion Action
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                            {typeLabels[actionType] || actionType}
                        </p>
                    </div>
                </div>
                {databaseTitle && (
                    <p className="mt-2 text-xs text-muted-foreground truncate">
                        DB: {databaseTitle}
                    </p>
                )}
            </div>
        </BaseNode>
    );
}

function NotionActionContents({ value, onChange, variables }: NodeEditorProps) {
    const actionType = typeof value.actionType === "string" ? value.actionType : "create_page";
    const databaseId = typeof value.databaseId === "string" ? value.databaseId : "";
    const targetPageId = typeof value.targetPageId === "string" ? value.targetPageId : "";
    const blockContent = typeof value.blockContent === "string" ? value.blockContent : "";
    const filterProperty = typeof value.filterProperty === "string" ? value.filterProperty : "";
    const filterValue = typeof value.filterValue === "string" ? value.filterValue : "";
    const fieldValues = (value.fieldValues as Record<string, unknown>) ?? {};

    const [status, setStatus] = useState<{ connected: boolean; workspaceName: string | null } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
    const [loadingDatabases, setLoadingDatabases] = useState(false);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [schema, setSchema] = useState<NotionProperty[]>([]);
    const [loadingSchema, setLoadingSchema] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get("/api/notion/status");
                setStatus(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingStatus(false);
            }
        };
        void fetchStatus();
    }, []);

    useEffect(() => {
        if (!status?.connected) return;
        const fetchDatabases = async () => {
            setLoadingDatabases(true);
            try {
                const res = await axios.get("/api/notion/databases");
                setDatabases(res.data.databases ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingDatabases(false);
            }
        };
        void fetchDatabases();
    }, [status]);

    useEffect(() => {
        if (!status?.connected || !databaseId) {
            setSchema([]);
            setPages([]);
            return;
        }

        const fetchSchema = async () => {
            setLoadingSchema(true);
            try {
                const res = await axios.get(`/api/notion/databases/${databaseId}`);
                setSchema(res.data.properties ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingSchema(false);
            }
        };

        const fetchPages = async () => {
            if (actionType !== "update_page" && actionType !== "append_block") return;
            setLoadingPages(true);
            try {
                const res = await axios.get(`/api/notion/pages?databaseId=${databaseId}`);
                setPages(res.data.pages ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingPages(false);
            }
        };

        void fetchSchema();
        void fetchPages();
    }, [status, databaseId, actionType]);

    const handleConnect = () => {
        window.location.href = "/api/notion/connect";
    };

    const handleDisconnect = async () => {
        try {
            await axios.delete("/api/notion/status");
            setStatus({ connected: false, workspaceName: null });
            setDatabases([]);
            onChange({
                actionType: "create_page",
                databaseId: "",
                databaseTitle: "",
                fieldValues: {},
                blockContent: "",
                targetPageId: "",
                filterProperty: "",
                filterValue: "",
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleActionTypeChange = (type: string) => {
        onChange({
            ...value,
            actionType: type,
            fieldValues: {},
            targetPageId: "",
            blockContent: "",
            filterProperty: "",
            filterValue: "",
        });
    };

    const handleDatabaseChange = (id: string) => {
        const selectedDb = databases.find((db) => db.id === id);
        onChange({
            ...value,
            databaseId: id,
            databaseTitle: selectedDb ? selectedDb.title : "",
            fieldValues: {},
            targetPageId: "",
            blockContent: "",
            filterProperty: "",
            filterValue: "",
        });
    };

    const handleFieldChange = (name: string, val: unknown) => {
        onChange({
            ...value,
            fieldValues: {
                ...fieldValues,
                [name]: val,
            },
        });
    };

    const handleMultiSelectChange = (name: string, option: string, isChecked: boolean) => {
        const currentVals = Array.isArray(fieldValues[name]) ? (fieldValues[name] as string[]) : [];
        const nextVals = isChecked
            ? [...currentVals, option]
            : currentVals.filter((v) => v !== option);
        handleFieldChange(name, nextVals);
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
                        Connect your Notion workspace to start automating databases and pages.
                    </p>
                    <Button onClick={handleConnect} className="mt-4 w-full">
                        Connect Notion
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
                    <div className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px]">
                        N
                    </div>
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
                    <option value="create_page">Create Page / Row</option>
                    <option value="update_page">Update Page Properties</option>
                    <option value="append_block">Append Content Block</option>
                    <option value="query_database">Query Database</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Database</label>
                {loadingDatabases ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-lg bg-background">
                        <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={16} />
                        <span className="text-sm text-muted-foreground">Loading databases...</span>
                    </div>
                ) : (
                    <select
                        value={databaseId}
                        onChange={(e) => handleDatabaseChange(e.target.value)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select a database...</option>
                        {databases.map((db) => (
                            <option key={db.id} value={db.id}>
                                {db.icon ? `${db.icon} ` : ""}{db.title}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {databaseId && (actionType === "update_page" || actionType === "append_block") && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Page</label>
                    {loadingPages ? (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-lg bg-background">
                            <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={16} />
                            <span className="text-sm text-muted-foreground">Loading pages...</span>
                        </div>
                    ) : (
                        <select
                            value={targetPageId}
                            onChange={(e) => onChange({ ...value, targetPageId: e.target.value })}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select a page...</option>
                            {pages.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {databaseId && actionType === "append_block" && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Block Content (Paragraph)</label>
                    <textarea
                        value={blockContent}
                        onChange={(e) => onChange({ ...value, blockContent: e.target.value })}
                        className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                        placeholder="Type paragraph text to append..."
                    />
                </div>
            )}

            {databaseId && actionType === "query_database" && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter Property</label>
                        {loadingSchema ? (
                            <div className="h-10 border rounded-lg animate-pulse bg-muted" />
                        ) : (
                            <select
                                value={filterProperty}
                                onChange={(e) => onChange({ ...value, filterProperty: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background"
                            >
                                <option value="">Select a property to filter...</option>
                                {schema
                                    .filter((p) => ["title", "rich_text", "select", "status", "checkbox"].includes(p.type))
                                    .map((p) => (
                                        <option key={p.id} value={p.name}>
                                            {p.name} ({p.type})
                                        </option>
                                    ))}
                            </select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter Value</label>
                        <Input
                            value={filterValue}
                            onChange={(e) => onChange({ ...value, filterValue: e.target.value })}
                            placeholder="Value to equal..."
                        />
                    </div>
                </div>
            )}

            {databaseId && (actionType === "create_page" || actionType === "update_page") && (
                <div className="space-y-4 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties Mapping</p>
                    {loadingSchema ? (
                        <div className="space-y-3">
                            <div className="h-8 border rounded-lg animate-pulse bg-muted" />
                            <div className="h-8 border rounded-lg animate-pulse bg-muted" />
                            <div className="h-8 border rounded-lg animate-pulse bg-muted" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schema.map((prop) => {
                                const currentVal = fieldValues[prop.name];

                                if (prop.type === "title" || prop.type === "rich_text" || prop.type === "url" || prop.type === "email" || prop.type === "phone_number") {
                                    return (
                                        <div key={prop.id} className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground capitalize">({prop.type})</span>
                                            </label>
                                            <Input
                                                value={typeof currentVal === "string" ? currentVal : ""}
                                                onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                                                placeholder={`Enter ${prop.type}...`}
                                            />
                                        </div>
                                    );
                                }

                                if (prop.type === "number") {
                                    return (
                                        <div key={prop.id} className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground">(number)</span>
                                            </label>
                                            <Input
                                                type="number"
                                                value={currentVal !== undefined && currentVal !== null ? String(currentVal) : ""}
                                                onChange={(e) => handleFieldChange(prop.name, e.target.value === "" ? null : Number(e.target.value))}
                                                placeholder="Enter number..."
                                            />
                                        </div>
                                    );
                                }

                                if (prop.type === "checkbox") {
                                    return (
                                        <div key={prop.id} className="flex items-center gap-2.5 py-1">
                                            <input
                                                type="checkbox"
                                                id={`checkbox-${prop.id}`}
                                                checked={Boolean(currentVal)}
                                                onChange={(e) => handleFieldChange(prop.name, e.target.checked)}
                                                className="size-4 rounded border-input text-primary focus:ring-primary"
                                            />
                                            <label htmlFor={`checkbox-${prop.id}`} className="text-sm font-medium text-foreground select-none">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground">(checkbox)</span>
                                            </label>
                                        </div>
                                    );
                                }

                                if (prop.type === "date") {
                                    return (
                                        <div key={prop.id} className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground">(date)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={typeof currentVal === "string" ? currentVal : ""}
                                                onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                                                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                    );
                                }

                                if (prop.type === "select" || prop.type === "status") {
                                    return (
                                        <div key={prop.id} className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground capitalize">({prop.type})</span>
                                            </label>
                                            <select
                                                value={typeof currentVal === "string" ? currentVal : ""}
                                                onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                                                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                                            >
                                                <option value="">Select option...</option>
                                                {(prop.options ?? []).map((o) => (
                                                    <option key={o.name} value={o.name}>
                                                        {o.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                }

                                if (prop.type === "multi_select") {
                                    return (
                                        <div key={prop.id} className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">
                                                {prop.name}
                                                <span className="ml-1.5 text-[10px] text-muted-foreground">(multi-select)</span>
                                            </label>
                                            <div className="max-h-36 overflow-y-auto rounded-lg border border-input bg-background p-2.5 space-y-1.5">
                                                {(prop.options ?? []).map((o) => {
                                                    const isChecked = Array.isArray(currentVal) && currentVal.includes(o.name);
                                                    return (
                                                        <label key={o.name} className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => handleMultiSelectChange(prop.name, o.name, e.target.checked)}
                                                                className="size-3.5 rounded border-input"
                                                            />
                                                            <span>{o.name}</span>
                                                        </label>
                                                    );
                                                })}
                                                {(prop.options ?? []).length === 0 && (
                                                    <span className="text-xs text-muted-foreground">No options defined</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export const NotionActionNode = memo(NotionActionNodeView);
export { NotionActionContents };
