import { createContext, useContext } from "react";

export type Shell = "unix" | "windows";

export const SHELL_LABELS: Record<Shell, string> = {
  unix: "macOS · Linux",
  windows: "Windows",
};

/** The prompt each shell actually shows, so pasted lines look like the real thing. */
export const SHELL_PROMPTS: Record<Shell, string> = {
  unix: "$ ",
  windows: "PS> ",
};

export interface ShellContextValue {
  shell: Shell;
  setShell: (shell: Shell) => void;
}

/**
 * Kept out of shell.tsx so that file exports only components: Fast Refresh can
 * hot-swap a module while preserving state only when every export is a
 * component, and a mixed file forces a full page reload.
 */
export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useShell must be used within ShellProvider");
  return context;
}
