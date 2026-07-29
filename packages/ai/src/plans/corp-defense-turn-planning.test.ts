import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CorpDefenseSignal,
  CorpEconomyNeedSignal,
  CorpGenericDefenseSignal,
} from "./corp-core-plan-modules";
import {
  assessFundingOnlyIceStaging,
  buildCorpDefenseTurnPlanningSlice,
} from "./corp-defense-turn-planning";
import { buildPlanningStateIdentity } from "./turn-planning-contracts";

describe("Corp defense/economy turn-planning vertical slice", () => {
  it("binds exact funding before the ICE install without duplicating defense value", () => {
    const input = decisionInput();
    const defense = defenseSignal({
      disposition: "funding_only",
      effect: "progress",
      fundingGap: 2,
    });
    const economy: CorpEconomyNeedSignal = {
      kind: "parent_funding",
      needId: "defense-reserve:rd:ice-1",
      gap: 2,
      actionIds: ["gain-credits"],
      immediateDefenseConversion: true,
      parentPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      parentNeedId: defense.defenseId,
      incrementalDefenseReserve: {
        targetCredits: 7,
        serverId: "rd",
        iceInstanceId: "ice-1",
      },
      urgentForScore: false,
      evidenceCode: defense.evidenceCode,
    };
    const slice = buildSlice(
      input,
      [defense],
      [economy],
      [economyCandidate(), installCandidate("install-rd", "ice-1", "rd")],
    );
    const line = slice.lines[0]!;

    expect(line).toMatchObject({
      disposition: "fund_then_install",
      currentActionId: "gain-credits",
      fundingGapBefore: 2,
      fundingGapAfter: 0,
      rezReadyAfterLine: true,
    });
    expect(line.nodes.map((node) => node.ownerModuleId)).toEqual([
      "corp.economy",
      "corp.defend_servers",
    ]);
    expect(
      line.valueClaims.filter(
        (claim) => claim.ownerModuleId === "corp.defend_servers",
      ),
    ).toHaveLength(1);
  });

  it("admits a capped bluff on an empty central only with a credible later-rez horizon", () => {
    const input = decisionInput();
    const defense = defenseSignal({
      disposition: "funding_only",
      effect: "no_progress",
      fundingGap: 2,
    });
    const assessment = assessFundingOnlyIceStaging({
      input,
      signal: defense,
      productiveAlternativeExists: false,
      fundingAlternativeExists: false,
    });
    expect(assessment).toEqual({
      admissible: true,
      disposition: "bounded_bluff",
      bluffValue: 3,
      reasonCode: "bounded_central_bluff_with_credible_funding_horizon",
    });

    const slice = buildSlice(
      input,
      [defense],
      [],
      [installCandidate("install-rd", "ice-1", "rd")],
    );
    expect(slice.lines[0]).toMatchObject({
      disposition: "bounded_bluff",
      bluffValue: 3,
      defenseValue: 0,
      totalValue: -3,
      rezReadyAfterLine: false,
    });
    expect(slice.lines[0]?.valueClaims).toEqual([
      expect.objectContaining({
        ownerModuleId: "corp.defend_servers",
        amount: 3,
      }),
    ]);
    expect(slice.lines[0]?.evidenceCodes).toContain(
      "ice_decision_owned_by_corp_defend_servers",
    );
  });

  it("keeps partial exact funding ahead of staging even when one action cannot close the whole gap", () => {
    const input = decisionInput();
    const defense = defenseSignal({
      disposition: "funding_only",
      effect: "progress",
      fundingGap: 2,
    });
    const economy: CorpEconomyNeedSignal = {
      kind: "parent_funding",
      needId: "defense-reserve:rd:ice-1",
      gap: 2,
      actionIds: ["gain-credits"],
      immediateDefenseConversion: true,
      parentPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      parentNeedId: defense.defenseId,
      incrementalDefenseReserve: {
        targetCredits: 7,
        serverId: "rd",
        iceInstanceId: "ice-1",
      },
      urgentForScore: false,
      evidenceCode: defense.evidenceCode,
    };
    const slice = buildSlice(
      input,
      [defense],
      [economy],
      [economyCandidate(1), installCandidate("install-rd", "ice-1", "rd")],
    );

    expect(slice.lines).toEqual([]);
    expect(slice.rejected).toEqual([
      expect.objectContaining({
        defenseId: defense.defenseId,
        reasonCode: "exact_funding_before_install_available",
      }),
    ]);
  });

  it("rejects a weak bluff when useful defense is already available or the target has no pressure gap", () => {
    const input = decisionInput();
    input.playerView.servers.find((server) => server.id === "rd")!.ice = [
      visibleCard("existing-ice", "ice"),
    ];
    const weak = defenseSignal({
      disposition: "funding_only",
      effect: "no_progress",
      fundingGap: 2,
      centralPressure: undefined,
    });
    expect(
      assessFundingOnlyIceStaging({
        input,
        signal: weak,
        productiveAlternativeExists: false,
        fundingAlternativeExists: false,
      }),
    ).toEqual({
      admissible: false,
      reasonCode: "bluff_has_no_defense_or_tempo_basis",
    });
    expect(
      assessFundingOnlyIceStaging({
        input,
        signal: weak,
        productiveAlternativeExists: true,
        fundingAlternativeExists: false,
      }),
    ).toEqual({
      admissible: false,
      reasonCode: "productive_defense_install_available",
    });
  });
});

function buildSlice(
  input: AiDecisionInput,
  defenseNeeds: CorpDefenseSignal[],
  economyNeeds: CorpEconomyNeedSignal[],
  candidates: ActionSemanticCandidate[],
) {
  return buildCorpDefenseTurnPlanningSlice({
    input,
    defenseNeeds,
    economyNeeds,
    candidates,
    stateIdentity: buildPlanningStateIdentity(input),
  });
}

function defenseSignal(params: {
  disposition: "productive" | "funding_only";
  effect: "no_progress" | "progress" | "satisfied";
  fundingGap: number;
  centralPressure?: CorpGenericDefenseSignal["centralPressure"];
}): CorpGenericDefenseSignal {
  return {
    kind: "generic",
    defenseId: "central-defense:rd",
    serverId: "rd",
    phase: "install_ice",
    sourceDefinitionIds: ["ice-definition"],
    actionIds: ["install-rd"],
    urgent: false,
    ...(params.centralPressure
      ? { centralPressure: params.centralPressure }
      : {}),
    installRoute: {
      disposition: params.disposition,
      progressKind:
        params.disposition === "productive"
          ? "funded_structured_central_defense"
          : "funding_required",
      rezFundingGap: params.fundingGap,
      projection: {
        knowledge: "known",
        actionId: "install-rd",
        sourceCardInstanceId: "ice-1",
        sourceDefinitionId: "ice-definition",
        targetServerId: "rd",
        before: { knowledge: "known" },
        after: {
          knowledge: "known",
          minimumAdditionalCreditsToSatisfy: params.fundingGap,
        },
        effect: params.effect,
        evidence: [],
        installCredits: 0,
        installClicks: 1,
        installCostSource: "legal_action_agreed_projection",
        selectedRezCosts: [],
        creditsAfterDefense: 5,
        clicksAfterDefense: 2,
        preservesScoreCreditReserve: true,
        preservesHardClickReserve: true,
        preservesReserves: true,
        funded: params.fundingGap === 0,
      } as unknown as NonNullable<
        CorpGenericDefenseSignal["installRoute"]
      >["projection"],
    },
    value: 10,
    evidenceCode: "test-central-defense",
  };
}

function economyCandidate(netGain = 2): ActionSemanticCandidate {
  return {
    ...baseCandidate("gain-credits", "economy.gain_credit", "operation-1"),
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: netGain,
      netLiquidCreditGain: netGain,
      cardsDrawn: 0,
      cardsConsumed: 1,
      netHandDelta: -1,
      payoutMode: "fixed",
      repeatable: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
    },
  };
}

function installCandidate(
  actionId: string,
  sourceId: string,
  serverId: string,
): ActionSemanticCandidate {
  return {
    ...baseCandidate(actionId, "install.card", sourceId),
    sourceDefinitionId: "ice-definition",
    targetContext: {
      selectedTargets: [
        {
          targetId: serverId,
          targetKind: "server",
          targetSide: "corp",
          visibilityScope: "actor_private",
          evidence: [],
        },
      ],
      availableTargets: [],
      targetKind: "server",
      targetZones: [],
      targetSide: "corp",
      hiddenInfoPolicy: "none",
      availableTargetsStatus: "engine_provided",
      targetProfileMatches: [],
      targetConstraintResults: [],
    },
  };
}

function baseCandidate(
  actionId: string,
  semanticActionType: string,
  sourceId: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: [],
    },
    stateVersion: 30,
    sourceKind: "card",
    sourceCardInstanceId: sourceId,
    sourceDefinitionId: `${sourceId}-definition`,
    abilityBindingMethod: "unresolved",
    semanticActionType,
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
      stateVersion: 30,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function decisionInput(): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "defense-slice",
    seed: "defense-slice",
    decisionId: "defense-slice",
    actionNumber: 30,
    eventTail: [],
    playerView: {
      side: "corp",
      stateVersion: 30,
      turnSerial: 4,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "action",
      own: {
        identity: visibleCard("corp-id", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [visibleCard("ice-1", "ice")],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("runner-id", "identity"),
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
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function visibleCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId,
    definitionId: `${instanceId}-definition`,
    title: instanceId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
  };
}
