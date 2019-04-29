import * as GitHubApi from "@octokit/rest";

export interface GitCommitFile {
    path: string;
    content: string | Buffer;
}
export interface GitCommitPushOptions {
    owner: string;
    repo: string;
    files: GitCommitFile[];
    fullyQualifiedRef: string;
    forceUpdate?: boolean;
    commitMessage?: string;
    token?: string; // or process.env.GITHUB_API_TOKEN
}

const debug = require("debug")("git-commit-push-via-github-api");
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

const getReferenceCommit = async (github: GitHubApi, options: GitCommitPushOptions) => {
    const res = await github.git.getRef({
        owner: options.owner,
        repo: options.repo,
        ref: options.fullyQualifiedRef
    });
    debug("getReferenceCommit Response: %O", res);
    return { referenceCommitSha: res.data.object.sha };
};

const createTree = async (github: GitHubApi, options: GitCommitPushOptions, data: any) => {
    const files: GitHubApi.GitCreateTreeParamsTree[] = await Promise.all(
        options.files.map(async file => {
            const blob = await github.git.createBlob({
                owner: options.owner,
                repo: options.repo,
                content: Buffer.isBuffer(file.content) ? file.content.toString("base64") : file.content,
                encoding: Buffer.isBuffer(file.content) ? "base64" : "utf-8"
            });
            return {
                sha: blob.data.sha,
                path: file.path,
                mode: "100644",
                type: "blob"
            } as GitHubApi.GitCreateTreeParamsTree;
        })
    );
    debug("files: %O", files);

    const tree = await github.git.createTree({
        owner: options.owner,
        repo: options.repo,
        tree: files,
        base_tree: data.referenceCommitSha
    });
    debug("createTree Response: %O", tree);
    return Object.assign(data, { newTreeSha: tree.data.sha });
};

const createCommit = async (github: GitHubApi, options: GitCommitPushOptions, data: any) => {
    const commit = await github.git.createCommit({
        owner: options.owner,
        repo: options.repo,
        message: options.commitMessage || "commit",
        tree: data.newTreeSha,
        parents: [data.referenceCommitSha]
    });

    debug("createCommit Response: %O", commit);
    return Object.assign(data, { newCommitSha: commit.data.sha });
};

const updateReference = async (github: GitHubApi, options: GitCommitPushOptions, data: any) => {
    const ref = await github.git.updateRef({
        owner: options.owner,
        repo: options.repo,
        ref: options.fullyQualifiedRef,
        sha: data.newCommitSha,
        force: options.forceUpdate
    });
    debug("updateReference Response: %O", ref);
    return ref;
};

export const gitCommitPush = (options: GitCommitPushOptions) => {
    if (!options.owner || !options.repo || !options.files || !options.files.length) {
        return;
    }
    const token = options.token || GITHUB_API_TOKEN;
    if (!token) {
        throw new Error(`token is not defined`);
    }
    const gitHub = new GitHubApi();
    gitHub.authenticate({ type: "oauth", token });
    const filledOptions = {
        owner: options.owner,
        repo: options.repo,
        files: options.files,
        fullyQualifiedRef: options.fullyQualifiedRef || "heads/dev",
        forceUpdate: options.forceUpdate || false,
        commitMessage: options.commitMessage || "Commit - " + new Date().getTime().toString()
    };
    debug("options %O", options);
    return getReferenceCommit(gitHub, filledOptions)
        .then(data => createTree(gitHub, filledOptions, data))
        .then(data => createCommit(gitHub, filledOptions, data))
        .then(data => updateReference(gitHub, filledOptions, data));
};
