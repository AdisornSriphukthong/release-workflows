/**
 * The two workflow files, as functions of the reader's choices.
 *
 * Single source of truth: the copies under `public/workflows/` are generated
 * from here by `scripts/write-workflows.mjs` before every build, and the
 * download buttons call the same functions in the browser. Editing the YAML by
 * hand anywhere else would put the two out of step.
 */

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface WorkflowConfig {
  packageManager: PackageManager;
  /** Branch releases are cut from — also the branch the tag lands on. */
  releaseBranch: string;
  /** Long-lived working branch. CI watches it alongside the release branch. */
  devBranch: string;
  /** Directory the build writes to, zipped onto the release. */
  buildDir: string;
  /** Whether the project has a `lint` script to gate on. */
  hasLint: boolean;
  /** Whether to attach the build output to the release at all. */
  attachBuild: boolean;
}

export const DEFAULT_CONFIG: WorkflowConfig = {
  packageManager: "npm",
  releaseBranch: "main",
  devBranch: "develop",
  buildDir: "dist",
  hasLint: true,
  attachBuild: true,
};

/**
 * Install command per manager. Yarn 1 and Yarn 2+ spell the same idea
 * differently, so that one branch is resolved on the runner rather than here.
 */
function installStep(manager: PackageManager): string {
  if (manager === "npm") {
    return `      - name: Install dependencies
        run: npm ci`;
  }
  if (manager === "pnpm") {
    return `      - name: Install dependencies
        run: pnpm install --frozen-lockfile`;
  }
  return `      - name: Install dependencies
        # Yarn 1 and Yarn 2+ spell the same flag differently.
        run: |
          if [ "$(yarn --version | cut -d. -f1)" = "1" ]; then
            yarn install --frozen-lockfile
          else
            yarn install --immutable
          fi`;
}

/** corepack ships with Node and supplies the yarn and pnpm binaries. */
function corepackStep(manager: PackageManager): string {
  if (manager === "npm") return "";
  return `
      # corepack ships with Node and provides the ${manager} binary. It has to
      # run before setup-node, which needs ${manager} on PATH to work out where
      # its cache lives.
      - name: Enable corepack
        run: corepack enable
`;
}

function lintStep(config: WorkflowConfig): string {
  if (!config.hasLint) return "";
  return `
      - name: Lint
        run: ${config.packageManager} run lint
`;
}

export function releaseYml(config: WorkflowConfig): string {
  const pm = config.packageManager;
  const gates = config.hasLint ? "lint or the build" : "the build";

  const packageStep = config.attachBuild
    ? `
      - name: Package build output
        run: cd ${config.buildDir} && zip -r "../${config.buildDir}-\${{ steps.bump.outputs.version }}.zip" .
`
    : "";

  const releaseAsset = config.attachBuild
    ? ` \\
            "${config.buildDir}-\${{ steps.bump.outputs.version }}.zip"`
    : "";

  return `# ─────────────────────────────────────────────────────────────────────────────
# Manual release for a Node project.
#
# Actions > Release > Run workflow, pick patch / minor / major. The job bumps
# package.json, tags vX.Y.Z, builds${
    config.attachBuild ? ", and publishes a GitHub Release\n# with the built output attached." : ", and publishes a GitHub Release."
  }
#
# Generated for: ${pm} · release branch \`${config.releaseBranch}\`${
    config.attachBuild ? ` · build output \`${config.buildDir}/\`` : " · no attachment"
  }
#
# The workflow file must live on your repository's DEFAULT branch or the
# "Run workflow" button never appears — workflow_dispatch reads it from there.
#
# The version bump uses \`npm version\` whichever manager you install with: npm
# ships with Node, it is the one bump command that writes both the commit and
# the tag itself, and it leaves yarn.lock and pnpm-lock.yaml alone.
# ─────────────────────────────────────────────────────────────────────────────
name: Release

on:
  workflow_dispatch:
    inputs:
      bump:
        description: "Version bump (patch = 0.0.X, minor = 0.X.0, major = X.0.0)"
        required: true
        type: choice
        default: patch
        options:
          - patch
          - minor
          - major

# Needed to push the version commit/tag and to create the Release.
permissions:
  contents: write

# Two releases at once would race on the version commit.
concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    name: Build & publish release
    runs-on: ubuntu-latest
    steps:
      # Always release from ${config.releaseBranch}, whatever branch the workflow was
      # launched from. fetch-depth 0 so release notes can see prior tags.
      - uses: actions/checkout@v5
        with:
          ref: ${config.releaseBranch}
          fetch-depth: 0
${corepackStep(pm)}
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: ${pm}

${installStep(pm)}
${lintStep(config)}
      # Creates the version commit and annotated tag on the runner only.
      # Nothing is pushed until the build below succeeds, so a failed build
      # never leaves a half-finished tag behind in the repository.
      - name: Bump version
        id: bump
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          version=$(npm version "\${{ inputs.bump }}" -m "chore(release): %s")
          echo "version=$version" >> "$GITHUB_OUTPUT"

      - name: Build
        env:
          NODE_ENV: production
          # Build-time config goes here. Repository variables live under
          # Settings > Secrets and variables > Actions > Variables:
          #
          #   VITE_API_URL: \${{ vars.VITE_API_URL }}
          #
          # Anything a client bundle inlines is public once shipped, so use a
          # variable, not a secret — and never expose a real secret here.
        run: ${pm} run build
${packageStep}
      - name: Push version commit and tag
        run: git push --follow-tags origin ${config.releaseBranch}

      - name: Create GitHub Release
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          gh release create "\${{ steps.bump.outputs.version }}" \\
            --title "\${{ steps.bump.outputs.version }}" \\
            --generate-notes${releaseAsset}

# If ${gates} fails, the job stops with the version commit and tag still on
# the runner — nothing half-finished reaches the repository.
`;
}

export function ciYml(config: WorkflowConfig): string {
  const pm = config.packageManager;
  const branches = `[${config.devBranch}, ${config.releaseBranch}]`;

  return `# ─────────────────────────────────────────────────────────────────────────────
# Lint and build on every push and pull request, so a broken commit is caught
# before it can be merged and turned into a release tag.
#
# Generated for: ${pm} · branches ${branches}
# ─────────────────────────────────────────────────────────────────────────────
name: CI

on:
  push:
    branches: ${branches}
  pull_request:
    branches: ${branches}

# A newer push to the same branch or PR makes the in-flight run irrelevant.
concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: ${config.hasLint ? "Lint & build" : "Build"}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
${corepackStep(pm)}
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: ${pm}

${installStep(pm)}
${lintStep(config)}
      # For a TypeScript project whose build script is \`tsc -b && …\`, this is
      # the type-check too.
      - name: Build
        env:
          NODE_ENV: production
        run: ${pm} run build
`;
}

export const WORKFLOW_FILES = [
  {
    name: "release.yml",
    build: releaseYml,
    summary:
      "The manual release. Adds a Run workflow button with a patch / minor / major choice.",
  },
  {
    name: "ci.yml",
    build: ciYml,
    summary:
      "Lint and build on every push and pull request, so a broken commit never becomes a tag.",
  },
] as const;
