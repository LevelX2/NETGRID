import { type AiDecisionInput } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";

type VisibleRootCard =
  AiDecisionInput["playerView"]["servers"][number]["root"][number];

export function visibleRootIsKnownAgenda(card: VisibleRootCard): boolean {
  if (!card.known) return false;
  const canonicalType = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.type
    : undefined;
  if (
    card.type !== undefined &&
    canonicalType !== undefined &&
    (card.type === "agenda") !== (canonicalType === "agenda")
  )
    throw new Error("visible_root_agenda_type_conflicts_with_definition");
  return (card.type ?? canonicalType) === "agenda";
}
