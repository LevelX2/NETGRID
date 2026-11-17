import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type VisibleCard } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function runtimeCardDefinitionForAi(definitionId: number) {
  return RUNTIME_CARDS[definitionId];
}

export function demoCardDefinitionForAi(definitionId: number) {
  return CARD_DEFINITIONS_BY_ID[definitionId];
}

export function demoCardRulesTextForAi(definitionId: number) {
  return CARD_DEFINITIONS_BY_ID[definitionId]?.rulesText;
}

export function runnerCardMechanicsForAi(definitionId: number): string[] {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = CARD_DEFINITIONS_BY_ID[definitionId];
  return [
    ...("mechanics" in (runtimeDefinition ?? {})
      ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
          ?.mechanics ?? [])
      : []),
    ...(demoDefinition?.mechanics ?? []),
  ];
}

export function cardDefinitionTypeForAi(
  definitionId: number | undefined,
): string | undefined {
  return definitionId ? CARD_DEFINITIONS_BY_ID[definitionId]?.type : undefined;
}

export function visibleCardDefinition(card: VisibleCard) {
  return card.known === true && card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
}
