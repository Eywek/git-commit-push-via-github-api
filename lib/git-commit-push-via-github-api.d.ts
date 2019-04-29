/// <reference types="node" />
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
    token?: string;
}
export declare const gitCommitPush: (
    options: GitCommitPushOptions
) => Promise<GitHubApi.Response<GitHubApi.GitUpdateRefResponse>> | undefined;
