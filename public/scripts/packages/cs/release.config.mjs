/* eslint-disable @typescript-eslint/no-var-requires */
import customTransform from "./release.utils.mjs"

module.exports = {
    branches: [
        "+([0-9])?(.{+([0-9]),x}).x",
        "master",
        "next",
        "next-major",
        { name: "beta", prerelease: true },
        { name: "alpha", prerelease: true },
    ],
    repositoryUrl: "git@github.com:deriv-com/deriv-static-content.git",
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                releaseRules: [
                    {
                        type: "feat",
                        release: "minor",
                    },
                    {
                        type: "build",
                        release: "patch",
                    },
                    {
                        type: "ci",
                        release: "patch",
                    },
                    {
                        type: "chore",
                        release: "patch",
                    },
                    {
                        type: "docs",
                        release: "patch",
                    },
                    {
                        type: "refactor",
                        release: "patch",
                    },
                    {
                        type: "style",
                        release: "patch",
                    },
                    {
                        type: "test",
                        release: "patch",
                    },
                    {
                        type: "fix",
                        release: "patch",
                    },
                ],
            },
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                parserOpts: {
                    mergePattern: /^Merge pull request #(\d+) from (.*)$/,
                    mergeCorrespondence: ["id", "source"],
                },
                writerOpts: { transform: customTransform },
            },
        ],
        "@semantic-release/changelog",
        [
            "@semantic-release/exec",
            {
              prepareCmd: "cd public/scripts/packages/cs && npm run build",
              publishCmd: "cd public/scripts/packages/cs && npm run publish",
            },
          ],
        [
            "@semantic-release/npm",
            {
                npmPublish: true,
            },
        ],
        "@semantic-release/github",
    ],
};
