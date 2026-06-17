import axios from "axios";
import { prisma } from "@repo/prisma/client";

export const executeGithubAction = async (actionName: string, metaData: any, userId: string) => {
    let actionType = typeof metaData.actionType === "string" ? metaData.actionType : "";

    // Normalize action name checks to support direct action types
    const normalizedName = actionName.toLowerCase();
    if (normalizedName === "create_issue") actionType = "create_issue";
    else if (normalizedName === "create_comment") actionType = "create_comment";
    else if (normalizedName === "create_pr") actionType = "create_pr";
    else if (normalizedName === "create_branch") actionType = "create_branch";
    else if (normalizedName === "get_repo") actionType = "get_repo";

    if (!actionType) {
        actionType = "create_issue"; // Default fallback
    }

    const repo = typeof metaData.repo === "string" ? metaData.repo.trim() : "";
    if (!repo) {
        throw new Error(`Repository is required for GitHub action: ${actionType}`);
    }

    const credential = await prisma.credential.findUnique({
        where: { id: `github-${userId}` },
    });

    if (!credential) {
        throw new Error(`GitHub credential not found for user: ${userId}`);
    }

    const headers = {
        Authorization: `token ${credential.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Zync-Workflow-Engine",
    };

    const baseUrl = "https://api.github.com";

    switch (actionType) {
        case "create_issue": {
            const title = typeof metaData.title === "string" ? metaData.title : "";
            const body = typeof metaData.body === "string" ? metaData.body : "";

            if (!title) {
                throw new Error("Title is required to create an issue");
            }

            const response = await axios.post(
                `${baseUrl}/repos/${repo}/issues`,
                { title, body },
                { headers }
            );

            console.log("GitHub issue created successfully:", response.data.html_url);
            return {
                issueId: response.data.id,
                issueNumber: response.data.number,
                url: response.data.html_url,
            };
        }

        case "create_comment": {
            const body = typeof metaData.body === "string" ? metaData.body : "";
            const rawNumber = metaData.issueNumber || metaData.number || metaData.prNumber;
            const issueNumber = Number(rawNumber);

            if (!body) {
                throw new Error("Comment body is required");
            }
            if (isNaN(issueNumber) || issueNumber <= 0) {
                throw new Error(`Invalid issue or pull request number: ${rawNumber}`);
            }

            const response = await axios.post(
                `${baseUrl}/repos/${repo}/issues/${issueNumber}/comments`,
                { body },
                { headers }
            );

            console.log("GitHub comment created successfully:", response.data.html_url);
            return {
                commentId: response.data.id,
                url: response.data.html_url,
            };
        }

        case "create_pr": {
            const title = typeof metaData.title === "string" ? metaData.title : "";
            const head = typeof metaData.head === "string" ? metaData.head : "";
            const base = typeof metaData.base === "string" ? metaData.base : "main";
            const body = typeof metaData.body === "string" ? metaData.body : "";

            if (!title) throw new Error("Pull request title is required");
            if (!head) throw new Error("Pull request head branch is required");

            const response = await axios.post(
                `${baseUrl}/repos/${repo}/pulls`,
                { title, head, base, body },
                { headers }
            );

            console.log("GitHub PR created successfully:", response.data.html_url);
            return {
                prId: response.data.id,
                prNumber: response.data.number,
                url: response.data.html_url,
            };
        }

        case "create_branch": {
            const branchName = typeof metaData.branchName === "string" ? metaData.branchName : "";
            const baseBranch = typeof metaData.baseBranch === "string" ? metaData.baseBranch : "main";

            if (!branchName) throw new Error("New branch name is required");

            // 1. Get the SHA of the base branch
            const refRes = await axios.get(
                `${baseUrl}/repos/${repo}/git/ref/heads/${baseBranch}`,
                { headers }
            );
            const sha = refRes.data?.object?.sha;
            if (!sha) {
                throw new Error(`Failed to find base branch ${baseBranch} SHA`);
            }

            // 2. Create the new ref
            const response = await axios.post(
                `${baseUrl}/repos/${repo}/git/refs`,
                {
                    ref: `refs/heads/${branchName}`,
                    sha,
                },
                { headers }
            );

            console.log(`GitHub branch created successfully: refs/heads/${branchName}`);
            return {
                ref: response.data.ref,
                sha: response.data.object?.sha,
            };
        }

        case "get_repo": {
            const response = await axios.get(`${baseUrl}/repos/${repo}`, { headers });
            return {
                name: response.data.name,
                fullName: response.data.full_name,
                description: response.data.description,
                defaultBranch: response.data.default_branch,
                stars: response.data.stargazers_count,
                url: response.data.html_url,
            };
        }

        default:
            throw new Error(`Unsupported GitHub actionType: ${actionType}`);
    }
};
