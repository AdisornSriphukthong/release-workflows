import {
  CommandBlock,
  DataTable,
  FileCard,
  Note,
  PlatformCommandBlock,
  Section,
  Step,
  Steps,
} from "./components/primitives";
import { ShellProvider, ShellToggle } from "./components/shell";
import { useActiveSection } from "./components/use-active-section";
import {
  adaptations,
  branches,
  bumps,
  failures,
  files,
  project,
  sections,
  sectionIds,
  stages,
} from "./content/runbook";

export default function App() {
  const active = useActiveSection(sectionIds);

  return (
    <ShellProvider>
      <div className="page">
        <header className="masthead">
          <div className="eyebrow">{project.eyebrow}</div>
          <h1>{project.title}</h1>
          <p className="lede">{project.lede}</p>
          <div className="meta-row">
            {project.chips.map((chip) => (
              <span
                key={chip.label}
                className={`chip${chip.live ? " chip--live" : ""}`}
              >
                {chip.label}&nbsp;&nbsp;<b>{chip.value}</b>
              </span>
            ))}
          </div>
        </header>

        <div className="shell">
          <nav className="index" aria-label="Sections">
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={s.id === active ? "location" : undefined}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <main className="content">
            <Section id="install" title="Install">
              <p>
                Both files go in <code>.github/workflows/</code> at the root of
                your repository. Download them, or fetch them from a terminal —
                the shell switch below changes every command on this page.
              </p>

              <div className="files">
                {files.map((file) => (
                  <FileCard key={file.name} {...file} />
                ))}
              </div>

              <ShellToggle />

              <Steps>
                <Step title="Put the files in place">
                  <PlatformCommandBlock
                    unix={[
                      { kind: "command", text: "mkdir -p .github/workflows" },
                      {
                        kind: "comment",
                        text: "# then move the two downloaded files into it",
                      },
                      {
                        kind: "command",
                        text: "mv ~/Downloads/release.yml ~/Downloads/ci.yml .github/workflows/",
                      },
                    ]}
                    windows={[
                      {
                        kind: "command",
                        text: "New-Item -ItemType Directory -Force .github\\workflows",
                      },
                      {
                        kind: "comment",
                        text: "# then move the two downloaded files into it",
                      },
                      {
                        kind: "command",
                        text: "Move-Item $HOME\\Downloads\\release.yml, $HOME\\Downloads\\ci.yml .github\\workflows\\",
                      },
                    ]}
                  />
                </Step>

                <Step title="Check the three settings">
                  <p>
                    Open <code>release.yml</code>. The header comment lists what
                    to confirm: the <strong>release branch</strong> (it says{" "}
                    <code>main</code> in two places), the{" "}
                    <strong>build output folder</strong> (it zips{" "}
                    <code>dist/</code>), and whether your project has a{" "}
                    <strong>lint script</strong>. Adjust <code>ci.yml</code>'s
                    branch names to match.
                  </p>
                </Step>

                <Step title="Push to the default branch">
                  <p>
                    The Run workflow button only appears when{" "}
                    <code>release.yml</code> is on your repository's default
                    branch. Push it there before looking for it.
                  </p>
                  <CommandBlock
                    lines={[
                      { kind: "command", text: "git add .github/workflows" },
                      {
                        kind: "command",
                        text: 'git commit -m "chore(ci): add CI and release workflows"',
                      },
                      { kind: "command", text: "git push" },
                    ]}
                  />
                </Step>
              </Steps>

              <Note label="One permission to check" tone="warn">
                <p>
                  The release job pushes a version commit back to your release
                  branch. If that branch is protected, add{" "}
                  <code>github-actions</code> as a bypass under Settings →
                  Branches, or the push fails at the last step with the tag
                  already built.
                </p>
              </Note>
            </Section>

            <Section id="branches" title="Branches">
              <p>
                The workflows assume two long-lived branches. If you work on a
                single branch, point both files at it and skip the merge step
                below.
              </p>
              <DataTable
                columns={[
                  { header: "Branch", variant: "code" },
                  { header: "Role" },
                ]}
                rows={branches.map((b) => [b.name, b.role])}
              />
              <p>
                The release workflow checks out{" "}
                <strong>the release branch no matter which branch you launch
                it from</strong>, so running it while sitting on{" "}
                <code>develop</code> still releases <code>main</code>. Merge
                first — the workflow will not pick up unmerged work.
              </p>
            </Section>

            <Section id="cut" title="Cutting a release">
              <Steps>
                <Step title="Get your work onto the release branch">
                  <CommandBlock
                    lines={[
                      { kind: "command", text: "git branch -f main develop" },
                      { kind: "command", text: "git push origin main" },
                      { kind: "blank" },
                      {
                        kind: "comment",
                        text: "# wait for CI to go green before releasing",
                      },
                      { kind: "command", text: "gh run watch" },
                    ]}
                  />
                  <p>
                    <code>git branch -f</code> is safe when{" "}
                    <code>main</code> is an ancestor of <code>develop</code> — it
                    moves a pointer forward rather than rewriting history. A red
                    CI run means the release will die partway, so fix it first.
                  </p>
                </Step>

                <Step title="Run the workflow">
                  <p>
                    On GitHub: <strong>Actions → Release → Run workflow</strong>,
                    pick a bump, run. Roughly one minute end to end. The same
                    thing from a terminal, if you prefer:
                  </p>
                  <CommandBlock
                    lines={[
                      {
                        kind: "command",
                        text: "gh workflow run release.yml -f bump=minor",
                      },
                      { kind: "command", text: "gh run watch" },
                      { kind: "command", text: "gh release view --web" },
                    ]}
                  />
                </Step>
              </Steps>
            </Section>

            <Section id="bump" title="Choosing the bump">
              <DataTable
                columns={[
                  { header: "Bump", variant: "code" },
                  { header: "1.4.0 becomes", variant: "num" },
                  { header: "Use it when" },
                ]}
                rows={bumps.map((b) => [b.bump, b.becomes, b.when])}
              />
              <p>
                The version lives in <code>package.json</code> and is bumped by{" "}
                <code>npm version</code> inside the workflow. Don't edit it by
                hand — you'd desync the file from the tags.
              </p>
            </Section>

            <Section id="pipeline" title="What runs">
              <div className="pipeline">
                {stages.map((stage, i) => (
                  <div
                    key={stage.name}
                    className={`stage${stage.gate ? " stage--gate" : ""}`}
                  >
                    <span className="stage-n">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="stage-name">
                      {stage.name}
                      <span className="stage-note">{stage.note}</span>
                    </span>
                  </div>
                ))}
              </div>
              <Note label="Why the order matters">
                <p>
                  The version commit and tag are created at step 4 but not pushed
                  until step 7. If lint or the build fails, the job dies with
                  everything still on the runner — no half-finished tag is left
                  in the repository for someone to clean up.
                </p>
              </Note>
            </Section>

            <Section id="after" title="After it lands">
              <p>
                The workflow pushes a commit back to the release branch, so your
                local clone is now behind. Pull it down and carry the version
                bump back into <code>develop</code>, or the two branches disagree
                about what version this is.
              </p>
              <CommandBlock
                lines={[
                  {
                    kind: "command",
                    text: "git checkout main && git pull origin main",
                  },
                  {
                    kind: "command",
                    text: "git checkout develop && git merge main",
                  },
                  { kind: "command", text: "git push origin develop" },
                ]}
              />
              <p>
                You get a tag <code>vX.Y.Z</code>, a GitHub Release with an
                auto-generated changelog, and{" "}
                <code>dist-vX.Y.Z.zip</code> attached — the built output, ready
                to hand to whatever serves it.
              </p>
            </Section>

            <Section id="adapt" title="Adapting it">
              <DataTable
                columns={[
                  { header: "If you need to" },
                  { header: "Edit", variant: "code" },
                  { header: "How" },
                ]}
                rows={adaptations.map((a) => [a.change, a.where, a.how])}
              />
              <Note label="Build-time config is public" tone="warn">
                <p>
                  Anything a client bundle inlines ships to every visitor, so
                  pass it as a repository <strong>variable</strong>, not a
                  secret — marking it secret only hides it from your own Actions
                  logs. Never put a real credential in the build step.
                </p>
              </Note>
            </Section>

            <Section id="fails" title="When it fails">
              <DataTable
                columns={[
                  { header: "Symptom" },
                  { header: "Cause and fix" },
                ]}
                rows={failures.map((f) => [f.symptom, f.cause])}
              />
              <Note label="Don't delete a published tag" tone="stop">
                <p>
                  Anyone who already pulled it keeps the old commit under that
                  name, and the two versions diverge silently. Ship a new patch
                  release instead.
                </p>
              </Note>
            </Section>

            <p className="footer">
              Both workflows are plain GitHub Actions YAML with no third-party
              actions beyond <code>actions/checkout</code> and{" "}
              <code>actions/setup-node</code>. Copy them, edit them, keep them —
              there is nothing to install and nothing to depend on.
            </p>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
