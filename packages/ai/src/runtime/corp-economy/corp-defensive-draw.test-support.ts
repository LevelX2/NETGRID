import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

function corpInputWithActions(
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions,
    playerView: {
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
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
      publicEvents: [],
    },
  } as unknown as AiDecisionInput;
}

function corpInputWithHqCards(
  credits: number,
  hqCards: VisibleCard[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithActions(legalActions);
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

function runnerOpponent(
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
    timingPoint: "corp_action.main",
    visibility: "public",
    expiresAtStateVersion: 1,
    source,
    costs: [],
    targetRequirements: [],
    choiceRequirements: [],
    payload,
  } as unknown as LegalAction;
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
