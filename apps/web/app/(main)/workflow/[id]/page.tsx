"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type Edge,
    type EdgeChange,
    type IsValidConnection,
    type Node,
    type NodeChange,
    type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { AvailableActions, AvailableTriggers } from "@repo/shared/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    Calendar01Icon,
    FloppyDiskIcon,
    Delete01Icon,
    Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { BaseNode, type BaseNodeData } from "@/components/workflow/base-node";
import { HttpNode } from "@/components/nodes/http-node";
import { ManualNode } from "@/components/nodes/manual-node";
import { NodeSettingsForm } from "@/components/workflow/node-settings-form";

type WorkflowNodeKind = "trigger" | "action";

type WorkflowNodeData = BaseNodeData & {
    catalogId: string;
};

type WorkflowNode = Node<WorkflowNodeData, "workflow">;
type WorkflowEdge = Edge<Record<string, never>>;

type SavedWorkflowResponse = {
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

function WorkflowNodeCard(props: NodeProps<WorkflowNode>) {
    const { data } = props;
    const label = data.label.toLowerCase();
    
    if (label.includes("http")) {
        return <HttpNode {...props} />;
    }
    if (label.includes("manual")) {
        return <ManualNode {...props} />;
    }

    return <BaseNode {...props} />;
}

const nodeTypes = {
    workflow: memo(WorkflowNodeCard),
};

function normalizeSavedNodes(nodes: WorkflowNode[] | undefined): WorkflowNode[] {
    if (!Array.isArray(nodes)) {
        return [];
    }

    return nodes
        .filter((node) => node?.id && node?.data?.catalogId && node?.data?.kind && node?.data?.label)
        .map((node) => ({
            ...node,
            type: "workflow",
            data: {
                catalogId: node.data.catalogId,
                kind: node.data.kind,
                label: node.data.label,
                metaData: node.data.metaData ?? {},
            },
            position: node.position ?? { x: 0, y: 0 },
        }));
}

function normalizeSavedEdges(edges: WorkflowEdge[] | undefined): WorkflowEdge[] {
    if (!Array.isArray(edges)) {
        return [];
    }

    return edges
        .filter((edge) => edge?.id && edge?.source && edge?.target)
        .map((edge) => ({
            ...edge,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
        }));
}

function buildFallbackGraph(workflow: SavedWorkflowResponse): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
} {
    const triggerNode: WorkflowNode[] = workflow.trigger
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

    const actionNodes = workflow.actions.map((action, index) => ({
        id: `action-${action.id}`,
        type: "workflow" as const,
        position: { x: NODE_WIDTH + 120, y: index * NODE_VERTICAL_GAP },
        data: {
            catalogId: action.actionId,
            kind: "action" as const,
            label: action.name,
            metaData: action.metaData ?? {},
        },
    }));

    const edges = workflow.trigger
        ? actionNodes.map((actionNode) => ({
            id: `edge-${triggerNode[0].id}-${actionNode.id}`,
            source: triggerNode[0].id,
            target: actionNode.id,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
        }))
        : [];

    return {
        nodes: [...triggerNode, ...actionNodes],
        edges,
    };
}

function hasPath(edges: WorkflowEdge[], start: string, end: string) {
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current || visited.has(current)) {
            continue;
        }

        if (current === end) {
            return true;
        }

        visited.add(current);
        queue.push(...edges.filter((edge) => edge.source === current).map((edge) => edge.target));
    }

    return false;
}

function getConnectedActionNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    const trigger = nodes.find((node) => node.data.kind === "trigger");

    if (!trigger) {
        return [];
    }

    return nodes
        .filter((node) => node.data.kind === "action" && hasPath(edges, trigger.id, node.id))
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
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [edges, setEdges] = useState<WorkflowEdge[]>([]);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId),
        [nodes, selectedNodeId],
    );

    const isTriggerTab = activeTab === "triggers";
    const activeItems = isTriggerTab ? availableTriggers : availableActions;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredItems = normalizedSearch.length
        ? activeItems.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
        : activeItems;

    const selectedTrigger = nodes.find((node) => node.data.kind === "trigger");
    const connectedActionCount = useMemo(
        () => getConnectedActionNodes(nodes, edges).length,
        [edges, nodes],
    );

    useEffect(() => {
        const loadOptions = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const response = await axios.get("/api/workflow");
                setAvailableTriggers(response.data?.triggers ?? []);
                setAvailableActions(response.data?.actions ?? []);
            } catch {
                setLoadError("Failed to load triggers and actions.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadOptions();
    }, []);

    useEffect(() => {
        if (!workflowId) {
            return;
        }

        const loadWorkflow = async () => {
            setIsWorkflowLoading(true);
            setLoadError(null);
            try {
                const response = await axios.get<SavedWorkflowResponse>(`/api/workflow/${workflowId}`);
                const savedNodes = normalizeSavedNodes(response.data.nodes);
                const savedEdges = normalizeSavedEdges(response.data.edges);
                const graph = savedNodes.length > 0
                    ? { nodes: savedNodes, edges: savedEdges }
                    : buildFallbackGraph(response.data);

                setNodes(graph.nodes);
                setEdges(graph.edges);
                setSaveStatus("saved");
            } catch {
                setLoadError("Failed to load this workflow.");
            } finally {
                setIsWorkflowLoading(false);
            }
        };

        void loadWorkflow();
    }, [workflowId]);

    const markDirty = useCallback(() => {
        setSaveError(null);
        setSaveStatus("idle");
    }, []);

    const onNodesChange = useCallback(
        (changes: NodeChange<WorkflowNode>[]) => {
            markDirty();
            setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
        },
        [markDirty],
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<WorkflowEdge>[]) => {
            markDirty();
            setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
        },
        [markDirty],
    );

    const isValidConnection: IsValidConnection<WorkflowEdge> = useCallback(
        (connection) => {
            if (!connection.source || !connection.target || connection.source === connection.target) {
                return false;
            }

            const sourceNode = nodes.find((node) => node.id === connection.source);
            const targetNode = nodes.find((node) => node.id === connection.target);

            if (!sourceNode || !targetNode || targetNode.data.kind === "trigger") {
                return false;
            }

            if (edges.some((edge) => edge.source === connection.source && edge.target === connection.target)) {
                return false;
            }

            return !hasPath(edges, connection.target, connection.source);
        },
        [edges, nodes],
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!isValidConnection(connection)) {
                return;
            }

            markDirty();
            setEdges((edgesSnapshot) =>
                addEdge(
                    {
                        ...connection,
                        markerEnd: { type: MarkerType.ArrowClosed },
                    },
                    edgesSnapshot,
                ),
            );
        },
        [isValidConnection, markDirty],
    );

    const handleAddNode = useCallback(
        (catalogId: string, label: string) => {
            const kind: WorkflowNodeKind = isTriggerTab ? "trigger" : "action";

            markDirty();
            setNodes((currentNodes) => {
                const actionCount = currentNodes.filter((node) => node.data.kind === "action").length;
                
                const defaultMetadata: Record<string, unknown> = {};
                if (label.toLowerCase().includes("http")) {
                    defaultMetadata.method = "POST";
                    defaultMetadata.url = "";
                    defaultMetadata.body = "{}";
                }

                const nextNode: WorkflowNode = {
                    id: `${kind}-${catalogId}-${crypto.randomUUID()}`,
                    type: "workflow",
                    position: kind === "trigger"
                        ? { x: 0, y: 0 }
                        : { x: NODE_WIDTH + 120, y: Math.max(actionCount, 0) * NODE_VERTICAL_GAP },
                    data: {
                        catalogId,
                        kind,
                        label,
                        metaData: defaultMetadata,
                    },
                };

                if (kind === "trigger") {
                    return [nextNode, ...currentNodes.filter((node) => node.data.kind !== "trigger")];
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

    const onNodeClick = useCallback((_: React.MouseEvent, node: WorkflowNode) => {
        setSelectedNodeId(node.id);
        setIsDrawerOpen(true);
    }, []);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
        setIsDrawerOpen(false);
        setSelectedNodeId(null);
        markDirty();
    }, [selectedNodeId, setEdges, setNodes, markDirty]);

    const handleUpdateNodeMetadata = useCallback((key: string, value: unknown) => {
        if (!selectedNodeId) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            metaData: {
                                ...(node.data.metaData as Record<string, unknown>),
                                [key]: value,
                            },
                        },
                    };
                }
                return node;
            }),
        );
        markDirty();
    }, [selectedNodeId, markDirty]);

    const handleDeleteNodeMetadata = useCallback((key: string) => {
        if (!selectedNodeId) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNodeId) {
                    const newMetadata = { ...(node.data.metaData as Record<string, unknown>) };
                    delete newMetadata[key];
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            metaData: newMetadata,
                        },
                    };
                }
                return node;
            }),
        );
        markDirty();
    }, [selectedNodeId, markDirty]);

    const handleSave = useCallback(async () => {
        if (!workflowId || saveStatus === "saving") {
            return;
        }

        const triggerNode = nodes.find((node) => node.data.kind === "trigger");
        const connectedActions = getConnectedActionNodes(nodes, edges);

        setSaveStatus("saving");
        setSaveError(null);

        try {
            await axios.post(`/api/workflow/${workflowId}`, {
                trigger: triggerNode
                    ? {
                        triggerId: triggerNode.data.catalogId,
                        metaData: triggerNode.data.metaData ?? {},
                    }
                    : null,
                actions: connectedActions.map((node, order) => ({
                    actionId: node.data.catalogId,
                    metaData: node.data.metaData ?? {},
                    order,
                })),
                nodes,
                edges,
            });
            setSaveStatus("saved");
        } catch {
            setSaveStatus("error");
            setSaveError("Could not save workflow.");
        }
    }, [edges, nodes, saveStatus, workflowId]);

    const statusLabel = saveStatus === "saving"
        ? "Saving..."
        : saveStatus === "saved"
            ? "Saved"
            : saveStatus === "error"
                ? "Save failed"
                : "Unsaved";

    return (
        <div className="relative h-full min-h-[calc(100vh-4rem)] w-full overflow-hidden">
            <div className="fixed top-6 right-10 z-10 flex items-center gap-2 rounded-lg border border-border bg-background/95 p-2 shadow-sm backdrop-blur">
                <span
                    className={
                        saveStatus === "error"
                            ? "px-2 text-xs text-destructive"
                            : "px-2 text-xs text-muted-foreground"
                    }
                >
                    {saveError ?? `${statusLabel} - ${selectedTrigger ? selectedTrigger.data.label : "No trigger"} / ${connectedActionCount} actions`}
                </span>
                <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                            New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="h-[80vh] w-150 max-w-none p-0 sm:max-w-none overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="flex h-full overflow-hidden"
                        >
                            <div className="flex w-50 flex-col border-r border-border bg-muted/30 p-4">
                                <motion.p 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3 px-2"
                                >
                                    Library
                                </motion.p>
                                <div className="flex flex-col gap-1">
                                    {[
                                        { id: 'triggers', label: 'Triggers', active: isTriggerTab },
                                        { id: 'actions', label: 'Actions', active: !isTriggerTab }
                                    ].map((tab, i) => (
                                        <motion.div
                                            key={tab.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15 + i * 0.05 }}
                                        >
                                            <Button
                                                variant={tab.active ? "secondary" : "ghost"}
                                                className={cn(
                                                    "w-full justify-start transition-all duration-200 rounded-lg",
                                                    tab.active && "bg-secondary"
                                                )}
                                                onClick={() => setActiveTab(tab.id as "triggers" | "actions")}
                                            >
                                                {tab.label}
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                                <DialogHeader className="border-border px-6 py-5">
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="mt-4 flex flex-wrap items-center gap-2"
                                    >
                                        <Input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder={`Search ${isTriggerTab ? "triggers" : "actions"}...`}
                                            className="h-10 bg-muted/50 border-border/50 focus-visible:bg-background transition-all duration-300 rounded-xl"
                                        />
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {['All', 'Popular', 'Recently used'].map((filter, i) => (
                                                <Button key={filter} size="sm" variant={i === 0 ? "outline" : "ghost"} className="rounded-full text-xs h-7">
                                                    {filter}
                                                </Button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
                                    {loadError ? (
                                        <p className="text-sm text-destructive">{loadError}</p>
                                    ) : isLoading ? (
                                        <div className="flex flex-col gap-2">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
                                            ))}
                                        </div>
                                    ) : filteredItems.length === 0 ? (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                                        >
                                            <p className="text-sm">
                                                {isTriggerTab ? "No triggers found." : "No actions found."}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 py-3">
                                            <AnimatePresence mode="popLayout">
                                                {filteredItems.map((item, i) => (
                                                    <motion.button
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ 
                                                            delay: Math.min(i * 0.03, 0.3),
                                                            ease: [0.23, 1, 0.32, 1]
                                                        }}
                                                        onClick={() => handleAddNode(item.id, item.name)}
                                                        className="group flex cursor-pointer items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                                                        key={item.id}
                                                    >
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <HugeiconsIcon icon={Calendar01Icon} size={16} />
                                                        </div>
                                                        <span className="font-medium">{item.name}</span>
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
                <Button onClick={handleSave} disabled={saveStatus === "saving" || isWorkflowLoading}>
                    <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
                    Save
                </Button>
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
                <Background />
                <Controls />
            </ReactFlow>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
                <DrawerContent className="h-full border-l border-border bg-background/95 backdrop-blur-md">
                    <DrawerHeader className="p-6 border-b border-border/50">
                        <div className="flex items-center gap-4">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "p-3 rounded-2xl",
                                    selectedNode?.data.kind === "trigger" 
                                        ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <HugeiconsIcon icon={selectedNode?.data.kind === "trigger" ? Calendar01Icon : FloppyDiskIcon} size={24} />
                            </motion.div>
                            <div>
                                <DrawerTitle className="text-xl font-semibold tracking-tight">
                                    {selectedNode?.data.label}
                                </DrawerTitle>
                                <DrawerDescription className="flex items-center gap-1.5 capitalize text-xs font-medium text-muted-foreground/80">
                                    <span className={cn(
                                        "size-1.5 rounded-full",
                                        selectedNode?.data.kind === "trigger" ? "bg-primary" : "bg-muted-foreground"
                                    )} />
                                    {selectedNode?.data.kind} Node
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground/90">
                                    <HugeiconsIcon icon={Settings01Icon} size={16} className="text-muted-foreground" />
                                    Configuration
                                </h3>
                            </div>
                            
                            <NodeSettingsForm 
                                node={selectedNode}
                                onUpdateMetadata={handleUpdateNodeMetadata}
                                onDeleteMetadata={handleDeleteNodeMetadata}
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-border/50 bg-muted/10 backdrop-blur-sm">
                        <Button 
                            variant="destructive" 
                            className="w-full h-11 gap-2 shadow-sm transition-all duration-200 active:scale-[0.98] rounded-xl hover:shadow-destructive/20"
                            onClick={handleDeleteNode}
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
