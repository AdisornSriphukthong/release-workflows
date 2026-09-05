import { useState } from "react";
import { useConfig } from "./config-context";
import {
  WORKFLOW_FILES,
  withoutComments,
  type PackageManager,
} from "../content/workflow-templates";

const MANAGERS: PackageManager[] = ["npm", "yarn", "pnpm"];

type CopyState = "idle" | "copied" | "failed";
type PreviewMode = "short" | "full";

/** Picks the four settings the workflows differ on. */
export function Configurator() {
  const { config, update } = useConfig();

  return (
    <div className="config">
      <div className="config-grid">
        <div className="field">
          <span className="field-label" id="pm-label">
            Package manager
          </span>
          <div className="toggle" role="group" aria-labelledby="pm-label">
            {MANAGERS.map((manager) => (
              <button
                key={manager}
                type="button"
                className="toggle-option"
                aria-pressed={config.packageManager === manager}
                onClick={() => update("packageManager", manager)}
              >
                {manager}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="release-branch">
            Release branch
          </label>
          <input
            id="release-branch"
            className="input"
            value={config.releaseBranch}
            spellCheck={false}
            onChange={(e) => update("releaseBranch", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="dev-branch">
            Working branch
          </label>
          <input
            id="dev-branch"
            className="input"
            value={config.devBranch}
            spellCheck={false}
            onChange={(e) => update("devBranch", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="build-dir">
            Build output folder
          </label>
          <input
            id="build-dir"
            className="input"
            value={config.buildDir}
            spellCheck={false}
            disabled={!config.attachBuild}
            onChange={(e) => update("buildDir", e.target.value)}
          />
        </div>
      </div>

      <div className="checks">
        <label className="check">
          <input
            type="checkbox"
            checked={config.hasLint}
            onChange={(e) => update("hasLint", e.target.checked)}
          />
          My project has a <code>lint</code> script
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={config.attachBuild}
            onChange={(e) => update("attachBuild", e.target.checked)}
          />
          Attach the build output to the release
        </label>
      </div>

      <div className="files">
        {WORKFLOW_FILES.map((file) => (
          <WorkflowFile
            key={file.name}
            name={file.name}
            summary={file.summary}
            full={file.build(config)}
          />
        ))}
      </div>
    </div>
  );
}

function WorkflowFile({
  name,
  summary,
  full,
}: {
  name: string;
  summary: string;
  full: string;
}) {
  const [mode, setMode] = useState<PreviewMode>("short");
  const [copied, setCopied] = useState<CopyState>("idle");

  // Short is the same file with its commentary removed, never a second
  // version of it — so what you read is always what you copy.
  const shown = mode === "short" ? withoutComments(full) : full;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  };

  const copyLabel =
    copied === "copied"
      ? "Copied"
      : copied === "failed"
        ? "Select and copy"
        : `Copy ${mode}`;

  return (
    <div className="file-card">
      <div className="file-head">
        <span className="file-name">{name}</span>
        <span className="file-actions">
          <div className="toggle toggle--sm" role="group" aria-label="Detail">
            {(["short", "full"] as PreviewMode[]).map((option) => (
              <button
                key={option}
                type="button"
                className="toggle-option"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`btn btn--primary${copied === "copied" ? " btn--done" : ""}`}
            onClick={copy}
          >
            {copyLabel}
          </button>
        </span>
      </div>

      <p className="file-summary">
        {summary}{" "}
        <span className="file-meta">
          {shown.split("\n").length} lines
          {mode === "short" && " · comments stripped"}
        </span>
      </p>

      <pre className="file-preview" tabIndex={0} aria-label={`${name}, ${mode}`}>
        {shown}
      </pre>
    </div>
  );
}
