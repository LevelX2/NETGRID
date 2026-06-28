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
});

function attributionForEvidence(evidence: string[]) {
  const diagnostics: Record<string, unknown> = {};
  createCorpVisibleTagPunishUnknownSkipDiagnosticsContext({
    sourceDefinitionIdForAction: () => "operation",
    isCorpTraceTagSourceAction: () => false,
  }).applyCorpVisibleTagPunishUnknownSkipDiagnostics(
    diagnostics,
    {
      playerView: {
        opponent: {
          handCount: 5,
        },
      },
    } as AiDecisionInput,
    action(),
    { reasonCode: "corp.plan.operation", evidence } as AiDecision,
    [{ category: "damage" } as never],
    {
      any: false,
      damage: false,
      flatline: false,
      link: false,
      trace: false,
    },
  );
  return diagnostics.corpVisibleTagPunishUnknownSkipAttribution;
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
