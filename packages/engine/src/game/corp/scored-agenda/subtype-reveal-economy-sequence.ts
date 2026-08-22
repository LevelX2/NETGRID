import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";

type ScoredSubtypeRevealSubtype = "code_gate" | "wall";
const SCORED_SUBTYPE_REVEAL_CHOICE_PREFIX = "scored_agenda.subtype_reveal";
const INVALID_SCORED_SUBTYPE_REVEAL_CREDIT_RATE =
  "runtime_invalid_scored_subtype_reveal_credit_rate";

export function isScoredSubtypeRevealChoiceSource(source: string): boolean {
  return source.startsWith(`${SCORED_SUBTYPE_REVEAL_CHOICE_PREFIX}:`);
}

export function startScoredSubtypeRevealChoiceOrResolve(
  host: ScoredAgendaFlowHost,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
  subtype: ScoredSubtypeRevealSubtype,
  creditPer: number,
): void {
  const agendaDefinition = host.cards.definitionFor(agendaId);
  const validatedCreditPerCountedIce = validatedScoredSubtypeRevealCreditRate(
    host,
    agendaDefinition,
    subtype,
    creditPer,
  );
  const matchingIceIds = installedIceIdsWithSubtype(host, subtype);
  const hiddenCandidates = matchingIceIds.filter((iceId) => {
    const instance = host.cards.mustInstance(iceId);
    return !instance.rezzed && !instance.faceup;
  });
  if (hiddenCandidates.length === 0) {
    resolveScoredSubtypeReveal(host, subtype, validatedCreditPerCountedIce, []);
    return;
  }
  const choiceStateVersion = host.state.stateVersion + 1;
  host.state.pendingChoice = {
    choiceId: `scored_agenda_subtype_reveal_${subtype}_${choiceStateVersion}`,
    side: "corp",
    source: `${SCORED_SUBTYPE_REVEAL_CHOICE_PREFIX}:${agendaId}:${subtype}:${validatedCreditPerCountedIce}:${choiceStateVersion}`,
    sourceCardInstanceId: agendaId,
    sourceCardDefinitionId: agendaDefinition.id,
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
    stateVersion: choiceStateVersion,
    visibility: "hidden_info_barrier",
  };
  applySequencePayloadPatch(legalAction, {
    agendaAbility: scoredSubtypeRevealAgendaAbility(),
    scoredSubtypeRevealChoiceOpened: true,
    scoredSubtypeRevealSubtype: subtype,
    scoredSubtypeRevealCandidateCount: hiddenCandidates.length,
  });
}

export function resolveScoredSubtypeRevealChoice(
  host: ScoredAgendaFlowHost,
): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !isScoredSubtypeRevealChoiceSource(choice.source))
    throw new Error("Es ist keine Scored-Subtype-Reveal-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese Reveal-Choice resolven.");
  const sourceParts = choice.source.split(":");
  if (
    sourceParts.length !== 5 ||
    sourceParts[0] !== SCORED_SUBTYPE_REVEAL_CHOICE_PREFIX
  )
    throw new Error(INVALID_SCORED_SUBTYPE_REVEAL_CREDIT_RATE);
  const [, agendaId, rawSubtype, rawCreditPer, rawStateVersion] = sourceParts;
  const subtype =
    rawSubtype === "wall" || rawSubtype === "code_gate"
      ? rawSubtype
      : undefined;
  const persistedCreditPerCountedIce =
    canonicalPositiveSafeInteger(rawCreditPer);
  const persistedStateVersion =
    canonicalNonNegativeSafeInteger(rawStateVersion);
  if (
    !agendaId ||
    !subtype ||
    persistedCreditPerCountedIce === undefined ||
    persistedStateVersion !== choice.stateVersion
  )
    throw new Error(INVALID_SCORED_SUBTYPE_REVEAL_CREDIT_RATE);
  const agendaDefinition = host.cards.definitionFor(agendaId as CardInstanceId);
  const scoredAgenda = host.cards.scoredAgendaForDefinition(agendaDefinition);
  if (
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    choice.sourceCardInstanceId !== agendaId ||
    choice.sourceCardDefinitionId !== agendaDefinition.id ||
    scoredAgenda?.kind !== "reveal_installed_ice_subtype_for_credits" ||
    scoredAgenda.subtype !== subtype
  ) {
    throw new Error("Die Reveal-Agenda ist nicht mehr in der Korp-ScoreArea.");
  }
  const creditPerCountedIce = validatedScoredSubtypeRevealCreditRate(
    host,
    agendaDefinition,
    subtype,
    persistedCreditPerCountedIce,
  );
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
      !host.cards.effectiveHasSubtype(selectedId, subtype)
    ) {
      throw new Error("Das Reveal-Ziel ist nicht mehr gueltig.");
    }
  }
  delete host.state.pendingChoice;
  resolveScoredSubtypeReveal(host, subtype, creditPerCountedIce, selectedIds);
}

function validatedScoredSubtypeRevealCreditRate(
  host: ScoredAgendaFlowHost,
  agendaDefinition: CardDefinition,
  subtype: ScoredSubtypeRevealSubtype,
  creditPerCountedIce: number,
): number {
  const scoredAgenda = host.cards.scoredAgendaForDefinition(agendaDefinition);
  if (
    scoredAgenda?.kind !== "reveal_installed_ice_subtype_for_credits" ||
    scoredAgenda.subtype !== subtype ||
    !Number.isSafeInteger(scoredAgenda.creditPerRevealedOrRezzed) ||
    scoredAgenda.creditPerRevealedOrRezzed <= 0 ||
    creditPerCountedIce !== scoredAgenda.creditPerRevealedOrRezzed
  )
    throw new Error(INVALID_SCORED_SUBTYPE_REVEAL_CREDIT_RATE);
  return scoredAgenda.creditPerRevealedOrRezzed;
}

function canonicalPositiveSafeInteger(
  value: string | undefined,
): number | undefined {
  const parsed = canonicalNonNegativeSafeInteger(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function canonicalNonNegativeSafeInteger(
  value: string | undefined,
): number | undefined {
  if (value === undefined || !/^(0|[1-9]\d*)$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function scoredSubtypeRevealAgendaAbility(): "scored_subtype_reveal" {
  return "scored_subtype_reveal";
}

function scoredSubtypeRevealHiddenZoneAction(
  subtype: ScoredSubtypeRevealSubtype,
): "scored_subtype_reveal_code_gates" | "scored_subtype_reveal_walls" {
  return subtype === "wall"
    ? "scored_subtype_reveal_walls"
    : "scored_subtype_reveal_code_gates";
}

function scoredSubtypeRevealPrompt(
  subtype: ScoredSubtypeRevealSubtype,
): string {
  return subtype === "wall"
    ? "Scored Agenda: Walls aufdecken"
    : "Scored Agenda: Code Gates aufdecken";
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
        host.cards.effectiveHasSubtype(iceId, subtype)
      );
    })
    .sort();
}

function resolveScoredSubtypeReveal(
  host: ScoredAgendaFlowHost,
  subtype: ScoredSubtypeRevealSubtype,
  creditPerCountedIce: number,
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
  const gainedCredits = countedIds.length * creditPerCountedIce;
  if (gainedCredits > 0) host.credits.gainCredits("corp", gainedCredits);
  const publicRevealDefinitionIds = countedIds.map(
    (iceId) => host.cards.definitionFor(iceId).id,
  );
  applySequencePayloadPatch(legalAction, {
    agendaAbility: scoredSubtypeRevealAgendaAbility(),
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
  });
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
