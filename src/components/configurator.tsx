import { useState } from "react";
import { useConfig } from "./config-context";
import {
  WORKFLOW_FILES,
  withoutComments,
  type PackageManager,
} from "../content/workflow-templates";

const MANAGERS: PackageManager[] = ["npm", "yarn", "pnpm"];

type CopyState = "idle" | "copied" | "failed";

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

function CopyIcon({ done }: { done: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {done ? (
        <polyline points="3 8.5 6.5 12 13 4" />
      ) : (
        <>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
          <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
        </>
      )}
    </svg>
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
  const [copied, setCopied] = useState<CopyState>("idle");

  // Always the comment-free form: it is the same file, just without the
  // commentary, and one version means what you read is what you copy.
  const shown = withoutComments(full);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  };

  const label =
    copied === "copied"
      ? `${name} copied`
      : copied === "failed"
        ? `Could not copy ${name} — select the text below instead`
        : `Copy ${name}`;

  return (
    <div className="file-card">
      <div className="file-head">
        <span className="file-name">{name}</span>
        <button
          type="button"
          className={`icon-btn${copied === "copied" ? " icon-btn--done" : ""}${
            copied === "failed" ? " icon-btn--failed" : ""
          }`}
          onClick={copy}
          title={label}
          aria-label={label}
        >
          <CopyIcon done={copied === "copied"} />
        </button>
      </div>

      <p className="file-summary">
        {summary}{" "}
        <span className="file-meta">{shown.split("\n").length} lines</span>
      </p>

      <pre className="file-preview" tabIndex={0} aria-label={name}>
        {shown}
      </pre>
    </div>
  );
}
