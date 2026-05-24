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
