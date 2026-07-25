import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { semanticRuntimeCorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

export function assess(input: AiDecisionInput, action: LegalAction) {
  return semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    testDependencies(),
  );
}

export function corpInput(overrides: {
  ownCredits?: number;
  ownClicks?: number;
  runnerCredits?: number;
  runnerAgendaPoints?: number;
  agendaPointsToWin?: number;
  runnerRig?: VisibleCard[];
  hq?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
  servers: AiDecisionInput["playerView"]["servers"];
}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    eventTail: overrides.eventTail ?? [],
    playerView: {
      stateVersion: 1,
      own: {
        credits: overrides.ownCredits ?? 5,
        clicks: overrides.ownClicks ?? 3,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        scoreArea: [],
      },
      opponent: {
        credits: overrides.runnerCredits ?? 4,
        clicks: 4,
        agendaPoints: overrides.runnerAgendaPoints ?? 0,
        rig: overrides.runnerRig ?? [],
        scoreArea: [],
      },
      servers: overrides.servers,
      publicEvents: [],
      agendaPointsToWin: overrides.agendaPointsToWin ?? 7,
    },
  } as unknown as AiDecisionInput;
}

export function publicEvent(
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

export function publicLabelEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverLabel: "HQ" | "R&D",
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
      serverLabel,
    },
  };
}

export function remoteEvent(
  eventId: string,
  actionType: "access_card" | "install_card",
  stateVersionAfter: number,
  payload: Record<string, unknown>,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actionType,
      ...payload,
    },
  };
}

export function protectedCentralServers(
  remotes: AiDecisionInput["playerView"]["servers"],
): AiDecisionInput["playerView"]["servers"] {
  return [
    centralServer("hq", [centralIce("hq-ice")]),
    centralServer("rd", [centralIce("rd-ice")]),
    ...remotes,
  ];
}

export function centralServer(
  id: "hq" | "rd",
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return server(id, ice, []);
}

export function remoteServer(
  id: string,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return server(id, ice, root);
}

export function server(
  id: string,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id: id as AiDecisionInput["playerView"]["servers"][number]["id"],
    label: id,
    ice: ice.map((card) => testInstalledIceWithExactRezQuote(card, id)),
    root: [...root],
  };
}

function testInstalledIceWithExactRezQuote(
  card: VisibleCard,
  serverId: string,
): VisibleCard {
  if (
    card.rezzed !== false ||
    card.effectiveRezCostQuote !== undefined ||
    !Number.isSafeInteger(card.rezCost) ||
    (card.rezCost ?? -1) < 0
  ) {
    return card;
  }
  return {
    ...card,
    effectiveRezCostQuote: {
      context: "installed",
      complete: true,
      cardId: card.instanceId,
      targetServerId: serverId,
      projectedServerId: serverId,
      expiresAtStateVersion: 1,
      baseCredits: card.rezCost!,
      finalCredits: card.rezCost!,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
    },
  } as VisibleCard;
}

export function agendaCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "agenda",
    advancementRequirement: 3,
    advancementCounters: 0,
    agendaPoints: 2,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

export function operationCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  const card = {
    instanceId,
    known: true,
    type: "operation",
    owner: "corp",
    ...overrides,
  } as VisibleCard;
  if (
    card.playCost === undefined &&
    typeof card.cost === "number" &&
    Number.isFinite(card.cost)
  ) {
    card.playCost = { kind: "fixed", credits: card.cost };
  }
  return card;
}

export function wallIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "simple_barrier_ice",
    subtypes: ["Barrier"],
    rezzed: false,
    rezCost: 3,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

export function classicWallIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Crystal Wall",
    definitionId: "onr_v1_232_crystal-wall",
    subtypes: ["Wall"],
    rezzed: false,
    rezCost: 4,
    owner: "corp",
    ...overrides,
  } as VisibleCard;
}

export function centralIce(instanceId: string): VisibleCard {
  return wallIce(instanceId, { rezCost: 1 });
}

export function genericIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: instanceId,
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

export function blankIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "blank_remote_ice",
    rezzed: false,
    rezCost: 0,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "blank_remote_ice",
      effectiveStrength: 0,
      subroutines: [],
    },
    ...overrides,
  } as unknown as VisibleCard;
}

export function hunterTraceTagIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Hunter",
    definitionId: "onr_v1_249_hunter",
    subtypes: ["Sentry", "Bloodhound"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          amount: 5,
        },
      ],
    },
    ...overrides,
  } as unknown as VisibleCard;
}

export function dogPileIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    definitionId: "onr_proteus_021_dog-pile",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

export function bugZapperIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Bug Zapper",
    definitionId: "onr_proteus_012_bug-zapper",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

export function mastermindIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Mastermind",
    definitionId: "onr_proteus_030_mastermind",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
  } as VisibleCard;
}

export function huntingPackIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Hunting Pack",
    definitionId: "onr_proteus_026_hunting-pack",
    subtypes: ["Sentry"],
    rezzed: false,
    rezCost: 1,
    owner: "corp",
  } as VisibleCard;
}

export function mobileBarricadeIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    title: "Mobile Barricade",
    definitionId: "onr_proteus_033_mobile-barricade",
    subtypes: ["Barrier"],
    rezzed: false,
    rezCost: 1,
    owner: "corp",
  } as VisibleCard;
}

export function simpleFracter(
  instanceId: string,
  recurringRunCredits = 0,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    definitionId: "simple_fracter",
    subtypes: ["Icebreaker", "Fracter"],
    owner: "runner",
    ...(recurringRunCredits > 0
      ? {
          counterDisplays: [
            {
              id: `${instanceId}-recurring`,
              amount: recurringRunCredits,
              displayKind: "recurring_credit",
              label: "Recurring credits",
              ariaLabel: "Recurring credits",
              counterType: "recurring_credit",
              creditPool: {
                kind: "recurring_credit",
                uses: ["using_icebreaker_during_run"],
              },
            },
          ],
        }
      : {}),
  } as VisibleCard;
}

export function earlyWormBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    title: "Early Worm",
    definitionId: "onr_classic_027_early-worm",
    subtypes: ["Icebreaker", "Worm"],
    owner: "runner",
  } as VisibleCard;
}

export function simpleKiller(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    definitionId: "simple_killer",
    subtypes: ["Icebreaker", "Killer"],
    owner: "runner",
  } as VisibleCard;
}

export function newsgroupFilter(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    title: "Newsgroup Filter",
    definitionId: "onr_v1_045_newsgroup-filter",
    owner: "runner",
  } as VisibleCard;
}

export function brokerResource(
  instanceId: string,
  hostedCredits: number,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "resource",
    title: "Broker",
    definitionId: "onr_v1_154_broker",
    rulesText:
      "A: Put 3 credits from the bank on Broker. A: Take all the bits from Broker.",
    owner: "runner",
    counterDisplays: [
      {
        id: `${instanceId}-bits`,
        amount: hostedCredits,
        displayKind: "stored_credits",
        label: "Bits",
        ariaLabel: "Bits",
        counterType: "bit",
      },
    ],
  } as VisibleCard;
}

export function runnerCentralPressureCard(
  instanceId: string,
  rulesText: string,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    title: instanceId,
    definitionId: instanceId,
    rulesText,
    owner: "runner",
  } as VisibleCard;
}

export function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"],
  source = "basic_action",
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    source,
    payload,
  } as unknown as LegalAction;
}

export function testDependencies() {
  return {
    actionServerId: (_input: AiDecisionInput, action: LegalAction) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    server: (input: AiDecisionInput, serverId: string | undefined) =>
      input.playerView.servers.find((candidate) => candidate.id === serverId),
    actionCreditCost: () => 0,
    actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => {
      const source = findVisibleCard(input, String(action.source));
      return source?.type === "agenda" || action.payload?.cardType === "agenda";
    },
    advanceCompletesScore: (input: AiDecisionInput, action: LegalAction) => {
      if (action.type !== "advance_card") return false;
      const source = findVisibleCard(input, String(action.source));
      return (
        source?.type === "agenda" &&
        typeof source.advancementRequirement === "number" &&
        (source.advancementCounters ?? 0) + 1 >= source.advancementRequirement
      );
    },
    remoteHasScoreLine: (
      server: AiDecisionInput["playerView"]["servers"][number] | undefined,
    ) =>
      server?.root.some(
        (card) =>
          (card.known && card.type === "agenda") ||
          (card.advancementCounters ?? 0) > 0,
      ) === true,
    isRemoteServerTarget: (serverId: string | undefined) =>
      serverId?.startsWith("remote_") === true,
    actionSourceCard: (input: AiDecisionInput, action: LegalAction) =>
      findVisibleCard(input, String(action.source)),
  };
}

export function findVisibleCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  for (const card of input.playerView.own.gripOrHq) {
    if (card.instanceId === instanceId) return card;
  }
  for (const server of input.playerView.servers) {
    for (const card of [...server.ice, ...server.root]) {
      if (card.instanceId === instanceId) return card;
    }
  }
  return undefined;
}
