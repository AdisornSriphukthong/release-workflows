/**
 * Every fact the page states, in one place — so updating the guide means
 * editing data, not hunting through markup.
 */
import {
  INSTALL_COMMAND,
  runScript,
  type WorkflowConfig,
} from "./workflow-templates";

export const project = {
  eyebrow: "GitHub Actions · Node projects",
  title: "Release workflows",
  lede: "Two workflow files that turn a version bump into a tagged GitHub Release. You pick patch, minor or major; the job lints, versions, builds, tags and publishes. Nothing is pushed until the build succeeds.",
  chips: [
    { label: "files", value: "2", live: true },
    { label: "setup", value: "~5 min" },
    { label: "runtime", value: "~1 min" },
    { label: "works with", value: "npm · yarn · pnpm" },
  ],
};

export const sections = [
  { id: "install", title: "Install" },
  { id: "branches", title: "Branches" },
  { id: "cut", title: "Cutting a release" },
  { id: "bump", title: "Choosing the bump" },
  { id: "pipeline", title: "What runs" },
  { id: "after", title: "After it lands" },
  { id: "adapt", title: "Adapting it" },
  { id: "fails", title: "When it fails" },
] as const;

/** Module-level so the identity is stable across renders. */
export const sectionIds = sections.map((s) => s.id);

export const files = [
  {
    name: "release.yml",
    href: "workflows/release.yml",
    summary:
      "The manual release. Adds a Run workflow button with a patch / minor / major choice.",
  },
  {
    name: "ci.yml",
    href: "workflows/ci.yml",
    summary:
      "Lint and build on every push and pull request, so a broken commit never becomes a tag.",
  },
];

/** The two branches the workflows watch, named the way the reader set them. */
export function branchesFor(config: WorkflowConfig) {
  return [
    {
      name: config.devBranch,
      role: "Day-to-day work. Features merge here. Never released from.",
    },
    {
      name: config.releaseBranch,
      role: "Stable, and the repository's default branch. Every tag points at a commit on this branch.",
    },
  ];
}

export const bumps = [
  {
    bump: "patch",
    becomes: "1.4.1",
    when: "Bug fixes, copy changes, dependency bumps — nothing anyone has to learn.",
  },
  {
    bump: "minor",
    becomes: "1.5.0",
    when: "New features that don't break how anything already works.",
  },
  {
    bump: "major",
    becomes: "2.0.0",
    when: "Breaking changes, or the deliberate call that this is the first stable release.",
  },
];

/**
 * The pipeline, described with the commands the reader's own setup will run.
 * Derived from the same config the YAML is generated from, so the diagram can
 * never show an npm command to someone who picked yarn.
 */
export function stagesFor(config: WorkflowConfig) {
  const pm = config.packageManager;
  const stages: { name: string; note: string; gate: boolean }[] = [
    {
      name: "checkout",
      note: `Branch ${config.releaseBranch}, full history, whatever branch you launched from.`,
      gate: false,
    },
  ];

  if (pm !== "npm") {
    stages.push({
      name: "corepack enable",
      note: `Puts ${pm} on PATH before setup-node needs to cache its store.`,
      gate: false,
    });
  }

  stages.push({
    name: INSTALL_COMMAND[pm],
    note:
      pm === "yarn"
        ? "Node 22, exact versions from yarn.lock. Yarn 1 and 2+ take different flags, so the runner picks."
        : `Node 22, exact versions from your lockfile.`,
    gate: false,
  });

  if (config.hasLint) {
    stages.push({
      name: runScript(pm, "lint"),
      note: "Gate — the same script CI runs on every push.",
      gate: true,
    });
  }

  stages.push(
    {
      name: "npm version <bump>",
      note: "Always npm, even on yarn or pnpm — it writes the commit and the tag itself and touches no lockfile. Local to the runner so far.",
      gate: false,
    },
    {
      name: runScript(pm, "build"),
      note: "Gate — whatever your build script does, with production config.",
      gate: true,
    },
  );

  if (config.attachBuild) {
    stages.push({
      name: `zip ${config.buildDir}/`,
      note: `Becomes ${config.buildDir}-vX.Y.Z.zip.`,
      gate: false,
    });
  }

  stages.push(
    {
      name: `git push --follow-tags origin ${config.releaseBranch}`,
      note: "First moment anything leaves the runner.",
      gate: false,
    },
    {
      name: "gh release create",
      note: "Publishes the release with notes generated from the commits since the last tag.",
      gate: false,
    },
  );

  return stages;
}

/** Things the generator does not cover, which you do have to edit by hand. */
export const adaptations = [
  {
    change: "Build needs an API URL or feature flag",
    where: "release.yml",
    how: "Add it under the Build step's env, reading from a repository variable. A commented example is already in place.",
  },
  {
    change: "Deploy somewhere after the release",
    where: "release.yml",
    how: "Add a step after the release is created. It has the tag in steps.bump.outputs.version.",
  },
  {
    change: "More than two branches watched by CI",
    where: "ci.yml",
    how: "Add them to both branch lists — push and pull_request.",
  },
  {
    change: "A different Node version",
    where: "both files",
    how: "The node-version under setup-node. Node 22 is the current LTS.",
  },
];

const LOCKFILE: Record<string, string> = {
  npm: "package-lock.json",
  yarn: "yarn.lock",
  pnpm: "pnpm-lock.yaml",
};

/** Failure modes, described with the reader's own manager and branch names. */
export function failuresFor(config: WorkflowConfig) {
  const pm = config.packageManager;
  const lockfile = LOCKFILE[pm];

  return [
    {
      symptom: "No “Run workflow” button",
      cause: `release.yml is not on the repository's default branch. workflow_dispatch reads it from there and nowhere else — merge it into ${config.releaseBranch} and push.`,
    },
    {
      symptom: `Fails at ${INSTALL_COMMAND[pm].split(" ").slice(0, 2).join(" ")}`,
      cause: `${lockfile} disagrees with package.json — the install command refuses to update it. Run ${pm} install locally and commit ${lockfile}. Installing with a different package manager causes exactly this.`,
    },
    {
      symptom: "Fails at the build, works on your machine",
      cause:
        "Usually filename casing. macOS and Windows are case-insensitive, the Linux runner is not, so an import of ./app resolves locally while git has the file recorded as App.tsx. Rename through a temporary name so git records it: git mv App.tsx tmp.tsx && git mv tmp.tsx app.tsx.",
    },
    {
      symptom: "Permission denied on the push",
      cause: `The job needs permissions: contents: write, and ${config.releaseBranch} must not be protected against the Actions bot. Add github-actions as a bypass, or release from an unprotected branch.`,
    },
    {
      symptom: "Two releases at once",
      cause:
        "Can't happen — the concurrency: release group queues the second run rather than racing it.",
    },
  ];
}
