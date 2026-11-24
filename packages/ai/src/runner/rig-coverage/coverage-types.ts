import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

export type CoverageSearchBinding = {
  selectedSearchActionId: string;
  selectedSearchStateVersion: number;
};

export function hasCoverageSearchBinding(
  state: unknown,
): state is CoverageSearchBinding {
  return (
    typeof state === "object" &&
    state !== null &&
    "selectedSearchActionId" in state &&
    typeof state.selectedSearchActionId === "string" &&
    state.selectedSearchActionId.length > 0 &&
    "selectedSearchStateVersion" in state &&
    typeof state.selectedSearchStateVersion === "number" &&
    Number.isSafeInteger(state.selectedSearchStateVersion) &&
    state.selectedSearchStateVersion >= 0
  );
}

export type CoverageState = {
  kind: "coverage";
  gap: RunnerCoverageGapSignal;
  phase:
    | "prepare_coverage"
    | "install_answer"
    | "fund_answer"
    | "search_answer"
    | "setup_search_engine"
    | "draw_for_answer";
} & (
  | CoverageSearchBinding
  | { selectedSearchActionId?: never; selectedSearchStateVersion?: never }
);
