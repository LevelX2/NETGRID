import type { PlayerView } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { corpStartVirusDrawCount } from "../turn/corp-mandatory-virus-draw-count";

/** Mandatory cards on the next Corp turn if the public sources stay as
 * observed. Draw replacement and optional draws are separate effects. */
export function visibleCorpMandatoryDrawCount(
  view: PlayerView,
): number | undefined {
  if (
    view.side !== "corp" ||
    !view.own.identity.known ||
    view.own.scoreArea.some((card) => !card.known || !card.definitionId)
  )
    return undefined;
  let cards = 1;
  for (const card of view.own.scoreArea) {
    const scored = cardImplementationForDefinitionId(
      card.definitionId!,
    )?.scoredAgenda;
    if (scored?.kind === "corp_start_turn_mandatory_draw")
      cards += scored.drawCount;
  }
  cards += corpStartVirusDrawCount(
    (counterType) =>
      view.own.identity.counterDisplays?.find(
        (counter) =>
          counter.displayKind === "virus" &&
          counter.id === `runner_virus_corp_${counterType}` &&
          counter.counterType === counterType,
      )?.amount ?? 0,
  );
  return Number.isSafeInteger(cards) && cards > 0 ? cards : undefined;
}
