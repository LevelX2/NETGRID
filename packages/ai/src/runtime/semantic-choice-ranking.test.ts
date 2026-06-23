import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { tacticalPlanMappedChoice } from "./semantic-choice-ranking";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { PlanStepMappingResult } from "../tactical-plans";

describe("tacticalPlanMappedChoice", () => {
  it("lets a clear semantic run gap override coverage-plan mapping", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7645), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7645),
    );

    expect(result.overrideChoice?.action.actionId).toBe("run-rd");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("gain");
    expect(result.scoreGap).toBe(620);
  });

  it("keeps coverage-plan mapping for close semantic run gaps", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7600), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7600),
    );

    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
  });

  it("keeps direct coverage answers even with a clear semantic run gap", () => {
    const prepare = legalAction("prepare-shell-traders", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 8200), choice(prepare, 6200)],
      coverageMapping([prepare]),
      choice(run, 8200),
    );

    expect(result.choice?.action.actionId).toBe("prepare-shell-traders");
    expect(result.overrideChoice).toBeUndefined();
  });
});

function choice(action: LegalAction, score: number): SemanticRuntimeChoice {
  return {
    action,
    scopeId:
      action.type === "start_run"
        ? "simple_hq_or_rnd_pressure"
        : "basic_economy_draw",
    score,
    reasonCode: `runner.semantic.${action.type}`,
    explanation: action.label,
    evidence: [],
  };
}

function coverageMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return {
    status: "matched",
    plan: {
      planId: "runner.obtain_breaker_coverage:remote_1",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "active",
      priority: 100,
      horizonTurns: 1,
      target: { kind: "server", id: "remote_1" },
      requiredCapabilities: [],
      currentStep: {
        stepId: "gain_for_breaker",
        kind: "gain_credits",
        desiredActionSemantics: ["economy.gain_credit"],
        requiredCapabilities: [],
        rationale: [],
      },
      evidence: [],
      scoreBreakdown: [],
      stateVersion: 1,
    },
    step: {
      stepId: "gain_for_breaker",
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [],
      rationale: [],
    },
    legalActions,
    actionCandidateIds: legalActions.map((action) => action.actionId),
    rationale: [],
  } as unknown as PlanStepMappingResult;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function aiInput(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 1,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: {
          instanceId: "runner",
          definitionId: "runner",
          title: "Runner",
          owner: "runner",
          controller: "runner",
          type: "identity",
          known: true,
        },
        credits: 3,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "corp",
          definitionId: "corp",
          title: "Corp",
          owner: "corp",
          controller: "corp",
          type: "identity",
          known: true,
        },
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "semantic-choice-ranking-test",
    decisionId: "semantic-choice-ranking-test",
    actionNumber: 1,
    profileId: "semantic-choice-ranking-test",
  };
}
