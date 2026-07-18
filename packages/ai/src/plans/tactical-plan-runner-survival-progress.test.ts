import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { evaluateTacticalPlans } from "../tactical-plans";

describe("runner survival progress contract", () => {
  it("does not create survival defense from a basic credit above its reaction reserve", () => {
    const gain = legalAction("gain", "gain_credit");
    const input = aiInput([gain], 14);

    const result = evaluateTacticalPlans({
      input,
      candidates: buildActionSemanticCandidates(input),
    });

    expect(result.planAlternatives.map((plan) => plan.type)).not.toContain(
      "runner.survival_defense",
    );
  });

  it("uses a basic credit to close an unsatisfied critical reaction reserve", () => {
    const gain = legalAction("gain", "gain_credit");
    const input = aiInput([gain], 2);

    const result = evaluateTacticalPlans({
      input,
      candidates: buildActionSemanticCandidates(input),
    });

    expect(result.selectedPlan).toMatchObject({
      type: "runner.survival_defense",
      requiredCapabilities: [
        expect.objectContaining({ kind: "survival", minimumCredits: 4 }),
      ],
    });
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      gain.actionId,
    );
  });
});

function aiInput(
  legalActions: LegalAction[],
  credits: number,
): AiDecisionInput {
  return {
    side: "runner",
    playerView: playerView(legalActions, credits),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-survival-progress-test",
    decisionId: "runner-survival-progress-test:runner",
    actionNumber: 1,
    profileId: "runner-survival-progress-test",
  };
}

function playerView(legalActions: LegalAction[], credits: number): PlayerView {
  return {
    stateVersion: 39,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [damageEvent()],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function damageEvent(): PublicGameEvent {
  return {
    eventId: "setup-net-damage",
    type: "net_damage",
    stateVersionBefore: 31,
    stateVersionAfter: 32,
    stateHashAfter: "fnv1a:setup-net-damage",
    visibilityClass: "public",
    publicPayload: {
      actor: "corp",
      actionType: "net_damage",
      damageType: "net",
      damageAmount: 2,
      sourceTitle: "Setup!",
      sourceDefinitionId: "onr_v1_340_setup",
    },
  };
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function legalAction(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ credits: 0 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 40,
  };
}
