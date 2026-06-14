"use client";
import { memo } from "react";
import { Input } from "@/components/ui/input";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { VariableSuggestions, type VariableInfo } from "../variable-suggestions";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
    variables?: VariableInfo[];
};

function TransformActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const operation = typeof metaData.operation === "string" ? metaData.operation : "custom";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Transform Action
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground capitalize">
                    {operation === "custom" ? "Custom template" : `${operation} text`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Modifies text or variables and passes the output to subsequent steps.
                </p>
            </div>
        </BaseNode>
    );
}

function TransformActionContents({ value, onChange, variables }: NodeEditorProps) {
    const input = typeof value.input === "string" ? value.input : "";
    const operation = typeof value.operation === "string" ? value.operation : "custom";
    const searchText = typeof value.searchText === "string" ? value.searchText : "";
    const replaceText = typeof value.replaceText === "string" ? value.replaceText : "";
    const appendText = typeof value.appendText === "string" ? value.appendText : "";
    const prependText = typeof value.prependText === "string" ? value.prependText : "";

    const handleOperationChange = (newOperation: string) => {
        onChange({
            ...value,
            operation: newOperation,
        });
    };

    return (
        <div className="space-y-4">
            <VariableSuggestions variables={variables ?? []} />

            {/* Input Text/Variable */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Input Value
                </label>
                <textarea
                    value={input}
                    placeholder="Enter static text or paste context variables (e.g. {data.message})"
                    onChange={(event) =>
                        onChange({
                            ...value,
                            input: event.target.value,
                        })
                    }
                    className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
            </div>

            {/* Operation Type Dropdown */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Transformation Type
                </label>
                <select
                    value={operation}
                    onChange={(e) => handleOperationChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                >
                    <option value="custom">Custom (Direct Input / Template)</option>
                    <option value="uppercase">Uppercase (A-Z)</option>
                    <option value="lowercase">Lowercase (a-z)</option>
                    <option value="trim">Trim (remove leading/trailing spaces)</option>
                    <option value="replace">Replace Text (find & replace)</option>
                    <option value="append">Append (add text to end)</option>
                    <option value="prepend">Prepend (add text to start)</option>
                </select>
            </div>

            {/* Conditional Settings Fields */}
            {operation === "replace" && (
                <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/15">
                    <p className="text-xs font-semibold text-foreground">Replace Configuration</p>
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium text-muted-foreground">Search Text</label>
                        <Input
                            value={searchText}
                            placeholder="Text to look for"
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    searchText: event.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium text-muted-foreground">Replace With</label>
                        <Input
                            value={replaceText}
                            placeholder="Text to replace with"
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    replaceText: event.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            )}

            {operation === "append" && (
                <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-muted/15">
                    <label className="text-xs font-semibold text-foreground">Text to Append</label>
                    <Input
                        value={appendText}
                        placeholder="Text to add to the end"
                        onChange={(event) =>
                            onChange({
                                ...value,
                                appendText: event.target.value,
                            })
                        }
                    />
                </div>
            )}

            {operation === "prepend" && (
                <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-muted/15">
                    <label className="text-xs font-semibold text-foreground">Text to Prepend</label>
                    <Input
                        value={prependText}
                        placeholder="Text to add to the start"
                        onChange={(event) =>
                            onChange({
                                ...value,
                                prependText: event.target.value,
                            })
                        }
                    />
                </div>
            )}

            {/* Output Instruction Info Box */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">💡 Variable Output</p>
                <p>
                    The transformed text is saved in the <code className="font-mono text-primary font-semibold">{`{transform.result}`}</code> field.
                </p>
                <p>
                    Use <code className="font-mono text-primary font-semibold">{`{transform.result}`}</code> in subsequent action cards to dynamically reference the output.
                </p>
            </div>
        </div>
    );
}

export const TransformActionNode = memo(TransformActionNodeView);
export { TransformActionContents };
