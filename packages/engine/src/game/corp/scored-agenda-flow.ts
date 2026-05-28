import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";

type ScoredAgendaPayload = Record<string, string | number | boolean>;
type ScoredSubtypeRevealSubtype = "code_gate" | "wall";

export type ScoredAgendaFlowHost = {
  state: Pick<
    GameState,
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "stateVersion"
    | "phase"
    | "activeSide"
    | "timingPoint"
    | "winner"
  >;
  legalAction?: LegalAction;
  playerAction?: PlayerAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    scoredAgendaForDefinition: (
      definition: CardDefinition,
    ) => CardScoredAgendaImplementation | undefined;
    effectiveAgendaDifficulty: (cardId: CardInstanceId) => number;
    hasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    isOveradvanceAgendaDefinition: (definitionId: string) => boolean;
  };
  constants: {
    employeeEmpowermentId: string;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    cleanupEmptyRemotes: () => void;
    corpInstalledCardIds: () => CardInstanceId[];
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => unknown;
  };
  counters: {
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: "agenda" | "mark",
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: "boon" | "mark",
      amount: number,
    ) => void;
    cardCounter: (cardId: CardInstanceId, counterType: "boon" | "mark") => number;
  };
  credits: {
    gainCredits: (side: "corp", amount: number) => void;
    setCorpCredits: (amount: number) => void;
  };
  flags: {
    markScoredBlackOpsAgendaThisTurn: () => void;
    employeeEmpowermentResolvedSourceIds: () => CardInstanceId[];
    markEmployeeEmpowermentResolved: (cardId: CardInstanceId) => void;
  };
  effects: {
    executeOnScore: (definition: CardDefinition, cardId: CardInstanceId) => void;
    appendEmployeeEmpowermentDrawEffect: (
      cardId: CardInstanceId,
      drawnCount: number,
    ) => void;
  };
  draw: {
    drawCorpCard: () => void;
  };
  choices: {
    startDataFortReclamation: (cardId: CardInstanceId) => void;
    startPriorityRequisition: (cardId: CardInstanceId) => void;
    startCorporateDownsizing: (
      cardId: CardInstanceId,
      creditPerAgendaPoint: number,
    ) => void;
    resolveSecurityPurge: () => void;
  };
};

export type ScoredAgendaFlowResult = {
  handled: boolean;
  stateChanged?: boolean;
  agendaInstanceId?: CardInstanceId;
  agendaDefinitionId?: string;
  agendaPointsScored?: number;
  bonusAgendaPoints?: number;
  overadvancedBy?: number;
  gainedCredits?: number;
  lostCredits?: boolean;
  placedCounters?: number;
  pendingChoice?: ChoiceRequest;
  resolvedPayload?: ScoredAgendaPayload;
};

export function scoreAgenda(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
): ScoredAgendaFlowResult {
  const state = host.state;
  const legalAction = host.legalAction;
  const definition = host.cards.definitionFor(cardId);
  if (definition.type !== "agenda")
    throw new Error("Nur Agendas koennen gescored werden.");
  const instanceBefore = host.cards.mustInstance(cardId);
  const requiredDifficulty = host.cards.effectiveAgendaDifficulty(cardId);
  if (instanceBefore.advancementCounters < requiredDifficulty)
    throw new Error("Agenda hat nicht genug Advancements.");
  if (
    legalAction &&
    instanceBefore.zone.side === "corp" &&
    instanceBefore.zone.zone === "serverRoot"
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      scoredFromServerId: instanceBefore.zone.serverId,
    };
  }
  host.zones.removeFromAllZones(cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "scoreArea" },
  };
  if (host.cards.hasSubtype(definition, "black_ops")) {
    host.flags.markScoredBlackOpsAgendaThisTurn();
  }
  const scoredAgenda = host.cards.scoredAgendaForDefinition(definition);
  let bonusAgendaPoints = 0;
  let overadvancedBy = 0;
  if (scoredAgenda?.kind === "project_babylon_bonus_points") {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    bonusAgendaPoints = Math.floor(
      overadvancedBy / scoredAgenda.perExcessAdvancementCounters,
    );
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        projectBabylonOveradvance: overadvancedBy,
        projectBabylonBonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (host.cards.isOveradvanceAgendaDefinition(definition.id)) {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    bonusAgendaPoints = Math.floor(overadvancedBy / 2);
    host.counters.setCardCounter(cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919AgendaDifficulty: requiredDifficulty,
        v1919Overadvance: overadvancedBy,
        v1919BonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (scoredAgenda?.kind === "fixed_bonus_agenda_points_on_score") {
    bonusAgendaPoints += scoredAgenda.amount;
    host.counters.setCardCounter(cardId, "agenda", scoredAgenda.amount);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        fixedBonusAgendaPoints: scoredAgenda.amount,
        bonusAgendaPoints,
      };
    }
  }
  if (scoredAgenda?.kind === "overadvance_start_of_corp_turn_credits") {
    overadvancedBy = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    const recurringCredits =
      Math.floor(overadvancedBy / scoredAgenda.perExcessAdvancementCounters) *
      scoredAgenda.creditPerGroup;
    host.counters.setCardCounter(cardId, "mark", recurringCredits);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        overadvanceRecurringCredits: recurringCredits,
        projectZurichOveradvance: overadvancedBy,
      };
    }
  }
  applySimpleScoreEffects(host, cardId, definition, scoredAgenda);
  startScoreTimeChoices(host, cardId, definition, instanceBefore, scoredAgenda);
  host.zones.cleanupEmptyRemotes();
  const result: ScoredAgendaFlowResult = {
    handled: true,
    stateChanged: true,
    agendaInstanceId: cardId,
    agendaDefinitionId: definition.id,
    bonusAgendaPoints,
    overadvancedBy,
  };
  if (state.pendingChoice) result.pendingChoice = state.pendingChoice;
  if (legalAction?.payload) result.resolvedPayload = legalAction.payload as ScoredAgendaPayload;
  return result;
}

function applySimpleScoreEffects(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): void {
  const legalAction = host.legalAction;
  if (scoredAgenda?.kind === "gain_credits_on_score") {
    host.credits.gainCredits(scoredAgenda.recipient, scoredAgenda.amount);
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        onScoreGainCredits: scoredAgenda.amount,
        gainedCredits: scoredAgenda.amount,
        corpCreditsAfter: host.state.corp.credits,
      };
  }
  if (scoredAgenda?.kind === "add_counters_on_score") {
    host.counters.addCardCounter(
      cardId,
      scoredAgenda.counterType,
      scoredAgenda.amount,
    );
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        counterType: scoredAgenda.counterType,
        addedCounterAmount: scoredAgenda.amount,
        remainingCounters: host.counters.cardCounter(
          cardId,
          scoredAgenda.counterType,
        ),
      };
  }
  host.effects.executeOnScore(definition, cardId);
  if (scoredAgenda?.kind === "corporate_retreat_disable_on_rez_or_install") {
    host.counters.setCardCounter(cardId, "mark", 1);
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        agendaAbility: "v1922_corporate_retreat",
        corporateRetreatAvailable: true,
      };
  }
  if (scoredAgenda?.kind === "corporate_war_credit_swing") {
    const corpCreditsBefore = host.state.corp.credits;
    const threshold = scoredAgenda.threshold;
    const gainAmount = scoredAgenda.gainAmount;
    const thresholdMet = corpCreditsBefore >= threshold;
    if (thresholdMet) {
      host.credits.gainCredits("corp", gainAmount);
    } else {
      host.credits.setCorpCredits(0);
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922CorporateWarThreshold: threshold,
        corpCreditsBeforeCorporateWar: corpCreditsBefore,
        corporateWarThresholdMet: thresholdMet,
        onScoreGainCredits: thresholdMet ? gainAmount : 0,
        onScoreLostAllCredits: !thresholdMet,
        corpCreditsAfter: host.state.corp.credits,
      };
    }
  }
}

function startScoreTimeChoices(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  instanceBefore: CardInstance,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): void {
  const legalAction = host.legalAction;
  if (!legalAction) return;
  if (scoredAgenda?.kind === "data_fort_reclamation") {
    host.choices.startDataFortReclamation(cardId);
  }
  if (scoredAgenda?.kind === "ice_transmutation_rezzed_ice_modifier") {
    startIceTransmutationChoice(host, cardId, legalAction);
  }
  if (scoredAgenda?.kind === "priority_requisition_rez_ice_at_no_cost") {
    host.choices.startPriorityRequisition(cardId);
  }
  if (scoredAgenda?.kind === "reveal_installed_ice_subtype_for_credits") {
    startScoredSubtypeRevealChoiceOrResolve(
      host,
      cardId,
      legalAction,
      scoredAgenda.subtype,
      scoredAgenda.creditPerRevealedOrRezzed,
    );
  }
  if (scoredAgenda?.kind === "choose_fort_ice_strength_bonus") {
    const selectedServerId =
      typeof legalAction.payload?.selectedServerId === "string"
        ? String(legalAction.payload.selectedServerId)
        : instanceBefore.zone.side === "corp" &&
            instanceBefore.zone.zone === "serverRoot"
          ? instanceBefore.zone.serverId
          : undefined;
    if (!selectedServerId || selectedServerId === "new_remote")
      throw new Error("Security Net Optimization braucht ein gueltiges Remote.");
    host.zones.mustServer(selectedServerId as Exclude<ServerId, "new_remote">);
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      selectedServerId: selectedServerId as Exclude<ServerId, "new_remote">,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      securityNetOptimizationActive: true,
      selectedServerId,
      securityNetOptimizationServerId: selectedServerId,
    };
  }
  if (scoredAgenda?.kind === "corporate_downsizing_hq_agendas") {
    host.choices.startCorporateDownsizing(
      cardId,
      scoredAgenda.creditPerAgendaPoint,
    );
  }
  if (scoredAgenda?.kind === "security_purge_top_rd") {
    host.choices.resolveSecurityPurge();
  }
  void definition;
}

export function handleScoredAgendaFlowChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (source.startsWith("v162.scored_subtype_reveal")) {
    resolveScoredSubtypeRevealChoice(host);
    const result: ScoredAgendaFlowResult = { handled: true, stateChanged: true };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  if (source.startsWith("v1920.ice_transmutation")) {
    resolveIceTransmutationChoice(host);
    const result: ScoredAgendaFlowResult = { handled: true, stateChanged: true };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  if (source.startsWith("v1912.employee_empowerment_start_draw")) {
    resolveEmployeeEmpowermentStartDrawChoice(host);
    const result: ScoredAgendaFlowResult = { handled: true, stateChanged: true };
    if (host.legalAction?.payload)
      result.resolvedPayload = host.legalAction.payload as ScoredAgendaPayload;
    return result;
  }
  return { handled: false };
}

export function startEmployeeEmpowermentStartDrawChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  if (host.state.pendingChoice) return { handled: false };
  const sourceCardId = scoredEmployeeEmpowermentSourceIds(host)[0];
  if (!sourceCardId) return { handled: false };
  host.state.pendingChoice = {
    choiceId: `v1912_employee_empowerment_start_draw_${sourceCardId}_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1912.employee_empowerment_start_draw:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Employee Empowerment: zusätzliche Karte ziehen?",
    kind: "select_option",
    options: [
      {
        id: "draw",
        label: "Zusätzliche Karte ziehen",
        publicLabel: "Zusätzliche Karte gezogen",
        value: "draw",
      },
      {
        id: "skip",
        label: "Überspringen",
        publicLabel: "Übersprungen",
        value: "skip",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  return {
    handled: true,
    stateChanged: true,
    pendingChoice: host.state.pendingChoice,
  };
}

function scoredEmployeeEmpowermentSourceIds(
  host: ScoredAgendaFlowHost,
): CardInstanceId[] {
  const resolved = new Set(host.flags.employeeEmpowermentResolvedSourceIds());
  return host.state.corp.scoreArea
    .filter(
      (cardId) =>
        host.cards.definitionFor(cardId).id ===
          host.constants.employeeEmpowermentId &&
        !resolved.has(cardId),
    )
    .sort();
}

function resolveEmployeeEmpowermentStartDrawChoice(
  host: ScoredAgendaFlowHost,
): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1912.employee_empowerment_start_draw"))
    throw new Error("Es ist keine Employee-Empowerment-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Employee Empowerment nutzen.");
  if (
    host.state.phase !== "corp_draw_phase" ||
    host.state.timingPoint !== "corp_draw.mandatory_draw"
  )
    throw new Error("Employee Empowerment ist nur am Start des Korp-Zugs nutzbar.");
  const [, sourceCardId] = choice.source.split(":");
  if (
    !sourceCardId ||
    !host.state.corp.scoreArea.includes(sourceCardId as CardInstanceId) ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      host.constants.employeeEmpowermentId
  )
    throw new Error("Employee Empowerment ist nicht mehr in der Korp-ScoreArea.");

  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  const useDraw = selected === "draw";
  host.flags.markEmployeeEmpowermentResolved(sourceCardId as CardInstanceId);
  delete host.state.pendingChoice;

  const rdBefore = host.state.corp.rd.length;
  if (useDraw) host.draw.drawCorpCard();
  const drawnCount = useDraw ? rdBefore - host.state.corp.rd.length : 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "public",
    sourceDefinitionId: host.constants.employeeEmpowermentId,
    cardDefinitionId: host.constants.employeeEmpowermentId,
    employeeEmpowermentStartDrawDecision: useDraw ? "draw" : "skip",
    ...(useDraw ? { drawnCards: drawnCount, drawnCount } : {}),
  };
  if (useDraw) {
    host.effects.appendEmployeeEmpowermentDrawEffect(
      sourceCardId as CardInstanceId,
      drawnCount,
    );
  }
  if (!host.state.winner) startEmployeeEmpowermentStartDrawChoice(host);
}

function scoredSubtypeRevealAgendaAbility(
  subtype: ScoredSubtypeRevealSubtype,
): "encryption_breakthrough" | "superior_net_barriers" {
  return subtype === "wall" ? "superior_net_barriers" : "encryption_breakthrough";
}

function scoredSubtypeRevealHiddenZoneAction(
  subtype: ScoredSubtypeRevealSubtype,
):
  | "encryption_breakthrough_reveal_code_gates"
  | "superior_net_barriers_reveal_walls" {
  return subtype === "wall"
    ? "superior_net_barriers_reveal_walls"
    : "encryption_breakthrough_reveal_code_gates";
}

function scoredSubtypeRevealPrompt(subtype: ScoredSubtypeRevealSubtype): string {
  return subtype === "wall"
    ? "Superior Net Barriers: Walls aufdecken"
    : "Encryption Breakthrough: Code Gates aufdecken";
}

function scoredSubtypeRevealOptionPublicLabel(
  subtype: ScoredSubtypeRevealSubtype,
): string {
  return subtype === "wall" ? "Installierte Wall" : "Installiertes Code Gate";
}

function installedIceIdsWithSubtype(
  host: ScoredAgendaFlowHost,
  subtype: ScoredSubtypeRevealSubtype,
): CardInstanceId[] {
  return host.zones
    .corpInstalledCardIds()
    .filter((iceId) => {
      const instance = host.cards.mustInstance(iceId);
      return (
        instance.zone.zone === "serverIce" &&
        host.cards.hasSubtype(host.cards.definitionFor(iceId), subtype)
      );
    })
    .sort();
}

function startScoredSubtypeRevealChoiceOrResolve(
  host: ScoredAgendaFlowHost,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
  subtype: ScoredSubtypeRevealSubtype,
  creditPer: number,
): void {
  const matchingIceIds = installedIceIdsWithSubtype(host, subtype);
  const hiddenCandidates = matchingIceIds.filter((iceId) => {
    const instance = host.cards.mustInstance(iceId);
    return !instance.rezzed && !instance.faceup;
  });
  if (hiddenCandidates.length === 0) {
    resolveScoredSubtypeReveal(host, subtype, creditPer, []);
    return;
  }
  host.state.pendingChoice = {
    choiceId: `v162_scored_subtype_reveal_${subtype}_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v162.scored_subtype_reveal:${agendaId}:${subtype}:${creditPer}:${host.state.stateVersion + 1}`,
    prompt: scoredSubtypeRevealPrompt(subtype),
    kind: "select_cards",
    options: hiddenCandidates.map((cardId) => ({
      id: `card_${cardId}`,
      label: host.cards.definitionFor(cardId).title,
      publicLabel: scoredSubtypeRevealOptionPublicLabel(subtype),
      value: cardId,
    })),
    minSelections: 0,
    maxSelections: hiddenCandidates.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: scoredSubtypeRevealAgendaAbility(subtype),
    scoredSubtypeRevealChoiceOpened: true,
    scoredSubtypeRevealSubtype: subtype,
    scoredSubtypeRevealCandidateCount: hiddenCandidates.length,
  };
}

function resolveScoredSubtypeRevealChoice(host: ScoredAgendaFlowHost): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v162.scored_subtype_reveal"))
    throw new Error("Es ist keine Scored-Subtype-Reveal-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese Reveal-Choice resolven.");
  const [, agendaId, rawSubtype, rawCreditPer] = choice.source.split(":");
  const subtype =
    rawSubtype === "wall" || rawSubtype === "code_gate" ? rawSubtype : undefined;
  const creditPer = Number(rawCreditPer);
  if (!agendaId || !subtype || !Number.isInteger(creditPer) || creditPer < 0)
    throw new Error("Die Scored-Subtype-Reveal-Choice ist ungueltig.");
  const agendaDefinition = host.cards.definitionFor(agendaId as CardInstanceId);
  const scoredAgenda = host.cards.scoredAgendaForDefinition(agendaDefinition);
  if (
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    scoredAgenda?.kind !== "reveal_installed_ice_subtype_for_credits" ||
    scoredAgenda.subtype !== subtype
  ) {
    throw new Error("Die Reveal-Agenda ist nicht mehr in der Korp-ScoreArea.");
  }
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const optionValues = new Set(
    choice.options
      .map((option) => option.value)
      .filter((value): value is string => typeof value === "string"),
  );
  for (const selectedId of selectedIds) {
    const instance = host.state.cardInstances[selectedId];
    if (
      !optionValues.has(selectedId) ||
      !instance ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.rezzed ||
      instance.faceup ||
      !host.cards.hasSubtype(host.cards.definitionFor(selectedId), subtype)
    ) {
      throw new Error("Das Reveal-Ziel ist nicht mehr gueltig.");
    }
  }
  delete host.state.pendingChoice;
  resolveScoredSubtypeReveal(host, subtype, creditPer, selectedIds);
}

function resolveScoredSubtypeReveal(
  host: ScoredAgendaFlowHost,
  subtype: ScoredSubtypeRevealSubtype,
  creditPer: number,
  selectedRevealIds: CardInstanceId[],
): void {
  const legalAction = requireLegalAction(host);
  const selectedSet = new Set(selectedRevealIds);
  for (const iceId of selectedSet) {
    const instance = host.cards.mustInstance(iceId);
    host.state.cardInstances[iceId] = { ...instance, faceup: true };
  }
  const matchingIceIds = installedIceIdsWithSubtype(host, subtype);
  const rezzedMatchingIceCount = matchingIceIds.filter(
    (iceId) => host.cards.mustInstance(iceId).rezzed,
  ).length;
  const countedIds = matchingIceIds.filter((iceId) => {
    const instance = host.cards.mustInstance(iceId);
    return selectedSet.has(iceId) || instance.rezzed || instance.faceup;
  });
  const gainedCredits = countedIds.length * creditPer;
  if (gainedCredits > 0) host.credits.gainCredits("corp", gainedCredits);
  const publicRevealDefinitionIds = countedIds.map(
    (iceId) => host.cards.definitionFor(iceId).id,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: scoredSubtypeRevealAgendaAbility(subtype),
    hiddenZoneBarrier: true,
    hiddenZoneAction: scoredSubtypeRevealHiddenZoneAction(subtype),
    revealedCount: selectedRevealIds.length,
    ...(subtype === "code_gate"
      ? { rezzedCodeGateCount: rezzedMatchingIceCount }
      : {}),
    rezzedMatchingIceCount,
    countedMatchingIceCount: countedIds.length,
    gainedCredits,
    corpCreditsAfter: host.state.corp.credits,
    publicRevealDefinitionIds: publicRevealDefinitionIds.join(","),
  };
}

function iceTransmutationTargetIds(host: ScoredAgendaFlowHost): CardInstanceId[] {
  return Object.entries(host.state.cardInstances)
    .filter(([, instance]) => {
      return (
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverIce" &&
        instance.rezzed === true
      );
    })
    .map(([cardId]) => cardId as CardInstanceId)
    .filter((cardId) => host.cards.definitionFor(cardId).type === "ice")
    .sort();
}

function startIceTransmutationChoice(
  host: ScoredAgendaFlowHost,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const targets = iceTransmutationTargetIds(host);
  if (targets.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaAbility: "v1920_ice_transmutation",
      iceTransmutationSkippedReason: "no_rezzed_ice",
    };
    return;
  }
  host.state.pendingChoice = {
    choiceId: `v1920_ice_transmutation_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1920.ice_transmutation:${agendaId}:${host.state.stateVersion + 1}`,
    prompt: "Ice Transmutation: Rezzed ICE wählen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: "v1920_ice_transmutation_choice",
    eligibleIceCount: targets.length,
  };
}

function resolveIceTransmutationChoice(host: ScoredAgendaFlowHost): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1920.ice_transmutation"))
    throw new Error("Es ist keine Ice-Transmutation-Choice offen.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaForDefinition(
      host.cards.definitionFor(agendaId as CardInstanceId),
    )?.kind !== "ice_transmutation_rezzed_ice_modifier"
  )
    throw new Error("Ice Transmutation ist nicht gescored.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== 1)
    throw new Error("Ice Transmutation braucht genau ein ICE-Ziel.");
  const targetIceId = selectedIds[0];
  if (!targetIceId) throw new Error("Ice-Transmutation-Ziel fehlt.");
  if (!iceTransmutationTargetIds(host).includes(targetIceId))
    throw new Error("Ice Transmutation darf nur rezzed ICE wählen.");
  host.counters.addCardCounter(targetIceId, "mark", 1);
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: "v1920_ice_transmutation",
    sourceAgendaId: agendaId,
    targetIceId,
    targetIceDefinitionId: host.cards.definitionFor(targetIceId).id,
    strengthBonus: host.counters.cardCounter(targetIceId, "mark"),
    duplicatedSubroutineCount:
      (host.cards.definitionFor(targetIceId).subroutines?.length ?? 0) *
      host.counters.cardCounter(targetIceId, "mark"),
  };
}

function requireLegalAction(host: ScoredAgendaFlowHost): LegalAction {
  if (!host.legalAction) throw new Error("Scored-Agenda LegalAction fehlt.");
  return host.legalAction;
}

function requirePlayerAction(host: ScoredAgendaFlowHost): PlayerAction {
  if (!host.playerAction) throw new Error("Scored-Agenda PlayerAction fehlt.");
  return host.playerAction;
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

function selectedChoiceCardIds(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
}
