import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { corpPunishCandidates } from "./tactical-plan-corp-helpers";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("corpPunishCandidates", () => {
  it("matches structured punish signals without substring noise", () => {
    const structuredTag = candidate("structured-tag", {
      actionTacticSignals: ["tag.source"],
    });
    const structuredPunish = candidate("structured-punish", {
      actionTacticSignals: ["punish.payoff"],
    });
    const compoundPunish = candidate("compound-punish", {
      actionTacticSignals: ["visible_punish_payoff"],
    });
    const compoundFlatline = candidate("compound-flatline", {
      actionTacticSignals: ["score_flatline_window"],
    });
    const noise = candidate("noise", {
      actionTacticSignals: [
        "tagalong.source",
        "punishment_noise",
        "pre_punishment_support",
        "flatliner",
      ],
    });

    expect(
      corpPunishCandidates(
        {
          candidates: [
            structuredTag,
            structuredPunish,
            compoundPunish,
            compoundFlatline,
            noise,
          ],
        } as unknown as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ).map((entry) => entry.actionId),
    ).toEqual([
      "structured-tag",
      "structured-punish",
      "compound-punish",
      "compound-flatline",
    ]);
  });
});

function candidate(
  actionId: string,
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "trigger_ability",
    actorSide: "corp",
    visibilityScope: "public",
    legalActionRef: {
      actionId,
      actionType: "trigger_ability",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "unbound",
    semanticActionType: "card_ability.unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
    timingProfile: { timingPoint: "corp_action.main", window: "main_action" },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "partial",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}
