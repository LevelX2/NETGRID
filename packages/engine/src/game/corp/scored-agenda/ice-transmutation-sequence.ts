import type {
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { cardImplementationPrimitivePayload } from "../../../ability-engine/card-implementation-primitives";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import type { ScoredAgendaFlowHost } from "../scored-agenda-flow";

const SCORED_ICE_MARK_CHOICE_SOURCE =
  "card_implementation_primitive.select_rezzed_ice_mark_modifier";

export function isScoredIceMarkModifierChoiceSource(source: string): boolean {
  return (
    source.startsWith(`${SCORED_ICE_MARK_CHOICE_SOURCE}:`) ||
    source.startsWith("v1920.ice_transmutation")
  );
}

export function startScoredRezzedIceMarkModifierChoice(
  host: ScoredAgendaFlowHost,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
  scoredAgenda: Extract<
    CardScoredAgendaImplementation,
    { kind: "select_rezzed_ice_mark_modifier" }
  >,
): void {
  if (
    scoredAgenda.target !== "rezzed_installed_ice" ||
    scoredAgenda.counterType !== "mark" ||
    scoredAgenda.counterAmount !== 1 ||
    scoredAgenda.strengthBonusPerCounter !== 1 ||
    scoredAgenda.duplicateEachPrintedSubroutinePerCounter !== true
  )
    throw new Error("Der Scored-ICE-Mark-Modifier-Vertrag ist ungueltig.");
  const targets = rezzedInstalledIceMarkModifierTargetIds(host);
  const agendaDefinition = host.cards.definitionFor(agendaId);
  const primitivePayload = cardImplementationPrimitivePayload({
    sourceCardId: agendaId,
    sourceDefinitionId: agendaDefinition.id,
    primitiveKind: scoredAgenda.kind,
    effectKind: "mark_modifier",
    abilityKey: scoredAgenda.abilityKey,
  });
  if (targets.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...primitivePayload,
      agendaAbility: "v1920_ice_transmutation",
      scoredAgendaPrimitiveSkippedReason: "no_rezzed_ice",
      iceTransmutationSkippedReason: "no_rezzed_ice",
    };
    return;
  }
  host.state.pendingChoice = {
    choiceId: `choice_card_implementation_select_rezzed_ice_mark_modifier_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `${SCORED_ICE_MARK_CHOICE_SOURCE}:${agendaId}:${host.state.stateVersion + 1}`,
    prompt:
      "Ice Transmutation: Rezzed ICE wählen. Das gewählte ICE bekommt +1 Stärke; jede Subroutine wird direkt nach ihrem ursprünglichen Platz einmal zusätzlich ausgeführt.",
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
    ...primitivePayload,
    agendaAbility: "v1920_ice_transmutation_choice",
    cardImplementationTargetKind: scoredAgenda.target,
    cardImplementationCounterType: scoredAgenda.counterType,
    cardImplementationCounterAmount: scoredAgenda.counterAmount,
    cardImplementationStrengthBonusPerCounter:
      scoredAgenda.strengthBonusPerCounter,
    cardImplementationDuplicateEachPrintedSubroutinePerCounter:
      scoredAgenda.duplicateEachPrintedSubroutinePerCounter,
    eligibleIceCount: targets.length,
  };
}

export function resolveScoredRezzedIceMarkModifierChoice(
  host: ScoredAgendaFlowHost,
): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !isScoredIceMarkModifierChoiceSource(choice.source))
    throw new Error("Es ist keine Scored-ICE-Mark-Modifier-Choice offen.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaForDefinition(
      host.cards.definitionFor(agendaId as CardInstanceId),
    )?.kind !== "select_rezzed_ice_mark_modifier"
  )
    throw new Error(
      "Das Scored-ICE-Mark-Modifier-Primitive ist nicht gescored.",
    );
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== 1)
    throw new Error(
      "Das Scored-ICE-Mark-Modifier-Primitive braucht genau ein ICE-Ziel.",
    );
  const targetIceId = selectedIds[0];
  if (!targetIceId) throw new Error("Scored-ICE-Mark-Modifier-Ziel fehlt.");
  if (!rezzedInstalledIceMarkModifierTargetIds(host).includes(targetIceId))
    throw new Error(
      "Das Scored-ICE-Mark-Modifier-Primitive darf nur rezzed ICE wählen.",
    );
  const scoredAgenda = host.cards.scoredAgendaForDefinition(
    host.cards.definitionFor(agendaId as CardInstanceId),
  );
  if (
    scoredAgenda?.kind !== "select_rezzed_ice_mark_modifier" ||
    scoredAgenda.target !== "rezzed_installed_ice" ||
    scoredAgenda.counterType !== "mark" ||
    scoredAgenda.counterAmount !== 1 ||
    scoredAgenda.strengthBonusPerCounter !== 1 ||
    scoredAgenda.duplicateEachPrintedSubroutinePerCounter !== true
  )
    throw new Error("Der Scored-ICE-Mark-Modifier-Vertrag passt nicht.");
  host.counters.addCardCounter(
    targetIceId,
    scoredAgenda.counterType,
    scoredAgenda.counterAmount,
  );
  delete host.state.pendingChoice;
  const markCount = host.counters.cardCounter(
    targetIceId,
    scoredAgenda.counterType,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...cardImplementationPrimitivePayload({
      sourceCardId: agendaId as CardInstanceId,
      sourceDefinitionId: host.cards.definitionFor(agendaId as CardInstanceId)
        .id,
      primitiveKind: scoredAgenda.kind,
      effectKind: "mark_modifier",
      abilityKey: scoredAgenda.abilityKey,
    }),
    agendaAbility: "v1920_ice_transmutation",
    sourceAgendaId: agendaId,
    targetIceId,
    targetIceDefinitionId: host.cards.definitionFor(targetIceId).id,
    cardImplementationTargetKind: scoredAgenda.target,
    cardImplementationCounterType: scoredAgenda.counterType,
    cardImplementationCounterAmount: scoredAgenda.counterAmount,
    cardImplementationStrengthBonusPerCounter:
      scoredAgenda.strengthBonusPerCounter,
    cardImplementationDuplicateEachPrintedSubroutinePerCounter:
      scoredAgenda.duplicateEachPrintedSubroutinePerCounter,
    strengthBonus: markCount * scoredAgenda.strengthBonusPerCounter,
    duplicatedSubroutineCount:
      (host.cards.definitionFor(targetIceId).subroutines?.length ?? 0) *
      markCount,
  };
}

function rezzedInstalledIceMarkModifierTargetIds(
  host: ScoredAgendaFlowHost,
): CardInstanceId[] {
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
