import {
  DEMO_CARDS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
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
  let drawnCount = 0;
  for (let index = 0; index < amount; index += 1) {
    if (drawCorpCardRaw(state)) drawnCount += 1;
    if (state.winner) return;
  }
  if (drawnCount > 0) applyStrategicPlanningGroupDrawReplacement(state);
}

function applyStrategicPlanningGroupDrawReplacement(state: GameState): void {
  for (const sourceId of strategicPlanningGroupSourceIds(state)) {
    const sourceDefinitionId = mustInstance(
      state.cardInstances,
      sourceId,
    ).definitionId as CardDefinitionId;
    const implementation =
      cardImplementationForDefinitionId(sourceDefinitionId)?.corpUtility;
    if (implementation?.kind !== "corp_draw_extra_then_bottom_one") continue;
    for (let index = 0; index < implementation.extraDraw; index += 1) {
      const extraCardId = drawCorpCardRaw(state);
      if (!extraCardId || state.winner) return;
      bottomCorpHqCard(state, extraCardId);
    }
  }
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
        cardImplementationForDefinitionId(instance.definitionId as CardDefinitionId)
          ?.corpUtility?.kind === "corp_draw_extra_then_bottom_one" &&
        DEMO_CARDS_BY_ID[instance.definitionId]?.side === "corp"
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

export function randomHqAccess(
  state: GameState,
): CardInstanceId | undefined {
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
