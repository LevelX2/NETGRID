import { CARD_DEFINITIONS_BY_ID, type VisibleCard } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function runtimeCardDefinitionForAi(definitionId: string) {
  return RUNTIME_CARDS[definitionId];
}

export function demoCardDefinitionForAi(definitionId: string) {
  return CARD_DEFINITIONS_BY_ID[definitionId];
}

export function demoCardRulesTextForAi(definitionId: string) {
  return CARD_DEFINITIONS_BY_ID[definitionId]?.rulesText;
}

export function runnerCardMechanicsForAi(definitionId: string): string[] {
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
  definitionId: string | undefined,
): string | undefined {
  return definitionId ? CARD_DEFINITIONS_BY_ID[definitionId]?.type : undefined;
}

export function visibleCardDefinition(card: VisibleCard) {
  return card.definitionId ? CARD_DEFINITIONS_BY_ID[card.definitionId] : undefined;
}
