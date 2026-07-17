import type { ApiMatchMode } from "@netgrid/shared";

export function isHumanVsAiMatchMode(mode: ApiMatchMode | undefined): boolean {
  return (
    mode === "human_runner_vs_corp_ai" || mode === "human_corp_vs_runner_ai"
  );
}
