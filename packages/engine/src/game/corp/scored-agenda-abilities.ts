import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import { abilityUsageSourceUsed } from "../../ability-engine/card-implementation-ability-limits";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import type { ScoredAgendaActionProfile } from "../../mechanics/agenda-scoring";

type ScoredAgendaAbilityPayload = Record<string, string | number | boolean>;

export type ScoredAgendaAbilityHost = {
  state: Pick<
    GameState,
    | "corp"
    | "runner"
    | "cardInstances"
    | "phase"
    | "activeSide"
    | "corpTurnFlags"
  >;
  legalAction?: LegalAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    scoredAgendaKindForDefinition: (
      definition: CardDefinition,
    ) => string | undefined;
    scoredAgendaForDefinition: (
      definition: CardDefinition,
    ) => CardScoredAgendaImplementation | undefined;
    isScoredRevealAgendaDefinition: (definitionId: string) => boolean;
  };
  actions: {
    createLegalAction: (
      side: "corp",
      type: LegalAction["type"],
      label: string,
      source: string,
      costs: LegalAction["costs"],
      payload: NonNullable<LegalAction["payload"]>,
    ) => LegalAction;
  };
  counters: {
    cardCounter: (
      cardId: CardInstanceId,
      counterType: "mark" | "power" | "pdca",
    ) => number;
    spendVisibleCardCounter: (
      cardId: CardInstanceId,
      counterType: "power",
      amount: number,
    ) => ScoredAgendaAbilityPayload;
  };
  credits: {
    gainCorpCredits: (amount: number) => void;
  };
  damage?: {
    dealRunnerMeatDamage: (
      sourceCardId: CardInstanceId,
      amount: number,
    ) => {
      damageAmount: number;
      cardsTrashed: number;
      flatline: boolean;
    };
  };
  actionProfiles: {
    scoredAgendaCounterCreditProfileForDefinition: (
      definitionId: string,
    ) => ScoredAgendaActionProfile | undefined;
    scoredAgendaCounterCreditProfileForPayload: (
      definitionId: string,
      payload: Record<string, unknown> | undefined,
    ) => ScoredAgendaActionProfile | undefined;
    scoredAgendaCounterCreditPayload: (
      profile: ScoredAgendaActionProfile,
      cardId: CardInstanceId,
    ) => NonNullable<LegalAction["payload"]>;
  };
  callbacks: {
    pushActivatedCardImplementationActions: (
      actions: LegalAction[],
      cardId: CardInstanceId,
      definition: CardDefinition,
    ) => void;
    resolveActivatedCardImplementationAbility: () => boolean;
    revealCorpRdTop: () => void;
    resolveHqArchivesShuffleDraw: (sourceCardId: CardInstanceId) => void;
  };
};

export type ScoredAgendaActivatedAbilityHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  gainedCredits?: number;
  drawCount?: number;
  removedCounters?: number;
  resolvedPayload?: ScoredAgendaAbilityPayload;
  resolvedEffects?: ResolvedGameEffect[];
};

export type ScoredAgendaAbilityLegalActionResult = {
  handled: boolean;
  actions: LegalAction[];
};

export function buildScoredAgendaAbilityActions(
  host: ScoredAgendaAbilityHost,
): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const agendaId of host.state.corp.scoreArea.slice().sort()) {
    const result = buildScoredAgendaAbilityActionsForCard(host, agendaId);
    if (result.handled) actions.push(...result.actions);
  }
  return actions;
}

export function buildScoredAgendaAbilityActionsForCard(
  host: ScoredAgendaAbilityHost,
  agendaId: CardInstanceId,
): ScoredAgendaAbilityLegalActionResult {
  const actions: LegalAction[] = [];
  const definition = host.cards.definitionFor(agendaId);
  host.callbacks.pushActivatedCardImplementationActions(
    actions,
    agendaId,
    definition,
  );
  if (
    host.cards.scoredAgendaKindForDefinition(definition) ===
    "tagged_runner_meat_damage_reduce_hand_size_on_success"
  ) {
    if (host.state.runner.tags > 0) {
      const implementation = host.cards.scoredAgendaForDefinition(definition);
      const damageAmount =
        implementation?.kind ===
        "tagged_runner_meat_damage_reduce_hand_size_on_success"
          ? implementation.damageAmount
          : 1;
      actions.push(
        host.actions.createLegalAction(
          "corp",
          "gain_credit",
          `${definition.title}: 1 Meat Damage`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "proteus_corporate_headhunters",
            damageAmount,
          },
        ),
      );
    }
    return { handled: true, actions };
  }
  if (
    host.cards.scoredAgendaKindForDefinition(definition) ===
    "shuffle_hq_archives_into_rd_then_draw"
  ) {
    const implementation = host.cards.scoredAgendaForDefinition(definition);
    const drawCardsAmount =
      implementation?.kind === "shuffle_hq_archives_into_rd_then_draw"
        ? implementation.drawCount
        : 0;
    actions.push(
      host.actions.createLegalAction(
        "corp",
        "gain_credit",
        "HQ/Archives in R&D mischen, 5 ziehen",
        agendaId,
        [{ clicks: 1 }],
        {
          cardId: agendaId,
          agendaAbility: "hq_archives_shuffle_draw",
          drawCardsAmount,
        },
      ),
    );
    return { handled: true, actions };
  }
  if (
    host.cards.scoredAgendaKindForDefinition(definition) ===
    "corp_damage_replacement_pdca_action_counter"
  ) {
    const alreadyUsed = abilityUsageSourceUsed(
      host.state.corpTurnFlags?.pdcaUsedSourceIdsThisTurn,
      agendaId,
    );
    if (
      host.state.phase === "corp_action_phase" &&
      host.state.activeSide === "corp" &&
      !alreadyUsed &&
      host.counters.cardCounter(agendaId, "pdca") > 0
    ) {
      actions.push(
        host.actions.createLegalAction(
          "corp",
          "trigger_ability",
          `${definition.title}: PDCA-Counter fuer 1 Aktion ausgeben`,
          agendaId,
          [],
          {
            cardId: agendaId,
            actionEconomyAbility: "pdca_counter_gain_action",
            sourceDefinitionId: definition.id,
            counterType: "pdca",
            removeCounterAmount: 1,
          },
        ),
      );
    }
    return { handled: true, actions };
  }
  const scoredCounterCreditProfile =
    host.actionProfiles.scoredAgendaCounterCreditProfileForDefinition(
      definition.id,
    );
  if (scoredCounterCreditProfile) {
    if (
      host.counters.cardCounter(
        agendaId,
        scoredCounterCreditProfile.counterType,
      ) >= scoredCounterCreditProfile.removeCounterAmount
    ) {
      actions.push(
        host.actions.createLegalAction(
          "corp",
          "gain_credit",
          `${definition.title}: ${scoredCounterCreditProfile.label}`,
          agendaId,
          [{ clicks: scoredCounterCreditProfile.clickCost }],
          host.actionProfiles.scoredAgendaCounterCreditPayload(
            scoredCounterCreditProfile,
            agendaId,
          ),
        ),
      );
    }
    return { handled: true, actions };
  }
  if (host.cards.isScoredRevealAgendaDefinition(definition.id)) {
    if (host.state.corp.rd.length > 0) {
      actions.push(
        host.actions.createLegalAction(
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze revealn`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1919_scored_agenda_reveal_rd_top",
            hiddenZoneAction: "v1919_scored_agenda_reveal_rd_top",
          },
        ),
      );
    }
    return { handled: true, actions };
  }
  if (
    host.cards.scoredAgendaKindForDefinition(definition) ===
    "scored_agenda_credit_until_install_or_rez"
  ) {
    if (!isScoredAgendaInstallRezCreditAvailable(host, agendaId))
      return { handled: true, actions };
    actions.push(
      host.actions.createLegalAction(
        "corp",
        "gain_credit",
        `${definition.title}: 2 Credits`,
        agendaId,
        [{ clicks: 1 }],
        {
          cardId: agendaId,
          agendaAbility: "scored_agenda_credit_until_install_or_rez",
          gainCreditsAmount: 2,
        },
      ),
    );
    return { handled: true, actions };
  }
  return { handled: actions.length > 0, actions };
}

export function handleScoredAgendaActivatedAbilityAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = host.legalAction;
  if (!legalAction) return { handled: false };
  if (legalAction.type === "activated_card_ability") {
    if (legalAction.payload?.cardImplementationAbility !== "activated")
      return { handled: false };
    const sourceCardId = legalAction.abilityRef?.sourceCardInstanceId;
    if (!sourceCardId || !host.state.corp.scoreArea.includes(sourceCardId))
      return { handled: false };
    const definition = host.cards.definitionFor(sourceCardId);
    if (!host.callbacks.resolveActivatedCardImplementationAbility())
      throw new Error("Die aktivierte Kartenfaehigkeit ist nicht gueltig.");
    const result: ScoredAgendaActivatedAbilityHandlerResult = {
      handled: true,
      stateChanged: true,
      sourceCardId,
      sourceDefinitionId: definition.id,
    };
    if (legalAction.payload)
      result.resolvedPayload = legalAction.payload as ScoredAgendaAbilityPayload;
    if (legalAction.resolvedEffects)
      result.resolvedEffects = legalAction.resolvedEffects;
    return result;
  }
  if (resolveScoredAgendaCounterCreditAction(host).handled) {
    return {
      handled: true,
      stateChanged: true,
      resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
    };
  }
  if (legalAction.payload?.agendaAbility === "scored_agenda_credit_until_install_or_rez")
    return resolveScoredAgendaInstallRezCreditAction(host);
  if (
    legalAction.payload?.agendaAbility ===
    "v1919_scored_agenda_reveal_rd_top"
  )
    return resolveScoredAgendaRevealRdTopAction(host);
  if (legalAction.payload?.agendaAbility === "hq_archives_shuffle_draw")
    return resolveHqArchivesShuffleDrawAction(host);
  if (legalAction.payload?.agendaAbility === "proteus_corporate_headhunters")
    return resolveCorporateHeadhuntersAction(host);
  return { handled: false };
}

function resolveCorporateHeadhuntersAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Corporate Headhunters nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!host.state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Corporate Headhunters ist nicht gescort.");
  if (host.state.runner.tags <= 0)
    throw new Error("Corporate Headhunters braucht einen getaggten Runner.");
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation = host.cards.scoredAgendaForDefinition(definition);
  if (
    implementation?.kind !==
    "tagged_runner_meat_damage_reduce_hand_size_on_success"
  )
    throw new Error("Die Agenda-Aktion passt nicht zu Corporate Headhunters.");
  if (!host.damage)
    throw new Error("Corporate Headhunters braucht Damage-Callbacks.");
  const summary = host.damage.dealRunnerMeatDamage(
    sourceCardId,
    implementation.damageAmount,
  );
  let handSizeReduction = 0;
  if (summary.cardsTrashed > 0) {
    handSizeReduction = implementation.handSizeReduction;
    host.state.runner.maxHandSize = Math.max(
      0,
      host.state.runner.maxHandSize - handSizeReduction,
    );
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    damageResolved: true,
    damageType: "meat",
    damageAmount: summary.damageAmount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    handSizeReduction,
    runnerMaxHandSizeAfter: host.state.runner.maxHandSize,
  };
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
  };
}

function resolveScoredAgendaInstallRezCreditAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error(
      "Nur die Korp darf scored Agenda-Install/Rez-Credits nutzen.",
    );
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!host.state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Die Install/Rez-Credit-Agenda ist nicht gescort.");
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation = host.cards.scoredAgendaForDefinition(definition);
  if (implementation?.kind !== "scored_agenda_credit_until_install_or_rez")
    throw new Error(
      "Die Agenda-Aktion passt nicht zu Install/Rez-Credits.",
    );
  if (!isScoredAgendaInstallRezCreditAvailable(host, sourceCardId))
    throw new Error(
      "Die Install/Rez-Credit-Agenda ist nach Install oder Rez nicht mehr verfuegbar.",
    );
  const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
  const expectedGain =
    implementation.kind === "scored_agenda_credit_until_install_or_rez"
      ? implementation.gainAmount
      : 0;
  if (!Number.isInteger(gainAmount) || gainAmount !== expectedGain)
    throw new Error(
      "Die Install/Rez-Credit-Agenda gewaehrt in diesem Scope genau 2 Credits.",
    );
  host.credits.gainCorpCredits(gainAmount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    gainedCredits: gainAmount,
    corpCreditsAfter: host.state.corp.credits,
  };
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    gainedCredits: gainAmount,
    resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
  };
}

function resolveScoredAgendaRevealRdTopAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error(
      "Nur die Korp darf V1.9.19-Scored-Agenda-Faehigkeiten nutzen.",
    );
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!host.state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Die V1.9.19-Scored-Agenda ist nicht gescort.");
  const definition = host.cards.definitionFor(sourceCardId);
  if (!host.cards.isScoredRevealAgendaDefinition(definition.id))
    throw new Error("Die V1.9.19-Scored-Agenda-Faehigkeit passt nicht zur Karte.");
  host.callbacks.revealCorpRdTop();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneAction: "v1919_scored_agenda_reveal_rd_top",
  };
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
  };
}

function resolveHqArchivesShuffleDrawAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error(
      "Nur die Korp darf die HQ/Archives-Shuffle-Draw-Agenda-Aktion nutzen.",
    );
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!host.state.corp.scoreArea.includes(sourceCardId))
    throw new Error(
      "Die gewaehlte HQ/Archives-Shuffle-Draw-Agenda ist nicht gescort.",
    );
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation = host.cards.scoredAgendaForDefinition(definition);
  if (implementation?.kind !== "shuffle_hq_archives_into_rd_then_draw")
    throw new Error(
      "Die Agenda-Aktion passt nicht zur ausgewaehlten HQ/Archives-Shuffle-Draw-Agenda.",
    );
  host.callbacks.resolveHqArchivesShuffleDraw(sourceCardId);
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    drawCount: implementation.drawCount,
    resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
  };
}

function resolveScoredAgendaCounterCreditAction(
  host: ScoredAgendaAbilityHost,
): ScoredAgendaActivatedAbilityHandlerResult {
  const legalAction = requireLegalAction(host);
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!sourceCardId || !host.state.cardInstances[sourceCardId])
    return { handled: false };
  const definition = host.cards.definitionFor(sourceCardId);
  const profile = host.actionProfiles.scoredAgendaCounterCreditProfileForPayload(
    definition.id,
    legalAction.payload,
  );
  if (!profile) return { handled: false };
  validateScoredAgendaCounterCreditAction(host, sourceCardId, profile);
  const counterPayload = host.counters.spendVisibleCardCounter(
    sourceCardId,
    profile.counterType,
    profile.removeCounterAmount,
  );
  host.credits.gainCorpCredits(profile.creditGain);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...counterPayload,
    spentPowerCounters: profile.removeCounterAmount,
    gainedCredits: profile.creditGain,
    remainingPowerCounters: Number(counterPayload.remainingCounters ?? 0),
  };
  return {
    handled: true,
    stateChanged: true,
    sourceCardId,
    sourceDefinitionId: definition.id,
    gainedCredits: profile.creditGain,
    removedCounters: profile.removeCounterAmount,
    resolvedPayload: legalAction.payload as ScoredAgendaAbilityPayload,
  };
}

function validateScoredAgendaCounterCreditAction(
  host: ScoredAgendaAbilityHost,
  sourceCardId: CardInstanceId,
  profile: ScoredAgendaActionProfile,
): void {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== profile.side)
    throw new Error("Nur die Korp darf diese scored Agenda-Aktion nutzen.");
  if (host.state.phase !== "corp_action_phase" || host.state.activeSide !== "corp")
    throw new Error("Diese scored Agenda-Aktion ist nur in der Korp-Aktionsphase nutzbar.");
  if (!host.state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Die scored Agenda-Aktion ist nicht gescort.");
  if (host.cards.definitionFor(sourceCardId).id !== profile.sourceDefinitionId)
    throw new Error("Die scored Agenda-Aktion passt nicht zur Karte.");
  if (legalAction.payload?.agendaAbility !== profile.agendaAbility)
    throw new Error("Die scored Agenda-Aktion passt nicht zum Profil.");
  const removeAmount = Number(legalAction.payload?.removePowerCounterAmount ?? 0);
  if (
    !Number.isInteger(removeAmount) ||
    removeAmount !== profile.removeCounterAmount
  )
    throw new Error("Die scored Agenda-Aktion hat ungueltige Counterkosten.");
  if (host.counters.cardCounter(sourceCardId, profile.counterType) < removeAmount)
    throw new Error("Auf der scored Agenda sind nicht genug Counter.");
  const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
  if (!Number.isInteger(gainAmount) || gainAmount !== profile.creditGain)
    throw new Error("Die scored Agenda-Aktion hat einen ungueltigen Creditbetrag.");
}

function isScoredAgendaInstallRezCreditAvailable(
  host: ScoredAgendaAbilityHost,
  agendaId: CardInstanceId,
): boolean {
  return (
    host.state.corp.scoreArea.includes(agendaId) &&
    host.cards.scoredAgendaKindForDefinition(host.cards.definitionFor(agendaId)) ===
      "scored_agenda_credit_until_install_or_rez" &&
    host.counters.cardCounter(agendaId, "mark") > 0
  );
}

function requireLegalAction(host: ScoredAgendaAbilityHost): LegalAction {
  if (!host.legalAction) throw new Error("Scored-Agenda LegalAction fehlt.");
  return host.legalAction;
}
