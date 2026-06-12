import { describe, expect, it } from "vitest";
import {
  labelProgressDeltaAction,
  labelProgressDeltaWindow,
  type ProgressDeltaAction,
} from "./progress-delta-labeler";

describe("progress delta labeler", () => {
  it("labels direct access, trash, steal, and score progress", () => {
    expect(actionLabel({ actionType: "access_card" })).toBe("progress_access");
    expect(actionLabel({ actionType: "trash_accessed_card" })).toBe(
      "progress_trash",
    );
    expect(actionLabel({ actionType: "steal_agenda" })).toBe(
      "progress_steal",
    );
    expect(actionLabel({ actionType: "score_agenda", side: "corp" })).toBe(
      "progress_score",
    );
  });

  it("labels visible runner coverage installs without hidden card data", () => {
    const result = labelProgressDeltaAction({
      side: "runner",
      actionType: "install_card",
      runnerSetupMissingCoverageTypes: ["barrier"],
      reasonCode: "runner.install.coverage",
      evidence: ["visible breaker coverage"],
    });

    expect(result.label).toBe("progress_coverage_install");
    expect(result.primaryProgress).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("labels economy as converted only when follow-up progress appears", () => {
    const labels = labelProgressDeltaWindow([
      { index: 10, side: "runner", actionType: "gain_credit" },
      { index: 11, side: "runner", actionType: "start_run" },
      { index: 12, side: "runner", actionType: "access_card" },
    ]);

    expect(labels[0]?.label).toBe("progress_economy_converted");
    expect(labels[0]?.followUp.within5).toContain("progress_access");
  });

  it("keeps reserve economy plausible without treating it as progress", () => {
    const result = labelProgressDeltaAction({
      side: "runner",
      actionType: "gain_credit",
      runnerEconomyTakenToReachRunReserve: true,
      evidence: ["known_unaffordable_path"],
    });

    expect(result.label).toBe("no_progress_plausible");
    expect(result.primaryProgress).toBe(false);
  });

  it("labels unsupported filler actions as stale no-progress", () => {
    const result = labelProgressDeltaAction({
      side: "runner",
      actionType: "draw_card",
      reasonCode: "runner.semantic.basic_economy_draw",
    });

    expect(result.label).toBe("no_progress_stale");
    expect(result.primaryProgress).toBe(false);
  });
});

function actionLabel(action: ProgressDeltaAction) {
  return labelProgressDeltaAction(action).label;
}
