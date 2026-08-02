import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { mustInstance } from "./card-server-lookup";

export function mustArrayValue<T>(
  values: T[],
  index: number,
  message: string,
): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function drawCorpCardRaw(state: GameState): CardInstanceId | undefined {
  const cardId = state.corp.rd.shift();
  if (!cardId) {
    state.winner = "runner";
    state.gameEndReason = "corp_deck_empty";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    return undefined;
  }
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "corp", zone: "hq" },
  };
  return cardId;
}

export function drawCorpCard(state: GameState): void {
  drawCorpCards(state, 1);
}

export function drawCorpCards(state: GameState, amount: number): void {
  const drawnCardIds: CardInstanceId[] = [];
  for (let index = 0; index < amount; index += 1) {
    const cardId = drawCorpCardRaw(state);
    if (cardId) drawnCardIds.push(cardId);
    if (state.winner) return;
  }
  if (drawnCardIds.length > 0)
    startStrategicPlanningGroupDrawChoice(state, drawnCardIds);
}

function startStrategicPlanningGroupDrawChoice(
  state: GameState,
  drawnCardIds: CardInstanceId[],
): void {
  const sourceId = strategicPlanningGroupSourceIds(state)[0];
  if (!sourceId) return;
  const sourceDefinitionId = mustInstance(state.cardInstances, sourceId)
    .definitionId as CardDefinitionId;
  const implementation =
    cardImplementationForDefinitionId(sourceDefinitionId)?.corpUtility;
  if (implementation?.kind !== "corp_draw_extra_then_bottom_one") return;
  for (let index = 0; index < implementation.extraDraw; index += 1) {
    const extraCardId = drawCorpCardRaw(state);
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

export function randomHqAccess(state: GameState): CardInstanceId | undefined {
  if (state.corp.hq.length === 0) return undefined;
  const value = nextRandom(state, "hq_random_access");
  const index = Math.floor(value * state.corp.hq.length);
  return state.corp.hq[index];
}

export function nextRandom(state: GameState, purpose: string): number {
  const value = deterministicNumber(
    `${state.seed}:${purpose}:${state.randomCounter}`,
  );
  state.randomDrawRecords.push({
    counter: state.randomCounter,
    purpose,
    value,
  });
  state.randomCounter += 1;
  return value;
}

export function rollDeterministicDie(
  state: GameState,
  purpose: string,
): number {
  const scopedPurpose = /^v\d+\.die\./.test(purpose)
    ? purpose
    : `v190.die.${purpose}`;
  const value = nextRandom(state, scopedPurpose);
  return Math.floor(value * 6) + 1;
}

export function deterministicNumber(input: string): number {
  let hashA = 0xdeadbeef ^ input.length;
  let hashB = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 0x9e3779b1);
    hashB = Math.imul(hashB ^ code, 0x5f356495);
  }
  hashA =
    Math.imul(hashA ^ (hashA >>> 16), 0x85ebca6b) ^
    Math.imul(hashB ^ (hashB >>> 13), 0xc2b2ae35);
  hashB =
    Math.imul(hashB ^ (hashB >>> 16), 0x85ebca6b) ^
    Math.imul(hashA ^ (hashA >>> 13), 0xc2b2ae35);
  return (0x100000000 * (hashB & 0x1fffff) + (hashA >>> 0)) / 0x20000000000000;
}

export function shuffleIds(
  ids: CardInstanceId[],
  seed: string,
  purpose: string,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): CardInstanceId[] {
  const shuffled = ids.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
    const swapIndex = Math.floor(value * (index + 1));
    const current = mustArrayValue(shuffled, index, "Shuffle index missing.");
    shuffled[index] = mustArrayValue(
      shuffled,
      swapIndex,
      "Shuffle swap missing.",
    );
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

export function shuffleStateIds(
  state: GameState,
  ids: CardInstanceId[],
  purpose: string,
): CardInstanceId[] {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  const shuffled = shuffleIds(ids, state.seed, purpose, random);
  state.randomCounter = random.counter;
  return shuffled;
}

export function recordRandomMarkers(
  seed: string,
  purpose: string,
  amount: number,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): void {
  for (let index = 0; index < amount; index += 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
  }
}

export function recordStateRandomMarkers(
  state: GameState,
  purpose: string,
  amount: number,
): void {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  recordRandomMarkers(state.seed, purpose, amount, random);
  state.randomCounter = random.counter;
}
