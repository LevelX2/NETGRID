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
  drawAdditionalCorpCard: (state: GameState) => CardInstanceId | undefined,
): boolean {
  const transaction = state.pendingCorpDraw;
  if (!transaction)
    throw new Error(
      "Strategic Planning Group braucht einen Corp-Draw-Vorgang.",
    );
  const sourceId = strategicPlanningGroupSourceIds(state)[0];
  if (!sourceId) return false;
  const sourceDefinitionId = mustInstance(state.cardInstances, sourceId)
    .definitionId as CardDefinitionId;
  const implementation =
    cardImplementationForDefinitionId(sourceDefinitionId)?.corpUtility;
  if (implementation?.kind !== "corp_draw_extra_then_bottom_one") return false;
  for (let index = 0; index < implementation.extraDraw; index += 1) {
    const extraCardId = drawAdditionalCorpCard(state);
    if (!extraCardId || state.winner) return false;
    transaction.drawnCardIds.push(extraCardId);
    transaction.replacementDrawCount += 1;
  }
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  transaction.replacementSourceCardInstanceId = sourceId;
  transaction.replacementSourceDefinitionId = sourceDefinitionId;
  state.pendingChoice = {
    choiceId: `classic_spg_draw_${state.stateVersion + 1}`,
    side: "corp",
    source: `card_implementation.strategic_planning_group_draw:${sourceId}:${transaction.transactionId}`,
    sourceCardInstanceId: sourceId,
    sourceCardDefinitionId: sourceDefinitionId,
    prompt:
      "Strategic Planning Group: Welche gezogene Karte soll unter R&D gelegt werden?",
    kind: "select_cards",
    options: transaction.drawnCardIds.map((cardId) => ({
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
  return true;
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
  const transaction = state.pendingCorpDraw;
  if (!transaction) throw new Error("Der Strategic-Planning-Group-Draw fehlt.");
  const [, sourceId = "", transactionId = ""] = choice.source.split(":");
  if (
    transaction.transactionId !== transactionId ||
    choice.sourceCardInstanceId !== sourceId ||
    transaction.replacementSourceCardInstanceId !== sourceId ||
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
  const drawnCardIds = new Set(transaction.drawnCardIds);
  if (typeof cardId !== "string" || !drawnCardIds.has(cardId))
    throw new Error("Die gewählte Karte wurde nicht in diesem Draw gezogen.");
  if (!(state.specialZones?.setAside ?? []).includes(cardId as CardInstanceId))
    throw new Error("Die gewählte Karte ist nicht mehr beiseitegelegt.");
  completeStrategicPlanningGroupDraw(state, cardId as CardInstanceId);
  delete state.pendingChoice;
  delete state.pendingCorpDraw;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "hidden_info_barrier",
    drawReplacementSourceTitle: "Strategic Planning Group",
    ...(choice.sourceCardDefinitionId
      ? { sourceDefinitionId: choice.sourceCardDefinitionId }
      : {}),
    strategicPlanningGroupChoiceResolved: true,
    strategicPlanningGroupBaseDrawCount: transaction.baseDrawCount,
    strategicPlanningGroupAdditionalDrawCount: transaction.replacementDrawCount,
    strategicPlanningGroupDrawnCardCount: transaction.drawnCardIds.length,
    strategicPlanningGroupNetDrawCount: transaction.drawnCardIds.length - 1,
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

function completeStrategicPlanningGroupDraw(
  state: GameState,
  bottomedCardId: CardInstanceId,
): void {
  const transaction = state.pendingCorpDraw;
  if (!transaction) throw new Error("Der Strategic-Planning-Group-Draw fehlt.");
  const drawnSet = new Set(transaction.drawnCardIds);
  if (drawnSet.size !== transaction.drawnCardIds.length)
    throw new Error("Der Strategic-Planning-Group-Draw enthält Duplikate.");
  const setAside = state.specialZones?.setAside ?? [];
  if (transaction.drawnCardIds.some((cardId) => !setAside.includes(cardId)))
    throw new Error("Nicht alle gezogenen Karten sind beiseitegelegt.");
  state.specialZones!.setAside = setAside.filter(
    (cardId) => !drawnSet.has(cardId),
  );
  for (const cardId of transaction.drawnCardIds) {
    if (cardId === bottomedCardId) {
      state.corp.rd.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "rd" },
      };
      continue;
    }
    state.corp.hq.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "hq" },
    };
  }
}
