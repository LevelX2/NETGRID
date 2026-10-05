import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";

/** The same scored-source authority feeds actual draws and planning facts. */
export function corpMandatoryAgendaDrawSources(
  state: GameState,
  definitionFor: (state: GameState, id: CardInstanceId) => CardDefinition,
  implementationFor: (
    definition: CardDefinition,
  ) => CardScoredAgendaImplementation | undefined,
) {
  return state.corp.scoreArea
    .slice()
    .sort()
    .flatMap((cardId) => {
      const definition = definitionFor(state, cardId);
      const implementation = implementationFor(definition);
      return implementation?.kind === "corp_start_turn_mandatory_draw"
        ? [
            {
              cardId,
              definitionId: definition.id,
              count: implementation.drawCount,
            },
          ]
        : [];
    });
}
