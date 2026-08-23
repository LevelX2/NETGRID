import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  PlayerAction,
  PurgeableRunnerVirusCounterBucket,
  PurgeableRunnerVirusCounterType,
  ResolvedGameEffect,
  ServerId,
} from "@netgrid/shared";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import type { SuccessfulRunFollowupExecutionResult } from "./successful-run-interventions";
import {
  type ActiveRun,
  type RunEndAftermathResult,
  type RunEndCleanupHost,
  type RunnerTurnFlags,
} from "./run-end-cleanup-contracts";
import { successfulRunServerId } from "./run-server-identities";

export type RunnerVirusCounterPreventionSummary = {
  added: number;
  prevented: number;
  deferred: number;
  creditsPaid: number;
  preventionChargesSpent: number;
};

export function purgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
  counterType: PurgeableRunnerVirusCounterType,
): number {
  const amount = bucket?.[counterType] ?? 0;
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error(
      `Purgeable Runner virus counter ${counterType} ist ungültig.`,
    );
  return amount;
}

export function setPurgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket,
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
): void {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error(
      `Purgeable Runner virus counter ${counterType} ist ungültig.`,
    );
  const normalized = amount;
  if (normalized > 0) bucket[counterType] = normalized;
  else delete bucket[counterType];
}

export function compactPurgeableRunnerVirusCounters(state: GameState): void {
  const counters = state.purgeableRunnerVirusCounters;
  if (!counters) return;
  if (counters.corp && Object.keys(counters.corp).length === 0)
    delete counters.corp;
  if (counters.servers) {
    for (const [serverId, bucket] of Object.entries(counters.servers)) {
      if (!bucket || Object.keys(bucket).length === 0)
        delete counters.servers[serverId as Exclude<ServerId, "new_remote">];
    }
    if (Object.keys(counters.servers).length === 0) delete counters.servers;
  }
  if (counters.effects && Object.keys(counters.effects).length === 0)
    delete counters.effects;
  if (!counters.corp && !counters.servers && !counters.effects)
    delete state.purgeableRunnerVirusCounters;
}

export function addPurgeableRunnerVirusCounter(
  state: GameState,
  scope:
    | { kind: "corp" }
    | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> },
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
): number {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Purgeable Runner virus counter amount ist ungültig.");
  const normalized = amount;
  if (normalized <= 0) return 0;
  const counters = (state.purgeableRunnerVirusCounters ??= {});
  const bucket =
    scope.kind === "corp"
      ? (counters.corp ??= {})
      : ((counters.servers ??= {})[scope.serverId] ??= {});
  const next =
    purgeableRunnerVirusCounterAmount(bucket, counterType) + normalized;
  setPurgeableRunnerVirusCounterAmount(bucket, counterType, next);
  return normalized;
}

export function applyRunnerVirusCounterPrevention(
  host: RunEndCleanupHost,
  amount: number,
  target: NonNullable<
    GameState["pendingVirusCounterPrevention"]
  >["targets"][number],
  legalAction?: LegalAction,
): RunnerVirusCounterPreventionSummary {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Runner virus counter prevention amount ist ungültig.");
  const normalized = amount;
  let added = 0;
  let prevented = 0;
  let deferred = 0;
  let creditsPaid = 0;
  let preventionChargesSpent = 0;
  for (let index = 0; index < normalized; index += 1) {
    const prevention =
      host.counters.preventOneVirusCounterWithCounterPrevention(target);
    if (prevention.deferred) {
      deferred += 1;
      continue;
    }
    if (prevention.prevented) {
      prevented += 1;
      creditsPaid += prevention.creditsPaid;
      preventionChargesSpent += prevention.preventionChargesSpent;
      continue;
    }
    added += 1;
  }
  if (legalAction && prevented > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      virusCounterAvoided:
        Number(legalAction.payload?.virusCounterAvoided ?? 0) + prevented,
      counterPreventionCreditsPaid:
        Number(legalAction.payload?.counterPreventionCreditsPaid ?? 0) +
        creditsPaid,
      runnerVirusCounterPreventionChargesSpent:
        Number(
          legalAction.payload?.runnerVirusCounterPreventionChargesSpent ?? 0,
        ) + preventionChargesSpent,
      corpRunnerVirusCounterPreventionChargesAfter:
        host.state.corpRunnerVirusCounterPreventionCharges ?? 0,
      corpCreditsAfter: host.state.corp.credits,
    };
  }
  return { added, prevented, deferred, creditsPaid, preventionChargesSpent };
}

export function addPurgeableRunnerVirusCounterWithPrevention(
  host: RunEndCleanupHost,
  scope:
    | { kind: "corp" }
    | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> },
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
  legalAction?: LegalAction,
): RunnerVirusCounterPreventionSummary {
  const summary = applyRunnerVirusCounterPrevention(
    host,
    amount,
    scope.kind === "corp"
      ? { kind: "corp_pool", counterType }
      : { kind: "server_pool", serverId: scope.serverId, counterType },
    legalAction,
  );
  if (summary.added > 0) {
    addPurgeableRunnerVirusCounter(
      host.state,
      scope,
      counterType,
      summary.added,
    );
  }
  return summary;
}

export function socketCounterTypeForServer(
  serverId: Exclude<ServerId, "new_remote">,
):
  | Extract<
      PurgeableRunnerVirusCounterType,
      "socket_archives" | "socket_hq" | "socket_rd"
    >
  | undefined {
  if (serverId === "archives") return "socket_archives";
  if (serverId === "hq") return "socket_hq";
  if (serverId === "rd") return "socket_rd";
  return undefined;
}

export function applyV181SuccessfulRunCounterTriggers(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const serverId = successfulRunServerId(run);
  const sourceIds = host.virus.installedRunnerVirusSourceIds(
    (implementation) =>
      implementation.addOnSuccessfulRun !== undefined &&
      successfulRunMatchesVirusTrigger(host, run, implementation),
  );
  const pattelSources = sourceIds.filter(
    (cardId) =>
      host.virus.virusCounterImplementationForCard(cardId)?.addOnSuccessfulRun
        ?.counterScope.kind === "chosen_fully_broken_ice",
  );
  if (pattelSources.length > 0) {
    const sourceBindings = pattelSources.map((sourceCardId) => {
      const amount =
        host.virus.virusCounterImplementationForCard(sourceCardId)
          ?.addOnSuccessfulRun?.amount;
      if (!Number.isSafeInteger(amount) || !amount || amount <= 0)
        throw new Error("Pattel's Virus hat einen ungültigen Counter-Betrag.");
      return { sourceCardId, amount };
    });
    const targetIceIds = (run.fullyBrokenIceIds ?? []).filter(
      (targetIceId) => host.state.cardInstances[targetIceId],
    );
    if (targetIceIds.length === 1) {
      const targetIceId = targetIceIds[0]!;
      const added = sourceBindings.reduce(
        (sum, source) =>
          sum +
          host.counters.addVirusCounterWithCounterPrevention(
            targetIceId,
            "pattel",
            source.amount,
            legalAction,
          ),
        0,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          abilityId: "broken_ice_virus_counter",
          brokenIceVirusCounterAdded: added,
          targetCardDefinitionId: host.cards.definitionFor(targetIceId).id,
          remainingCounters: host.counters.cardCounter(targetIceId, "pattel"),
        };
      }
    } else if (targetIceIds.length > 1) {
      startBrokenIceVirusCounterChoice(
        host,
        targetIceIds,
        legalAction,
        "pattel",
        sourceBindings,
      );
    }
  }

  for (const cardId of sourceIds) {
    const implementation = host.virus.virusCounterImplementationForCard(cardId);
    const trigger = implementation?.addOnSuccessfulRun;
    if (
      !implementation ||
      !trigger ||
      trigger.counterScope.kind === "chosen_fully_broken_ice"
    )
      continue;
    const definition = host.cards.definitionFor(cardId);
    if (trigger.counterScope.kind === "shared_corp_pool") {
      const counterType =
        implementation.counterKind as PurgeableRunnerVirusCounterType;
      const counterSummary = addPurgeableRunnerVirusCounterWithPrevention(
        host,
        { kind: "corp" },
        counterType,
        trigger.amount,
        legalAction,
      );
      const added = counterSummary.added;
      if (legalAction) {
        const serverLabel = host.servers.publicServerLabel(serverId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          proteusRunnerVirusCounter: true,
          runId: run.runId,
          serverId,
          counterType,
          counterDelta: added,
          counterTotalAfter: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.corp,
            counterType,
          ),
          sourceCardDefinitionId: definition.id,
        };
        if (added > 0) {
          appendRunnerVirusCounterEffect(legalAction, {
            run,
            sourceCardId: cardId,
            sourceDefinitionId: definition.id,
            sourceTitle: definition.title,
            side: "corp",
            counterType,
            added,
            remainingCounters: purgeableRunnerVirusCounterAmount(
              host.state.purgeableRunnerVirusCounters?.corp,
              counterType,
            ),
            ...(serverLabel ? { serverLabel } : {}),
          });
        }
      }
      continue;
    }
    if (trigger.counterScope.kind === "attacked_central_server_pool") {
      const socketCounterType = socketCounterTypeForServer(serverId);
      if (!socketCounterType) continue;
      const counterSummary = addPurgeableRunnerVirusCounterWithPrevention(
        host,
        { kind: "server", serverId },
        socketCounterType,
        trigger.amount,
        legalAction,
      );
      const added = counterSummary.added;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          proteusRunnerVirusCounter: true,
          runId: run.runId,
          serverId,
          counterType: socketCounterType,
          counterDelta: added,
          counterTotalAfter: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.servers?.[serverId],
            socketCounterType,
          ),
          sourceCardDefinitionId: definition.id,
        };
        const socketEffectInput: Parameters<
          typeof appendRunnerVirusCounterEffect
        >[1] = {
          run,
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          side: "corp",
          counterType: socketCounterType,
          added,
          remainingCounters: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.servers?.[serverId],
            socketCounterType,
          ),
          serverId,
        };
        const socketServerLabel = host.servers.publicServerLabel(serverId);
        if (socketServerLabel)
          socketEffectInput.serverLabel = socketServerLabel;
        if (added > 0)
          appendRunnerVirusCounterEffect(legalAction, socketEffectInput);
      }
      continue;
    }
    if (trigger.counterScope.kind === "source_card") {
      const added = host.counters.addVirusCounterWithCounterPrevention(
        cardId,
        implementation.counterKind as CounterType,
        trigger.amount,
        legalAction,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "source",
          sourceDefinitionId: definition.id,
          virusCountersAfter: host.counters.cardCounter(
            cardId,
            implementation.counterKind as CounterType,
          ),
        };
      }
      continue;
    }
    if (trigger.counterScope.kind !== "attacked_server")
      throw new Error("Unbekannter Virus-Counter-Scope.");
    if (implementation.counterKind === "pox") {
      const current = host.counters.poxCountersForServer(serverId);
      const counterSummary = applyRunnerVirusCounterPrevention(
        host,
        trigger.amount,
        { kind: "pox_server", serverId },
        legalAction,
      );
      const added = counterSummary.added;
      host.state.poxCountersByServer = {
        ...(host.state.poxCountersByServer ?? {}),
        [serverId]: current + added,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          abilityId: "pox_counter",
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "server",
          sourceDefinitionId: definition.id,
          poxCounterAdded: added,
          poxCountersAfter: current + added,
          targetServerLabel:
            host.servers.publicServerLabel(serverId) ?? serverId,
        };
      }
      continue;
    }
    if (implementation.counterKind === "fait") {
      const current = Math.max(
        0,
        Math.floor(
          host.state.serverAgendaCostCountersByServer?.[serverId] ?? 0,
        ),
      );
      const counterSummary = applyRunnerVirusCounterPrevention(
        host,
        trigger.amount,
        { kind: "fait_server", serverId },
        legalAction,
      );
      const added = counterSummary.added;
      host.state.serverAgendaCostCountersByServer = {
        ...(host.state.serverAgendaCostCountersByServer ?? {}),
        [serverId]: current + added,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "server",
          sourceDefinitionId: definition.id,
          faitCounterAdded: added,
          faitCountersAfter: current + added,
          targetServerLabel:
            host.servers.publicServerLabel(serverId) ?? serverId,
        };
      }
    }
  }
}

export function appendRunnerVirusCounterEffect(
  legalAction: LegalAction,
  input: {
    run: ActiveRun;
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    sourceTitle: string;
    side: "corp" | "runner";
    counterType: CounterType;
    added: number;
    remainingCounters: number;
    reason?: "runner_virus_successful_run";
    serverId?: Exclude<ServerId, "new_remote">;
    serverLabel?: string;
  },
): void {
  if (input.added <= 0) return;
  const effect: ResolvedGameEffect = {
    effectId: `${input.run.runId}.${input.sourceCardId}.successful_run.${input.counterType}`,
    kind: "counter_change",
    visibility: "public",
    side: input.side,
    amount: input.remainingCounters,
    counterType: input.counterType,
    addedCounterAmount: input.added,
    remainingCounters: input.remainingCounters,
    reason: input.reason ?? "runner_virus_successful_run",
    sourceDefinitionId: input.sourceDefinitionId,
    sourceTitle: input.sourceTitle,
    ...(input.serverId ? { serverId: input.serverId } : {}),
    ...(input.serverLabel ? { serverLabel: input.serverLabel } : {}),
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    effect,
  ];
}

export function successfulRunMatchesVirusTrigger(
  host: RunEndCleanupHost,
  run: ActiveRun,
  implementation: CardVirusCounterImplementation,
): boolean {
  const trigger = implementation.addOnSuccessfulRun;
  if (!trigger) return false;
  const serverId = successfulRunServerId(run);
  if (trigger.server === "any") return true;
  if (
    trigger.server === "hq" ||
    trigger.server === "rd" ||
    trigger.server === "archives"
  )
    return serverId === trigger.server;
  if (trigger.server === "central")
    return serverId === "archives" || serverId === "hq" || serverId === "rd";
  if (trigger.server === "subsidiary_data_fort") {
    return host.servers.mustServer(serverId).kind === "remote";
  }
  return false;
}

export function startBrokenIceVirusCounterChoice(
  host: RunEndCleanupHost,
  targetIceIds: CardInstanceId[],
  legalAction?: LegalAction,
  counterType: Extract<CounterType, "pattel"> = "pattel",
  sources: Array<{ sourceCardId: CardInstanceId; amount: number }> = [],
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const validSources = sources
    .filter(
      (source) =>
        host.state.cardInstances[source.sourceCardId] &&
        Number.isSafeInteger(source.amount) &&
        source.amount > 0,
    )
    .sort((left, right) => left.sourceCardId.localeCompare(right.sourceCardId));
  const validTargets = targetIceIds
    .filter((cardId) => host.state.cardInstances[cardId])
    .sort();
  if (validSources.length === 0 || validTargets.length === 0) return;
  const options = validSources.flatMap((source) =>
    validTargets.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `source_${source.sourceCardId}_target_${cardId}`,
        label: `${definition.title} (${source.sourceCardId})`,
        publicLabel: "Gebrochenes ICE",
        value: cardId,
        metadata: {
          sourceCardInstanceId: source.sourceCardId,
          targetCardInstanceId: cardId,
        },
      };
    }),
  );
  host.state.pendingBrokenIceVirusCounterChoice = {
    counterType,
    sources: validSources,
    targetIceIds: validTargets,
  };
  host.state.pendingChoice = {
    choiceId: `broken_ice_virus_counter_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `broken_ice.virus_counter:${host.state.stateVersion + 1}`,
    prompt: "Für jede Pattel's-Virus-Quelle ein gebrochenes ICE wählen.",
    presentationKey: "generic_select_option",
    kind: "select_option",
    options,
    minSelections: validSources.length,
    maxSelections: validSources.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      abilityId: "broken_ice_virus_counter_choice",
      brokenIceVirusCounterCandidateCount: options.length,
      brokenIceVirusCounterAmount: validSources.reduce(
        (sum, source) => sum + source.amount,
        0,
      ),
      brokenIceVirusCounterChoiceOpened: true,
      choiceVisibility: "public",
    };
  }
}

export function unsuccessfulRunCorpCreditBonus(
  host: RunEndCleanupHost,
  run: GameState["run"],
  successful: boolean,
): RunEndAftermathResult & { amount: number } {
  if (!run || successful) return { handled: false, amount: 0 };
  const attackedServer = host.state.corp.servers.find(
    (server) => server.id === run.attackedServerId,
  );
  if (!attackedServer) return { handled: false, amount: 0 };
  const sourceCardId = attackedServer.root.find((cardId) => {
    const instance = host.cards.cardInstanceFor(cardId);
    return (
      instance.rezzed && host.aftermath.isTokyoUnsuccessfulRunSource(cardId)
    );
  });
  if (!sourceCardId) return { handled: false, amount: 0 };
  const amount =
    host.aftermath.tokyoUnsuccessfulRunAmountForCard(sourceCardId) ?? 2;
  return {
    handled: amount > 0,
    amount,
    gainedCredits: amount,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
  };
}
