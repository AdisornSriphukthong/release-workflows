import { createContext, useContext } from "react";
import {
  DEFAULT_CONFIG,
  type WorkflowConfig,
} from "../content/workflow-templates";

export interface ConfigContextValue {
  config: WorkflowConfig;
  update: <K extends keyof WorkflowConfig>(
    key: K,
    value: WorkflowConfig[K],
  ) => void;
}

/**
 * The reader's choices, shared by the whole page: the generated YAML, the
 * pipeline diagram and the prose all describe the same setup, so a reader on
 * yarn never sees an npm command anywhere.
 *
 * Kept out of the provider's file so that file exports only components and
 * Fast Refresh can hot-swap it without dropping state.
 */
export const ConfigContext = createContext<ConfigContextValue>({
  config: DEFAULT_CONFIG,
  update: () => {},
});

export function useConfig() {
  return useContext(ConfigContext);
}
