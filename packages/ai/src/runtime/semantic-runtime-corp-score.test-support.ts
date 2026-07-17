import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";
import {
  semanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

export function corpInputWithGoals(
  goals: readonly TacticalGoalLike[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions,
    playerView: {
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      opponent: runnerOpponent(),
      servers: [],
      legalActions,
    },
    ownCorpTacticalGoals: goals,
  } as unknown as AiDecisionInput;
}

export function corpInputWithHqCards(
  credits: number,
  hqCards: VisibleCard[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        gripOrHq: hqCards,
      },
    },
  } as unknown as AiDecisionInput;
}

export function corpInputWithHqCardsAndServers(
  credits: number,
  hqCards: VisibleCard[],
  servers: AiDecisionInput["playerView"]["servers"],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithHqCards(credits, hqCards, legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      servers,
    },
  } as unknown as AiDecisionInput;
}

export function corpInputWithDeckoutFlood(
  credits: number,
  hqCards: VisibleCard[],
  stackOrRdCount: number,
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithHqCards(credits, hqCards, legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        stackOrRdCount,
      },
    },
  } as unknown as AiDecisionInput;
}

export function corpInputWithScoreAreaCards(
  credits: number,
  scoreAreaCards: VisibleCard[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        scoreArea: scoreAreaCards,
      },
    },
  } as unknown as AiDecisionInput;
}

export function corpInputWithRemoteAgenda(
  credits: number,
  clicks: number,
  agenda: VisibleCard,
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        clicks,
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [agenda],
        },
      ],
      legalActions,
    },
  } as unknown as AiDecisionInput;
}

export function runnerOpponent(
  overrides: Partial<AiDecisionInput["playerView"]["opponent"]> = {},
): AiDecisionInput["playerView"]["opponent"] {
  return {
    identity: {
      instanceId: "runner-identity",
      known: true,
      owner: "runner",
      type: "identity",
      counterDisplays: [],
    },
    credits: 4,
    clicks: 4,
    agendaPoints: 0,
    tags: 0,
    handCount: 4,
    maxHandSize: 5,
    deckCount: 20,
    discardCount: 0,
    rig: [],
    scoreArea: [],
    ...overrides,
  };
}

export function accountsReceivableCard(): VisibleCard {
  return {
    instanceId: "corp_accounts_receivable",
    known: true,
    title: "Accounts Receivable",
    definitionId: "onr_v1_281_accounts-receivable",
    type: "operation",
    rulesText: "Gain 9 credits.",
    cost: 5,
    owner: "corp",
    controller: "corp",
  };
}

export function nightShiftCard(): VisibleCard {
  return {
    instanceId: "corp_night_shift",
    known: true,
    title: "Night Shift",
    definitionId: "onr_v1_295_night-shift",
    type: "operation",
    rulesText: "Gain 2 credits and draw one card.",
    cost: 0,
    owner: "corp",
    controller: "corp",
  };
}

export function dayShiftCard(): VisibleCard {
  return economyOperationCard({
    instanceId: "day-shift",
    definitionId: "test_day_shift",
    title: "Day Shift",
    rulesText: "Gain 3 credits and draw one card.",
    cost: 0,
  });
}

export function economyOperationCard(
  overrides: Partial<VisibleCard> & { instanceId: string },
): VisibleCard {
  const { instanceId, ...rest } = overrides;
  return {
    instanceId,
    known: true,
    title: "Economy Operation",
    type: "operation",
    cost: 0,
    owner: "corp",
    controller: "corp",
    ...rest,
  };
}

export function corpIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    title: instanceId,
    definitionId: instanceId,
    type: "ice",
    owner: "corp",
    controller: "corp",
    rezzed: false,
    ...overrides,
  };
}

export function fracterBreaker(): VisibleCard {
  return {
    instanceId: "runner-fracter",
    known: true,
    title: "Runner Fracter",
    definitionId: "runner-fracter",
    type: "program",
    owner: "runner",
    controller: "runner",
    subtypes: ["Icebreaker", "Fracter"],
    rulesText: "Break barrier subroutines.",
  };
}

export function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: "candidate",
    actionType: "trigger_ability",
    actorSide: "corp",
    visibilityScope: "public",
    legalActionRef: {
      actionId: "candidate",
      actionType: "trigger_ability",
      originalPayloadKeys: [],
    },
    sourceKind: "asset",
    abilityBindingMethod: "bound",
    semanticActionType: "corp.ability",
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
    primaryProjectionStatus: "complete",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}

export function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
  source?: string,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

export function testDependencies(): SemanticRuntimeCorpScoreDependencies<string> {
  return {
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: ["test"] }),
    corpAdvanceRemoteScore: () => 0,
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpRemoteScoreContestabilityAssessment: () => undefined,
    corpActionIsScoreLine: () => false,
    corpAdvanceCompletesScore: () => false,
    corpInstallRemoteScore: () => 0,
    corpAdvancementCounterPlacementAssessment: () => undefined,
    corpHasRemoteInstability: () => false,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpTaggedRunnerPayoffPressure: () => undefined,
    corpTaggedPayoffWindowPassiveActionPenalty: () => undefined,
    corpPassiveScoreLinePenalty: () => undefined,
  };
}

export function totalScoreFor(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: ReturnType<typeof testDependencies>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): number {
  return totalScore(
    semanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      actionSemanticCandidate,
    ),
  );
}

export function totalScore(components: readonly { value: number }[]): number {
  return components.reduce((sum, component) => sum + component.value, 0);
}

export function scoringWindow(
  overrides: Partial<CorpScoringWindowAssessment> = {},
): CorpScoringWindowAssessment {
  return {
    serverId: "remote_1",
    windowKind: "unsafe",
    runnerCanContestNow: false,
    runnerCanReachAccessNow: false,
    agendaStealRelevantNow: false,
    runnerCanContestBeforeScore: false,
    runnerCanReachAccessBeforeScore: false,
    agendaStealRelevantBeforeScore: false,
    agendaPointsAtRisk: 2,
    runnerAgendaPointsAfterSteal: 4,
    agendaStealSeverity: "normal",
    missingVisibleBreakerCoverage: false,
    corpCanRezRelevantIce: true,
    affordableDurableRelevantIceCount: 0,
    dynamicProtectionWeaknessCount: 0,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: true,
    scoreHorizon: "next_turn",
    runnerExposureCreditActions: 3,
    recommendedNextStep: "build_remote_ice",
    evidence: ["test_scoring_window"],
    ...overrides,
  };
}

export function scorelineFundingAssessment(params: {
  advanceAction: LegalAction;
  fundingAction?: LegalAction;
  blockedByCredits?: boolean;
}): CorpScorelineWindowAssessment {
  const fundingAction = params.fundingAction;
  const advancePath = {
    actionId: params.advanceAction.actionId,
    actionType: params.advanceAction.type,
    serverId: "remote_1",
    actionRoles: ["advance_agenda" as const],
    windowKind: "blocked" as const,
    recommendedNextStep: "fund_scoreline" as const,
    safe: false,
    blocked: true,
    blockers: ["credits" as const],
    creditsBeforeAction: 4,
    creditsAfterAction: 3,
    evidence: ["test_scoreline_advance_needs_funding"],
  };
  const fundingPath = fundingAction
    ? {
        actionId: fundingAction.actionId,
        actionType: fundingAction.type,
        serverId: "remote_1",
        actionRoles: ["fund_scoreline" as const],
        windowKind: "blocked" as const,
        recommendedNextStep: "fund_scoreline" as const,
        safe: true,
        blocked: false,
        blockers: [],
        creditsBeforeAction: 4,
        creditsAfterAction: 5,
        evidence: ["test_scoreline_funding_path"],
      }
    : undefined;
  return {
    windowKind: "blocked",
    terminalWindow: false,
    recommendedNextStep: "fund_scoreline",
    bestPath: fundingPath ?? advancePath,
    paths: fundingPath ? [advancePath, fundingPath] : [advancePath],
    scoreActionIds: [],
    advanceToScoreActionIds: [],
    agendaInstallActionIds: [],
    protectedRemoteIds: ["remote_1"],
    blockedByCredits: params.blockedByCredits ?? true,
    blockedByCheapContest: false,
    blockedByRunnerContest: false,
    blockedByHqThreat: false,
    runnerAccessThreatHigh: false,
    evidence: ["test_scoreline_window_recommends_funding"],
  };
}

export function agendaCard(
  instanceId = "agenda-in-hq",
  agendaPoints = 2,
): VisibleCard {
  return corpCard(instanceId, "agenda", {
    advancementRequirement: 3,
    agendaPoints,
  });
}

export function corpCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    owner: "corp",
    side: "corp",
    type,
    ...overrides,
  } as VisibleCard;
}

export function componentKeysForInstallRoles(roles: string[]): string[] {
  return semanticRuntimeCorpScoreComponents(
    corpInputWithGoals([]),
    corpAction("install-card", "install_card"),
    "basic_install",
    {
      ...testDependencies(),
      rolesForAction: () => roles,
    },
  ).map((component) => component.key);
}

export function semanticCandidate(
  actionId: string,
  semanticActionType: string,
  actionTacticSignals: readonly string[],
  actionType: LegalAction["type"] = "trigger_ability",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "explicit_ability_id",
    semanticActionType,
    cardContextSignals: [],
    actionTacticSignals: [...actionTacticSignals],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "not_applicable",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [...actionTacticSignals],
  };
}
