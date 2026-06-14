"use client";
import { memo } from "react";
import BaseNode from "../base-node";
import type { WorkflowNode } from "../types";
import type { NodeProps } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

// We use Calendar01Icon as the base/fallback, or try to import a clock/hourglass icon if available.
// If your icons library supports it, we'll try Clock01Icon or fallback.
import { Tick02Icon } from "@hugeicons/core-free-icons";

type NodeEditorProps = {
    value: Record<string, unknown>;
    onChange: (nextValue: Record<string, unknown>) => void;
};

function DelayActionNodeView(props: NodeProps<WorkflowNode>) {
    const metaData = props.data.metaData ?? {};
    const delayValue = typeof metaData.delayValue === "number" ? metaData.delayValue : 5;
    const delayUnit = typeof metaData.delayUnit === "string" ? metaData.delayUnit : "seconds";

    return (
        <BaseNode {...props}>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Delay Action
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    Delay for {delayValue} {delayUnit}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Pauses the workflow execution before running subsequent actions.
                </p>
            </div>
        </BaseNode>
    );
}

const PRESETS = [
    { label: "5s", value: 5, unit: "seconds" },
    { label: "30s", value: 30, unit: "seconds" },
    { label: "1m", value: 1, unit: "minutes" },
    { label: "5m", value: 5, unit: "minutes" },
    { label: "15m", value: 15, unit: "minutes" },
    { label: "30m", value: 30, unit: "minutes" },
    { label: "1h", value: 1, unit: "hours" },
    { label: "4h", value: 4, unit: "hours" },
];

function DelayActionContents({ value, onChange }: NodeEditorProps) {
    const delayValue = typeof value.delayValue === "number" ? value.delayValue : 5;
    const delayUnit = typeof value.delayUnit === "string" ? value.delayUnit : "seconds";

    const handleUnitChange = (newUnit: string) => {
        let maxVal = 60;
        if (newUnit === "hours") maxVal = 24;

        const nextVal = Math.min(delayValue, maxVal);
        onChange({
            ...value,
            delayUnit: newUnit,
            delayValue: nextVal || 1,
        });
    };

    const handleValueSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(event.target.value, 10);
        onChange({
            ...value,
            delayValue: isNaN(val) ? 5 : val,
        });
    };

    const maxSliderValue = delayUnit === "hours" ? 24 : 60;

    return (
        <div className="space-y-6">
            {/* Quick Presets */}
            <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Presets
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {PRESETS.map((preset) => {
                        const isSelected = delayValue === preset.value && delayUnit === preset.unit;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                className={`h-9 rounded-xl border text-xs font-medium transition-all active:scale-[0.97] hover:bg-muted ${
                                    isSelected
                                        ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_12px_rgba(var(--primary),0.05)]"
                                        : "border-border bg-background text-foreground/80"
                                }`}
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        delayValue: preset.value,
                                        delayUnit: preset.unit,
                                    })
                                }
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Unit Selection (Segmented Control style) */}
            <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Delay Unit
                </label>
                <div className="flex rounded-xl bg-muted/50 p-1 border border-border/50">
                    {["seconds", "minutes", "hours"].map((unit) => {
                        const isSelected = delayUnit === unit;
                        return (
                            <button
                                key={unit}
                                type="button"
                                className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg transition-all active:scale-[0.98] ${
                                    isSelected
                                        ? "bg-background text-foreground shadow-sm font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                onClick={() => handleUnitChange(unit)}
                            >
                                {unit}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Slider Select for Value */}
            <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Duration
                    </label>
                    <span className="text-sm font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                        {delayValue} {delayUnit}
                    </span>
                </div>

                <div className="space-y-1">
                    <input
                        type="range"
                        min="1"
                        max={maxSliderValue}
                        value={delayValue}
                        onChange={handleValueSliderChange}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>1 {delayUnit}</span>
                        <span>
                            {maxSliderValue} {delayUnit}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Summary & Detail Box */}
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                    ⏳ Delay Details
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    When the execution reaches this node, it will pause for exactly{" "}
                    <strong className="text-foreground">{delayValue} {delayUnit}</strong> before
                    triggering the subsequent actions in the flow.
                </p>
            </div>
        </div>
    );
}

export const DelayActionNode = memo(DelayActionNodeView);
export { DelayActionContents };
