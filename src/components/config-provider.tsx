import { useState, type ReactNode } from "react";
import { ConfigContext } from "./config-context";
import {
  DEFAULT_CONFIG,
  type WorkflowConfig,
} from "../content/workflow-templates";

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_CONFIG);

  const update = <K extends keyof WorkflowConfig>(
    key: K,
    value: WorkflowConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <ConfigContext.Provider value={{ config, update }}>
      {children}
    </ConfigContext.Provider>
  );
}
