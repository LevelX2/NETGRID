import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import {
  buildSemanticCoverageFallbackDecisionChainDebug,
  buildSemanticDecisionChainDebug,
  selectSemanticRuntimeInitialChoice,
} from "./semantic-decision-chain";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";

describe("semantic decision chain", () => {
  it("preserves the productive initial-choice precedence exactly", () => {
    const runPlan = choice("run-plan");
    const deckout = choice("deckout");
    const reactive = choice("reactive");
    const selfDamage = choice("self-damage");
    const matchpoint = choice("matchpoint");
    const mapped = choice("mapped");
    const best = choice("best");

    const selected = selectSemanticRuntimeInitialChoice({
      runPlanChoice: runPlan,
      inevitableCorpDeckoutChoice: deckout,
      reactiveChoice: reactive,
      selfDamageImmediateWinChoice: selfDamage,
      opponentMatchpointContestChoice: matchpoint,
      mappedChoice: {
        outcome: "plan_mapping_selected",
        choice: mapped,
      },
      bestChoice: best,
    });

    expect(selected).toMatchObject({
      route: "runner_run_plan",
      choice: runPlan,
      priorityCandidates: [
        { route: "runner_run_plan", actionId: "run-plan" },
        { route: "inevitable_corp_deckout", actionId: "deckout" },
        { route: "reactive_choice", actionId: "reactive" },
        { route: "self_damage_immediate_win", actionId: "self-damage" },
        { route: "opponent_matchpoint_contest", actionId: "matchpoint" },
        { route: "tactical_plan_mapping", actionId: "mapped" },
        { route: "semantic_score", actionId: "best" },
      ],
    });
  });

  it("labels a selected semantic plan override separately from plan mapping", () => {
    const override = choice("override", 1800);
    const selected = selectSemanticRuntimeInitialChoice({
      mappedChoice: {
        outcome: "semantic_choice_selected",
        choice: override,
        overriddenMappedChoice: choice("mapped", 900),
        overrideChoice: override,
      },
      bestChoice: choice("best", 1800),
    });

    expect(selected?.route).toBe("tactical_plan_override");
    expect(selected?.choice.action.actionId).toBe("override");
  });

  it.each([
    ["inevitable_corp_deckout", "deckout"],
    ["reactive_choice", "reactive"],
    ["self_damage_immediate_win", "self-damage"],
    ["opponent_matchpoint_contest", "matchpoint"],
    ["tactical_plan_mapping", "mapped"],
    ["semantic_score", "best"],
  ] as const)(
    "selects %s when every earlier route is absent",
    (expectedRoute, expectedActionId) => {
      const orderedCandidates = {
        inevitableCorpDeckoutChoice: choice("deckout"),
        reactiveChoice: choice("reactive"),
        selfDamageImmediateWinChoice: choice("self-damage"),
        opponentMatchpointContestChoice: choice("matchpoint"),
        mappedChoice: {
          outcome: "plan_mapping_selected" as const,
          choice: choice("mapped"),
        },
        bestChoice: choice("best"),
      };
      const routeOrder = [
        "inevitable_corp_deckout",
        "reactive_choice",
        "self_damage_immediate_win",
        "opponent_matchpoint_contest",
        "tactical_plan_mapping",
        "semantic_score",
      ] as const;
      const expectedIndex = routeOrder.indexOf(expectedRoute);
      const selected = selectSemanticRuntimeInitialChoice({
        ...(expectedIndex <= 0
          ? {
              inevitableCorpDeckoutChoice:
                orderedCandidates.inevitableCorpDeckoutChoice,
            }
          : {}),
        ...(expectedIndex <= 1
          ? { reactiveChoice: orderedCandidates.reactiveChoice }
          : {}),
        ...(expectedIndex <= 2
          ? {
              selfDamageImmediateWinChoice:
                orderedCandidates.selfDamageImmediateWinChoice,
            }
          : {}),
        ...(expectedIndex <= 3
          ? {
              opponentMatchpointContestChoice:
                orderedCandidates.opponentMatchpointContestChoice,
            }
          : {}),
        mappedChoice: expectedIndex <= 4 ? orderedCandidates.mappedChoice : {},
        ...(expectedIndex <= 5
          ? { bestChoice: orderedCandidates.bestChoice }
          : {}),
      });

      expect(selected?.route).toBe(expectedRoute);
      expect(selected?.choice.action.actionId).toBe(expectedActionId);
    },
  );

  it("returns no selection when every productive candidate is absent", () => {
    expect(
      selectSemanticRuntimeInitialChoice({ mappedChoice: {} }),
    ).toBeUndefined();
  });

  it("marks a fail-closed coverage selection as its own route", () => {
    const fallback = buildSemanticCoverageFallbackDecisionChainDebug({
      input: {
        legalActions: [choice("fallback").action],
      } as AiDecisionInput,
      choices: [],
      actionId: "fallback",
    });

    expect(fallback.initialSelection).toEqual({
      route: "semantic_coverage_fallback",
      actionId: "fallback",
    });
    expect(fallback.finalSelection).toEqual({
      actionId: "fallback",
      selectedOptionCount: 0,
    });
  });

  it("records score, plan arbitration, adjustment, and final choice without changing them", () => {
    const mapped = choice("mapped", 900);
    const override = choice("override", 1900);
    const mappedChoice: TacticalPlanMappedChoiceResult = {
      outcome: "semantic_choice_blocked",
      choice: mapped,
      overrideBlockedChoice: override,
      overrideBlockedReason: "corp_score_conversion_plan_controller",
      overrideThreshold: Number.POSITIVE_INFINITY,
      scoreGap: 1000,
    };
    const initialSelection = selectSemanticRuntimeInitialChoice({
      mappedChoice,
      bestChoice: override,
    });
    if (!initialSelection) throw new Error("missing initial selection");

    const debug = buildSemanticDecisionChainDebug({
      input: {
        legalActions: [mapped.action, override.action],
        playerView: {
          pendingChoice: {
            choiceId: "choice-1",
            kind: "bid_amount",
            source: "trace:test",
          },
        },
      } as AiDecisionInput,
      choices: [mapped, override],
      bestChoice: override,
      planRuntime: {
        planAlternatives: [],
        blockedPlans: [],
        selectedPlan: {
          planId: "plan-1",
          type: "corp.create_score_window",
        },
        selectedMapping: {
          status: "matched",
          legalActions: [mapped.action],
        },
      } as unknown as TacticalPlanRuntimeResult,
      mappedChoice,
      initialSelection,
      runOnlyActionAdjustment: {
        choice: override,
        rankedChoices: [override, mapped],
      },
      selectedChoices: {
        choiceId: "choice-1",
        selectedOptionIds: ["option-1"],
      },
    });

    expect(debug).toMatchObject({
      rawScoreWinner: { actionId: "override", score: 1900 },
      planSelection: {
        planId: "plan-1",
        planKind: "corp.create_score_window",
        mappedActionIds: ["mapped"],
      },
      planArbitration: {
        outcome: "semantic_choice_blocked",
        selectedActionId: "mapped",
        mappedActionId: "mapped",
        overrideBlockedActionId: "override",
        reason: "corp_score_conversion_plan_controller",
        scoreGap: 1000,
        threshold: "absolute",
        policy: "absolute_plan_control",
      },
      initialSelection: {
        route: "tactical_plan_mapping",
        actionId: "mapped",
      },
      adjustments: [
        {
          kind: "runner_run_only_adjustment",
          fromActionId: "mapped",
          toActionId: "override",
        },
      ],
      finalSelection: {
        actionId: "override",
        selectedOptionCount: 1,
      },
    });
  });
});

function choice(actionId: string, score = 1000): SemanticRuntimeChoice {
  return {
    action: {
      actionId,
      type: "gain_credit",
      side: "corp",
      source: "basic_action",
      visibility: "public",
      stateVersion: 1,
    } as unknown as LegalAction,
    scopeId: "basic_economy_draw",
    score,
    scoreBreakdown: [],
    reasonCode: `test.${actionId}`,
    explanation: actionId,
    evidence: [],
  };
}
