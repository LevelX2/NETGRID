import {
  CARD_VIRUS_COUNTER_TYPES,
  PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES,
  PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION,
  type CounterType,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PublicCounterMutation,
  type PublicCounterMutationScope,
  type PublicCounterThresholdVisibilityTransition,
  type PublicInstalledCorpCardIdentity,
  type ServerId,
} from "@netgrid/shared";
import { counterThresholdDeactivated } from "./counter-thresholds";

export type PublicCounterMutationInput = {
  operation: PublicCounterMutation["operation"];
  counterType: CounterType;
  scope: PublicCounterMutationScope;
  before: number;
  after: number;
};

export function publicCounterMutation(
  input: PublicCounterMutationInput,
): PublicCounterMutation {
  const before = counterAmount(input.before, "before");
  const after = counterAmount(input.after, "after");
  const amount = Math.abs(after - before);
  assertOperationDirection(input.operation, before, after);
  return {
    schemaVersion: PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION,
    operation: input.operation,
    counterType: input.counterType,
    scope: input.scope,
    before,
    amount,
    after,
  };
}

export function appendPublicCounterMutation(
  legalAction: LegalAction,
  mutation: PublicCounterMutation,
): void {
  legalAction.counterMutations = canonicalPublicCounterMutations([
    ...(legalAction.counterMutations ?? []),
    mutation,
  ]);
}

export function appendCounterThresholdVisibilityEnded(
  legalAction: LegalAction,
  input: Omit<PublicCounterThresholdVisibilityTransition, "kind" | "cards"> & {
    cards: readonly PublicInstalledCorpCardIdentity[];
  },
): void {
  if (
    !counterThresholdDeactivated(
      input.before,
      input.after,
      input.activeAtOrAbove,
    )
  )
    throw new Error(
      "Sichtbarkeitsende benötigt einen aktiven-zu-inaktiven Counterschwellen-Uebergang.",
    );
  const cards = [...input.cards].sort((left, right) =>
    `${left.serverId}:${left.area}:${left.positionKey}:${left.definitionId}`.localeCompare(
      `${right.serverId}:${right.area}:${right.positionKey}:${right.definitionId}`,
    ),
  );
  const transition: PublicCounterThresholdVisibilityTransition = {
    kind: "counter_threshold_identity_visibility_ended",
    counterType: input.counterType,
    scope: input.scope,
    activeAtOrAbove: input.activeAtOrAbove,
    before: input.before,
    after: input.after,
    cards,
  };
  legalAction.publicVisibilityTransitions = [
    ...(legalAction.publicVisibilityTransitions ?? []),
    transition,
  ].sort((left, right) =>
    `${left.scope.serverId}:${left.counterType}:${left.activeAtOrAbove}`.localeCompare(
      `${right.scope.serverId}:${right.counterType}:${right.activeAtOrAbove}`,
    ),
  );
}

export function publicCounterMutationsForEvent(
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
): PublicCounterMutation[] {
  return canonicalPublicCounterMutations([
    ...(legalAction.counterMutations ?? []),
    ...legacyActionCounterMutations(previousState, state, legalAction),
    ...purgeCounterMutations(previousState, state, legalAction),
    ...(legalAction.resolvedEffects ?? []).flatMap((effect) => {
      if (effect.counterMutation) return [effect.counterMutation];
      if (effect.visibility !== "public") return [];
      const scope = effect.sourceCardInstanceId
        ? publicScopeForCard(previousState, state, effect.sourceCardInstanceId)
        : effect.side
          ? { kind: "side" as const, side: effect.side }
          : undefined;
      return legacyCounterMutation(
        effect.counterType,
        effect.addedCounterAmount,
        effect.removedCounterAmount,
        effect.remainingCounters,
        scope,
      );
    }),
  ]);
}

function purgeCounterMutations(
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
): PublicCounterMutation[] {
  if (legalAction.type === "purge_virus_counters")
    return standardVirusPurgeMutations(previousState, state);
  if (
    legalAction.type === "purge_runner_virus_counters" ||
    positiveInteger(legalAction.payload?.runnerVirusCountersPurged) !==
      undefined
  )
    return purgeablePoolMutations(previousState, state);
  return [];
}

function standardVirusPurgeMutations(
  previousState: GameState,
  state: GameState,
): PublicCounterMutation[] {
  const mutations: PublicCounterMutation[] = [];
  for (const cardId of Object.keys(previousState.cardInstances).sort()) {
    const instance = previousState.cardInstances[cardId as CardInstanceId];
    if (!instance || instance.controller !== "runner") continue;
    for (const counterType of CARD_VIRUS_COUNTER_TYPES) {
      const before = instance.counters?.[counterType] ?? 0;
      const after =
        state.cardInstances[cardId as CardInstanceId]?.counters?.[
          counterType
        ] ?? 0;
      if (before === after) continue;
      const scope = publicScopeForCard(
        previousState,
        state,
        cardId as CardInstanceId,
      );
      if (!scope) continue;
      mutations.push(
        publicCounterMutation({
          operation: "purge",
          counterType,
          scope,
          before,
          after,
        }),
      );
    }
  }
  const serverIds = new Set([
    ...Object.keys(previousState.poxCountersByServer ?? {}),
    ...Object.keys(previousState.serverAgendaCostCountersByServer ?? {}),
    ...Object.keys(state.poxCountersByServer ?? {}),
    ...Object.keys(state.serverAgendaCostCountersByServer ?? {}),
  ]);
  for (const serverId of [...serverIds].sort()) {
    if (serverId === "new_remote") continue;
    const before = serverVirusPoolAmount(previousState, serverId);
    const after = serverVirusPoolAmount(state, serverId);
    if (before === after) continue;
    mutations.push(
      publicCounterMutation({
        operation: "purge",
        counterType: "virus",
        scope: {
          kind: "server",
          serverId: serverId as Exclude<ServerId, "new_remote">,
        },
        before,
        after,
      }),
    );
  }
  return mutations;
}

function serverVirusPoolAmount(state: GameState, serverId: string): number {
  return (
    nonNegativeInteger(
      state.poxCountersByServer?.[serverId as Exclude<ServerId, "new_remote">],
    ) +
    nonNegativeInteger(
      state.serverAgendaCostCountersByServer?.[
        serverId as Exclude<ServerId, "new_remote">
      ],
    )
  );
}

function purgeablePoolMutations(
  previousState: GameState,
  state: GameState,
): PublicCounterMutation[] {
  const before = aggregatePurgeablePools(previousState);
  const after = aggregatePurgeablePools(state);
  const keys = new Set([...before.keys(), ...after.keys()]);
  const mutations: PublicCounterMutation[] = [];
  for (const key of [...keys].sort()) {
    const beforeEntry = before.get(key);
    const afterEntry = after.get(key);
    const reference = beforeEntry ?? afterEntry;
    if (!reference || beforeEntry?.amount === afterEntry?.amount) continue;
    mutations.push(
      publicCounterMutation({
        operation: "purge",
        counterType: reference.counterType,
        scope: reference.scope,
        before: beforeEntry?.amount ?? 0,
        after: afterEntry?.amount ?? 0,
      }),
    );
  }
  return mutations;
}

type AggregatedPurgeablePool = {
  counterType: CounterType;
  scope: PublicCounterMutationScope;
  amount: number;
};

function aggregatePurgeablePools(
  state: GameState,
): Map<string, AggregatedPurgeablePool> {
  const result = new Map<string, AggregatedPurgeablePool>();
  const add = (
    counterType: CounterType,
    scope: PublicCounterMutationScope,
    amount: unknown,
  ) => {
    const normalized = nonNegativeInteger(amount);
    if (normalized <= 0) return;
    const key = `${scopeSortKey(scope)}:${counterType}`;
    const existing = result.get(key);
    result.set(key, {
      counterType,
      scope,
      amount: (existing?.amount ?? 0) + normalized,
    });
  };
  const counters = state.purgeableRunnerVirusCounters;
  for (const counterType of PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES)
    add(
      counterType,
      { kind: "side", side: "corp" },
      counters?.corp?.[counterType],
    );
  for (const [serverId, bucket] of Object.entries(counters?.servers ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    for (const counterType of PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES)
      add(
        counterType,
        {
          kind: "server",
          serverId: serverId as Exclude<ServerId, "new_remote">,
        },
        bucket?.[counterType],
      );
  }
  for (const effect of Object.values(counters?.effects ?? {})) {
    add(
      effect.counterType,
      effect.serverId
        ? { kind: "server", serverId: effect.serverId }
        : { kind: "game" },
      effect.amount,
    );
  }
  return result;
}

function nonNegativeInteger(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

export function canonicalPublicCounterMutations(
  mutations: readonly PublicCounterMutation[],
): PublicCounterMutation[] {
  const byKey = new Map<string, PublicCounterMutation>();
  for (const mutation of mutations)
    byKey.set(mutationSortKey(mutation), mutation);
  return [...byKey.values()].sort((left, right) =>
    mutationSortKey(left).localeCompare(mutationSortKey(right)),
  );
}

function legacyActionCounterMutations(
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
): PublicCounterMutation[] {
  if (legalAction.visibility !== "public") return [];
  const payload = legalAction.payload;
  if (!payload) return [];
  const scope = serverScope(payload.serverId) ??
    publicScopeForCandidateCards(previousState, state, [
      payload.cardId,
      payload.targetCardId,
      legalAction.source,
    ]) ?? { kind: "side" as const, side: legalAction.side };
  return legacyCounterMutation(
    payload.counterType,
    payload.addedCounterAmount,
    payload.removedCounterAmount,
    payload.remainingCounters,
    scope,
  );
}

function legacyCounterMutation(
  counterType: unknown,
  added: unknown,
  removed: unknown,
  remaining: unknown,
  scope: PublicCounterMutationScope | undefined,
): PublicCounterMutation[] {
  if (
    typeof counterType !== "string" ||
    counterType.length === 0 ||
    !scope ||
    !Number.isSafeInteger(remaining) ||
    Number(remaining) < 0
  )
    return [];
  const addedAmount = positiveInteger(added);
  const removedAmount = positiveInteger(removed);
  if ((addedAmount === undefined) === (removedAmount === undefined)) return [];
  const after = Number(remaining);
  const before =
    addedAmount !== undefined ? after - addedAmount : after + removedAmount!;
  if (before < 0) return [];
  return [
    publicCounterMutation({
      operation: addedAmount !== undefined ? "add" : "remove",
      counterType: counterType as CounterType,
      scope,
      before,
      after,
    }),
  ];
}

function positiveInteger(value: unknown): number | undefined {
  return Number.isSafeInteger(value) && Number(value) > 0
    ? Number(value)
    : undefined;
}

function serverScope(value: unknown): PublicCounterMutationScope | undefined {
  return typeof value === "string" && value.length > 0 && value !== "new_remote"
    ? {
        kind: "server",
        serverId: value as Exclude<ServerId, "new_remote">,
      }
    : undefined;
}

function publicScopeForCandidateCards(
  previousState: GameState,
  state: GameState,
  candidates: readonly unknown[],
): PublicCounterMutationScope | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const scope = publicScopeForCard(
      previousState,
      state,
      candidate as CardInstanceId,
    );
    if (scope) return scope;
  }
  return undefined;
}

function publicScopeForCard(
  previousState: GameState,
  state: GameState,
  cardInstanceId: CardInstanceId,
): PublicCounterMutationScope | undefined {
  const instance =
    state.cardInstances[cardInstanceId] ??
    previousState.cardInstances[cardInstanceId];
  if (!instance) return undefined;
  const installed =
    installedCorpPosition(state, cardInstanceId) ??
    installedCorpPosition(previousState, cardInstanceId);
  if (installed) return installed;
  return {
    kind: "public_card",
    side: instance.controller,
    cardInstanceId,
  };
}

function installedCorpPosition(
  state: GameState,
  cardInstanceId: CardInstanceId,
): PublicCounterMutationScope | undefined {
  for (const server of state.corp.servers) {
    const rootIndex = server.root.indexOf(cardInstanceId);
    if (rootIndex >= 0)
      return {
        kind: "installed_corp_card",
        serverId: server.id,
        area: "root",
        positionKey: `root:${rootIndex}`,
      };
    const iceIndex = server.ice.indexOf(cardInstanceId);
    if (iceIndex >= 0)
      return {
        kind: "installed_corp_card",
        serverId: server.id,
        area: "ice",
        positionKey: `ice:${iceIndex}`,
      };
  }
  return undefined;
}

function counterAmount(value: number, field: "before" | "after"): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`Counter-Mutation benötigt ${field} als Ganzzahl >= 0.`);
  return value;
}

function assertOperationDirection(
  operation: PublicCounterMutation["operation"],
  before: number,
  after: number,
): void {
  if (operation === "add" && after < before)
    throw new Error("Counter-Add darf den Counterwert nicht senken.");
  if ((operation === "remove" || operation === "purge") && after > before)
    throw new Error("Counter-Entfernung darf den Counterwert nicht erhöhen.");
}

function mutationSortKey(mutation: PublicCounterMutation): string {
  return [
    scopeSortKey(mutation.scope),
    mutation.counterType,
    mutation.operation,
    mutation.before,
    mutation.after,
  ].join(":");
}

function scopeSortKey(scope: PublicCounterMutationScope): string {
  switch (scope.kind) {
    case "public_card":
      return `public_card:${scope.side}:${scope.cardInstanceId}`;
    case "installed_corp_card":
      return `installed_corp_card:${scope.serverId}:${scope.area}:${scope.positionKey}`;
    case "server":
      return `server:${scope.serverId}`;
    case "side":
      return `side:${scope.side}`;
    case "shared_pool":
      return `shared_pool:${scope.ownerSide}`;
    case "game":
      return "game";
  }
}
