import { useState, type ReactNode } from "react";
import {
  SHELL_LABELS,
  ShellContext,
  useShell,
  type Shell,
} from "./shell-context";

/** Guess from the browser so most readers never touch the switch. */
function detectShell(): Shell {
  if (typeof navigator === "undefined") return "unix";
  return /win/i.test(navigator.userAgent) ? "windows" : "unix";
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [shell, setShell] = useState<Shell>(detectShell);
  return (
    <ShellContext.Provider value={{ shell, setShell }}>
      {children}
    </ShellContext.Provider>
  );
}

/**
 * Switches every command block on the page at once — a reader on Windows
 * shouldn't have to flip a toggle per snippet.
 */
export function ShellToggle() {
  const { shell, setShell } = useShell();
  return (
    <div className="toggle" role="group" aria-label="Shell">
      {(Object.keys(SHELL_LABELS) as Shell[]).map((option) => (
        <button
          key={option}
          type="button"
          className="toggle-option"
          aria-pressed={shell === option}
          onClick={() => setShell(option)}
        >
          {SHELL_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
