import type {
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  PurgeableRunnerVirusCounterBucket,
  PurgeableRunnerVirusCounterType,
  Side,
} from "@netgrid/shared";

export type DrawTaxDecision = "auto" | "pay" | "tag";

export type TurnBasicRunnerDrawSummary = {
  drawnCount: number;
  drawnCardIds?: CardInstanceId[];
  drawTaxSourceCount: number;
  drawTaxCreditsPaid: number;
  drawTaxTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
  crashEverettChoiceOpened?: boolean;
};

export type TurnBasicExecutionHost = {
  state: GameState;
  draw: {
    drawCorpCard: (state: GameState) => void;
    drawRunnerCards: (
      state: GameState,
      amount: number,
      drawTaxDecision?: DrawTaxDecision,
    ) => TurnBasicRunnerDrawSummary;
    applyRunnerDrawSummaryPayload: (
      state: GameState,
      legalAction: LegalAction,
      summary: TurnBasicRunnerDrawSummary,
    ) => void;
  };
  turn: {
    spendClick: (state: GameState, side: Side) => void;
    spendClicks: (state: GameState, side: Side, amount: number) => void;
    endTurn: (state: GameState, side: Side, legalAction: LegalAction) => void;
  };
  credits: {
    spendRunnerTagRemovalCredits: (
      state: GameState,
      amount: number,
      legalAction: LegalAction,
    ) => void;
  };
  cards: {
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: string,
      legalAction?: LegalAction,
    ) => void;
  };
  callbacks: {
    startCodeViralCachePurgeChoice: (
      state: GameState,
      legalAction: LegalAction,
    ) => boolean;
  };
};

export type TurnBasicExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleTurnBasicExecution(
  host: TurnBasicExecutionHost,
  legalAction: LegalAction,
): TurnBasicExecutionResult {
  const { state } = host;
  switch (legalAction.type) {
    case "mandatory_draw":
      host.draw.drawCorpCard(state);
      if (state.winner) return handled(legalAction);
      state.phase = "corp_action_phase";
      state.timingPoint = "corp_action.main";
      state.activeSide = "corp";
      return handled(legalAction);
    case "draw_card":
      host.turn.spendClick(state, legalAction.side);
      if (legalAction.side === "runner") {
        host.draw.applyRunnerDrawSummaryPayload(
          state,
          legalAction,
          host.draw.drawRunnerCards(
            state,
            1,
            drawTaxDecisionFromPayload(legalAction),
          ),
        );
      } else {
        host.draw.drawCorpCard(state);
      }
      return handled(legalAction);
    case "remove_tag":
      host.turn.spendClick(state, "runner");
      if (legalAction.payload?.resourceAbility === "danshis_second_id") {
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (
          !state.runner.rig.resources.includes(sourceCardId as CardInstanceId)
        )
          throw new Error("Danshi's Second ID ist nicht installiert.");
        const requested = Number(legalAction.payload?.removeTagAmount ?? 0);
        if (!Number.isInteger(requested) || requested <= 0 || requested > 3)
          throw new Error("Die Tag-Entfernung ist ungueltig.");
        state.runner.tags = Math.max(0, state.runner.tags - requested);
        if (legalAction.payload?.trashOnUse === true) {
          host.cards.trashRunnerInstalledCardToHeap(
            state,
            sourceCardId,
            legalAction,
          );
        }
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedTags: requested,
          runnerTagsAfter: state.runner.tags,
        };
        return handled(legalAction);
      }
      host.credits.spendRunnerTagRemovalCredits(state, 2, legalAction);
      state.runner.tags = Math.max(0, state.runner.tags - 1);
      return handled(legalAction);
    case "purge_virus_counters": {
      host.turn.spendClicks(state, "corp", 3);
      if (host.callbacks.startCodeViralCachePurgeChoice(state, legalAction))
        return handled(legalAction);
      const purged = purgeVirusCounters(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        purgedVirusCounters: purged,
        purgedCounterType: "virus",
      };
      return handled(legalAction);
    }
    case "purge_runner_virus_counters": {
      if (legalAction.side !== "corp")
        throw new Error("Nur die Korp darf Runner-Virus-Counter purgen.");
      const window = state.runnerVirusPurgeWindow;
      const mainActionPurge =
        state.phase === "corp_action_phase" &&
        state.timingPoint === "corp_action.main" &&
        state.activeSide === "corp";
      if (!window && !mainActionPurge)
        throw new Error(
          "Runner-Virus-Purge ist im aktuellen Fenster nicht legal.",
        );
      const summary = purgePurgeableRunnerVirusCounters(state);
      const pendingDebt = addCorpActionDebt(state, {
        amount: 3,
        reason: "proteus_virus_purge",
        source: "proteus_purge",
      });
      delete state.runnerVirusPurgeWindow;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        purgeModel: "future_action_debt",
        purgedRunnerVirusCounters: summary.total,
        purgedCounterSummary: summary.publicSummary,
        actionDebtAdded: 3,
        corpActionDebtTotalAfter: pendingDebt,
        ...(window
          ? {
              timingWindowId: window.windowId,
              timingFamily: window.timingFamily,
            }
          : {
              timingFamily: "corp_main_action",
            }),
      };
      return handled(legalAction);
    }
    case "forgo_action": {
      if (legalAction.side !== "corp")
        throw new Error("Nur die Korp darf Korp-Aktionsschuld abtragen.");
      const beforeDebt = corpActionDebtPending(state);
      if (beforeDebt <= 0) throw new Error("Es gibt keine Korp-Aktionsschuld.");
      host.turn.spendClick(state, "corp");
      const paid = consumeCorpActionDebt(state, 1);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        actionDebtPaid: paid,
        corpActionDebtTotalBefore: beforeDebt,
        corpActionDebtTotalAfter: corpActionDebtPending(state),
        corpClicksAfter: state.corp.clicks,
      };
      return handled(legalAction);
    }
    case "end_turn":
      host.turn.endTurn(state, legalAction.side, legalAction);
      return handled(legalAction);
    default:
      return { handled: false };
  }
}

export function drawTaxDecisionFromPayload(
  legalAction: LegalAction,
): DrawTaxDecision {
  const decision = legalAction.payload?.drawTaxDecision;
  if (decision === "pay" || decision === "tag") return decision;
  return "auto";
}

export function corpActionDebtPending(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.corpActionDebt?.forgoActionsPending ?? 0),
  );
}

export function addCorpActionDebt(
  state: GameState,
  input: {
    amount: number;
    reason: string;
    source: string;
  },
): number {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount <= 0) return corpActionDebtPending(state);
  const debt = (state.corpActionDebt ??= {
    forgoActionsPending: 0,
    entries: [],
  });
  debt.forgoActionsPending = corpActionDebtPending(state) + amount;
  debt.entries = [
    ...(debt.entries ?? []),
    {
      reason: input.reason,
      remaining: amount,
      createdAtStateVersion: state.stateVersion,
      source: input.source,
    },
  ];
  return debt.forgoActionsPending;
}

export function consumeCorpActionDebt(
  state: GameState,
  amount: number,
): number {
  const requested = Math.max(0, Math.floor(amount));
  if (requested <= 0 || !state.corpActionDebt) return 0;
  const consumed = Math.min(corpActionDebtPending(state), requested);
  let remainingToConsume = consumed;
  const entries = [...(state.corpActionDebt.entries ?? [])]
    .map((entry) => ({
      ...entry,
      remaining: Math.max(0, Math.floor(entry.remaining)),
    }))
    .filter((entry) => entry.remaining > 0);
  for (const entry of entries) {
    if (remainingToConsume <= 0) break;
    const entryConsumed = Math.min(entry.remaining, remainingToConsume);
    entry.remaining -= entryConsumed;
    remainingToConsume -= entryConsumed;
  }
  state.corpActionDebt = {
    forgoActionsPending: Math.max(0, corpActionDebtPending(state) - consumed),
    entries: entries.filter((entry) => entry.remaining > 0),
  };
  if (state.corpActionDebt.forgoActionsPending <= 0)
    delete state.corpActionDebt;
  return consumed;
}

const PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES: readonly PurgeableRunnerVirusCounterType[] =
  [
    "cascade",
    "doom",
    "crumble",
    "garbage",
    "highlighter",
    "scaldan",
    "tax",
    "vienna",
    "socket_archives",
    "socket_hq",
    "socket_rd",
    "pipe",
  ];

export function purgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
  counterType: PurgeableRunnerVirusCounterType,
): number {
  return Math.max(0, Math.floor(Number(bucket?.[counterType] ?? 0)));
}

export function setPurgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket,
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
): void {
  const normalized = Math.max(0, Math.floor(amount));
  if (normalized > 0) bucket[counterType] = normalized;
  else delete bucket[counterType];
}

function purgeableRunnerVirusBucketTotal(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
): number {
  return PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES.reduce(
    (sum, counterType) =>
      sum + purgeableRunnerVirusCounterAmount(bucket, counterType),
    0,
  );
}

export function purgeableRunnerVirusCounterTotal(state: GameState): number {
  const counters = state.purgeableRunnerVirusCounters;
  if (!counters) return 0;
  let total = purgeableRunnerVirusBucketTotal(counters.corp);
  for (const bucket of Object.values(counters.servers ?? {})) {
    total += purgeableRunnerVirusBucketTotal(bucket);
  }
  for (const effect of Object.values(counters.effects ?? {})) {
    total += Math.max(0, Math.floor(Number(effect.amount ?? 0)));
  }
  return total;
}

function compactPurgeableRunnerVirusBucket(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
): PurgeableRunnerVirusCounterBucket | undefined {
  const compact: PurgeableRunnerVirusCounterBucket = {};
  for (const counterType of PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES) {
    const amount = purgeableRunnerVirusCounterAmount(bucket, counterType);
    if (amount > 0) compact[counterType] = amount;
  }
  return Object.keys(compact).length > 0 ? compact : undefined;
}

export function purgePurgeableRunnerVirusCounters(state: GameState): {
  total: number;
  publicSummary: string;
} {
  const counters = state.purgeableRunnerVirusCounters;
  const summary: string[] = [];
  const addSummary = (
    scope: string,
    bucket: PurgeableRunnerVirusCounterBucket | undefined,
  ) => {
    const compact = compactPurgeableRunnerVirusBucket(bucket);
    if (!compact) return;
    for (const counterType of PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES) {
      const amount = compact[counterType];
      if (amount && amount > 0)
        summary.push(`${scope}:${counterType}=${amount}`);
    }
  };

  addSummary("corp", counters?.corp);
  for (const [serverId, bucket] of Object.entries(counters?.servers ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    addSummary(`server:${serverId}`, bucket);
  }
  for (const [effectId, effect] of Object.entries(counters?.effects ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const amount = Math.max(0, Math.floor(Number(effect.amount ?? 0)));
    if (amount > 0)
      summary.push(`effect:${effectId}:${effect.counterType}=${amount}`);
  }

  const total = purgeableRunnerVirusCounterTotal(state);
  if (total <= 0)
    throw new Error("Es gibt keine purgefaehigen Runner-Virus-Counter.");
  delete state.purgeableRunnerVirusCounters;
  return { total, publicSummary: summary.join(";") };
}

export function purgeVirusCounters(state: GameState): number {
  const total = totalCounters(state, "virus");
  if (total <= 0) throw new Error("Es gibt keine Virus-Counter zu purgen.");
  for (const cardId of Object.keys(state.cardInstances)) {
    setCardCounter(state, cardId as CardInstanceId, "virus", 0);
  }
  if (state.poxCountersByServer) state.poxCountersByServer = {};
  if (state.faitAccompliCountersByServer)
    state.faitAccompliCountersByServer = {};
  return total;
}

function totalCounters(state: GameState, counterType: CounterType): number {
  const cardCounterTotal = Object.keys(state.cardInstances).reduce(
    (sum, cardId) =>
      sum + cardCounter(state, cardId as CardInstanceId, counterType),
    0,
  );
  if (counterType !== "virus") return cardCounterTotal;
  let poxTotal = 0;
  for (const amount of Object.values(state.poxCountersByServer ?? {})) {
    poxTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
  }
  let faitTotal = 0;
  for (const amount of Object.values(
    state.faitAccompliCountersByServer ?? {},
  )) {
    faitTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
  }
  return cardCounterTotal + poxTotal + faitTotal;
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function setCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const instance = mustInstance(state.cardInstances, cardId);
  const counters = { ...(instance.counters ?? {}) };
  if (amount === 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  state.cardInstances[cardId] =
    Object.keys(counters).length > 0
      ? { ...withoutCounters, counters }
      : withoutCounters;
}

function mustInstance(
  instances: GameState["cardInstances"],
  cardId: CardInstanceId,
): CardInstance {
  const instance = instances[cardId];
  if (!instance) throw new Error(`CardInstance fehlt: ${cardId}`);
  return instance;
}

function handled(legalAction: LegalAction): TurnBasicExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
