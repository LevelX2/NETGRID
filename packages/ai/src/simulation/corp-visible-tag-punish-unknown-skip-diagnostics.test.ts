import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createCorpVisibleTagPunishUnknownSkipDiagnosticsContext } from "./corp-visible-tag-punish-unknown-skip-diagnostics";

describe("corp visible tag punish unknown skip diagnostics", () => {
  it("matches unknown-skip evidence signals by bounded terms", () => {
    expect(attributionForEvidence(["score_window"])).toBe(
      "unknown_skip_plausible_advance_to_score",
    );
    expect(attributionForEvidence(["score_windowish_noise"])).toBe(
      "unknown_skip_unclassified_missing_evidence",
    );
    expect(attributionForEvidence(["protect_hq"])).toBe(
      "unknown_skip_plausible_hq_or_rnd_safety",
    );
    expect(attributionForEvidence(["protector_hq_noise"])).toBe(
      "unknown_skip_unclassified_missing_evidence",
    );
    expect(attributionForEvidence(["microeconomy_noise"])).toBe(
      "unknown_skip_unclassified_missing_evidence",
    );
  });

  it("uses visible damage to identify payoffs that can empty the current hand", () => {
    expect(
      diagnose([], 3).corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    ).toBeUndefined();
    expect(
      diagnose([], 4, "onr_v1_302_scorched-earth")
        .corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    ).toBe(true);
    expect(
      diagnose([], 3, "onr_v1_302_scorched-earth", true)
        .corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    ).toBeUndefined();
  });
});

function attributionForEvidence(evidence: string[]) {
  return diagnose(evidence, 5).corpVisibleTagPunishUnknownSkipAttribution;
}

function diagnose(
  evidence: string[],
  handCount: number,
  cardId?: string,
  damagePrevention = false,
) {
  const diagnostics: Record<string, unknown> = {};
  createCorpVisibleTagPunishUnknownSkipDiagnosticsContext({
    sourceDefinitionIdForAction: () => "operation",
    isCorpTraceTagSourceAction: () => false,
  }).applyCorpVisibleTagPunishUnknownSkipDiagnostics(
    diagnostics,
    {
      playerView: {
        opponent: {
          handCount,
        },
      },
    } as AiDecisionInput,
    action(),
    { reasonCode: "corp.plan.operation", evidence } as AiDecision,
    [
      {
        action: action(),
        category: "damage",
        kind: "scorched_earth_like",
        cardId,
      },
    ],
    {
      any: false,
      damage: damagePrevention,
      flatline: false,
      link: false,
      trace: false,
    },
  );
  return diagnostics;
}

function action(): LegalAction {
  return {
    actionId: "operation",
    side: "corp",
    type: "play_operation",
    label: "Play operation",
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
