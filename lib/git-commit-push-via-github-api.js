"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function(thisArg, body) {
        var _ = {
                label: 0,
                sent: function() {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function() {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function(v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [0, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var GitHubApi = require("@octokit/rest");
var debug = require("debug")("git-commit-push-via-github-api");
var GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;
var getReferenceCommit = function(github, options) {
    return __awaiter(_this, void 0, void 0, function() {
        var res;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [
                        4 /*yield*/,
                        github.git.getRef({
                            owner: options.owner,
                            repo: options.repo,
                            ref: options.fullyQualifiedRef
                        })
                    ];
                case 1:
                    res = _a.sent();
                    debug("getReferenceCommit Response: %O", res);
                    return [2 /*return*/, { referenceCommitSha: res.data.object.sha }];
            }
        });
    });
};
var createTree = function(github, options, data) {
    return __awaiter(_this, void 0, void 0, function() {
        var _this = this;
        var files, tree;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [
                        4 /*yield*/,
                        Promise.all(
                            options.files.map(function(file) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    var blob;
                                    return __generator(this, function(_a) {
                                        switch (_a.label) {
                                            case 0:
                                                return [
                                                    4 /*yield*/,
                                                    github.git.createBlob({
                                                        owner: options.owner,
                                                        repo: options.repo,
                                                        content: Buffer.isBuffer(file.content)
                                                            ? file.content.toString("base64")
                                                            : file.content,
                                                        encoding: Buffer.isBuffer(file.content) ? "base64" : "utf-8"
                                                    })
                                                ];
                                            case 1:
                                                blob = _a.sent();
                                                return [
                                                    2 /*return*/,
                                                    {
                                                        sha: blob.data.sha,
                                                        path: file.path,
                                                        mode: "100644",
                                                        type: "blob"
                                                    }
                                                ];
                                        }
                                    });
                                });
                            })
                        )
                    ];
                case 1:
                    files = _a.sent();
                    debug("files: %O", files);
                    return [
                        4 /*yield*/,
                        github.git.createTree({
                            owner: options.owner,
                            repo: options.repo,
                            tree: files,
                            base_tree: data.referenceCommitSha
                        })
                    ];
                case 2:
                    tree = _a.sent();
                    debug("createTree Response: %O", tree);
                    return [2 /*return*/, Object.assign(data, { newTreeSha: tree.data.sha })];
            }
        });
    });
};
var createCommit = function(github, options, data) {
    return __awaiter(_this, void 0, void 0, function() {
        var commit;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [
                        4 /*yield*/,
                        github.git.createCommit({
                            owner: options.owner,
                            repo: options.repo,
                            message: options.commitMessage || "commit",
                            tree: data.newTreeSha,
                            parents: [data.referenceCommitSha]
                        })
                    ];
                case 1:
                    commit = _a.sent();
                    debug("createCommit Response: %O", commit);
                    return [2 /*return*/, Object.assign(data, { newCommitSha: commit.data.sha })];
            }
        });
    });
};
var updateReference = function(github, options, data) {
    return __awaiter(_this, void 0, void 0, function() {
        var ref;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [
                        4 /*yield*/,
                        github.git.updateRef({
                            owner: options.owner,
                            repo: options.repo,
                            ref: options.fullyQualifiedRef,
                            sha: data.newCommitSha,
                            force: options.forceUpdate
                        })
                    ];
                case 1:
                    ref = _a.sent();
                    debug("updateReference Response: %O", ref);
                    return [2 /*return*/, ref];
            }
        });
    });
};
exports.gitCommitPush = function(options) {
    if (!options.owner || !options.repo || !options.files || !options.files.length) {
        return;
    }
    var token = options.token || GITHUB_API_TOKEN;
    if (!token) {
        throw new Error("token is not defined");
    }
    var gitHub = new GitHubApi();
    gitHub.authenticate({ type: "oauth", token: token });
    var filledOptions = {
        owner: options.owner,
        repo: options.repo,
        files: options.files,
        fullyQualifiedRef: options.fullyQualifiedRef || "heads/dev",
        forceUpdate: options.forceUpdate || false,
        commitMessage: options.commitMessage || "Commit - " + new Date().getTime().toString()
    };
    debug("options %O", options);
    return getReferenceCommit(gitHub, filledOptions)
        .then(function(data) {
            return createTree(gitHub, filledOptions, data);
        })
        .then(function(data) {
            return createCommit(gitHub, filledOptions, data);
        })
        .then(function(data) {
            return updateReference(gitHub, filledOptions, data);
        });
};
//# sourceMappingURL=git-commit-push-via-github-api.js.map
