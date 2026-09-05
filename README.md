# Release Workflows

Two GitHub Actions workflow files that turn a version bump into a tagged GitHub
Release, plus a single-page guide explaining how to install and adapt them.

Copy the workflows into any npm project. There is nothing to install and no
third-party action beyond `actions/checkout` and `actions/setup-node`.

## The workflows

| File | What it does |
| --- | --- |
| [public/workflows/release.yml](public/workflows/release.yml) | Adds a **Run workflow** button with a `patch` / `minor` / `major` choice. Lints, bumps `package.json`, builds, tags `vX.Y.Z`, and publishes a GitHub Release with the build output zipped and attached. |
| [public/workflows/ci.yml](public/workflows/ci.yml) | Lints and builds on every push and pull request, so a broken commit never becomes a tag. |

Both go in `.github/workflows/` at the root of your repository.

### Before first use

`release.yml` opens with a comment listing the three things to check:

1. **Release branch** — the file says `main` in two places (the checkout `ref`
   and the final `git push`). Change both if you release from `master`, and
   update the branch lists in `ci.yml` to match.
2. **Build output** — the packaging step zips `dist/`. Change it if your build
   writes to `build/`, `out/`, or anywhere else.
3. **Scripts** — the job runs `npm run lint` and `npm run build`. Drop the lint
   step if your project has no lint script.

`release.yml` must sit on your repository's **default branch** or the Run
workflow button never appears — `workflow_dispatch` reads it from there and
nowhere else.

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
