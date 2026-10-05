import type { CardInstanceId, GameState } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { definitionFor } from "../state/card-server-lookup";
import { virusCounterDrawsAtCorpStart } from "../turn/corp-mandatory-virus-draw-count";
import { agendaPoints, agendaPointsForScoredCard } from "../win-conditions";
import { corpMandatoryAgendaDrawSources } from "./mandatory-agenda-draw-sources";

/** Mandatory base draws under the current position, excluding optional draws.
 * Other draw replacements can add consumption; this is a required lower bound,
 * never a certificate that a future opponent turn or extra draw is harmless.
 */
export function corpScoreMandatoryDrawHorizonPayload(
  state: GameState,
  cardId: CardInstanceId,
) {
  const target = cardImplementationForDefinitionId(
    definitionFor(state, cardId).id,
  )?.scoredAgenda;
  if (target?.kind !== "corp_start_turn_mandatory_draw") return undefined;
  const current =
    1 +
    corpMandatoryAgendaDrawSources(
      state,
      definitionFor,
      (definition) =>
        cardImplementationForDefinitionId(definition.id)?.scoredAgenda,
    ).reduce((sum, source) => sum + source.count, 0) +
    virusCounterDrawsAtCorpStart(state);
  return {
    corpScoreMandatoryDrawQuoteSchemaVersion:
      "corp-score-mandatory-draw-horizon-v1",
    corpScoreMandatoryDrawQuoteStateVersion: state.stateVersion,
    corpScoreMandatoryDrawCurrentBaseCount: current,
    corpScoreMandatoryDrawAddedCount: target.drawCount,
    corpScoreMandatoryDrawAfterBaseCount: current + target.drawCount,
    corpScoreAgendaPointsAfter:
      agendaPoints(state, "corp") + agendaPointsForScoredCard(state, cardId),
  };
}
