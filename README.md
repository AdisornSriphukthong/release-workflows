# Release Workflows

Two GitHub Actions workflow files that turn a version bump into a tagged GitHub
Release, plus a single-page guide explaining how to install and adapt them.

Copy the workflows into any Node project — npm, yarn or pnpm. There is
nothing to install and no third-party action beyond `actions/checkout` and
`actions/setup-node`; yarn and pnpm come from corepack, which ships with Node.

## The workflows

| File | What it does |
| --- | --- |
| [public/workflows/release.yml](public/workflows/release.yml) | Adds a **Run workflow** button with a `patch` / `minor` / `major` choice. Lints, bumps `package.json`, builds, tags `vX.Y.Z`, and publishes a GitHub Release with the build output zipped and attached. |
| [public/workflows/ci.yml](public/workflows/ci.yml) | Lints and builds on every push and pull request, so a broken commit never becomes a tag. |

Both go in `.github/workflows/` at the root of your repository.

### Before first use

Open the guide (`npm run dev`) and set four things, then download files that
already carry them:

| Setting | Default | What it changes |
| --- | --- | --- |
| Package manager | `npm` | The dependency cache, the install command, and how the scripts are run. Yarn and pnpm additionally get a `corepack enable` step. |
| Release branch | `main` | The checkout `ref`, the final `git push`, and the branch list in `ci.yml`. |
| Working branch | `develop` | The other branch `ci.yml` watches. |
| Build output folder | `dist` | What gets zipped onto the release. |

Two checkboxes cover the rest: whether the project has a `lint` script to gate
on, and whether to attach the build output to the release at all.

The version bump always uses `npm version`, whichever manager you pick: npm
ships with Node, it is the one bump command that writes both the commit and the
tag itself, and it leaves `yarn.lock` and `pnpm-lock.yaml` untouched without
creating a `package-lock.json`.

`release.yml` must sit on your repository's **default branch** or the Run
workflow button never appears — `workflow_dispatch` reads it from there and
nowhere else.

### One source of truth

The YAML is not stored as YAML. Both files are built by
[src/content/workflow-templates.ts](src/content/workflow-templates.ts):

- the download buttons call those functions in the browser, and
- [scripts/write-workflows.mjs](scripts/write-workflows.mjs) renders the
  defaults into `public/workflows/` before every `dev` and `build`, so the two
  files also have stable URLs you can `curl` or read without JavaScript.

Edit the templates, never `public/workflows/*.yml` — those are generated and
will be overwritten.

### Why nothing is pushed early

The version commit and tag are created on the runner at step 4 but not pushed
until step 7. If lint or the build fails, the job dies with everything still on
the runner, so a failed release never leaves a half-finished tag in the
repository for someone to clean up.

## Running the guide

React 19 + Vite 8 + TypeScript. No runtime dependencies beyond React.

- `npm run dev` — dev server with HMR
- `npm run build` — `tsc -b` type-check then `vite build`
- `npm run lint` — oxlint over the repo
- `npm run preview` — serve the production build locally

### Where things live

| Path | What it holds |
| --- | --- |
| [src/content/runbook.ts](src/content/runbook.ts) | Every fact the page states — branches, bump table, pipeline stages, adaptations, failure modes. |
| [src/components/primitives.tsx](src/components/primitives.tsx) | `Section`, `CommandBlock`, `DataTable`, `Note`, `Steps`, `FileCard`. |
| [src/components/shell-context.ts](src/components/shell-context.ts) | The macOS/Linux ↔ Windows switch: context, hook, prompt strings. |
| [src/components/shell.tsx](src/components/shell.tsx) | `ShellProvider` and `ShellToggle` — components only, so Fast Refresh keeps state. |
| [src/App.tsx](src/App.tsx) | Composes the page. |
| [src/index.css](src/index.css) | Design tokens and every component style. |

**Content is data, not markup.** Edit `src/content/runbook.ts`; the components
render whatever is in it. `DataTable` takes plain strings plus a per-column
`variant` (`code` / `num` / `text`) so table content is never written as JSX.

**Shell switch.** The page guesses macOS/Linux or Windows from the user agent
and flips every command block at once. Commands that are genuinely different
per platform use `PlatformCommandBlock`; the rest share one form and only the
prompt changes.

**Theming.** Colours are defined three times in `src/index.css`: the complete
light palette on bare `:root`, then token-only redefinitions under
`@media (prefers-color-scheme: dark)` (guarded with
`:root:not([data-theme="light"])`) and under `:root[data-theme="dark"]`. Never
define a colour only inside a media or `[data-theme]` block — it would not
apply in the default "system" state.

## Licence

MIT. Take the workflows and do whatever you like with them.
