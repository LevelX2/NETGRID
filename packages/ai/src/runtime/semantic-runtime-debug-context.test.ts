import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import {
  buildNeutralActionSemanticCandidate,
  type ActionSemanticCandidate,
} from "../action-semantic-candidate";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import { createSemanticRuntimeDebugContext } from "./semantic-runtime-debug-context";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("SemanticRuntimeDebugContext", () => {
  it("uses action semantic candidates for selected and alternative score breakdowns", () => {
    const selectedAction = legalAction("install-agenda", "corp", "install_card");
    const alternativeAction = legalAction("gain-credit", "corp", "gain_credit");
    const selectedChoice = choice(
      selectedAction,
      "scoreline",
      100,
      "selected candidate evidence",
    );
    const alternativeChoice = choice(
      alternativeAction,
      "basic_economy_draw",
      50,
      "alternative candidate evidence",
    );
    const selectedCandidate = candidate(
      selectedAction,
      "candidate.install_scoreline",
    );
    const alternativeCandidate = candidate(
      alternativeAction,
      "candidate.basic_economy",
    );
    const context = createSemanticRuntimeDebugContext({
      scoreBreakdown: (_input, action, _scopeId, _exclusion, actionCandidate) => [
        {
          key: `candidate_${actionCandidate?.semanticActionType ?? "missing"}`,
          label: action.actionId,
          value: actionCandidate ? 1 : -1,
          ...(actionCandidate ? { reason: actionCandidate.actionId } : {}),
        },
      ],
      visibleSourceCard: () => undefined,
    });

    const debug = context.semanticRuntimeDecisionDebug(
      aiInput("corp", [selectedAction, alternativeAction]),
      selectedChoice,
      [selectedChoice, alternativeChoice],
      emptyPlanRuntime(),
      [selectedCandidate, alternativeCandidate],
    );

    expect(debug.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "candidate_candidate.install_scoreline",
          reason: "install-agenda",
        }),
      ]),
    );
    expect(
      debug.rankedAlternatives?.find(
        (entry) => entry.selectedActionType === "install_card",
      )?.scoreBreakdown,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "candidate_candidate.install_scoreline",
          reason: "install-agenda",
        }),
      ]),
    );
    expect(
      debug.rankedAlternatives?.find(
        (entry) => entry.selectedActionType === "gain_credit",
      )?.scoreBreakdown,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "candidate_candidate.basic_economy",
          reason: "gain-credit",
        }),
      ]),
    );
    expect(
      debug.actionAlternatives?.find(
        (entry) => entry.actionId === "install-agenda",
      )?.scoreBreakdown,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "candidate_candidate.install_scoreline",
          reason: "install-agenda",
        }),
      ]),
    );
    expect(
      debug.actionAlternatives?.find(
        (entry) => entry.actionId === "gain-credit",
      )?.scoreBreakdown,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "candidate_candidate.basic_economy",
          reason: "gain-credit",
        }),
      ]),
    );
  });
});

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function choice(
  action: LegalAction,
  scopeId: string,
  score: number,
  evidence: string,
): SemanticRuntimeChoice {
  return {
    action,
    scopeId,
    score,
    reasonCode: `corp.semantic.${scopeId}`,
    explanation: scopeId,
    evidence: [evidence],
  };
}

function candidate(
  action: LegalAction,
  semanticActionType: string,
): ActionSemanticCandidate {
  return {
    ...buildNeutralActionSemanticCandidate(action, {
      observerSide: "corp",
      stateVersion: 1,
    }),
    semanticActionType,
  };
}

function emptyPlanRuntime(): TacticalPlanRuntimeResult {
  return {
    planAlternatives: [],
    blockedPlans: [],
  };
}

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: side,
      phase: "corp_action_phase",
      own: {
        identity: visibleCard("corp-identity", side),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 40,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("runner-identity", side === "corp" ? "runner" : "corp"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 40,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "debug-context-test",
    decisionId: "decision-1",
    actionNumber: 1,
    profileId: "test-profile",
  };
}

function visibleCard(instanceId: string, side: Side): VisibleCard {
  return {
    instanceId,
    known: true,
    title: instanceId,
    type: "identity",
    owner: side,
    controller: side,
  };
}
