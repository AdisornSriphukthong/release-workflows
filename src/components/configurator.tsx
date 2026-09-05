import { useState } from "react";
import {
  DEFAULT_CONFIG,
  WORKFLOW_FILES,
  type PackageManager,
  type WorkflowConfig,
} from "../content/workflow-templates";

const MANAGERS: PackageManager[] = ["npm", "yarn", "pnpm"];

/**
 * Downloads text the browser never fetched, by handing it a temporary object
 * URL. Revoked on the next frame — the click has already been dispatched by
 * then, and holding the blob would leak it for the life of the page.
 */
function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/yaml;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/**
 * Picks the four settings the workflows differ on, then hands over files that
 * already carry them. The alternative — shipping one generic file and listing
 * what to edit — makes every reader repeat the same four edits by hand.
 */
export function Configurator() {
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<string | null>(null);

  const update = <K extends keyof WorkflowConfig>(
    key: K,
    value: WorkflowConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

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
        {WORKFLOW_FILES.map((file) => {
          const content = file.build(config);
          const isOpen = preview === file.name;
          return (
            <div key={file.name} className="file-card">
              <div className="file-head">
                <span className="file-name">{file.name}</span>
                <span className="file-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => downloadText(file.name, content)}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-expanded={isOpen}
                    onClick={() => setPreview(isOpen ? null : file.name)}
                  >
                    {isOpen ? "Hide" : "Preview"}
                  </button>
                </span>
              </div>
              <p className="file-summary">{file.summary}</p>
              {isOpen && (
                <pre className="file-preview" tabIndex={0}>
                  {content}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
