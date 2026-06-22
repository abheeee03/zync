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
import { NotionIcon, GithubIcon, GeminiIcon, OpenaiIcon, ClaudeIcon, OpenRouterIcon } from "@/components/icons";

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
    const [chatgptStatus, setChatgptStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });
    const [claudeStatus, setClaudeStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });
    const [githubStatus, setGithubStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });

    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [isConnectingGemini, setIsConnectingGemini] = useState(false);
    const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);

    const [chatgptApiKey, setChatgptApiKey] = useState("");
    const [isConnectingChatgpt, setIsConnectingChatgpt] = useState(false);
    const [isChatgptDialogOpen, setIsChatgptDialogOpen] = useState(false);

    const [claudeApiKey, setClaudeApiKey] = useState("");
    const [isConnectingClaude, setIsConnectingClaude] = useState(false);
    const [isClaudeDialogOpen, setIsClaudeDialogOpen] = useState(false);

    const [openrouterStatus, setOpenrouterStatus] = useState<IntegrationStatus>({
        connected: false,
        workspaceName: null,
        loading: true,
    });
    const [openrouterApiKey, setOpenrouterApiKey] = useState("");
    const [isConnectingOpenRouter, setIsConnectingOpenRouter] = useState(false);
    const [isOpenRouterDialogOpen, setIsOpenRouterDialogOpen] = useState(false);

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
            const geminiRes = await axios.get("/api/llm/gemini");
            setGeminiStatus({
                connected: geminiRes.data.connected,
                workspaceName: geminiRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setGeminiStatus((prev) => ({ ...prev, loading: false }));
        }

        try {
            const chatgptRes = await axios.get("/api/llm/chatgpt");
            setChatgptStatus({
                connected: chatgptRes.data.connected,
                workspaceName: chatgptRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setChatgptStatus((prev) => ({ ...prev, loading: false }));
        }

        try {
            const claudeRes = await axios.get("/api/llm/claude");
            setClaudeStatus({
                connected: claudeRes.data.connected,
                workspaceName: claudeRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setClaudeStatus((prev) => ({ ...prev, loading: false }));
        }

        try {
            const openrouterRes = await axios.get("/api/llm/openrouter");
            setOpenrouterStatus({
                connected: openrouterRes.data.connected,
                workspaceName: openrouterRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setOpenrouterStatus((prev) => ({ ...prev, loading: false }));
        }

        try {
            const githubRes = await axios.get("/api/github/status");
            setGithubStatus({
                connected: githubRes.data.connected,
                workspaceName: githubRes.data.workspaceName,
                loading: false,
            });
        } catch {
            setGithubStatus((prev) => ({ ...prev, loading: false }));
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

    const handleConnectGithub = () => {
        window.location.href = "/api/github/connect";
    };

    const handleDisconnectGithub = async () => {
        try {
            await axios.delete("/api/github/status");
            setGithubStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected GitHub successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect GitHub" });
        }
    };

    const handleConnectGemini = async () => {
        if (!geminiApiKey.trim()) {
            sileo.error({ title: "Please enter a valid API key" });
            return;
        }
        setIsConnectingGemini(true);
        try {
            await axios.post("/api/llm/gemini", { apiKey: geminiApiKey });
            setGeminiStatus({ connected: true, workspaceName: "Gemini API", loading: false });
            setGeminiApiKey("");
            setIsGeminiDialogOpen(false);
            sileo.success({ title: "Connected Gemini successfully!" });
        } catch {
            sileo.error({ title: "Failed to connect Gemini" });
        } finally {
            setIsConnectingGemini(false);
        }
    };

    const handleDisconnectGemini = async () => {
        try {
            await axios.delete("/api/llm/gemini");
            setGeminiStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected Gemini successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect Gemini" });
        }
    };

    const handleConnectChatgpt = async () => {
        if (!chatgptApiKey.trim()) {
            sileo.error({ title: "Please enter a valid API key" });
            return;
        }
        setIsConnectingChatgpt(true);
        try {
            await axios.post("/api/llm/chatgpt", { apiKey: chatgptApiKey });
            setChatgptStatus({ connected: true, workspaceName: "OpenAI API", loading: false });
            setChatgptApiKey("");
            setIsChatgptDialogOpen(false);
            sileo.success({ title: "Connected ChatGPT successfully!" });
        } catch {
            sileo.error({ title: "Failed to connect ChatGPT" });
        } finally {
            setIsConnectingChatgpt(false);
        }
    };

    const handleDisconnectChatgpt = async () => {
        try {
            await axios.delete("/api/llm/chatgpt");
            setChatgptStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected ChatGPT successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect ChatGPT" });
        }
    };

    const handleConnectClaude = async () => {
        if (!claudeApiKey.trim()) {
            sileo.error({ title: "Please enter a valid API key" });
            return;
        }
        setIsConnectingClaude(true);
        try {
            await axios.post("/api/llm/claude", { apiKey: claudeApiKey });
            setClaudeStatus({ connected: true, workspaceName: "Anthropic API", loading: false });
            setClaudeApiKey("");
            setIsClaudeDialogOpen(false);
            sileo.success({ title: "Connected Claude successfully!" });
        } catch {
            sileo.error({ title: "Failed to connect Claude" });
        } finally {
            setIsConnectingClaude(false);
        }
    };

    const handleDisconnectClaude = async () => {
        try {
            await axios.delete("/api/llm/claude");
            setClaudeStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected Claude successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect Claude" });
        }
    };

    const handleConnectOpenRouter = async () => {
        if (!openrouterApiKey.trim()) {
            sileo.error({ title: "Please enter a valid API key" });
            return;
        }
        setIsConnectingOpenRouter(true);
        try {
            await axios.post("/api/llm/openrouter", { apiKey: openrouterApiKey });
            setOpenrouterStatus({ connected: true, workspaceName: "OpenRouter API", loading: false });
            setOpenrouterApiKey("");
            setIsOpenRouterDialogOpen(false);
            sileo.success({ title: "Connected OpenRouter successfully!" });
        } catch {
            sileo.error({ title: "Failed to connect OpenRouter" });
        } finally {
            setIsConnectingOpenRouter(false);
        }
    };

    const handleDisconnectOpenRouter = async () => {
        try {
            await axios.delete("/api/llm/openrouter");
            setOpenrouterStatus({ connected: false, workspaceName: null, loading: false });
            sileo.success({ title: "Disconnected OpenRouter successfully" });
        } catch {
            sileo.error({ title: "Failed to disconnect OpenRouter" });
        }
    };

    const isLoading = notionStatus.loading || geminiStatus.loading || chatgptStatus.loading || claudeStatus.loading || openrouterStatus.loading || githubStatus.loading;

    if (isLoading) {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full space-y-8 py-6 px-6">

            <div className="grid gap-6 sm:grid-cols-2">
                {/* Notion Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <NotionIcon className="size-7 rounded" />
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

                {/* GitHub Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-zinc-950 dark:bg-zinc-900 text-white select-none border border-border/30">
                                    <GithubIcon className="size-4" />
                                </span>
                                GitHub
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Automate repositories, pull requests, issues, comments, and branches.
                            </CardDescription>
                        </div>
                        {githubStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {githubStatus.connected ? (
                                <span>Username: <strong className="text-foreground">{githubStatus.workspaceName}</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {githubStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectGithub} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleConnectGithub}>
                                Connect GitHub
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Gemini Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <GeminiIcon className="size-7 rounded" />
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
                            <Dialog open={isGeminiDialogOpen} onOpenChange={setIsGeminiDialogOpen}>
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
                                                value={geminiApiKey}
                                                onChange={(e) => setGeminiApiKey(e.target.value)}
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

                {/* ChatGPT Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-teal-800/80 text-white select-none">
                                    <OpenaiIcon className="size-4.5" />
                                </span>
                                ChatGPT (OpenAI)
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Integrate OpenAI models dynamically in your workflow logic.
                            </CardDescription>
                        </div>
                        {chatgptStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {chatgptStatus.connected ? (
                                <span>Status: <strong className="text-foreground">Active Key</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {chatgptStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectChatgpt} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Dialog open={isChatgptDialogOpen} onOpenChange={setIsChatgptDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Connect ChatGPT</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Connect OpenAI API</DialogTitle>
                                        <DialogDescription>
                                            Paste your OpenAI API key below to enable ChatGPT content generation in workflow nodes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-2">
                                        <div className="space-y-1">
                                            <Input
                                                id="chatgpt-key"
                                                type="password"
                                                placeholder="Enter OpenAI API Key"
                                                value={chatgptApiKey}
                                                onChange={(e) => setChatgptApiKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleConnectChatgpt}
                                            disabled={isConnectingChatgpt}
                                            className="w-full sm:w-auto"
                                        >
                                            {isConnectingChatgpt ? (
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

                {/* Claude Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-orange-950/40 text-[#d97757] select-none border border-orange-500/10">
                                    <ClaudeIcon className="size-5" />
                                </span>
                                Claude (Anthropic)
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Integrate Anthropic models dynamically in your workflow logic.
                            </CardDescription>
                        </div>
                        {claudeStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {claudeStatus.connected ? (
                                <span>Status: <strong className="text-foreground">Active Key</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {claudeStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectClaude} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Dialog open={isClaudeDialogOpen} onOpenChange={setIsClaudeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Connect Claude</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Connect Anthropic API</DialogTitle>
                                        <DialogDescription>
                                            Paste your Anthropic API key below to enable Claude content generation in workflow nodes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-2">
                                        <div className="space-y-1">
                                            <Input
                                                id="claude-key"
                                                type="password"
                                                placeholder="Enter Anthropic API Key"
                                                value={claudeApiKey}
                                                onChange={(e) => setClaudeApiKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleConnectClaude}
                                            disabled={isConnectingClaude}
                                            className="w-full sm:w-auto"
                                        >
                                            {isConnectingClaude ? (
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

                {/* OpenRouter Card */}
                <Card className="flex flex-col justify-between border-border/60 bg-muted/10">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded bg-violet-950/40 text-violet-400 select-none border border-violet-500/10">
                                    <OpenRouterIcon className="size-4" />
                                </span>
                                OpenRouter
                            </CardTitle>
                            <CardDescription className="pt-2 text-xs">
                                Access GPT-4o, Claude, Llama, Mistral, DeepSeek and 200+ models via a single unified API.
                            </CardDescription>
                        </div>
                        {openrouterStatus.connected && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                <HugeiconsIcon icon={Tick02Icon} size={12} />
                                Connected
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">
                            {openrouterStatus.connected ? (
                                <span>Status: <strong className="text-foreground">Active Key</strong></span>
                            ) : (
                                <span>Not connected</span>
                            )}
                        </div>
                        {openrouterStatus.connected ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectOpenRouter} className="text-destructive hover:bg-destructive/10">
                                Disconnect
                            </Button>
                        ) : (
                            <Dialog open={isOpenRouterDialogOpen} onOpenChange={setIsOpenRouterDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Connect OpenRouter</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Connect OpenRouter API</DialogTitle>
                                        <DialogDescription>
                                            Paste your OpenRouter API key to access 200+ models including GPT-4o, Claude, Llama, and Mistral in workflow nodes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-2">
                                        <div className="space-y-1">
                                            <Input
                                                id="openrouter-key"
                                                type="password"
                                                placeholder="sk-or-..."
                                                value={openrouterApiKey}
                                                onChange={(e) => setOpenrouterApiKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleConnectOpenRouter}
                                            disabled={isConnectingOpenRouter}
                                            className="w-full sm:w-auto"
                                        >
                                            {isConnectingOpenRouter ? (
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
            </div>
        </div>
    );
}
