import type { ReactNode } from "react";
import { SHELL_PROMPTS, useShell, type Shell } from "./shell-context";

/** A titled block of the guide. The `id` doubles as its anchor in the index. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * One line of a shell transcript. `kind` selects how it reads rather than how
 * it looks, so a comment never gets a copyable prompt in front of it.
 */
export interface CommandLine {
  kind: "command" | "comment" | "blank";
  text?: string;
}

/** Same commands on every platform; only the prompt character differs. */
export function CommandBlock({ lines }: { lines: CommandLine[] }) {
  const { shell } = useShell();
  return <RawCommandBlock lines={lines} shell={shell} />;
}

/**
 * Commands that genuinely differ between platforms. Falls back to the Unix
 * variant so a missing Windows translation shows something usable.
 */
export function PlatformCommandBlock({
  unix,
  windows,
}: {
  unix: CommandLine[];
  windows?: CommandLine[];
}) {
  const { shell } = useShell();
  const lines = shell === "windows" ? (windows ?? unix) : unix;
  return <RawCommandBlock lines={lines} shell={shell} />;
}

function RawCommandBlock({ lines, shell }: { lines: CommandLine[]; shell: Shell }) {
  const prompt = SHELL_PROMPTS[shell];
  return (
    <div className="cmd">
      <pre>
        {lines.map((line, i) => {
          const newline = i === lines.length - 1 ? "" : "\n";
          if (line.kind === "blank") return <span key={i}>{newline}</span>;
          if (line.kind === "comment") {
            return (
              <span key={i} className="comment">
                {line.text}
                {newline}
              </span>
            );
          }
          return (
            <span key={i}>
              <span className="prompt">{prompt}</span>
              {line.text}
              {newline}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

/**
 * How a column's cells are rendered. Keeping this on the column rather than
 * wrapping each cell in JSX means callers hand over plain strings, so table
 * content stays data instead of markup scattered through the page.
 */
export type ColumnVariant = "text" | "code" | "num";

export interface Column {
  header: string;
  variant?: ColumnVariant;
}

/** Horizontally scrollable on its own, so the page body never scrolls sideways. */
export function DataTable({
  columns,
  rows,
}: {
  columns: Column[];
  rows: string[][];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => {
                const variant = columns[i]?.variant ?? "text";
                return (
                  <td key={columns[i]?.header ?? i}>
                    {variant === "code" ? (
                      <code>{cell}</code>
                    ) : variant === "num" ? (
                      <span className="num">{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Note({
  label,
  tone = "neutral",
  children,
}: {
  label: string;
  tone?: "neutral" | "warn" | "stop";
  children: ReactNode;
}) {
  const toneClass = tone === "neutral" ? "" : ` note--${tone}`;
  return (
    <div className={`note${toneClass}`}>
      <span className="note-label">{label}</span>
      {children}
    </div>
  );
}

/** Numbered because a release genuinely is a sequence — order carries meaning. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="steps">{children}</div>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="step">
      <div className="step-body">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
