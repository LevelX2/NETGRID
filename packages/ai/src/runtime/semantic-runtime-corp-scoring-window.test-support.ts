import { isRemoteServerId } from "@netgrid/shared";
import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import {
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
      timingPoint: "corp_action.main",
      traceRulesProfile: "modern_open",
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
  const stateVersionAfter = actionType === "start_run" ? 1 : 2;
  return {
    eventId: stateVersionAfter + 1,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
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
  const stateVersionAfter = actionType === "start_run" ? 1 : 2;
  return {
    eventId: stateVersionAfter + 1,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
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
    eventId: stateVersionAfter + 1,
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
  const explicitPostRezRunQuote =
    card.rezzed === false ? card.effectiveRunQuote : undefined;
  const cardWithoutCurrentRunQuote = explicitPostRezRunQuote
    ? (() => {
        const { effectiveRunQuote: _currentOnlyQuote, ...rest } = card;
        return rest;
      })()
    : card;
  if (
    card.rezzed !== false ||
    card.effectiveRezCostQuote !== undefined ||
    !Number.isSafeInteger(card.rezCost) ||
    (card.rezCost ?? -1) < 0
  ) {
    return cardWithoutCurrentRunQuote;
  }
  return {
    ...cardWithoutCurrentRunQuote,
    ...(explicitPostRezRunQuote && card.definitionId
      ? {
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: card.instanceId,
            iceDefinitionId: card.definitionId,
            targetServerId: serverId,
            projectedServerId: serverId,
            expiresAtStateVersion: 1,
            complete: true,
            effectiveRunQuote: explicitPostRezRunQuote,
          },
        }
      : {}),
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
    definitionId: 589,
    subtypes: ["Barrier"],
    rezzed: false,
    rezCost: 3,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: 589,
      effectiveStrength: 3,
      subroutines: [
        {
          id: `${instanceId}_end_the_run`,
          type: "end_the_run",
          sourceDefinitionId: 589,
          sourceTitle: "Simple Barrier ICE",
        },
      ],
    },
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
    definitionId: 444,
    subtypes: ["Wall"],
    rezzed: false,
    rezCost: 4,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: 444,
      effectiveStrength: 3,
      subroutines: [
        {
          id: `${instanceId}_end_the_run`,
          type: "end_the_run",
          sourceDefinitionId: 444,
          sourceTitle: "Crystal Wall",
        },
      ],
    },
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
    definitionId: syntheticCardDefinitionId(instanceId),
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
    definitionId: syntheticCardDefinitionId("blank_remote_ice"),
    rezzed: false,
    rezCost: 0,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: syntheticCardDefinitionId("blank_remote_ice"),
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
    definitionId: 461,
    subtypes: ["Sentry", "Bloodhound"],
    rezzed: false,
    rezCost: 2,
    owner: "corp",
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: 461,
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: 461,
          sourceTitle: "Hunter",
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
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
    definitionId: 79,
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
    definitionId: 70,
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
    definitionId: 88,
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
    definitionId: 84,
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
    definitionId: 91,
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
    definitionId: 597,
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
    definitionId: 31,
    subtypes: ["Icebreaker", "Worm"],
    owner: "runner",
  } as VisibleCard;
}

export function simpleKiller(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    definitionId: 598,
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
    definitionId: 257,
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
    definitionId: 366,
    rulesText:
      "A: Put 3 credits from the bank on Broker. A: Take all the bits from Broker.",
    owner: "runner",
    counters: { bit: hostedCredits },
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
    definitionId: syntheticCardDefinitionId(instanceId),
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
    costs:
      type === "install_card" ||
      type === "advance_card" ||
      type === "play_operation" ||
      type === "gain_credit" ||
      type === "draw_card"
        ? [{ clicks: 1 }]
        : [],
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
      isRemoteServerId(serverId) === true,
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
