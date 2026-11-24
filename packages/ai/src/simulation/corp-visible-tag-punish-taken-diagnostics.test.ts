import { describe, expect, it } from "vitest";
import type { AiDecision } from "@netgrid/shared";
import {
  aiInput,
  legalAction,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { CorpVisibleTagPunishOpportunity } from "./corp-visible-tag-punish-opportunities";
import { applyCorpVisibleTagPunishTakenWindowDiagnostics } from "./corp-visible-tag-punish-taken-diagnostics";

describe("visible Punish lethality metrics", () => {
  it("only prefers the damage payoff when the resolved amount can exceed the visible grip", () => {
    const damage = legalAction("meat", "corp", "play_operation", "Damage", {
      credits: 3,
    });
    const econ = legalAction(
      "econ",
      "corp",
      "play_operation",
      "Economic payoff",
      { credits: 0 },
    );
    const input = aiInput("corp", [damage, econ]);
    input.playerView.opponent.rig = [];
    const opportunities: [
      CorpVisibleTagPunishOpportunity,
      CorpVisibleTagPunishOpportunity,
    ] = [
      {
        action: econ,
        cardId: 497,
        kind: "closed_accounts_like",
        category: "economic",
      },
      {
        action: damage,
        cardId: 514,
        kind: "scorched_earth_like",
        category: "damage",
      },
    ];
    const decision: AiDecision = {
      actionId: econ.actionId,
      reasonCode: "test",
      explanation: "test",
      consideredActionIds: [damage.actionId, econ.actionId],
      fallbackUsed: false,
    };
    const classify = (handCount: number) => {
      input.playerView.opponent.handCount = handCount;
      const diagnostics: Partial<AiSimulationActionSequenceEntry> = {};
      applyCorpVisibleTagPunishTakenWindowDiagnostics(
        diagnostics,
        input,
        econ,
        decision,
        opportunities[0],
        opportunities,
      );
      return diagnostics.corpVisibleTagPunishChosenNonLethalOverLethal;
    };
    expect(classify(3)).toBe(true);
    expect(classify(4)).toBeUndefined();
    opportunities[1].cardId = undefined;
    expect(classify(3)).toBeUndefined();
  });
});
