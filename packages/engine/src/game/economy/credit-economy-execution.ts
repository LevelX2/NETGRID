import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";

type HostFn<T = unknown> = (...args: any[]) => T;

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
    visibleVirusCounterTargetIds: (state: GameState) => CardInstanceId[];
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
    COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE: string;
    COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID: string;
    DISINFECTANT_VIRUS_COUNTER_ASSET_ID: string;
    COUNTER_UPGRADE_SOURCES: ReadonlySet<string>;
    RUNNER_RANDOM_PROGRAM_SOURCES: ReadonlySet<string>;
    QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_SOURCE: string;
    FAIT_ACCOMPLI_COUNTER_PROGRAM_ID: string;
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
  host.actions.spendClick(state, legalAction.side);
  if (host.delegates.shouldOpenCorpInstalledEconomyCreditChoice(state, legalAction)) {
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
  if (legalAction.payload?.v1912CounterAbility === "reveal_stack_top") {
    if (legalAction.side !== "runner")
      throw new Error(
        "Nur der Runner darf diese V1.9.12 Counter-Faehigkeit nutzen.",
      );
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error("Die V1.9.12 Counter-Faehigkeit ist nicht installiert.");
    if (
      host.cards.definitionFor(state, sourceCardId).id !==
      host.constants.COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE
    )
      throw new Error("Die V1.9.12 Counter-Faehigkeit passt nicht zur Karte.");
    host.hiddenZone.revealRunnerStackTop(state, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneAction: "v1912_reveal_stack_top",
    };
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
    legalAction.payload?.v1917AssetAbility === "trash_installed_runner_card"
  ) {
    if (legalAction.side !== "corp")
      throw new Error(
        "Nur die Korp darf V1.9.17-installed-card-Assets nutzen.",
      );
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.rezzedRootCardIds(state).includes(sourceCardId))
      throw new Error(
        "Die V1.9.17-installed-card-Asset-Faehigkeit ist nicht rezzed installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (definition.id !== host.constants.COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID)
      throw new Error(
        "Die V1.9.17-installed-card-Faehigkeit passt nicht zur Karte.",
      );
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
    if (!host.runner.installedCardIds(state).includes(targetCardId))
      throw new Error(
        "Das V1.9.17-installed-card-Ziel ist nicht mehr installiert.",
      );
    const targetDefinitionId = host.cards.definitionFor(state, targetCardId).id;
    host.runner.trashInstalledCardToHeap(state, targetCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_trash_installed_runner_card",
      trashedCardDefinitionId: targetDefinitionId,
    };
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1951CorpUtilityAbility ===
    "corp_installed_card_to_hq"
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
  if (legalAction.payload?.v1917AssetAbility === "remove_virus_counter") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf V1.9.17-Virus-Counter-Assets nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!host.corp.rezzedRootCardIds(state).includes(sourceCardId))
      throw new Error(
        "Die V1.9.17-Virus-Counter-Asset-Faehigkeit ist nicht rezzed installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (definition.id !== host.constants.DISINFECTANT_VIRUS_COUNTER_ASSET_ID)
      throw new Error(
        "Die V1.9.17-Virus-Counter-Faehigkeit passt nicht zur Karte.",
      );
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
    if (
      !host.counters.visibleVirusCounterTargetIds(state).includes(targetCardId)
    )
      throw new Error("Das V1.9.17-Virus-Counter-Ziel ist nicht mehr gueltig.");
    const removeAmount = Number(legalAction.payload?.removeCounterAmount ?? 0);
    if (!Number.isInteger(removeAmount) || removeAmount !== 1)
      throw new Error(
        "Disinfectant, Inc. entfernt in V1.9.17 genau 1 Virus-Counter.",
      );
    host.counters.spendCardCounter(state, targetCardId, "virus", removeAmount);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_remove_virus_counter",
      counterType: "virus",
      removedCounterAmount: removeAmount,
      remainingCounters: host.counters.cardCounter(
        state,
        targetCardId,
        "virus",
      ),
      targetCardDefinitionId: host.cards.definitionFor(state, targetCardId).id,
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
    if (!host.constants.RUNNER_RANDOM_PROGRAM_SOURCES.has(definition.id))
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
  if (
    legalAction.payload?.v1921RunnerResourceAbility ===
    "deterministic_die_probe"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf V1.9.21-Ressourcen-Zufall nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.resources.includes(sourceCardId))
      throw new Error(
        "Die V1.9.21-Ressourcen-Zufallsfaehigkeit ist nicht installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (
      definition.id !==
      host.constants.QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_SOURCE
    )
      throw new Error(
        "Die V1.9.21-Ressourcen-Zufallsfaehigkeit passt nicht zur Karte.",
      );
    const randomPurpose = `v1921.die.${definition.id}.resource_probe`;
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
  if (legalAction.payload?.v1919RunnerProgramAbility === "add_power_counter") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf V1.9.19-Programm-Counter nutzen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error(
        "Die V1.9.19-Programm-Counter-Faehigkeit ist nicht installiert.",
      );
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (definition.id !== host.constants.FAIT_ACCOMPLI_COUNTER_PROGRAM_ID)
      throw new Error(
        "Die V1.9.19-Programm-Counter-Faehigkeit passt nicht zur Karte.",
      );
    if (state.runner.scoreArea.length === 0)
      throw new Error(
        "Fait Accompli benoetigt eine Runner-Agenda als Agenda-Bezug.",
      );
    const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
    if (!Number.isInteger(addAmount) || addAmount !== 1)
      throw new Error(
        "Fait Accompli laedt in diesem V1.9.19-WIP genau 1 Power-Counter.",
      );
    host.counters.addCardCounter(state, sourceCardId, "power", addAmount);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      addedCounterAmount: addAmount,
      remainingCounters: host.counters.cardCounter(
        state,
        sourceCardId,
        "power",
      ),
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
    if (implementation?.kind !== "databroker_agenda_point_credits")
      throw new Error("Die Databroker-Faehigkeit passt nicht zur Karte.");
    const agendaCost = Number(legalAction.payload?.agendaPointCost ?? 0);
    const expectedAgendaCost = implementation.agendaPointCost;
    if (!Number.isInteger(agendaCost) || agendaCost !== expectedAgendaCost)
      throw new Error("Der Databroker-Agenda-Kostenpfad ist ungueltig.");
    const forfeitAgendaCardId = String(
      legalAction.payload?.forfeitAgendaCardId ?? "",
    ) as CardInstanceId;
    host.runner.forfeitAgendaForPointCost(state, forfeitAgendaCardId);
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
      forfeitedAgendaCardId: forfeitAgendaCardId,
      agendaPointCostPaid: agendaCost,
      gainedCredits: gainAmount,
      specialZone: "removed_from_game",
      specialZoneVisibility: "public",
      specialZoneReason: "agenda_point_cost_databroker",
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
