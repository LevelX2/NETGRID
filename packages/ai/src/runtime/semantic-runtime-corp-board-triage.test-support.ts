import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { CorpBoardTriageDependencies } from "./semantic-runtime-corp-board-triage";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

export function corpInput(overrides: {
  legalActions: LegalAction[];
  servers: AiDecisionInput["playerView"]["servers"];
  corpHq?: VisibleCard[];
  corpCredits?: number;
  runnerAgendaPoints?: number;
  runnerRig?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
  actionNumber?: number;
}): AiDecisionInput {
  bindEngineInstallQuotes(
    overrides.legalActions,
    [
      ...(overrides.corpHq ?? []),
      ...overrides.servers.flatMap((server) => [...server.ice, ...server.root]),
    ],
    1,
  );
  return {
    side: "corp",
    ...(overrides.actionNumber !== undefined
      ? { actionNumber: overrides.actionNumber }
      : {}),
    legalActions: overrides.legalActions,
    eventTail: overrides.eventTail ?? [],
    playerView: {
      stateVersion: 1,
      timingPoint: "corp_action.main",
      own: {
        credits: overrides.corpCredits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: overrides.corpHq ?? [],
        heapOrArchives: [],
        scoreArea: [],
        stackOrRdCount: 20,
      },
      opponent: {
        credits: 4,
        clicks: 4,
        agendaPoints: overrides.runnerAgendaPoints ?? 0,
        rig: overrides.runnerRig ?? [],
        scoreArea: [],
      },
      publicEvents: [],
      servers: overrides.servers,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

export function testDependencies(
  options: {
    scoringWindowByActionId?: Record<string, CorpScoringWindowAssessment>;
    actionCreditCost?: (action: LegalAction) => number;
    corpAdvanceCompletesScore?: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => boolean;
  } = {},
): CorpBoardTriageDependencies<"test"> {
  return {
    actionCreditCost: options.actionCreditCost ?? (() => 0),
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: [] }),
    corpActionIsScoreLine: (_input, action) =>
      action.actionId.includes("scoreline") || action.type === "advance_card",
    corpAdvanceCompletesScore:
      options.corpAdvanceCompletesScore ?? (() => false),
    corpScoringWindowAssessment: (_input, action) =>
      options.scoringWindowByActionId?.[action.actionId],
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpHasRemoteInstability: () => false,
  };
}

export function scoringWindow(
  overrides: Partial<CorpScoringWindowAssessment>,
): CorpScoringWindowAssessment {
  return {
    serverId: "remote_1",
    windowKind: "unsafe",
    runnerCanContestNow: true,
    runnerCanReachAccessNow: true,
    agendaStealRelevantNow: true,
    runnerCanContestBeforeScore: true,
    runnerCanReachAccessBeforeScore: true,
    agendaStealRelevantBeforeScore: true,
    agendaPointsAtRisk: 2,
    runnerAgendaPointsAfterSteal: 7,
    agendaStealSeverity: "game_ending",
    missingVisibleBreakerCoverage: false,
    corpCanRezRelevantIce: true,
    affordableDurableRelevantIceCount: 0,
    dynamicProtectionWeaknessCount: 1,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: false,
    scoreHorizon: "next_turn",
    runnerExposureCreditActions: 3,
    recommendedNextStep: "build_remote_ice",
    evidence: ["test_scoring_window"],
    ...overrides,
  };
}

export function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
  source = "basic_action",
): LegalAction {
  return {
    actionId,
    type,
    side: "corp",
    label: actionId,
    source,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

export function corpRezIceAction(
  actionId: string,
  source: string,
  rezCost: number,
): LegalAction {
  return {
    actionId,
    type: "rez_ice",
    side: "corp",
    label: actionId,
    source,
    costs: [{ credits: rezCost }],
    payload: { rezCostPaid: rezCost },
  } as unknown as LegalAction;
}

export function centralServer(
  id: "hq" | "rd",
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id.toUpperCase(), ice: [...ice], root: [] };
}

export function remoteServer(
  id: `remote_${number}`,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id, ice: [...ice], root: [...root] };
}

export function agendaCard(
  instanceId = "remote-agenda",
  agendaPoints = 2,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "agenda",
    owner: "corp",
    advancementRequirement: 3,
    advancementCounters: 1,
    agendaPoints,
    ...overrides,
  } as VisibleCard;
}

export function iceCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  const definitionId = overrides.definitionId ?? "simple_barrier_ice";
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  return {
    instanceId,
    known: true,
    type: "ice",
    owner: "corp",
    controller: "corp",
    definitionId,
    rezCost: 2,
    ...overrides,
    ...(definition?.strength !== undefined
      ? { strength: definition.strength }
      : {}),
    ...(definition?.subtypes !== undefined
      ? { subtypes: definition.subtypes.slice() }
      : {}),
  } as VisibleCard;
}

function bindEngineInstallQuotes(
  actions: LegalAction[],
  visibleCards: readonly VisibleCard[],
  stateVersion: number,
): void {
  for (const action of actions) {
    if (action.type !== "install_card" || action.payload?.placement !== "ice") {
      continue;
    }
    const sourceCard = visibleCards.find(
      (card) => card.instanceId === action.source,
    );
    const serverId = action.payload.serverId;
    if (
      !sourceCard ||
      sourceCard.known !== true ||
      sourceCard.type !== "ice" ||
      typeof serverId !== "string" ||
      !Number.isSafeInteger(sourceCard.rezCost) ||
      (sourceCard.rezCost ?? -1) < 0
    ) {
      continue;
    }
    Object.assign(action, {
      timingPoint: "corp_action.main",
      expiresAtStateVersion: stateVersion,
      payload: {
        ...action.payload,
        cardId: sourceCard.instanceId,
        ...(sourceCard.definitionId !== undefined
          ? { sourceDefinitionId: sourceCard.definitionId }
          : {}),
        postInstallRezQuoteCardId: sourceCard.instanceId,
        postInstallRezQuoteTargetServerId: serverId,
        postInstallRezQuoteProjectedServerId:
          serverId === "new_remote" ? "remote_1" : serverId,
        postInstallRezQuoteExpiresAtStateVersion: stateVersion,
        postInstallRezQuoteComplete: true,
        postInstallRezQuoteBaseCredits: sourceCard.rezCost,
        postInstallRezQuoteFinalCredits: sourceCard.rezCost,
        postInstallRezQuoteMandatoryAgendaPointCost: 0,
      },
    });
  }
}

export function assetCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "asset",
    owner: "corp",
    definitionId: "support_asset",
  } as VisibleCard;
}

export function rdVirusCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    owner: "runner",
    title: "Highlighter",
    rulesText:
      "After each successful run on R&D, give the Corp a Highlighter counter. Each counter after the first allows you to access an additional card from R&D.",
  } as VisibleCard;
}

export function earlyWormBreaker(): VisibleCard {
  return {
    instanceId: "early-worm",
    known: true,
    type: "program",
    owner: "runner",
    title: "Early Worm",
    definitionId: "onr_classic_027_early-worm",
    subtypes: ["Icebreaker", "Worm"],
  } as VisibleCard;
}

export function fracterBreaker(): VisibleCard {
  return {
    instanceId: "runner-fracter",
    known: true,
    type: "program",
    owner: "runner",
    title: "Runner Fracter",
    subtypes: ["Icebreaker", "Fracter"],
    rulesText: "Break wall subroutines.",
  } as VisibleCard;
}

export function publicCentralEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverId: "hq" | "rd",
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType,
      serverId,
    },
  };
}
