import {
  CURRENT_RULES_BASELINE,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "./turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
  PROJECTED_DECISION_FRAME_SCHEMA_VERSION,
  TurnProjectionError,
} from "./turn-projection";

describe("turn projection", () => {
  it("repeats the same frame and fingerprint for the same planning input", () => {
    const first = projectedFrame(decisionInput());
    const repeated = projectedFrame(decisionInput());

    expect(repeated).toEqual(first);
    expect(repeated.projectedFrameKey).toBe(first.projectedFrameKey);
  });

  it("builds an immutable side-safe frame with complete known-zone keys", () => {
    const input = decisionInput();
    const frame = projectedFrame(input);

    expect(frame).toMatchObject({
      schemaVersion: PROJECTED_DECISION_FRAME_SCHEMA_VERSION,
      side: "corp",
      ownCredits: { minimum: 5, maximum: 5 },
      actionCapacityLedger: {
        unrestricted: { minimum: 3, maximum: 3 },
      },
      ownHand: {
        count: { minimum: 2, maximum: 2 },
        capacity: 5,
      },
      projectedCleanup: {
        dispositionCoverageComplete: true,
        requiredDiscardRange: { minimum: 0, maximum: 0 },
      },
    });
    expect(frame.ownKnownZones.map((zone) => zone.zoneId)).toEqual(
      expect.arrayContaining([
        "own_hand",
        "own_discard",
        "own_scored",
        "server:rd:ice",
      ]),
    );
    expect(frame.projectedFrameKey).toMatch(/^fnv1a:/);
    expect(input.playerView.own.credits).toBe(5);
  });

  it("projects only guaranteed side-safe semantic deltas without mutating the base", () => {
    const input = decisionInput();
    const frame = projectedFrame(input);
    const delta = certifiedTurnProjectionDeltaFromCandidate({
      frame,
      candidate: candidate({
        netCredits: 4,
        netHand: -1,
        netActions: -1,
      }),
    });
    const projected = applyCertifiedTurnProjectionDelta(frame, delta);

    expect(projected.ownCredits).toEqual({ minimum: 9, maximum: 9 });
    expect(projected.ownHand.count).toEqual({ minimum: 1, maximum: 1 });
    expect(projected.actionCapacityLedger.unrestricted).toEqual({
      minimum: 2,
      maximum: 2,
    });
    expect(projected.projectedFrameKey).not.toBe(frame.projectedFrameKey);
    expect(frame.ownCredits).toEqual({ minimum: 5, maximum: 5 });
  });

  it("tracks restricted action tokens exactly and rejects overconsumption", () => {
    const frame = projectedFrame(decisionInput());
    const tokenId = "restricted-install-actions";
    const withToken = applyCertifiedTurnProjectionDelta(frame, {
      schemaVersion: "turn-projection-delta-v1",
      deltaId: "add-restricted-capacity",
      expectedBaseFrameKey: frame.projectedFrameKey,
      certification: "legal_action_semantics",
      actionCapacityDelta: { minimum: -1, maximum: -1 },
      restrictedActionCapacityAdds: [
        {
          tokenId,
          remaining: 3,
          allowedActionTypes: ["install_card"],
          expiresAt: "side_turn_end",
        },
      ],
      creditDelta: { minimum: 0, maximum: 0 },
      handCountDelta: { minimum: 0, maximum: 0 },
      knownZoneMoves: [],
      boardUpdates: [],
      usageAdds: [],
      publicEventFactAdds: [],
      reservations: [],
      portfolioProgress: [],
      uncertainty: [],
    });
    const consumed = applyCertifiedTurnProjectionDelta(withToken, {
      schemaVersion: "turn-projection-delta-v1",
      deltaId: "consume-restricted-capacity",
      expectedBaseFrameKey: withToken.projectedFrameKey,
      certification: "legal_action_semantics",
      actionCapacityDelta: { minimum: 0, maximum: 0 },
      restrictedActionCapacityConsumes: [{ tokenId, amount: 2 }],
      creditDelta: { minimum: 0, maximum: 0 },
      handCountDelta: { minimum: 0, maximum: 0 },
      knownZoneMoves: [],
      boardUpdates: [],
      usageAdds: [],
      publicEventFactAdds: [],
      reservations: [],
      portfolioProgress: [],
      uncertainty: [],
    });

    expect(consumed.actionCapacityLedger.restrictedTokens).toEqual([
      expect.objectContaining({ tokenId, remaining: 1 }),
    ]);
    expect(() =>
      applyCertifiedTurnProjectionDelta(consumed, {
        schemaVersion: "turn-projection-delta-v1",
        deltaId: "overconsume-restricted-capacity",
        expectedBaseFrameKey: consumed.projectedFrameKey,
        certification: "legal_action_semantics",
        actionCapacityDelta: { minimum: 0, maximum: 0 },
        restrictedActionCapacityConsumes: [{ tokenId, amount: 2 }],
        creditDelta: { minimum: 0, maximum: 0 },
        handCountDelta: { minimum: 0, maximum: 0 },
        knownZoneMoves: [],
        boardUpdates: [],
        usageAdds: [],
        publicEventFactAdds: [],
        reservations: [],
        portfolioProgress: [],
        uncertainty: [],
      }),
    ).toThrowError(/restricted_capacity_overconsumed/);
  });

  it("moves a known own card and advances it only from an exact base frame", () => {
    const input = decisionInput();
    const frame = projectedFrame(input);
    const projected = applyCertifiedTurnProjectionDelta(frame, {
      schemaVersion: "turn-projection-delta-v1",
      deltaId: "install-agenda",
      expectedBaseFrameKey: frame.projectedFrameKey,
      certification: "plan_module_exact",
      actionCapacityDelta: { minimum: -1, maximum: -1 },
      creditDelta: { minimum: 0, maximum: 0 },
      handCountDelta: { minimum: -1, maximum: -1 },
      knownZoneMoves: [
        {
          instanceId: "agenda-1",
          fromZoneId: "own_hand",
          toZoneId: "server:remote_1:root",
        },
      ],
      boardUpdates: [
        {
          instanceId: "agenda-1",
          zoneId: "server:remote_1:root",
          serverId: "remote_1",
          advancementDelta: 1,
        },
      ],
      usageAdds: ["installed_this_turn:agenda-1"],
      publicEventFactAdds: [],
      reservations: [],
      portfolioProgress: [],
      uncertainty: [],
    });

    expect(
      projected.ownKnownZones.find(
        (zone) => zone.zoneId === "server:remote_1:root",
      )?.instanceIds,
    ).toContain("agenda-1");
    expect(
      projected.ownKnownBoard.find((card) => card.instanceId === "agenda-1"),
    ).toMatchObject({ serverId: "remote_1", advancement: 1 });
    expect(projected.usageLedger).toContain("installed_this_turn:agenda-1");

    expect(() =>
      applyCertifiedTurnProjectionDelta(projected, {
        schemaVersion: "turn-projection-delta-v1",
        deltaId: "stale-delta",
        expectedBaseFrameKey: frame.projectedFrameKey,
        certification: "plan_module_exact",
        actionCapacityDelta: { minimum: 0, maximum: 0 },
        creditDelta: { minimum: 0, maximum: 0 },
        handCountDelta: { minimum: 0, maximum: 0 },
        knownZoneMoves: [],
        boardUpdates: [],
        usageAdds: [],
        publicEventFactAdds: [],
        reservations: [],
        portfolioProgress: [],
        uncertainty: [],
      }),
    ).toThrowError(/base_frame_mismatch/);
  });

  it("ends a draw at a private boundary but values remaining capacity abstractly", () => {
    const early = assessTurnObservationBoundary({
      boundaryKind: "private_observation",
      remainingActionCapacity: { minimum: 3, maximum: 3 },
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["draw_one_card"],
    });
    const late = assessTurnObservationBoundary({
      boundaryKind: "private_observation",
      remainingActionCapacity: { minimum: 0, maximum: 0 },
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["draw_one_card"],
    });

    expect(early.postBoundaryOptionality).toEqual({
      minimum: 3,
      maximum: 3,
      unit: "usable_actions",
    });
    expect(late.postBoundaryOptionality.maximum).toBe(0);
    expect(JSON.stringify(early)).not.toMatch(
      /futureAction|futureCard|nextPhase/,
    );
  });

  it("binds need-hit optionality to bounded probabilities", () => {
    const boundary = assessTurnObservationBoundary({
      boundaryKind: "private_observation",
      remainingActionCapacity: { minimum: 2, maximum: 2 },
      residualTurnValueBasis: "open_need_hit_distribution",
      immediateOutcomeCodes: ["search_for_icebreaker"],
      hitProbabilityBands: [
        {
          needId: "breaker:barrier",
          minimumProbability: 0.2,
          maximumProbability: 0.45,
        },
      ],
    });
    expect(boundary.postBoundaryOptionality).toEqual({
      minimum: 0.2,
      maximum: 0.45,
      unit: "need_hit_probability",
    });
    expect(() =>
      assessTurnObservationBoundary({
        boundaryKind: "private_observation",
        remainingActionCapacity: { minimum: 2, maximum: 2 },
        residualTurnValueBasis: "open_need_hit_distribution",
        immediateOutcomeCodes: [],
        hitProbabilityBands: [
          {
            needId: "invalid",
            minimumProbability: 0.8,
            maximumProbability: 0.2,
          },
        ],
      }),
    ).toThrow(TurnProjectionError);
  });

  it("marks every unclassified own hand instance before cleanup", () => {
    const input = decisionInput();
    const rulesContext = buildPlanningRulesContext({
      rulesBaseline: CURRENT_RULES_BASELINE,
      formatProfileId: "test-format",
      cardPoolSnapshotId: "test-pool",
    });
    const frame = buildProjectedDecisionFrame({
      input,
      rulesContext,
      stateIdentity: buildPlanningStateIdentity(input),
      turnKey: "corp:1",
      handDispositions: new Map([["agenda-1", "campaign_hold"]]),
    });

    expect(frame.projectedCleanup).toEqual(
      expect.objectContaining({
        dispositionCoverageComplete: false,
        unclassifiedInstanceIds: ["operation-1"],
      }),
    );
  });
});

function projectedFrame(input: AiDecisionInput) {
  return buildProjectedDecisionFrame({
    input,
    rulesContext: buildPlanningRulesContext({
      rulesBaseline: CURRENT_RULES_BASELINE,
      formatProfileId: "test-format",
      cardPoolSnapshotId: "test-pool",
    }),
    stateIdentity: buildPlanningStateIdentity(input),
    turnKey: "corp:1",
    handDispositions: new Map([
      ["agenda-1", "campaign_hold"],
      ["operation-1", "current_plan_route"],
    ]),
  });
}

function candidate(params: {
  netCredits: number;
  netHand: number;
  netActions: number;
}): ActionSemanticCandidate {
  return {
    actionId: "play-operation",
    actionType: "play_operation",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: "play-operation",
      actionType: "play_operation",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    sourceCardInstanceId: "operation-1",
    sourceDefinitionId: "operation",
    abilityBindingMethod: "unresolved",
    semanticActionType: "economy.gain_credit",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 10,
      notes: [],
    },
    confidence: "high",
    stateVersion: 10,
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: params.netCredits,
      netLiquidCreditGain: params.netCredits,
      cardsDrawn: 0,
      cardsConsumed: 1,
      netHandDelta: params.netHand,
      payoutMode: "fixed",
      repeatable: "unknown",
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
    },
    actionCapacityProjection: {
      schemaVersion: "action-capacity-projection-v1",
      kind: "non_action_capacity",
      timing: "immediate",
      restriction: "unrestricted",
      allowedActionTypes: [],
      listedActionCost: 1,
      grossActionsGained: 0,
      generatedActionsConsumedByCurrentAction: 0,
      preExistingActionCost: 1,
      followupActionCapacity: 0,
      netCurrentTurnActionDelta: params.netActions,
      actionDebt: 0,
      selfFinancing: false,
      source: "legal_action_payload",
      reliability: "guaranteed",
      repeatable: "unknown",
      confidence: "high",
      evidence: [],
    },
  };
}

function decisionInput(): AiDecisionInput {
  const agenda = card("agenda-1", "agenda", "agenda");
  const operation = card("operation-1", "operation", "operation");
  const ice = card("rd-ice", "ice", "ice");
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "projection-test",
    seed: "projection-test",
    decisionId: "projection-test",
    actionNumber: 10,
    eventTail: [],
    playerView: {
      side: "corp",
      stateVersion: 10,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "action",
      own: {
        identity: card("corp-id", "corp-id", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [agenda, operation],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "runner-id", "identity"),
        credits: 5,
        clicks: 4,
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
        { id: "rd", label: "R&D", ice: [ice], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
        { id: "remote_1", label: "Remote 1", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
  };
}
