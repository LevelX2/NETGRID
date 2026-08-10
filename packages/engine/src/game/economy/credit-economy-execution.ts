import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import {
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
} from "../payment/runner-payment-support";

type HostFn<T = unknown> = (...args: any[]) => T;

export type RandomProgramProbeImplementation =
  | {
      family: "icebreakerAbilities";
      kind: "run_start_random_strength_bonus";
    }
  | {
      family: "virusCounter";
      kind: "boardwalk";
    };

export type CreditEconomyRunnerDrawSummary = {
  drawnCount: number;
  drawnCardIds?: CardInstanceId[];
  drawTaxSourceCount: number;
  drawTaxCreditsPaid: number;
  drawTaxTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
  crashEverettChoiceOpened?: boolean;
};

export type CreditEconomyExecutionHost = {
  state: GameState;
  actions: {
    spendClick: (state: GameState, side: Side) => void;
  };
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    mustInstance: (
      source: Record<CardInstanceId, CardInstance>,
      cardId: CardInstanceId,
    ) => CardInstance;
    publicServerLabelForCard: (
      state: GameState,
      cardId: string | undefined,
    ) => string | undefined;
    hasCardImplementationForDefinition: (definitionId: string) => boolean;
    hasCorpUtilityKind: (
      state: GameState,
      cardId: CardInstanceId,
      kind:
        | "move_installed_corp_card_to_hq"
        | "shuffle_hq_into_rd_then_draw_same_count",
    ) => boolean;
    uniqueDirectLongtailImplementationForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) =>
      | {
          kind?: string;
          agendaPointCost?: number;
          gainCredits?: number;
        }
      | undefined;
    randomProgramProbeImplementationForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => RandomProgramProbeImplementation | undefined;
  };
  credits: {
    gain: (state: GameState, side: Side, amount: number) => void;
    spend: (state: GameState, side: Side, amount: number) => void;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    addCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
  };
  runner: {
    installedCardIds: (state: GameState) => CardInstanceId[];
    trashInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    forfeitAgendaForPointCost: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
    drawCards: (
      state: GameState,
      amount: number,
    ) => CreditEconomyRunnerDrawSummary;
    applyDrawSummaryPayload: (
      state: GameState,
      legalAction: LegalAction,
      summary: CreditEconomyRunnerDrawSummary,
    ) => void;
    ensureTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
  };
  corp: {
    rezzedRootCardIds: (state: GameState) => CardInstanceId[];
    installedCardIds: (state: GameState) => CardInstanceId[];
    publicInstalledCardIdentityKnown: (
      state: GameState,
      cardId: CardInstanceId,
    ) => boolean;
    uninstallInstalledCardToHq: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
    trashInstalledCardToArchives: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  hiddenZone: {
    resolveV1911RunnerHiddenZoneAbility: HostFn<void>;
    resolveScoredAgendaCorpRdTopReveal: HostFn<void>;
    revealRunnerStackTop: HostFn<void>;
    revealCorpRdTop: HostFn<void>;
    resolveReschedulerHqShuffleDraw: HostFn<void>;
    startCorpAssetRdTopReorderChoice: HostFn<void>;
  };
  delegates: {
    shouldOpenCorpInstalledEconomyCreditChoice: (
      state: GameState,
      legalAction: LegalAction,
    ) => boolean;
    startCorpInstalledEconomyCreditChoice: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
    resolveCorpInstalledEconomyAction: (
      state: GameState,
      legalAction: LegalAction,
    ) => boolean;
    handleTraceOrchestrationAction: (legalAction: LegalAction) => {
      handled: boolean;
    };
    handleCorpSpecialDamageAbilityAction: (legalAction: LegalAction) => {
      handled: boolean;
    };
    handleScoredAgendaActivatedAbilityAction: (legalAction: LegalAction) => {
      handled: boolean;
    };
  };
  random: {
    nextRandom: (state: GameState, purpose: string) => number;
  };
  constants: {
    COUNTER_UPGRADE_SOURCES: ReadonlySet<string>;
  };
};

export type CreditEconomyExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleCreditEconomyExecution(
  host: CreditEconomyExecutionHost,
  legalAction: LegalAction,
): CreditEconomyExecutionResult {
  if (legalAction.type !== "gain_credit") return { handled: false };

  const { state } = host;
  const runnerCreditCost = legalAction.costs[0]?.credits ?? 0;
  if (legalAction.side === "runner" && runnerCreditCost > 0) {
    if (
      openRunnerCostPenaltySupportWindow(state, legalAction, {
        amount: runnerCreditCost,
        availableWithoutSupport: state.runner.credits,
        context: "runner_pool",
      })
    )
      return handled(legalAction);
    closeRunnerCostPenaltySupportWindowForPayment(
      state,
      legalAction,
      runnerCreditCost,
    );
  }
  host.actions.spendClick(state, legalAction.side);
  if (
    host.delegates.shouldOpenCorpInstalledEconomyCreditChoice(
      state,
      legalAction,
    )
  ) {
    host.delegates.startCorpInstalledEconomyCreditChoice(state, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.v1911HiddenZoneAbility) {
    host.hiddenZone.resolveV1911RunnerHiddenZoneAbility(state, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.agendaAbility === "scored_agenda_reveal_rd_top") {
    host.hiddenZone.resolveScoredAgendaCorpRdTopReveal(state, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "remove_crying_counter") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Crying-Counter entfernen.");
    const sourceCardId = String(legalAction.payload?.cardId ?? "");
    if (sourceCardId !== state.runner.identity)
      throw new Error(
        "Crying-Counter liegen auf dem Runner-Identitaetsstatus.",
      );
    if (host.counters.cardCounter(state, state.runner.identity, "crying") <= 0)
      throw new Error("Es ist kein Crying-Counter vorhanden.");
    const removeAmount = Number(legalAction.payload?.removeCounterAmount ?? 0);
    if (!Number.isInteger(removeAmount) || removeAmount !== 1)
      throw new Error("Es wird genau 1 Crying-Counter entfernt.");
    const cost = Number(legalAction.payload?.counterRemoveCreditCost ?? 2);
    if (!Number.isInteger(cost) || cost !== 2)
      throw new Error("Crying-Counter entfernen kostet genau 2 Credits.");
    host.credits.spend(state, "runner", cost);
    host.counters.spendCardCounter(
      state,
      state.runner.identity,
      "crying",
      removeAmount,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      removedCounterAmount: removeAmount,
      remainingCounters: host.counters.cardCounter(
        state,
        state.runner.identity,
        "crying",
      ),
      runnerCreditsAfter: state.runner.credits,
    };
    return handled(legalAction);
  }
  if (host.delegates.resolveCorpInstalledEconomyAction(state, legalAction)) {
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1917AssetAbility === "rescheduler_hq_shuffle_draw"
  ) {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf Rescheduler nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.rezzedRootCardIds(state).includes(sourceCardId))
      throw new Error("Rescheduler ist nicht rezzed installiert.");
    if (
      !host.cards.hasCorpUtilityKind(
        state,
        sourceCardId,
        "shuffle_hq_into_rd_then_draw_same_count",
      )
    )
      throw new Error("Die Rescheduler-Faehigkeit passt nicht zur Karte.");
    host.hiddenZone.resolveReschedulerHqShuffleDraw(
      state,
      legalAction,
      sourceCardId,
    );
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1951CorpUtilityAbility === "corp_installed_card_to_hq"
  ) {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese installierte Karte bewegen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.rezzedRootCardIds(state).includes(sourceCardId))
      throw new Error("Die Corp-Utility-Quelle ist nicht rezzed installiert.");
    if (
      !host.cards.hasCorpUtilityKind(
        state,
        sourceCardId,
        "move_installed_corp_card_to_hq",
      )
    )
      throw new Error("Die Corp-Utility-Faehigkeit passt nicht zur Karte.");
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.installedCardIds(state).includes(targetCardId))
      throw new Error("Das Corp-Utility-Ziel ist nicht mehr installiert.");
    const targetDefinitionId = host.cards.definitionFor(state, targetCardId).id;
    const targetIdentityKnown = host.corp.publicInstalledCardIdentityKnown(
      state,
      targetCardId,
    );
    host.corp.uninstallInstalledCardToHq(state, targetCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corp_installed_card_to_hq",
      movedCardCount: 1,
      ...(targetIdentityKnown
        ? { movedCardDefinitionId: targetDefinitionId }
        : {}),
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.v1918UpgradeAbility === "add_power_counter") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf V1.9.18-Upgrade-Counter nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.rezzedRootCardIds(state).includes(sourceCardId))
      throw new Error(
        "Die V1.9.18-Upgrade-Counter-Faehigkeit ist nicht rezzed installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (!host.constants.COUNTER_UPGRADE_SOURCES.has(definition.id))
      throw new Error("Die V1.9.18-Counter-Faehigkeit passt nicht zur Karte.");
    const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
    if (!Number.isInteger(addAmount) || addAmount !== 1)
      throw new Error(
        "V1.9.18-Counter-Upgrades laden in diesem WIP genau 1 Power-Counter.",
      );
    host.counters.addCardCounter(state, sourceCardId, "power", addAmount);
    const serverLabel = host.cards.publicServerLabelForCard(
      state,
      sourceCardId,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      ...(serverLabel ? { serverLabel } : {}),
      addedCounterAmount: addAmount,
      remainingCounters: host.counters.cardCounter(
        state,
        sourceCardId,
        "power",
      ),
    };
    return handled(legalAction);
  }
  if (host.delegates.handleTraceOrchestrationAction(legalAction).handled) {
    return handled(legalAction);
  }
  if (host.delegates.handleCorpSpecialDamageAbilityAction(legalAction).handled)
    return handled(legalAction);
  if (
    legalAction.payload?.v1921UpgradeAbility ===
    "deterministic_server_die_probe"
  ) {
    throw new Error("Rio de Janeiro City Grid nutzt automatische Trigger.");
  }
  if (
    legalAction.payload?.v1921RunnerProgramAbility === "deterministic_die_probe"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf V1.9.21-Programm-Zufall nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error(
        "Die V1.9.21-Programm-Zufallsfaehigkeit ist nicht installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    const randomProgramProbe =
      host.cards.randomProgramProbeImplementationForCard(state, sourceCardId);
    if (
      randomProgramProbe?.family !== "icebreakerAbilities" &&
      randomProgramProbe?.family !== "virusCounter"
    )
      throw new Error(
        "Die V1.9.21-Programm-Zufallsfaehigkeit passt nicht zur Karte.",
      );
    const randomPurpose = `v1921.die.${definition.id}.program_probe`;
    const dieRoll =
      Math.floor(host.random.nextRandom(state, randomPurpose) * 6) + 1;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      randomPurpose,
      v1921DieRoll: dieRoll,
      randomCounterAfter: state.randomCounter,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.resourceAbility === "databroker") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Databroker nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.resources.includes(sourceCardId))
      throw new Error("Databroker ist nicht installiert.");
    const implementation = host.cards.uniqueDirectLongtailImplementationForCard(
      state,
      sourceCardId,
    );
    if (implementation?.kind !== "agenda_point_for_credits_resource")
      throw new Error("Die Databroker-Faehigkeit passt nicht zur Karte.");
    const agendaCost = Number(legalAction.payload?.agendaPointCost ?? 0);
    const expectedAgendaCost = implementation.agendaPointCost;
    if (!Number.isInteger(agendaCost) || agendaCost !== expectedAgendaCost)
      throw new Error("Der Databroker-Agenda-Kostenpfad ist ungueltig.");
    const agendaPointSourceCardId = String(
      legalAction.payload?.spentAgendaCardId ??
        legalAction.payload?.forfeitAgendaCardId ??
        "",
    ) as CardInstanceId;
    host.runner.forfeitAgendaForPointCost(state, agendaPointSourceCardId);
    if (legalAction.payload?.trashOnUse === true)
      host.runner.trashInstalledCardToHeap(state, sourceCardId);
    const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 10);
    const expectedGainAmount = implementation.gainCredits;
    if (
      !Number.isInteger(gainAmount) ||
      gainAmount !== expectedGainAmount ||
      gainAmount <= 0
    )
      throw new Error("Der Databroker-Creditgewinn ist ungueltig.");
    host.credits.gain(state, "runner", gainAmount);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      spentAgendaCardId: agendaPointSourceCardId,
      agendaPointCostPaid: agendaCost,
      gainedCredits: gainAmount,
    };
    return handled(legalAction);
  }
  if (
    host.delegates.handleScoredAgendaActivatedAbilityAction(legalAction).handled
  ) {
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf die Run-Sperre entfernen.");
    const cost = Number(legalAction.payload?.runnerRunLockCreditCost ?? 0);
    const pendingCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runnerRunLockCreditCost ?? 0),
    );
    if (!Number.isInteger(cost) || cost <= 0 || cost !== pendingCost)
      throw new Error("Die Run-Sperre verlangt den aktuellen Betrag.");
    host.credits.spend(state, "runner", cost);
    host.runner.ensureTurnFlags(state).runnerRunLockCreditCost = 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerRunLockCleared: true,
      runnerCreditsAfter: state.runner.credits,
      gainedCredits: 0,
    };
    return handled(legalAction);
  }
  host.credits.gain(state, legalAction.side, 1);
  if (legalAction.payload?.drawCardAfter === true) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf mit diesem Effekt ziehen.");
    host.runner.applyDrawSummaryPayload(
      state,
      legalAction,
      host.runner.drawCards(state, 1),
    );
  }
  return handled(legalAction);
}

function handled(legalAction: LegalAction): CreditEconomyExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
