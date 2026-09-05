/**
 * Every fact the page states, in one place — so updating the guide means
 * editing data, not hunting through markup.
 */

export const project = {
  eyebrow: "GitHub Actions · Node projects",
  title: "Release workflows",
  lede: "Two workflow files that turn a version bump into a tagged GitHub Release. You pick patch, minor or major; the job lints, versions, builds, tags and publishes. Nothing is pushed until the build succeeds.",
  chips: [
    { label: "files", value: "2", live: true },
    { label: "setup", value: "~5 min" },
    { label: "runtime", value: "~1 min" },
    { label: "works with", value: "any npm project" },
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

export const branches = [
  {
    name: "develop",
    role: "Day-to-day work. Features merge here. Never released from.",
  },
  {
    name: "main",
    role: "Stable, and the repository's default branch. Every tag points at a commit on this branch.",
  },
];

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

/** `gate` marks a step that can fail the job and stop the release. */
export const stages = [
  {
    name: "checkout",
    note: "The release branch, full history, whatever branch you launched from.",
    gate: false,
  },
  {
    name: "npm ci",
    note: "Node 22, exact versions from package-lock.json.",
    gate: false,
  },
  {
    name: "npm run lint",
    note: "Gate — the same command CI runs on every push.",
    gate: true,
  },
  {
    name: "npm version <bump>",
    note: "Commits chore(release): vX.Y.Z and tags it. Local to the runner so far.",
    gate: false,
  },
  {
    name: "npm run build",
    note: "Gate — whatever your build script does, with production config.",
    gate: true,
  },
  {
    name: "zip the build output",
    note: "Becomes dist-vX.Y.Z.zip.",
    gate: false,
  },
  {
    name: "git push --follow-tags",
    note: "First moment anything leaves the runner.",
    gate: false,
  },
  {
    name: "gh release create",
    note: "Publishes the release with notes generated from the commits since the last tag.",
    gate: false,
  },
];

export const adaptations = [
  {
    change: "Release from master",
    where: "release.yml",
    how: "Two places: the checkout ref, and the final git push. Update the branch list in ci.yml to match.",
  },
  {
    change: "Build writes somewhere other than dist/",
    where: "release.yml",
    how: "The Package build output step. Change both the cd and the zip path.",
  },
  {
    change: "No lint script",
    where: "both files",
    how: "Delete the npm run lint step. The build step stays as the gate.",
  },
  {
    change: "Build needs an API URL or feature flag",
    where: "release.yml",
    how: "Add it under the Build step's env, reading from a repository variable. A commented example is already there.",
  },
  {
    change: "Project uses pnpm or yarn",
    where: "both files",
    how: "Swap npm ci for your install command and set the matching cache in setup-node.",
  },
  {
    change: "Nothing to attach to the release",
    where: "release.yml",
    how: "Delete the Package build output step and the zip argument on gh release create.",
  },
];

export const failures = [
  {
    symptom: "No “Run workflow” button",
    cause:
      "release.yml is not on the repository's default branch. workflow_dispatch reads it from there and nowhere else — merge it in and push.",
  },
  {
    symptom: "Fails at npm ci",
    cause:
      "package-lock.json disagrees with package.json. Run npm install locally and commit the lockfile. Installing with a different package manager causes exactly this.",
  },
  {
    symptom: "Fails at the build, works on your machine",
    cause:
      "Usually filename casing. macOS and Windows are case-insensitive, the Linux runner is not, so an import of ./app resolves locally while git has the file recorded as App.tsx. Rename through a temporary name so git records it: git mv App.tsx tmp.tsx && git mv tmp.tsx app.tsx.",
  },
  {
    symptom: "Permission denied on the push",
    cause:
      "The job needs permissions: contents: write, and the branch must not be protected against the Actions bot. Add github-actions as a bypass, or release from an unprotected branch.",
  },
  {
    symptom: "Two releases at once",
    cause:
      "Can't happen — the concurrency: release group queues the second run rather than racing it.",
  },
];
