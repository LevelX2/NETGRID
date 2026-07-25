import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { buildCorpAmbushPlanSignals } from "./corp-ambush-plan-signals";

describe("Corp ambush plan signal duplicate scope", () => {
  it("counts only same-definition copies in active remote roots as installed duplicates", () => {
    const definitionId = "onr_v1_345_trap";
    const handCopy = visibleCard("trap-in-hq", "corp", "asset", {
      definitionId,
      title: "TRAP!",
    });
    const install = legalAction(
      "install-trap-remote-1",
      "corp",
      "install_card",
      "Install TRAP! in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: handCopy.instanceId,
        payload: {
          cardId: handCopy.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.credits = 8;
    input.playerView.own.gripOrHq = [handCopy];
    input.playerView.servers = [
      server("hq", [], [sameDefinitionCopy("trap-in-hq-root")]),
      server("rd", [], [sameDefinitionCopy("trap-in-rd")]),
      server("archives", [], [sameDefinitionCopy("trap-in-archives")]),
      server("remote_1"),
    ];
    setAmbushIntent(input);
    const candidate = ambushInstallCandidate(
      install.actionId,
      handCopy.instanceId,
      definitionId,
      "remote_1",
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([
      expect.objectContaining({
        sourceInstanceId: handCopy.instanceId,
        sourceDefinitionId: definitionId,
        actionIds: [install.actionId],
        serverId: "remote_1",
        phase: "install",
        duplicateAlreadyInstalled: false,
      }),
    ]);

    input.playerView.servers.push(
      server("remote_2", [], [sameDefinitionCopy("trap-in-remote-2")]),
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([]);

    function sameDefinitionCopy(instanceId: string) {
      return visibleCard(instanceId, "corp", "asset", {
        definitionId,
        title: "TRAP!",
      });
    }
  });
});

function ambushInstallCandidate(
  actionId: string,
  sourceInstanceId: string,
  sourceDefinitionId: string,
  serverId: "remote_1",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: ["cardId", "placement", "serverId"],
    },
    stateVersion: 1,
    sourceKind: "card",
    sourceCardInstanceId: sourceInstanceId,
    sourceDefinitionId,
    abilityBindingMethod: "unresolved",
    semanticActionType: "install.card",
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      paidBy: "corp",
      beneficiary: "corp",
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {
      phase: "corp_action_phase",
      turnSide: "corp",
      window: "corp_action.main",
      responseWindow: true,
    },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 1,
      notes: [],
    },
    runProjectionSummary: {
      serverId,
      serverKind: "remote",
      source: "legal_action_payload",
      evidence: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function setAmbushIntent(input: AiDecisionInput): void {
  (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent = {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "corp.punish_runner",
    scorePlan: [],
    defensePlan: [],
    economyPlan: [],
    enginePlan: [],
    punishPlan: ["corp.ambush_bluff"],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test_corp_ambush_strategy_active"],
  } satisfies CorpStrategicIntentProfile;
}
