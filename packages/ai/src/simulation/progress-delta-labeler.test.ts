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

  it("bounds flatline progress signals to exact text tokens", () => {
    expect(
      actionLabel({
        actionType: "trigger_ability",
        reasonCode: "corp.damage.flatline",
      }),
    ).toBe("progress_flatline");
    expect(
      actionLabel({
        actionType: "trigger_ability",
        reasonCode: "corp.damage.flatlinedish",
      }),
    ).toBe("no_progress_stale");
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

  it("bounds coverage install signals to exact text tokens", () => {
    expect(
      actionLabel({
        side: "runner",
        actionType: "install_card",
        reasonCode: "runner.install.decoder",
      }),
    ).toBe("progress_coverage_install");
    expect(
      actionLabel({
        side: "runner",
        actionType: "install_card",
        reasonCode: "runner.install.codebreakerish",
      }),
    ).toBe("no_progress_stale");
  });

  it("bounds reachability progress signals to exact text tokens", () => {
    expect(
      actionLabel({
        side: "runner",
        actionType: "trigger_ability",
        reasonCode: "runner.known_path",
      }),
    ).toBe("progress_reachability_improved");
    expect(
      actionLabel({
        side: "runner",
        actionType: "trigger_ability",
        reasonCode: "runner.unknown_pathish",
      }),
    ).toBe("no_progress_stale");
  });

  it("bounds server protection signals to exact text tokens", () => {
    expect(
      actionLabel({
        side: "corp",
        actionType: "install_card",
        reasonCode: "corp.score_remote",
      }),
    ).toBe("progress_server_protected");
    const noisy = actionLabel({
      side: "corp",
      actionType: "install_card",
      reasonCode: "corp.protective_noise",
    });
    expect(noisy).not.toBe("progress_server_protected");
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

  it("bounds economy conversion text signals to exact tokens", () => {
    const funded = labelProgressDeltaWindow([
      {
        index: 10,
        side: "runner",
        actionType: "draw_card",
        reasonCode: "runner.funding",
      },
      { index: 11, side: "runner", actionType: "access_card" },
    ]);
    expect(funded[0]?.label).toBe("progress_economy_converted");

    const noisy = labelProgressDeltaWindow([
      {
        index: 10,
        side: "runner",
        actionType: "draw_card",
        reasonCode: "runner.creditor_noise",
      },
      { index: 11, side: "runner", actionType: "access_card" },
    ]);
    expect(noisy[0]?.label).not.toBe("progress_economy_converted");
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
