"use client";

import { memo, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type IsValidConnection,
    type NodeChange,
    type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    AlertCircleIcon,
    Calendar01Icon,
    CloudIcon,
    Delete01Icon,
    Globe02Icon,
    Loading03Icon,
    Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { AvailableActions, AvailableTriggers } from "@repo/shared/types";
import BaseNode from "@/components/workflow/base-node";
import {
    ManualTriggerContents,
    ManualTriggerNode,
} from "@/components/workflow/triggers/manual";
import {
    WebhookTriggerContents,
    WebhookTriggerNode,
} from "@/components/workflow/triggers/webhook";
import {
    ScheduleTriggerContents,
    ScheduleTriggerNode,
} from "@/components/workflow/triggers/schedule";
import {
    WebhookActionContents,
    WebhookActionNode,
} from "@/components/workflow/actions/webhook";
import {
    NotionActionContents,
    NotionActionNode,
} from "@/components/workflow/actions/notion";
import type {
    WorkflowEdge,
    WorkflowNode,
    WorkflowNodeKind,
} from "@/components/workflow/types";
import Loader from "@/components/loader";

export type SavedWorkflowResponse = {
    isActive: boolean;
    trigger: {
        id: string;
        triggerId: string;
        name: string;
        metaData?: Record<string, unknown>;
    } | null;
    actions: {
        id: string;
        actionId: string;
        name: string;
        metaData?: Record<string, unknown>;
        order: number;
    }[];
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const NODE_WIDTH = 240;
const NODE_VERTICAL_GAP = 140;

function WorkflowNodeRenderer(props: NodeProps<WorkflowNode>) {
    const nodeName = props.data.label.toLowerCase();

    if (props.data.kind === "trigger") {
        if (nodeName.includes("manual")) {
            return <ManualTriggerNode {...props} />;
        }
        if (nodeName.includes("webhook")) {
            return <WebhookTriggerNode {...props} />;
        }
        if (nodeName.includes("schedule")) {
            return <ScheduleTriggerNode {...props} />;
        }
    }

    if (props.data.kind === "action") {
        if (nodeName.includes("notion")) {
            return <NotionActionNode {...props} />;
        }
        if (nodeName.includes("webhook")) {
            return <WebhookActionNode {...props} />;
        }
    }

    return <BaseNode {...props} />;
}

const nodeTypes = {
    workflow: memo(WorkflowNodeRenderer),
};

function normalizeSavedNodes(nodes: WorkflowNode[] | undefined): WorkflowNode[] {
    if (!Array.isArray(nodes)) return [];
    return nodes
        .filter((n) => n?.id && n?.data?.catalogId && n?.data?.kind && n?.data?.label)
        .map((n) => ({
            ...n,
            type: "workflow" as const,
            data: {
                catalogId: n.data.catalogId,
                kind: n.data.kind,
                label: n.data.label,
                metaData: n.data.metaData ?? {},
            },
            position: n.position ?? { x: 0, y: 0 },
        }));
}

function normalizeSavedEdges(edges: WorkflowEdge[] | undefined): WorkflowEdge[] {
    if (!Array.isArray(edges)) return [];
    return edges
        .filter((e) => e?.id && e?.source && e?.target)
        .map((e) => ({
            ...e,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
        }));
}

function buildFallbackGraph(workflow: SavedWorkflowResponse): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
} {
    const triggerNodes: WorkflowNode[] = workflow.trigger
        ? [
            {
                id: `trigger-${workflow.trigger.triggerId}`,
                type: "workflow",
                position: { x: 0, y: 0 },
                data: {
                    catalogId: workflow.trigger.triggerId,
                    kind: "trigger",
                    label: workflow.trigger.name,
                    metaData: workflow.trigger.metaData ?? {},
                },
            },
        ]
        : [];

    const actionNodes = workflow.actions.map((a, i) => ({
        id: `action-${a.id}`,
        type: "workflow" as const,
        position: { x: NODE_WIDTH + 120, y: i * NODE_VERTICAL_GAP },
        data: {
            catalogId: a.actionId,
            kind: "action" as const,
            label: a.name,
            metaData: a.metaData ?? {},
        },
    }));

    const edges: WorkflowEdge[] = workflow.trigger
        ? actionNodes.map((an) => ({
            id: `edge-${triggerNodes[0].id}-${an.id}`,
            source: triggerNodes[0].id,
            target: an.id,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
        }))
        : [];

    return { nodes: [...triggerNodes, ...actionNodes], edges };
}

function hasPath(edges: WorkflowEdge[], start: string, end: string): boolean {
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        if (current === end) return true;
        visited.add(current);
        queue.push(...edges.filter((e) => e.source === current).map((e) => e.target));
    }

    return false;
}

function getConnectedActionNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    const trigger = nodes.find((n) => n.data.kind === "trigger");
    if (!trigger) return [];

    return nodes
        .filter((n) => n.data.kind === "action" && hasPath(edges, trigger.id, n.id))
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
}

function WorkflowPage() {
    const { theme } = useTheme();
    const params = useParams<{ id: string }>();
    const workflowId = params.id;

    const [activeTab, setActiveTab] = useState<"triggers" | "actions">("triggers");
    const [availableTriggers, setAvailableTriggers] = useState<AvailableTriggers[]>([]);
    const [availableActions, setAvailableActions] = useState<AvailableActions[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWorkflowLoading, setIsWorkflowLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [edges, setEdges] = useState<WorkflowEdge[]>([]);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId),
        [nodes, selectedNodeId],
    );
    const selectedNodeMetaData = selectedNode?.data.metaData ?? {};

    const isTriggerTab = activeTab === "triggers";
    const activeItems = isTriggerTab ? availableTriggers : availableActions;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredItems = normalizedSearch.length
        ? activeItems.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
        : activeItems;

    const selectedNodeCatalogName = useMemo(() => {
        if (!selectedNode) return null;

        const catalogItem =
            selectedNode.data.kind === "trigger"
                ? availableTriggers.find((item) => item.id === selectedNode.data.catalogId)
                : availableActions.find((item) => item.id === selectedNode.data.catalogId);

        return catalogItem?.name ?? selectedNode.data.label;
    }, [availableActions, availableTriggers, selectedNode]);
    const SelectedNodeContents = useMemo(() => {
        if (!selectedNode) return null;

        const normalizedName = (selectedNodeCatalogName ?? selectedNode.data.label).toLowerCase();
        if (selectedNode.data.kind === "trigger") {
            if (normalizedName.includes("manual")) {
                return ManualTriggerContents;
            }
            if (normalizedName.includes("webhook")) {
                return WebhookTriggerContents;
            }
            if (normalizedName.includes("schedule")) {
                return ScheduleTriggerContents;
            }
        }
        if (selectedNode.data.kind === "action") {
            if (normalizedName.includes("notion")) {
                return NotionActionContents;
            }
            if (normalizedName.includes("webhook")) {
                return WebhookActionContents;
            }
        }

        return null;
    }, [selectedNode, selectedNodeCatalogName]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const res = await axios.get("/api/workflow");
                setAvailableTriggers(res.data?.triggers ?? []);
                setAvailableActions(res.data?.actions ?? []);
            } catch {
                setLoadError("Failed to load triggers and actions.");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    useEffect(() => {
        if (!workflowId) return;

        const load = async () => {
            setIsWorkflowLoading(true);
            setLoadError(null);
            try {
                const res = await axios.get<SavedWorkflowResponse>(`/api/workflow/${workflowId}`);
                setIsActive(res.data.isActive ?? false);
                const savedNodes = normalizeSavedNodes(res.data.nodes);
                const savedEdges = normalizeSavedEdges(res.data.edges);
                const graph =
                    savedNodes.length > 0
                        ? { nodes: savedNodes, edges: savedEdges }
                        : buildFallbackGraph(res.data);
                setNodes(graph.nodes);
                setEdges(graph.edges);
                setSaveStatus("saved");
            } catch {
                setLoadError("Failed to load this workflow.");
            } finally {
                setIsWorkflowLoading(false);
            }
        };

        void load();
    }, [workflowId]);

    const markDirty = useCallback(() => {
        setSaveStatus("idle");
    }, []);

    const onNodesChange = useCallback(
        (changes: NodeChange<WorkflowNode>[]) => {
            markDirty();
            setNodes((snap) => applyNodeChanges(changes, snap));
        },
        [markDirty],
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<WorkflowEdge>[]) => {
            markDirty();
            setEdges((snap) => applyEdgeChanges(changes, snap));
        },
        [markDirty],
    );

    const isValidConnection: IsValidConnection<WorkflowEdge> = useCallback(
        (connection) => {
            if (!connection.source || !connection.target || connection.source === connection.target) return false;
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);
            if (!sourceNode || !targetNode || targetNode.data.kind === "trigger") return false;
            if (edges.some((e) => e.source === connection.source && e.target === connection.target)) return false;
            return !hasPath(edges, connection.target, connection.source);
        },
        [edges, nodes],
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isValidConnection(connection)) return;
            markDirty();
            setEdges((snap) =>
                addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, snap),
            );
        },
        [isValidConnection, markDirty],
    );

    const handleAddNode = useCallback(
        (catalogId: string, label: string) => {
            const kind: WorkflowNodeKind = isTriggerTab ? "trigger" : "action";
            const normalizedLabel = label.toLowerCase();
            markDirty();

            setNodes((currentNodes) => {
                const actionCount = currentNodes.filter((n) => n.data.kind === "action").length;
                const nextNode: WorkflowNode = {
                    id: `${kind}-${catalogId}-${crypto.randomUUID()}`,
                    type: "workflow",
                    position:
                        kind === "trigger"
                            ? { x: 0, y: 0 }
                            : { x: NODE_WIDTH + 120, y: Math.max(actionCount, 0) * NODE_VERTICAL_GAP },
                    data: {
                        catalogId,
                        kind,
                        label,
                        metaData:
                            kind === "action" && normalizedLabel.includes("notion")
                                ? { actionType: "create_page", databaseId: "", databaseTitle: "", fieldValues: {}, blockContent: "", targetPageId: "", filterProperty: "", filterValue: "" }
                                : kind === "action" && normalizedLabel.includes("webhook")
                                ? { method: "POST", url: "", body: "" }
                                : {},
                    },
                };

                if (kind === "trigger") {
                    return [nextNode, ...currentNodes.filter((n) => n.data.kind !== "trigger")];
                }

                return [...currentNodes, nextNode];
            });

            if (kind === "trigger") {
                setEdges([]);
            }

            setSearchTerm("");
            setIsLibraryOpen(false);
        },
        [isTriggerTab, markDirty],
    );

    const onNodeClick = useCallback((_: MouseEvent, node: WorkflowNode) => {
        setSelectedNodeId(node.id);
        setIsDrawerOpen(true);
    }, []);

    const handleSelectedNodeMetaDataChange = useCallback(
        (nextMetaData: Record<string, unknown>) => {
            if (!selectedNodeId) return;

            setNodes((currentNodes) =>
                currentNodes.map((node) =>
                    node.id === selectedNodeId
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                metaData: nextMetaData,
                            },
                        }
                        : node,
                ),
            );
            markDirty();
        },
        [markDirty, selectedNodeId],
    );

    const handleDeleteNode = useCallback(() => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setIsDrawerOpen(false);
        setSelectedNodeId(null);
        markDirty();
    }, [selectedNodeId, markDirty]);

    const handleSave = useCallback(async () => {
        if (!workflowId || saveStatus === "saving") return;
        const triggerNode = nodes.find((n) => n.data.kind === "trigger");
        const connectedActions = getConnectedActionNodes(nodes, edges);

        setSaveStatus("saving");

        try {
            await axios.post(`/api/workflow/${workflowId}`, {
                isActive,
                trigger: triggerNode
                    ? {
                        triggerId: triggerNode.data.catalogId,
                        metaData: triggerNode.data.metaData ?? {},
                    }
                    : null,
                actions: connectedActions.map((n, order) => ({
                    actionId: n.data.catalogId,
                    metaData: n.data.metaData ?? {},
                    order,
                })),
                nodes,
                edges,
            });
            setSaveStatus("saved");
        } catch {
            setSaveStatus("error");
        }
    }, [edges, nodes, saveStatus, workflowId, isActive]);

    useEffect(() => {
        if (saveStatus !== "idle" || isWorkflowLoading) return;

        const timer = setTimeout(() => {
            void handleSave();
        }, 1500);

        return () => clearTimeout(timer);
    }, [saveStatus, handleSave, isWorkflowLoading, nodes, edges]);

    return (
        <div className="relative h-full min-h-[calc(100vh-4rem)] w-full overflow-hidden">
            <div className="fixed top-20 right-10 z-10 flex items-center gap-2 rounded-full border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur select-none transition-all duration-300">
                <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-full px-4 text-xs font-semibold"
                    onClick={() => {
                        setIsActive(!isActive);
                        markDirty();
                    }}
                >
                    {isActive ? "Activated Workflow" : "Activate Workflow"}
                </Button>

                <div className="flex items-center gap-2 px-3 border-r border-l border-border mx-1">
                    <div className="relative flex items-center justify-center">
                        {saveStatus === "saving" && (
                            <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={16} />
                        )}
                        {saveStatus === "saved" && (
                            <HugeiconsIcon icon={Tick02Icon} className="text-primary" size={16} />
                        )}
                        {saveStatus === "error" && (
                            <HugeiconsIcon icon={AlertCircleIcon} className="text-destructive" size={16} />
                        )}
                        {saveStatus === "idle" && (
                            <HugeiconsIcon icon={CloudIcon} className="text-muted-foreground/50" size={16} />
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Error" : "Changes"}
                    </span>
                </div>

                <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} size={18} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="h-[80vh] w-7xl overflow-hidden bg-background/95 p-0 backdrop-blur-xl sm:max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            className="flex h-full overflow-hidden"
                        >
                            <div className="flex w-44 flex-col border-r border-border bg-muted/30 p-4">
                                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Library
                                </p>
                                <div className="flex flex-col gap-2">
                                    {(["triggers", "actions"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            className={
                                                cn(
                                                    "text-md w-full text-left px-3 py-1 rounded-xl ring-secondary hover:ring-1 transition-all duration-300",
                                                    activeTab == tab && "bg-primary text-background"
                                                )
                                            }
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col py-5">
                                <DialogHeader className="border-border px-6 pb-3 pt-6">
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={`Search ${isTriggerTab ? "triggers" : "actions"}...`}
                                        className="h-10 rounded-xl border-border/50 bg-muted/50 transition-all duration-300 focus-visible:bg-background"
                                    />
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-2">
                                    {loadError ? (
                                        <p className="py-4 text-sm text-destructive">{loadError}</p>
                                    ) : isLoading ? (
                                        <div className="flex flex-col gap-2 py-2">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-muted" />
                                            ))}
                                        </div>
                                    ) : filteredItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                            <p className="text-sm">
                                                {isTriggerTab ? "No triggers found." : "No actions found."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 py-2">
                                            <AnimatePresence mode="popLayout">
                                                {filteredItems.map((item, i) => (
                                                    <motion.button
                                                        layout
                                                        key={item.id}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.97 }}
                                                        transition={{
                                                            delay: Math.min(i * 0.04, 0.25),
                                                            ease: [0.23, 1, 0.32, 1],
                                                            duration: 0.2,
                                                        }}
                                                        onClick={() => handleAddNode(item.id, item.name)}
                                                        className="group flex cursor-pointer items-center justify-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-150 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                                                    >
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                            <HugeiconsIcon
                                                                icon={isTriggerTab ? Calendar01Icon : Globe02Icon}
                                                                size={16}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium leading-tight">{item.name}</p>
                                                            <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
                                                                {isTriggerTab ? "Trigger" : "Action"}
                                                            </p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </DialogContent>
                </Dialog>
            </div>

            <ReactFlow
                className="workflow-flow"
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                isValidConnection={isValidConnection}
                colorMode={theme === "light" ? "light" : "dark"}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                {
                    isWorkflowLoading && <div className="h-full w-full flex items-center justify-center">
                        <Loader />
                    </div>
                }
                <Background />
                <Controls />
            </ReactFlow>

            <Drawer
                open={isDrawerOpen}
                onOpenChange={(open) => {
                    setIsDrawerOpen(open);
                    if (!open) {
                        setSelectedNodeId(null);
                    }
                }}
                direction="right"
            >
                <DrawerContent className="h-full border-l border-border bg-background/95 backdrop-blur-md">
                    <DrawerHeader className="border-b border-border/50 p-6">
                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                className={cn(
                                    "rounded-2xl p-3",
                                    selectedNode?.data.kind === "trigger"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                <HugeiconsIcon
                                    icon={selectedNode?.data.kind === "trigger" ? Calendar01Icon : Globe02Icon}
                                    size={24}
                                />
                            </motion.div>
                            <div>
                                <DrawerTitle className="text-xl font-semibold tracking-tight">
                                    {selectedNode?.data.label ?? "Node"}
                                </DrawerTitle>
                                <DrawerDescription className="flex items-center gap-1.5 text-xs font-medium capitalize text-muted-foreground/80">
                                    <span
                                        className={cn(
                                            "size-1.5 rounded-full",
                                            selectedNode?.data.kind === "trigger"
                                                ? "bg-primary"
                                                : "bg-muted-foreground",
                                        )}
                                    />
                                    {selectedNodeCatalogName ?? selectedNode?.data.kind ?? "node"} settings
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        {SelectedNodeContents ? (
                            <SelectedNodeContents
                                value={selectedNodeMetaData}
                                onChange={handleSelectedNodeMetaDataChange}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                                <p className="text-sm font-medium text-foreground/90">No custom settings</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    This node does not need extra metadata yet.
                                </p>
                                <pre className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground">
                                    {JSON.stringify(selectedNodeMetaData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border/50 bg-muted/10 p-6">
                        <Button
                            variant="destructive"
                            className="h-11 w-full gap-2 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98]"
                            onClick={handleDeleteNode}
                            disabled={!selectedNode}
                        >
                            <HugeiconsIcon icon={Delete01Icon} size={18} />
                            <span className="font-semibold">Delete Node</span>
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default WorkflowPage;
