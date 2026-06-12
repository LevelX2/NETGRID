import { describe, expect, it } from "vitest";
import { progressAwareAlternativeSnapshot } from "./progress-aware-alternative-snapshot";

describe("progress-aware alternative snapshots", () => {
  it("summarizes score alternatives with hard gates and expected progress", () => {
    const snapshot = progressAwareAlternativeSnapshot({
      rank: 2,
      actionType: "score_agenda",
      selected: false,
      source: "game_rule",
      scoreBreakdown: [
        { key: "corp.scoreline.score_available" },
        { key: "hard_gate.remote_unsafe" },
      ],
      whyNot: ["hard_gate.remote_unsafe"],
    });

    expect(snapshot.semanticActionType).toBe("scoreline");
    expect(snapshot.targetContextStatus).toBe("blocked_by_hard_gate");
    expect(snapshot.expectedProgressLabel).toBe("progress_score");
    expect(snapshot.hardGates).toContain("hard_gate.remote_unsafe");
    expect(snapshot.blockedReason).toBe("hard_gate.remote_unsafe");
    expect(JSON.stringify(snapshot)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("summarizes visible coverage install alternatives without hidden data", () => {
    const snapshot = progressAwareAlternativeSnapshot({
      rank: 1,
      actionType: "install_card",
      selected: true,
      source: "visible_card",
      sourceTitle: "Proteus",
      scoreBreakdown: [{ key: "runner.coverage.breaker_install" }],
      whyChosen: ["selected_action"],
    });

    expect(snapshot.sourceKind).toBe("visible_card_or_ability");
    expect(snapshot.sourceDefinitionId).toBe("Proteus");
    expect(snapshot.semanticActionType).toBe("coverage_setup");
    expect(snapshot.expectedProgressLabel).toBe("progress_coverage_install");
    expect(snapshot.similarLaterProgress).toBe("unknown_shadow_only");
  });
});
