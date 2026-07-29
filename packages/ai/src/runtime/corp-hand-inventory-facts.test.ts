import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  buildCorpHandInventoryFacts,
  CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION,
  corpHandDuplicateCount,
  corpHandPressureAssessment,
} from "./corp-hand-inventory-facts";

describe("Corp hand inventory facts", () => {
  it("records exact own-HQ actions, projections and plan-effective cleanup facts", () => {
    const input = corpInput([
      card("project-venice", "project-venice", "agenda"),
      card("accounts", "accounts-receivable", "operation"),
      card("efficiency", "efficiency-experts", "operation"),
      card("setup", "setup", "asset"),
    ]);
    const candidates = [
      economyCandidate("play-accounts", "accounts", "accounts-receivable", 4),
      economyCandidate(
        "play-efficiency",
        "efficiency",
        "efficiency-experts",
        3,
      ),
      candidate("install-project", "project-venice", "project-venice"),
      candidate("install-setup", "setup", "setup"),
    ];
    const facts = buildCorpHandInventoryFacts({
      input,
      candidates,
      actionDispositions: [],
      domainClaims: [
        claim(
          "corp.score_agenda",
          "score-project",
          ["install-project"],
          ["project-venice"],
        ),
        claim("corp.economy", "accounts-plan", ["play-accounts"], ["accounts"]),
        claim(
          "corp.economy",
          "efficiency-plan",
          ["play-efficiency"],
          ["efficiency"],
        ),
        claim(
          "corp.ambush_and_bluff",
          "setup-plan",
          ["install-setup"],
          ["setup"],
        ),
      ],
    });

    expect(facts).toMatchObject({
      schemaVersion: CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION,
      authority: "plan_input",
      selectionInfluence: "draw_admission_and_cleanup_projection",
      pressure: {
        handSize: 4,
        maximumHandSize: 5,
        availableSlots: 1,
        status: "under_capacity",
        actionableCardCount: 4,
        exactCapacityReleaseActions: 2,
      },
      cleanupProjection: {
        handSizeIfTurnEndedNow: 4,
        requiredDiscardsIfTurnEndedNow: 0,
        availableSlotsBeforeCleanup: 1,
        singleCardDrawWouldIncreaseDiscard: false,
        dispositionCoverageComplete: true,
        assessmentUnknownInstanceIds: [],
      },
    });
    expect(
      facts?.records.find((record) => record.sourceInstanceId === "accounts"),
    ).toMatchObject({
      legalActionIds: ["play-accounts"],
      actionHandDeltas: [
        {
          actionId: "play-accounts",
          netHandDelta: -1,
          cardsDrawn: 0,
          cardsConsumed: 1,
        },
      ],
      domainClaims: [
        expect.objectContaining({
          ownerModuleId: "corp.economy",
          readiness: "executable_now",
        }),
      ],
      dispositions: [],
      planningDisposition: "current_plan_route",
      retentionHorizon: "current_turn",
    });
    expect(
      facts?.records
        .find((record) => record.sourceInstanceId === "accounts")
        ?.exactCurrentProjections.join("|"),
    ).toContain("net_credits=4:net_hand=-1");
  });

  it("classifies funding, hold, redundant, unsafe and unsupported records conservatively", () => {
    const input = corpInput([
      card("funding", "funding-card", "operation"),
      card("hold", "hold-card", "ice"),
      card("duplicate-a", "duplicate-card", "asset"),
      card("duplicate-b", "duplicate-card", "asset"),
      card("unsafe", "unsafe-card", "operation"),
      card("unsupported", "unsupported-card", "operation"),
    ]);
    input.playerView.own.maxHandSize = 5;
    const candidates = [
      candidate("unsafe-action", "unsafe", "unsafe-card"),
      candidate("unsupported-action", "unsupported", "unsupported-card"),
    ];
    const facts = buildCorpHandInventoryFacts({
      input,
      candidates,
      domainClaims: [
        {
          ...claim(
            "corp.economy",
            "funding-plan",
            [],
            ["funding"],
            "corp_operation_funding_gap",
          ),
          readiness: "executable_with_support",
        },
      ],
      actionDispositions: [
        {
          actionId: "unsafe-action",
          disposition: "assessment_unknown",
          ownerModuleId: "corp.economy",
          evidenceCode: "corp_projection_unknown",
        },
        {
          actionId: "unsupported-action",
          disposition: "explicitly_nonproductive",
          ownerModuleId: "corp.hand_and_agenda_management",
          evidenceCode: "corp_card_action_has_no_exact_parent_need",
        },
      ],
    })!;
    const disposition = (instanceId: string) =>
      facts.records.find((record) => record.sourceInstanceId === instanceId)!
        .dispositions;

    expect(disposition("funding")).toContain("blocked_funding");
    expect(disposition("hold")).toEqual(["strategic_hold"]);
    expect(disposition("duplicate-a")).toContain("redundant");
    expect(disposition("duplicate-b")).toContain("redundant");
    expect(disposition("unsafe")).toEqual([
      "unsafe_current_route",
      "unsupported_domain_contract",
    ]);
    expect(disposition("unsupported")).toEqual(["unsupported_domain_contract"]);
    expect(
      facts.records.find((record) => record.sourceInstanceId === "funding"),
    ).toMatchObject({
      planningDisposition: "blocked_but_developable",
      relatedPlanInstanceIds: ["funding-plan"],
      relatedNeedIds: [],
    });
    expect(
      facts.records.find((record) => record.sourceInstanceId === "hold"),
    ).toMatchObject({ planningDisposition: "campaign_hold" });
    expect(
      facts.records.find((record) => record.sourceInstanceId === "duplicate-a"),
    ).toMatchObject({
      planningDisposition: "redundant",
      redundancyGroupId: "definition:duplicate-card",
    });
    expect(facts.pressure).toMatchObject({
      handSize: 6,
      maximumHandSize: 5,
      overflowCount: 1,
      status: "overflow",
    });
    expect(facts.cleanupProjection).toEqual({
      handSizeIfTurnEndedNow: 6,
      requiredDiscardsIfTurnEndedNow: 1,
      availableSlotsBeforeCleanup: 0,
      singleCardDrawWouldIncreaseDiscard: true,
      dispositionCoverageComplete: true,
      assessmentUnknownInstanceIds: ["unsafe", "unsupported"],
      discardCandidateInstanceIds: ["duplicate-a", "duplicate-b"],
    });
    expect(
      facts.records.every(
        (record) =>
          record.domainClaims.length > 0 || record.dispositions.length > 0,
      ),
    ).toBe(true);
  });

  it("classifies every own HQ instance even when an own card definition is unexpectedly missing", () => {
    const input = corpInput([
      {
        instanceId: "unknown-own-card",
        known: false,
        owner: "corp",
        controller: "corp",
      } as VisibleCard,
    ]);
    const facts = buildCorpHandInventoryFacts({
      input,
      candidates: [],
      domainClaims: [],
      actionDispositions: [],
    })!;

    expect(facts.records).toHaveLength(1);
    expect(facts.records[0]).toMatchObject({
      sourceInstanceId: "unknown-own-card",
      sourceDefinitionId: "unknown-own-card",
      planningDisposition: "assessment_unknown",
    });
    expect(facts.cleanupProjection).toMatchObject({
      dispositionCoverageComplete: true,
      assessmentUnknownInstanceIds: ["unknown-own-card"],
    });
  });

  it("fails closed for Runner input and exposes shared pressure helpers without Corp selection state", () => {
    const runner = corpInput([card("runner-card", "runner-card", "program")]);
    runner.side = "runner";
    runner.playerView.side = "runner";

    expect(
      buildCorpHandInventoryFacts({
        input: runner,
        candidates: [],
        domainClaims: [],
        actionDispositions: [],
      }),
    ).toBeUndefined();
    expect(corpHandDuplicateCount(runner, "runner-card")).toBe(0);
    expect(corpHandPressureAssessment(runner)).toMatchObject({
      handSize: 1,
      maximumHandSize: 5,
      status: "under_capacity",
      actionableCardCount: 0,
    });
  });
});

function claim(
  ownerModuleId: string,
  planInstanceId: string,
  actionIds: string[],
  sourceInstanceIds: string[],
  evidenceCode = "test_claim",
) {
  return {
    ownerModuleId,
    planInstanceId,
    readiness: "executable_now" as const,
    actionIds,
    sourceInstanceIds,
    evidenceCode,
  };
}

function corpInput(
  hand: AiDecisionInput["playerView"]["own"]["gripOrHq"],
): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "test",
    seed: "corp-hand-inventory-test",
    decisionId: "corp-hand-inventory-test",
    actionNumber: 1,
    eventTail: [],
    playerView: {
      matchId: "match",
      stateVersion: 10,
      timingPoint: "corp_action.main",
      side: "corp",
      own: {
        playerId: "corp",
        credits: 5,
        clicks: 1,
        agendaPoints: 0,
        tags: 0,
        badPublicity: 0,
        brainDamage: 0,
        maxHandSize: 5,
        gripOrHq: hand,
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        playerId: "runner",
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        badPublicity: 0,
        brainDamage: 0,
        maxHandSize: 5,
        gripOrHqCount: 5,
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
      },
      servers: [],
      legalActions: [],
      publicEvents: [],
      turn: { side: "corp", number: 1 },
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

function candidate(
  actionId: string,
  sourceCardInstanceId: string,
  sourceDefinitionId: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "play_operation",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "play_operation",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    sourceCardInstanceId,
    sourceDefinitionId,
    abilityBindingMethod: "unresolved",
    semanticActionType: "play.corp_operation",
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
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function economyCandidate(
  actionId: string,
  sourceCardInstanceId: string,
  sourceDefinitionId: string,
  netCredits: number,
): ActionSemanticCandidate {
  return {
    ...candidate(actionId, sourceCardInstanceId, sourceDefinitionId),
    semanticActionType: "economy.gain_credit",
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: netCredits,
      netLiquidCreditGain: netCredits,
      cardsDrawn: 0,
      cardsConsumed: 1,
      netHandDelta: -1,
      payoutMode: "fixed",
      repeatable: "unknown",
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
    },
  };
}
