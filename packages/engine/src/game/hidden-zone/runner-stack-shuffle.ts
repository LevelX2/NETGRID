import type { CardInstance, CardInstanceId } from "@netgrid/shared";

export type RunnerStackZoneRefreshResult = {
  updatedCardIds: CardInstanceId[];
};

export type RunnerStackShuffleResult = RunnerStackZoneRefreshResult & {
  shuffledStack: CardInstanceId[];
  shufflePerformed: true;
};

export function refreshRunnerStackCardZones(input: {
  stack: readonly CardInstanceId[];
  cardInstances: Record<CardInstanceId, CardInstance>;
}): RunnerStackZoneRefreshResult {
  const updatedCardIds: CardInstanceId[] = [];
  for (const cardId of input.stack) {
    const instance = input.cardInstances[cardId];
    if (!instance) throw new Error(`CardInstance fehlt: ${cardId}`);
    input.cardInstances[cardId] = {
      ...instance,
      zone: { side: "runner", zone: "stack" },
    };
    updatedCardIds.push(cardId);
  }
  return { updatedCardIds };
}

export function shuffleRunnerStackAndRefreshZones(input: {
  stack: readonly CardInstanceId[];
  cardInstances: Record<CardInstanceId, CardInstance>;
  shuffle: (stack: CardInstanceId[]) => CardInstanceId[];
}): RunnerStackShuffleResult {
  const shuffledStack = input.shuffle([...input.stack]);
  assertExactStackPermutation(input.stack, shuffledStack);
  const refresh = refreshRunnerStackCardZones({
    stack: shuffledStack,
    cardInstances: input.cardInstances,
  });
  return {
    shuffledStack,
    updatedCardIds: refresh.updatedCardIds,
    shufflePerformed: true,
  };
}

function assertExactStackPermutation(
  original: readonly CardInstanceId[],
  shuffled: readonly CardInstanceId[],
): void {
  if (
    shuffled.length !== original.length ||
    new Set(original).size !== original.length ||
    new Set(shuffled).size !== shuffled.length
  )
    throw new Error(
      "Runner-Stack-Shuffle muss jede Karte genau einmal liefern.",
    );
  const expected = new Set(original);
  if (shuffled.some((cardId) => !expected.has(cardId)))
    throw new Error("Runner-Stack-Shuffle enthaelt eine fremde Karte.");
}
