import type { Edge, Node } from "@xyflow/react";

export type WorkflowNodeKind = "trigger" | "action";

export type WorkflowNodeData = {
    catalogId: string;
    label: string;
    kind: WorkflowNodeKind;
    metaData?: Record<string, unknown>;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflow">;
export type WorkflowEdge = Edge<Record<string, never>>;
