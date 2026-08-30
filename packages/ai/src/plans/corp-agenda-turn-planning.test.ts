import { CURRENT_RULES_BASELINE, type AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "./corp-core-plan-modules";
import type { CorpDefenseSignal } from "./corp-core-plan-modules";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "./turn-planning-contracts";
import { buildCorpAgendaTurnPlanningSlice } from "./corp-agenda-turn-planning";
import { campaignDisposition } from "./corp-agenda-turn-planning";

describe("Corp agenda turn-planning vertical slice", () => {
  it("builds pure rush, combined rush, and safe setup without duplicate payoff ownership", () => {
    const input = decisionInput();
    const slice = buildSlice(input, project(2), [
      agendaCandidate(),
      iceCandidate("remote-ice", "remote_1"),
      iceCandidate("rd-ice", "rd"),
      economyCandidate(),
    ]);

    expect(slice.lines.map((line) => line.family).sort()).toEqual([
      "combined_rush",
      "pure_rush",
      "safe_setup",
    ]);
    expect(
      slice.lines.find((line) => line.family === "combined_rush")?.nodes,
    ).toHaveLength(4);
    for (const line of slice.lines) {
      expect(
        line.valueClaims.filter(
          (claim) => claim.componentKey === "score_window_progress",
        ),
      ).toEqual([
        expect.objectContaining({ ownerModuleId: "corp.score_agenda" }),
      ]);
      expect(
        line.valueClaims
          .filter((claim) => claim.ownerModuleId === "corp.defend_servers")
          .every((claim) => claim.contributionKind === "risk_reduction"),
      ).toBe(true);
      expect(
        line.valueClaims
          .filter((claim) => claim.ownerModuleId === "corp.economy")
          .every((claim) => claim.componentKey === "net_liquidity_delta"),
      ).toBe(true);
    }
  });

  it("admits a bounded rush-versus-safe mix for the Engine RNG domain", () => {
    const input = decisionInput();
    const candidates = [
      agendaCandidate(),
      iceCandidate("remote-hardening", "remote_1"),
    ];
    const slice = buildSlice(input, project(0), candidates);

    expect(slice.randomizationEligibility).toMatchObject({
      decisionScope: "opening_rush_posture",
      rngDomain: "ai_turn_plan_selection",
      persistsUntil: "opportunity_invalidated",
    });
    expect(slice.selectionReason).toBe(
      "engine_randomized_opening_rush_posture",
    );
    expect(slice.opportunityKey).toBe("opening-rush:2:agenda-1:remote_1");
  });

  it("is deterministic under candidate enumeration order", () => {
    const input = decisionInput();
    const candidates = [
      agendaCandidate(),
      iceCandidate("remote-ice", "remote_1"),
      iceCandidate("rd-ice", "rd"),
      economyCandidate(),
    ];
    const first = buildSlice(input, project(2), candidates);
    const reordered = buildSlice(input, project(2), [...candidates].reverse());

    expect(reordered).toEqual(first);
  });

  it("waits across the opponent turn and abandons only after objective invalidation", () => {
    const input = decisionInput();
    const waiting = structuredClone(input);
    waiting.playerView.activeSide = "runner";
    expect(campaignDisposition(waiting, project(2))).toBe(
      "await_opponent_outcome",
    );

    const invalidated = structuredClone(input);
    invalidated.playerView.servers = invalidated.playerView.servers.filter(
      (server) => server.id !== "remote_1",
    );
    expect(campaignDisposition(invalidated, project(2))).toBe("abandon");
  });

  it("materializes safe setup from a bound protection provider without an agenda head", () => {
    const input = decisionInput();
    const blocked = {
      ...project(2),
      actionIds: undefined,
      feasible: false,
      protectionNeed: {
        needId: "score-protection:agenda-1:remote_1:revision-2",
        parentProjectId: "agenda:agenda-1:remote_1",
        targetServerId: "remote_1",
        observedAtStateVersion: input.playerView.stateVersion,
      },
    } as unknown as CorpScoreProjectSignal;

    const slice = buildSlice(
      input,
      blocked,
      [iceCandidate("remote-hardening", "remote_1"), economyCandidate()],
      [
        scoreProtectionProvider(
          "score-protection:agenda-1:remote_1:revision-2",
          "remote-hardening",
        ),
      ],
    );

    expect(slice.lines).toEqual([
      expect.objectContaining({
        family: "safe_setup",
        currentActionId: "remote-hardening",
        parentNeedId: "score-protection:agenda-1:remote_1:revision-2",
        providerModuleId: "corp.defend_servers",
        expectedNeedProgress: "monotonic_protection_improvement",
      }),
    ]);
    expect(slice.campaignDisposition).toBe("continue");
    expect(slice.evidenceCodes).not.toContain(
      "agenda_slice_missing_exact_agenda_head",
    );
  });
});

function buildSlice(
  input: AiDecisionInput,
  scoreProject: CorpScoreProjectSignal,
  candidates: ActionSemanticCandidate[],
  defenseNeeds?: CorpDefenseSignal[],
) {
  const protectionNeedId = scoreProject.protectionNeed?.needId;
  const remoteProvider = candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "install.card" &&
        candidate.sourceCardInstanceId !== scoreProject.agendaInstanceId &&
        candidate.targetContext?.selectedTargets.some(
          (target) => target.targetId === scoreProject.serverId,
        ),
    )
    .sort((left, right) => left.actionId.localeCompare(right.actionId))[0];
  return buildCorpAgendaTurnPlanningSlice({
    input,
    project: scoreProject,
    candidates,
    defenseNeeds:
      defenseNeeds ??
      (protectionNeedId && remoteProvider
        ? [scoreProtectionProvider(protectionNeedId, remoteProvider.actionId)]
        : []),
    rulesContext: buildPlanningRulesContext({
      rulesBaseline: CURRENT_RULES_BASELINE,
      formatProfileId: "agenda-slice-test",
      cardPoolSnapshotId: "agenda-slice-test",
    }),
    stateIdentity: buildPlanningStateIdentity(input),
  });
}

function project(agendaPoints: number): CorpScoreProjectSignal {
  return {
    projectId: "agenda:agenda-1:remote_1",
    agendaDefinitionId: "agenda-definition",
    agendaInstanceId: "agenda-1",
    agendaPoints,
    serverId: "remote_1",
    actionIds: ["install-agenda"],
    phase: "install_agenda",
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: false,
    protectionNeed: {
      needId: "score-protection:agenda:agenda-1:remote_1:revision-1",
      parentProjectId: "agenda:agenda-1:remote_1",
      targetServerId: "remote_1",
      observedAtStateVersion: 20,
    } as unknown as NonNullable<CorpScoreProjectSignal["protectionNeed"]>,
    evidenceCode: "corp_opening_rush_engine_randomized",
    openingRush: {
      status: "qualified",
      admission: "engine_randomized",
      acceptancePercent: 50,
      quote: {
        schemaVersion: "corp-opening-rush-v1",
        opportunityKey: "opening-rush:2:agenda-1:remote_1",
        agendaInstanceId: "agenda-1",
        agendaDefinitionId: "agenda-definition",
        targetServerId: "remote_1",
        observedAtTurnSerial: 2,
        firstContestTurnSerial: 3,
        actionId: "install-agenda",
        installClickCost: 1,
        installCreditCost: 0,
        scoreReserveCredits: 3,
        rezReserveCredits: 2,
        clicksAfterDefense: 2,
        creditsAfterDefense: 7,
        runnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
        maximumOpeningRushAccessProbability: {
          numerator: 1,
          denominator: 2,
        },
        publicRandomBreakerInstanceIds: ["breaker-1"],
        publicStagedBreakerInstanceIds: [],
        centralThreatStatus: "known_nonacute",
      },
      evidence: ["opening_rush_admission:engine_randomized"],
    },
  };
}

function scoreProtectionProvider(
  parentNeedId: string,
  actionId: string,
): CorpDefenseSignal {
  return {
    kind: "score_protection_staging_install",
    defenseId: "score-protection-staging:agenda-1:remote_1",
    serverId: "remote_1",
    phase: "install_ice",
    parentProjectId: "agenda:agenda-1:remote_1",
    parentNeedId,
    delegatedPriorityClass: "P4",
    actionId,
    sourceCardInstanceId: actionId,
    sourceDefinitionId: `${actionId}-definition`,
    evidenceCode: "score_protection_staging_install:test",
  };
}

function agendaCandidate(): ActionSemanticCandidate {
  return candidate({
    actionId: "install-agenda",
    semanticActionType: "install.card",
    sourceCardInstanceId: "agenda-1",
    targetId: "remote_1",
  });
}

function iceCandidate(
  actionId: string,
  targetId: string,
): ActionSemanticCandidate {
  return candidate({
    actionId,
    semanticActionType: "install.card",
    sourceCardInstanceId: actionId,
    targetId,
  });
}

function economyCandidate(): ActionSemanticCandidate {
  return {
    ...candidate({
      actionId: "economy",
      semanticActionType: "economy.gain_credit",
      sourceCardInstanceId: "economy-card",
    }),
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
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

function candidate(params: {
  actionId: string;
  semanticActionType: string;
  sourceCardInstanceId: string;
  targetId?: string;
}): ActionSemanticCandidate {
  return {
    actionId: params.actionId,
    actionType: "install_card",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: params.actionId,
      actionType: "install_card",
      originalPayloadKeys: [],
    },
    stateVersion: 20,
    sourceKind: "card",
    sourceCardInstanceId: params.sourceCardInstanceId,
    sourceDefinitionId: `${params.sourceCardInstanceId}-definition`,
    abilityBindingMethod: "unresolved",
    semanticActionType: params.semanticActionType,
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
    ...(params.targetId
      ? {
          targetContext: {
            selectedTargets: [
              {
                targetId: params.targetId,
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
        }
      : {}),
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 20,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  } as ActionSemanticCandidate;
}

function decisionInput(): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "agenda-slice",
    seed: "agenda-slice",
    decisionId: "agenda-slice",
    actionNumber: 20,
    eventTail: [],
    playerView: {
      side: "corp",
      stateVersion: 20,
      turnSerial: 2,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "action",
      own: {
        identity: visibleCard("corp-id", "identity"),
        credits: 10,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [visibleCard("agenda-1", "agenda")],
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
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [visibleCard("existing-remote-ice", "ice")],
          root: [],
        },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function visibleCard(instanceId: string, type: string) {
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
