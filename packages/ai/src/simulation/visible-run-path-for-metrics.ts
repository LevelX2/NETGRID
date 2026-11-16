import type { AiDecisionInput } from "@netgrid/shared";
import { visibleIcePathTraceContext } from "../run-analysis/trace-rules-profile-planning";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  type assessKnownRezzedIcePath,
} from "../visible-run-analysis";

export function quoteVisibleRunnerPathForMetrics(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
  assess: typeof assessKnownRezzedIcePath,
) {
  const rig = input.playerView.own.rig ?? [];
  return assess(
    server?.ice ?? [],
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      rig,
    ),
    server?.root ?? [],
    input.playerView.opponent.credits,
    visibleIcePathTraceContext(input),
  );
}
