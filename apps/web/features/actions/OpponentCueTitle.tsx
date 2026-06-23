import type { OpponentActionCue } from "../../app/action-cues";
import type { ChronicleItem } from "../../app/chronicle";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import { ChronicleCardTrigger } from "../chronicle/ChronicleCardTrigger";
import type { CardDisplayMode } from "../settings/settings-model";

type OpponentCueTitleCard = {
  catalogCardId: string;
  title: string;
  type: string;
  text: string;
  numeric: Record<string, number | null | undefined>;
};

export function OpponentCueTitle({
  cue,
  card,
  previewCard,
  displayMode,
  onFocusCard
}: {
  cue: OpponentActionCue;
  card: OpponentCueTitleCard | null;
  previewCard: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  if (!cue.cardTitle) return <>{cue.title}</>;
  const index = cue.title.indexOf(cue.cardTitle);
  if (index < 0) return <>{cue.title}</>;
  const item: ChronicleItem = {
    id: cue.eventId,
    category: cue.actionType === "continue_run" ? "run" : "card",
    importance: cue.importance,
    visibility: cue.visibility,
    ...(cue.actor ? { actor: cue.actor } : {}),
    title: cue.title,
    ...(cue.description ? { description: cue.description } : {}),
    chips: [],
    ...(cue.cardDefinitionId ? { cardDefinitionId: cue.cardDefinitionId } : {}),
    cardTitle: cue.cardTitle,
    cardDetailLines: [],
    groupLabel: cue.actorLabel
  };
  return (
    <>
      {cue.title.slice(0, index)}
      <ChronicleCardTrigger
        className={`chronicleCardName ${previewCard ? "hasDetail" : ""}`}
        card={card}
        item={item}
        displayMode={displayMode}
        disabled={!previewCard}
        title={cue.cardTitle}
        onClick={() => previewCard && onFocusCard(previewCard)}
      >
        {cue.cardTitle}
      </ChronicleCardTrigger>
      {cue.title.slice(index + cue.cardTitle.length)}
    </>
  );
}
