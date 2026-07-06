import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";
import { runnerKnownIcePathScoreComponents } from "./runner-known-ice-path-score";

describe("runnerKnownIcePathScoreComponents", () => {
  it("penalizes a known rezzed path that cannot reach access", () => {
    const action = runAction("run-remote-1", "remote_1");
    const [component] = runnerKnownIcePathScoreComponents(
      {
        playerView: { own: { credits: 4 } },
      } as AiDecisionInput,
      action,
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [],
      },
      {
        assessment: () =>
          ({
            assessedKnownIceCount: 1,
            blocked: true,
            canReachAccess: false,
            knownPathBlockedByUnbreakableIce: true,
            knownPathBlockedByMissingCoverage: true,
            knownPathBlockedByEtr: true,
            missingCoverage: ["code_gate"],
            creditsAfterPath: 4,
            canBreakNextIceButNotFullPath: false,
            hasBypassOrSpecialAccessPlan: false,
            noAccessReason: "missing_breaker_coverage",
            creditsSpentBeforeUnpayableIce: 0,
            unpayableReason: "ice_unbreakable",
          }) as KnownRezzedIcePathAssessment,
        reason: () => "server:remote_1;reason:missing_breaker_coverage",
      },
    );

    expect(component).toMatchObject({
      key: "runner_known_ice_path_no_access",
      value: -3200,
      reason: "server:remote_1;reason:missing_breaker_coverage",
    });
  });
});

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}
