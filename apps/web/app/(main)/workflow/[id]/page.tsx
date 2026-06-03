"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Controls, ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AvailableActions, AvailableTriggers } from "@repo/shared/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

interface INode {
    id: String,
    position: { x: Number, y: Number },
    data: { label: String },
    type: String,
}

interface IEdge{
    id: String,
    source: String,
    target: String,
}

function WorkflowPage() {
    const { theme } = useTheme()
    const [activeTab, setActiveTab] = useState<"triggers" | "actions">("triggers");
    const [availableTriggers, setAvailableTriggers] = useState<AvailableTriggers[]>([]);
    const [availableActions, setAvailableActions] = useState<AvailableActions[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const isTriggerTab = activeTab === "triggers";
    const activeItems = isTriggerTab ? availableTriggers : availableActions;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredItems = normalizedSearch.length
        ? activeItems.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
        : activeItems;

    const [nodes, setNodes] = useState<INode[]>([]);
    const [edges, setEdges] = useState<IEdge[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const response = await axios.get("/api/workflow");
                setAvailableTriggers(response.data?.triggers ?? []);
                setAvailableActions(response.data?.actions ?? []);
            } catch (error) {
                setLoadError("Failed to load triggers and actions.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadOptions();
    }, []);


    const handleAddNode = (id: String, name: String)=>{
        if (!nodes) {
            setNodes([
            {
            id,
            position: {
                x: 0,
                y: 0
            },
            type: name,
            data: {
                label: name
            }
            }
        ])
        }
        setNodes(prevNodes => [...prevNodes, {
            id,
            position: {
                x: 0,
                y: 0
            },
            type: "input",
            data: {
                label: name
            }
        }])
    }


    return (
        <>
            <div className="fixed top-6 right-10">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>New</Button>
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
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
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
                                                onClick={()=>{
                                                    handleAddNode(item.id, item.name)
                                                }}
                                                className="text-left text-md flex gap-2 items-center justify-start cursor-pointer px-2 py-2 hover:bg-accent rounded-xl" 
                                                key={item.id}>
                                                    <span>
                                                        <HugeiconsIcon icon={Calendar01Icon}/>
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
            </div>
            <div style={{ height: '100%', width: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    colorMode={theme == 'light' ? undefined : 'dark'}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </>
    )
}

export default WorkflowPage