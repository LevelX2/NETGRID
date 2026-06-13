import type {
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

type ScoredSubtypeRevealSubtype = "code_gate" | "wall";

export function isScoredSubtypeRevealChoiceSource(source: string): boolean {
  return source.startsWith("v162.scored_subtype_reveal");
}

export function startScoredSubtypeRevealChoiceOrResolve(
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
  const [, agendaId, rawSubtype, rawCreditPer] = choice.source.split(":");
  const subtype =
    rawSubtype === "wall" || rawSubtype === "code_gate"
      ? rawSubtype
      : undefined;
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

function scoredSubtypeRevealAgendaAbility(
  subtype: ScoredSubtypeRevealSubtype,
): "encryption_breakthrough" | "superior_net_barriers" {
  return subtype === "wall"
    ? "superior_net_barriers"
    : "encryption_breakthrough";
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

function scoredSubtypeRevealPrompt(
  subtype: ScoredSubtypeRevealSubtype,
): string {
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
