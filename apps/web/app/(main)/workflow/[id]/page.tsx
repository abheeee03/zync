"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import {
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
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
import { Input } from "@/components/ui/input";
import { AvailableActions, AvailableTriggers } from "@repo/shared/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    Calendar01Icon,
    FloppyDiskIcon,
} from "@hugeicons/core-free-icons";

type WorkflowNodeKind = "trigger" | "action";

type WorkflowNodeData = {
    catalogId: string;
    kind: WorkflowNodeKind;
    label: string;
    metaData?: Record<string, unknown>;
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

function WorkflowNodeCard({ data, isConnectable }: NodeProps<WorkflowNode>) {
    const isTrigger = data.kind === "trigger";

    return (
        <div className="bg-background border-accent border-2 min-w-60 rounded-xl px-4 py-3 text-sm text-card-foreground">
            {!isTrigger && (
                <Handle
                    type="target"
                    position={Position.Left}
                    isConnectable={isConnectable}
                    className="!size-3 !border-2 !border-background !bg-primary"
                />
            )}
            <div className="flex items-center gap-3">
                <div
                    className={
                        isTrigger
                            ? "flex size-9 items-center justify-center rounded-md text-primary"
                            : "flex size-9 items-center justify-center rounded-md text-muted-foreground"
                    }
                >
                    <HugeiconsIcon icon={isTrigger ? Calendar01Icon : FloppyDiskIcon} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        {isTrigger ? "Trigger" : "Action"}
                    </p>
                    <p className="truncate font-medium">{data.label}</p>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!size-3 !border-2 !border-background !bg-primary"
            />
        </div>
    );
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
                        metaData: {},
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
                    <DialogContent className="h-[80vh] w-150 max-w-none p-0 sm:max-w-none">
                        <div className="flex h-full overflow-hidden rounded-xl">
                            <div className="flex w-50 flex-col border-r border-border bg-muted/30 p-4">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Library</p>
                                <div className="mt-3 flex flex-col gap-1">
                                    <Button
                                        variant={isTriggerTab ? "secondary" : "ghost"}
                                        className="justify-start"
                                        onClick={() => setActiveTab("triggers")}
                                    >
                                        Triggers
                                    </Button>
                                    <Button
                                        variant={!isTriggerTab ? "secondary" : "ghost"}
                                        className="justify-start"
                                        onClick={() => setActiveTab("actions")}
                                    >
                                        Actions
                                    </Button>
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                                <DialogHeader className="border-border px-2 py-5">
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder={`Search ${isTriggerTab ? "triggers" : "actions"}...`}
                                            className="h-9 max-w-md"
                                        />
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <Button size="sm" variant="outline" className="rounded-full">
                                                All
                                            </Button>
                                            <Button size="sm" variant="ghost" className="rounded-full">
                                                Popular
                                            </Button>
                                            <Button size="sm" variant="ghost" className="rounded-full">
                                                Recently used
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-5">
                                    {loadError ? (
                                        <p className="text-sm text-destructive">{loadError}</p>
                                    ) : isLoading ? (
                                        <p className="text-sm text-muted-foreground">Loading...</p>
                                    ) : filteredItems.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {isTriggerTab ? "No triggers found." : "No actions found."}
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredItems.map((item) => (
                                                <button
                                                    onClick={() => handleAddNode(item.id, item.name)}
                                                    className="flex cursor-pointer items-center justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                                                    key={item.id}
                                                >
                                                    <span>
                                                        <HugeiconsIcon icon={Calendar01Icon} />
                                                    </span>
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                isValidConnection={isValidConnection}
                colorMode={theme === "light" ? "light" : "dark"}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

export default WorkflowPage;
