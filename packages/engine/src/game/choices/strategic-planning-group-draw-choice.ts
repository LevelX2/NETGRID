import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { mustInstance } from "../state/card-server-lookup";

export function applyCorpDrawReplacementAfterDraw(
  state: GameState,
  drawnCardIds: CardInstanceId[],
  drawAdditionalCorpCard: (state: GameState) => CardInstanceId | undefined,
): void {
  const sourceId = strategicPlanningGroupSourceIds(state)[0];
  if (!sourceId) return;
  const sourceDefinitionId = mustInstance(state.cardInstances, sourceId)
    .definitionId as CardDefinitionId;
  const implementation =
    cardImplementationForDefinitionId(sourceDefinitionId)?.corpUtility;
  if (implementation?.kind !== "corp_draw_extra_then_bottom_one") return;
  for (let index = 0; index < implementation.extraDraw; index += 1) {
    const extraCardId = drawAdditionalCorpCard(state);
    if (!extraCardId || state.winner) return;
    drawnCardIds.push(extraCardId);
  }
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `classic_spg_draw_${state.stateVersion + 1}`,
    side: "corp",
    source: `card_implementation.strategic_planning_group_draw:${sourceId}:${drawnCardIds.join(",")}:${
      state.stateVersion + 1
    }`,
    sourceCardInstanceId: sourceId,
    sourceCardDefinitionId: sourceDefinitionId,
    prompt:
      "Strategic Planning Group: Welche gezogene Karte soll unter R&D gelegt werden?",
    kind: "select_cards",
    options: drawnCardIds.map((cardId) => ({
      id: `bottom_${cardId}`,
      label: `${CARD_DEFINITIONS_BY_ID[mustInstance(state.cardInstances, cardId).definitionId]?.title ?? "Gezogene Karte"} unter R&D legen`,
      publicLabel: "Gezogene Karte unter R&D legen",
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function resolveStrategicPlanningGroupDrawChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith(
      "card_implementation.strategic_planning_group_draw:",
    )
  )
    throw new Error("Es ist keine Strategic-Planning-Group-Choice offen.");
  if (choice.side !== "corp" || legalAction.side !== "corp")
    throw new Error("Nur die Corporation darf diese Karte auswählen.");
  const [, sourceId = "", drawnList = ""] = choice.source.split(":");
  if (
    choice.sourceCardInstanceId !== sourceId ||
    !strategicPlanningGroupSourceIds(state).includes(sourceId as CardInstanceId)
  )
    throw new Error("Strategic Planning Group ist nicht mehr aktiv.");
  const selectedOptionId = selectedChoiceOptionIds(
    playerAction.selectedChoices,
  )[0];
  const option = choice.options.find(
    (candidate) => candidate.id === selectedOptionId,
  );
  const cardId = option?.value;
  const drawnCardIds = new Set(drawnList.split(",").filter(Boolean));
  if (typeof cardId !== "string" || !drawnCardIds.has(cardId))
    throw new Error("Die gewählte Karte wurde nicht in diesem Draw gezogen.");
  if (!state.corp.hq.includes(cardId as CardInstanceId))
    throw new Error("Die gewählte Karte ist nicht mehr in HQ.");
  bottomCorpHqCard(state, cardId as CardInstanceId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "hidden_info_barrier",
    drawReplacementSourceTitle: "Strategic Planning Group",
    ...(choice.sourceCardDefinitionId
      ? { sourceDefinitionId: choice.sourceCardDefinitionId }
      : {}),
    strategicPlanningGroupChoiceResolved: true,
    strategicPlanningGroupDrawnCardCount: drawnCardIds.size,
    bottomedCardCount: 1,
    destinationZone: "rd_bottom",
  };
}

function selectedChoiceOptionIds(
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

function strategicPlanningGroupSourceIds(state: GameState): CardInstanceId[] {
  const servers = state.corp.servers ?? [];
  return servers
    .flatMap((server) => server.root)
    .filter((cardId): cardId is CardInstanceId => {
      const instance = state.cardInstances[cardId];
      if (
        !instance ||
        instance.controller !== "corp" ||
        instance.rezzed !== true ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverRoot"
      )
        return false;
      return (
        cardImplementationForDefinitionId(
          instance.definitionId as CardDefinitionId,
        )?.corpUtility?.kind === "corp_draw_extra_then_bottom_one" &&
        CARD_DEFINITIONS_BY_ID[instance.definitionId]?.side === "corp"
      );
    })
    .sort();
}

function bottomCorpHqCard(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((candidate) => candidate !== cardId);
  state.corp.rd.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "rd" },
  };
}
