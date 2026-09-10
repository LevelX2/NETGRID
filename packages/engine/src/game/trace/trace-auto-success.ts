import type { CardDefinition, CardInstanceId } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** The first installed source owns the trace-wide modifier; copies do not stack. */
export function traceAutoSuccessSource(cards: {
  runnerInstalledCardIds: () => CardInstanceId[];
  definitionFor: (cardId: CardInstanceId) => CardDefinition;
}) {
  for (const cardId of cards.runnerInstalledCardIds().slice().sort()) {
    const definition = cards.definitionFor(cardId);
    if (
      cardImplementationForDefinitionId(definition.id)?.runnerUtilityLongtail
        ?.kind === "trace_attempts_auto_success_add_tag"
    ) {
      return { cardId, definitionId: definition.id, additionalTagAmount: 1 };
    }
  }
  return undefined;
}
