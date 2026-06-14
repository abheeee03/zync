"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/loader";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockPasswordIcon, Tick02Icon, Loading03Icon, Cancel01Icon, HelpCircleIcon } from "@hugeicons/core-free-icons";
import { sileo } from "sileo";

type IntegrationStatus = {
    connected: boolean;
    workspaceName: string | null;
    loading: boolean;
};

export default function CredentialsPage() {
    const [notionStatus, setNotionStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });
    const [geminiStatus, setGeminiStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });

    const [apiKey, setApiKey] = useState("");
    const [isConnectingGemini, setIsConnectingGemini] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchStatuses = async () => {
        try {
            const notionRes = await axios.get("/api/notion/status");
            setNotionStatus({
                connected: notionRes.data.connected,
                workspaceName: notionRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setNotionStatus((prev) => ({ ...prev, loading: false }));
        }

        try {
            const geminiRes = await axios.get("/api/gemini/status");
            setGeminiStatus({
                connected: geminiRes.data.connected,
                workspaceName: geminiRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setGeminiStatus((prev) => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        void fetchStatuses();
    }, []);

    const handleConnectNotion = () => {
        window.location.href = "/api/notion/connect";
    };

    const handleDisconnectNotion = async () => {
        try {
            await axios.delete("/api/notion/status");
            setNotionStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected Notion successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect Notion" });
        }
    };

    const handleConnectGemini = async () => {
        if (!apiKey.trim()) {
            sileo.error({ title: "Please enter a valid API key" });
            return;
        }
        setIsConnectingGemini(true);
        try {
            await axios.post("/api/gemini/connect", { apiKey });
            setGeminiStatus({ connected: true, workspaceName: "Gemini API", loading: false });
            setApiKey("");
            setIsDialogOpen(false);
            sileo.success({ title: "Connected Gemini successfully!" });
        } catch {
            sileo.error({ title: "Failed to connect Gemini" });
        } finally {
            setIsConnectingGemini(false);
        }
    };

    const handleDisconnectGemini = async () => {
        try {
            await axios.delete("/api/gemini/status");
            setGeminiStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected Gemini successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect Gemini" });
        }
    };

    const isLoading = notionStatus.loading || geminiStatus.loading;

    if (isLoading) {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 py-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
                <p className="text-muted-foreground mt-1">
                    Manage authentication credentials and connection status for integrations.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                {/* Notion Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-foreground text-background font-bold text-xs select-none">
                                    N
                                </span>
                                Notion
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Automate databases, query schemas, and append content blocks.
                            </CardDescription>
                        </div>
                        {notionStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {notionStatus.connected ? (
                                <span>Workspace: <strong className="text-foreground">{notionStatus.workspaceName}</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {notionStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectNotion} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleConnectNotion}>
                                Connect Notion
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Gemini Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-gradient-to-tr from-blue-600 to-indigo-400 text-white font-bold text-xs select-none">
                                    G
                                </span>
                                Gemini AI
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Process logic, rewrite content, or respond dynamically using Google's models.
                            </CardDescription>
                        </div>
                        {geminiStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {geminiStatus.connected ? (
                                <span>Status: <strong className="text-foreground">Active Key</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {geminiStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectGemini} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Connect Gemini</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Connect Gemini API</DialogTitle>
                                        <DialogDescription>
                                            Paste your Gemini API key below to enable LLM content generation in workflow nodes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-2">
                                        <div className="space-y-1">
                                            <Input
                                                id="gemini-key"
                                                type="password"
                                                placeholder="Enter API Key"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleConnectGemini}
                                            disabled={isConnectingGemini}
                                            className="w-full sm:w-auto"
                                        >
                                            {isConnectingGemini ? (
                                                <>
                                                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                                                    Connecting
                                                </>
                                            ) : (
                                                "Save API Key"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardContent>
                </Card>

                {/* ChatGPT Card - Scalability */}
                <Card className="flex flex-col justify-between border-border/40 bg-muted/5 opacity-60">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-teal-600 text-white font-bold text-xs select-none">
                                    O
                                </span>
                                ChatGPT (OpenAI)
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Integrate OpenAI models dynamically in your workflow logic.
                            </CardDescription>
                        </div>
                        <div className="rounded-full bg-muted border border-border/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                            Coming Soon
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">Future integration support</div>
                        <Button disabled size="sm" variant="outline">
                            Connect
                        </Button>
                    </CardContent>
                </Card>

                {/* Claude Card - Scalability */}
                <Card className="flex flex-col justify-between border-border/40 bg-muted/5 opacity-60">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-orange-700 text-white font-bold text-xs select-none">
                                    A
                                </span>
                                Claude (Anthropic)
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Integrate Anthropic models dynamically in your workflow logic.
                            </CardDescription>
                        </div>
                        <div className="rounded-full bg-muted border border-border/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                            Coming Soon
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">Future integration support</div>
                        <Button disabled size="sm" variant="outline">
                            Connect
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
