"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Calendar01Icon,
    Globe02Icon,
    AiBrain01Icon,
    Time04Icon,
    GitCompareIcon,
    WebhookIcon,
} from "@hugeicons/core-free-icons";
import {
    GithubIcon,
    NotionIcon,
    GeminiIcon,
    ClaudeIcon,
    OpenaiIcon,
} from "@/components/icons";

type NodeIconProps = {
    label: string;
    kind: "trigger" | "action";
    size?: number;
    className?: string;
};

export function NodeIcon({ label, kind, size = 16, className }: NodeIconProps): ReactNode {
    const name = label.toLowerCase();
    if (kind === "trigger") {
        if (
            name.includes("github") ||
            name.includes("push") ||
            name.includes("pull_request") ||
            name.includes("issue_opened") ||
            name.includes("release_published")
        ) {
            return <GithubIcon width={size} height={size} className={className} />;
        }
        if (name.includes("webhook")) {
            return <HugeiconsIcon icon={WebhookIcon} size={size} className={className} />;
        }
        if (name.includes("schedule")) {
            return <HugeiconsIcon icon={Time04Icon} size={size} className={className} />;
        }
        return <HugeiconsIcon icon={Calendar01Icon} size={size} className={className} />;
    }

    if (name.includes("notion")) {
        return <NotionIcon width={size} height={size} className={className} />;
    }
    if (
        name.includes("github") ||
        name.includes("create_issue") ||
        name.includes("create_comment") ||
        name.includes("create_pr") ||
        name.includes("create_branch") ||
        name.includes("get_repo")
    ) {
        return <GithubIcon width={size} height={size} className={className} />;
    }
    if (name.includes("ai")) {
        return <HugeiconsIcon icon={AiBrain01Icon} size={size} className={className} />;
    }
    if (name.includes("delay")) {
        return <HugeiconsIcon icon={Time04Icon} size={size} className={className} />;
    }
    if (name.includes("transform")) {
        return <HugeiconsIcon icon={GitCompareIcon} size={size} className={className} />;
    }
    if (name.includes("webhook")) {
        return <HugeiconsIcon icon={WebhookIcon} size={size} className={className} />;
    }

    return <HugeiconsIcon icon={Globe02Icon} size={size} className={className} />;
}

export function AiProviderIcon({ provider, size = 14 }: { provider: string; size?: number }): ReactNode {
    if (provider === "gemini") return <GeminiIcon width={size} height={size} />;
    if (provider === "claude") return <ClaudeIcon width={size} height={size} />;
    if (provider === "chatgpt") return <OpenaiIcon width={size} height={size} />;
    return <HugeiconsIcon icon={AiBrain01Icon} size={size} />;
}
