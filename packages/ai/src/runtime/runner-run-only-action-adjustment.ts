import { visibleRunnerPathTraceContext } from "../run-analysis/trace-rules-profile-planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";

export function runnerRunActionSpendingCapAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): {
  ok: boolean;
  reason: string;
  visibleBreakCost: number;
} {
  const serverId = semanticRuntimeServerId(action);
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (!server)
    return { ok: false, reason: "server_unknown", visibleBreakCost: 0 };
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server.root,
    input.playerView.opponent.credits,
    visibleRunnerPathTraceContext(input),
  );
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  if (assessment.assessedKnownIceCount > 0 && !assessment.canReachAccess) {
    return { ok: false, reason: "known_path_no_access", visibleBreakCost };
  }
  if (visibleBreakCost > 3) {
    return { ok: false, reason: "visible_break_cost_gt_cap", visibleBreakCost };
  }
  const hasUnknownIceCost = server.ice.some(
    (ice) => !ice.known || ice.rezzed !== true,
  );
  if (hasUnknownIceCost) {
    return { ok: false, reason: "unknown_ice_cap_risk", visibleBreakCost };
  }
  return { ok: true, reason: "visible_cost_within_cap", visibleBreakCost };
}
