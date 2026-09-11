import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
export type CoverageState = {
  kind: "coverage";
  gap: RunnerCoverageGapSignal;
  selectedSearchActionId?: string;
  selectedSearchStateVersion?: number;
  phase:
    | "prepare_coverage"
    | "install_answer"
    | "fund_answer"
    | "search_answer"
    | "setup_search_engine"
    | "draw_for_answer";
};
