import { type AiDecisionInput } from "@netgrid/shared";

type VisibleRootCard =
  AiDecisionInput["playerView"]["servers"][number]["root"][number];

export function visibleRootIsKnownAgenda(
  card: VisibleRootCard,
  definitionType: (definitionId: string) => string | undefined,
): boolean {
  const definitionId = card.definitionId;
  return (
    card.known &&
    (card.type === "agenda" ||
      (definitionId !== undefined && definitionType(definitionId) === "agenda"))
  );
}
