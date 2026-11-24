import {
  isRandomPurpose,
  isRandomHistory,
  type AiTurnPlanRandomDrawRecord,
  type RandomPurpose,
  type RandomDrawRecord,
  type RandomDomain,
} from "@netgrid/shared";
import {
  type CardInstanceId,
  type CorpDrawContinuation,
  type GameState,
} from "@netgrid/shared";
import { applyCorpDrawReplacementAfterDraw } from "../choices/strategic-planning-group-draw-choice";
import { mustInstance } from "./card-server-lookup";

// The engine owns the cloned history while an action resolves. The scope is
// discarded before the result goes back to callers that can mutate GameState.
const actionRandomPrefixes = new WeakMap<RandomDrawRecord[], number>();

export function withActionRandomHistory<T>(
  state: GameState,
  perform: () => T,
): T {
  const records = state.randomDrawRecords;
  actionRandomPrefixes.set(records, -1);
  try {
    return perform();
  } finally {
    actionRandomPrefixes.delete(records);
  }
}

export function mustArrayValue<T>(
  values: T[],
  index: number,
  message: string,
): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function setAsideCorpCardFromRd(state: GameState): CardInstanceId | undefined {
  const cardId = state.corp.rd.shift();
  if (!cardId) {
    state.winner = "runner";
    state.gameEndReason = "corp_deck_empty";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    return undefined;
  }
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: false,
    rezzed: false,
    zone: {
      side: "special",
      zone: "set_aside",
      visibility: "side_private",
      visibilitySide: "corp",
      returnZone: { side: "corp", zone: "hq" },
    },
  };
  return cardId;
}

export function drawCorpCard(state: GameState): void {
  drawCorpCards(state, 1);
}

export function drawCorpCards(
  state: GameState,
  amount: number,
  continuation?: CorpDrawContinuation,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error(
      "Die Corp-Draw-Menge muss eine nichtnegative Ganzzahl sein.",
    );
  if (state.pendingCorpDraw)
    throw new Error("Es ist bereits ein Corp-Draw-Vorgang offen.");
  const drawnCardIds: CardInstanceId[] = [];
  for (let index = 0; index < amount; index += 1) {
    const cardId = setAsideCorpCardFromRd(state);
    if (cardId) drawnCardIds.push(cardId);
    if (state.winner) {
      addSetAsideCorpCardsToHq(state, drawnCardIds);
      return;
    }
  }
  if (drawnCardIds.length === 0) return;
  state.pendingCorpDraw = {
    transactionId: state.stateVersion + 1,
    baseDrawCount: drawnCardIds.length,
    replacementDrawCount: 0,
    drawnCardIds,
    ...(continuation ? { continuation } : {}),
  };
  const choiceOpened = applyCorpDrawReplacementAfterDraw(
    state,
    setAsideCorpCardFromRd,
  );
  if (!choiceOpened) completeCorpDrawWithoutReplacementChoice(state);
}

export function completeCorpDrawWithoutReplacementChoice(
  state: GameState,
): void {
  const transaction = state.pendingCorpDraw;
  if (!transaction) return;
  addSetAsideCorpCardsToHq(state, transaction.drawnCardIds);
  delete state.pendingCorpDraw;
}

export function addSetAsideCorpCardsToHq(
  state: GameState,
  cardIds: CardInstanceId[],
): void {
  const moved = new Set(cardIds);
  if (moved.size !== cardIds.length)
    throw new Error("Der Corp-Draw enthält eine Karte mehrfach.");
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  for (const cardId of cardIds) {
    if (!state.specialZones.setAside.includes(cardId))
      throw new Error("Eine gezogene Corp-Karte ist nicht beiseitegelegt.");
  }
  state.specialZones.setAside = state.specialZones.setAside.filter(
    (cardId) => !moved.has(cardId),
  );
  for (const cardId of cardIds) {
    state.corp.hq.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "hq" },
    };
  }
}

export function randomHqAccess(state: GameState): CardInstanceId | undefined {
  if (state.corp.hq.length === 0) return undefined;
  const value = nextRandom(state, [9]);
  const index = Math.floor(value * state.corp.hq.length);
  return state.corp.hq[index];
}

export function nextRandom(state: GameState, purpose: RandomPurpose): number {
  const record = engineRandomDraw(state, purpose);
  appendRandomRecord(state.randomDrawRecords, record);
  state.randomCounter += 1;
  return record.value;
}

function engineRandomDraw(state: GameState, purpose: RandomPurpose): RandomDrawRecord {
  assertRandomCursor(state.randomCounter, state.randomDrawRecords);
  assertRandomPurpose(purpose);
  return createRandomDraw(
    state.seed,
    purpose,
    state.randomCounter,
    "engine",
  );
}

// The ordinary action application owns the full mutable state copy. A selection
// prepares only the private RNG cursor before choosing that action.
export function prepareEngineSelectionDraw(
  state: GameState,
  purpose: RandomPurpose,
): { state: GameState; record: RandomDrawRecord } {
  const record = engineRandomDraw(state, purpose);
  return {
    state: {
      ...state,
      randomCounter: record.counter + 1,
      randomDrawRecords: [...state.randomDrawRecords, record],
    },
    record,
  };
}

export function prepareAiSelectionDraw(
  state: GameState,
  purpose: RandomPurpose,
): { state: GameState; record: AiTurnPlanRandomDrawRecord } | undefined {
  const counter = state.aiTurnPlanRandomCounter;
  const history = state.aiTurnPlanRandomDrawRecords;
  if (counter === undefined || !history || !isRandomHistory(counter, history, "ai_turn_plan_selection"))
    return undefined;
  const record: AiTurnPlanRandomDrawRecord = {
    ...createRandomDraw(state.seed, purpose, counter, "ai_turn_plan_selection"),
    domain: "ai_turn_plan_selection",
  };
  return {
    state: {
      ...state,
      aiTurnPlanRandomCounter: counter + 1,
      aiTurnPlanRandomDrawRecords: [...history, record],
    },
    record,
  };
}

export function rollDeterministicDie(
  state: GameState,
  purpose: RandomPurpose,
): number {
  const value = nextRandom(state, purpose);
  return Math.floor(value * 6) + 1;
}

export function createRandomDraw(
  seed: string,
  purpose: RandomPurpose,
  counter: number,
  domain: RandomDomain,
): RandomDrawRecord {
  if (!isRandomPurpose(purpose, domain))
    throw new Error("Der Zufallszweck passt nicht zur RNG-Domäne.");
  if (
    !Number.isSafeInteger(counter) ||
    counter < 0 ||
    counter >= Number.MAX_SAFE_INTEGER
  )
    throw new Error("Der Zufallszähler ist ungültig.");
  const seedContext =
    domain === "engine"
      ? [seed, purpose, counter]
      : [seed, 1, purpose, counter];
  return {
    counter,
    purpose: structuredClone(purpose),
    value: deterministicNumber(JSON.stringify(seedContext)),
  };
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
  purpose: RandomPurpose,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): CardInstanceId[] {
  assertRandomCursor(random.counter, random.records);
  assertRandomPurpose(purpose);
  const shuffled = ids.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const record = createRandomDraw(seed, purpose, random.counter, "engine");
    appendRandomRecord(random.records, record);
    random.counter += 1;
    const swapIndex = Math.floor(record.value * (index + 1));
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
  purpose: RandomPurpose,
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
  purpose: RandomPurpose,
  amount: number,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): void {
  assertRandomCursor(random.counter, random.records);
  assertRandomPurpose(purpose);
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Die Anzahl der Zufallsmarker ist ungültig.");
  for (let index = 0; index < amount; index += 1) {
    const record = createRandomDraw(seed, purpose, random.counter, "engine");
    appendRandomRecord(random.records, record);
    random.counter += 1;
  }
}

function assertRandomPurpose(purpose: RandomPurpose): void {
  if (!isRandomPurpose(purpose, "engine"))
    throw new Error("Der Zufallszweck fehlt.");
}

function assertRandomCursor(
  counter: number,
  records: GameState["randomDrawRecords"],
): void {
  if (
    !Number.isSafeInteger(counter) ||
    counter < 0 ||
    counter >= Number.MAX_SAFE_INTEGER ||
    !Array.isArray(records) ||
    records.length !== counter
  )
    throw new Error("Der Zufallszustand ist nicht replay-konsistent.");
  if (actionRandomPrefixes.get(records) === counter) return;
  if (!isRandomHistory(counter, records, "engine"))
    throw new Error("Der Zufallsverlauf ist nicht replay-konsistent.");
  if (actionRandomPrefixes.has(records))
    actionRandomPrefixes.set(records, counter);
}

function appendRandomRecord(
  records: RandomDrawRecord[],
  record: RandomDrawRecord,
): void {
  records.push(record);
  if (actionRandomPrefixes.has(records))
    actionRandomPrefixes.set(records, records.length);
}

export function recordStateRandomMarkers(
  state: GameState,
  purpose: RandomPurpose,
  amount: number,
): void {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  recordRandomMarkers(state.seed, purpose, amount, random);
  state.randomCounter = random.counter;
}
