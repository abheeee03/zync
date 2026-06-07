import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Add01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { type Node } from "@xyflow/react";

interface NodeSettingsFormProps {
    node: Node<any> | undefined;
    onUpdateMetadata: (key: string, value: unknown) => void;
    onDeleteMetadata: (key: string) => void;
}

export function NodeSettingsForm({
    node,
    onUpdateMetadata,
    onDeleteMetadata
}: NodeSettingsFormProps) {
    const label = (node?.data?.label as string)?.toLowerCase() || "";
    const metadata = (node?.data?.metaData as Record<string, unknown>) || {};

    if (label.includes("http")) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">URL</label>
                    <Input 
                        value={String(metadata.url ?? "")} 
                        onChange={(e) => onUpdateMetadata("url", e.target.value)}
                        placeholder="https://api.example.com"
                        className="h-10 bg-muted/40 border-border/50 focus-visible:bg-background"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Method</label>
                    <select 
                        value={String(metadata.method ?? "POST")} 
                        onChange={(e) => onUpdateMetadata("method", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Body (JSON)</label>
                    <textarea 
                        value={String(metadata.body ?? "{}")} 
                        onChange={(e) => onUpdateMetadata("body", e.target.value)}
                        placeholder="{}"
                        className="flex min-h-32 w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
        );
    }

    if (label.includes("manual")) {
        return (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-border/50 bg-muted/5 transition-colors hover:bg-muted/10 group">
                <div className="p-3 rounded-full bg-muted/50 text-muted-foreground mb-3 group-hover:scale-110 transition-transform duration-300">
                    <HugeiconsIcon icon={Settings01Icon} size={20} />
                </div>
                <p className="text-sm font-medium text-foreground/90">Manual Trigger</p>
                <p className="text-xs text-muted-foreground mt-1">No configuration needed</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <AnimatePresence mode="popLayout" initial={false}>
                {Object.entries(metadata).map(([key, value], index) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                            delay: index * 0.04, 
                            ease: [0.23, 1, 0.32, 1],
                            duration: 0.4
                        }}
                        className="group space-y-2"
                    >
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {key}
                            </label>
                            <button 
                                onClick={() => onDeleteMetadata(key)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                            >
                                <HugeiconsIcon icon={Delete01Icon} size={12} />
                            </button>
                        </div>
                        <Input
                            value={String(value)}
                            onChange={(e) => onUpdateMetadata(key, e.target.value)}
                            className="h-10 bg-muted/40 border-border/50 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10 transition-all duration-300 rounded-lg"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {Object.keys(metadata).length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-border/50 bg-muted/5 transition-colors hover:bg-muted/10 group">
                    <div className="p-3 rounded-full bg-muted/50 text-muted-foreground mb-3 group-hover:scale-110 transition-transform duration-300">
                        <HugeiconsIcon icon={Settings01Icon} size={20} />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No options configured</p>
                </div>
            )}

            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-10 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 rounded-xl"
                    onClick={() => {
                        const key = prompt("Enter option name:");
                        if (key) onUpdateMetadata(key, "");
                    }}
                >
                    <HugeiconsIcon icon={Add01Icon} size={14} className="mr-2" />
                    Add Custom Option
                </Button>
            </motion.div>
        </div>
    );
}
