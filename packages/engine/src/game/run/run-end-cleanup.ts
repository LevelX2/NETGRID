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
import { TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE } from "../../compatibility/runtime-compatibility";
import type { SuccessfulRunFollowupExecutionResult } from "./successful-run-interventions";

type ActiveRun = NonNullable<GameState["run"]>;
type RunnerTurnFlags = NonNullable<GameState["runnerTurnFlags"]>;

const CORP_PURGEABLE_SUCCESSFUL_RUN_COUNTERS = new Set<
  PurgeableRunnerVirusCounterType
>(["cascade", "crumble", "garbage", "highlighter", "scaldan", "tax", "vienna"]);

export type RunEndDamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

export type RunEndCleanupResult = {
  handled: boolean;
  runWasSuccessful: boolean;
  serverId?: Exclude<ServerId, "new_remote">;
  returnedTemporaryCredits?: number;
  damageAmount?: number;
  damageType?: DamageType;
  unpreventableDamage?: boolean;
  followupRunChoiceStarted?: boolean;
  derezCardIds?: CardInstanceId[];
  placedCounters?: number;
  gainedCredits?: number;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
  stateChanged?: boolean;
};

export type RunTemporaryCreditCleanupResult = {
  handled: boolean;
  returnedTemporaryCredits?: number;
  damageAmount?: number;
  damageType?: DamageType;
  unpreventableDamage?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export type PostRunBridgeResult = {
  handled: boolean;
  followupRunChoiceStarted?: boolean;
};

export type RunDurationCleanupResult = {
  handled: boolean;
  derezCardIds?: CardInstanceId[];
  removedRunMarkers?: string[];
  placedCounters?: number;
};

export type RunEndAftermathResult = {
  handled: boolean;
  gainedCredits?: number;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
};

export type RunEndCleanupHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    withoutVariableIceState: (instance: CardInstance) => CardInstance;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => GameState["corp"]["servers"][number];
    publicServerLabel: (serverId: Exclude<ServerId, "new_remote">) => string | undefined;
  };
  runner: {
    ensureTurnFlags: () => RunnerTurnFlags;
    consumeFutureActionDebt: () => void;
    awardEventAgendaPoint?: (
      sourceCardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      legalAction?: LegalAction,
    ) => void;
    addFutureActionDebt?: (amount: number) => void;
  };
  choices: {
    selectedChoiceIds: (selectedChoices: PlayerAction["selectedChoices"]) => string[];
  };
  credits: {
    gainRunner: (amount: number) => void;
    gainCorp: (amount: number) => void;
  };
  damage: {
    dealUnpreventableCoreDamage: (
      run: ActiveRun,
      sourceDefinitionId: CardDefinitionId,
      amount: number,
    ) => RunEndDamageSummary;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: CounterType) => number;
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addVirusCounterWithDisinfectantPrevention: (
      targetCardId: CardInstanceId,
      amount: number,
      legalAction?: LegalAction,
    ) => number;
    preventOneVirusCounterWithDisinfectant: () => {
      prevented: boolean;
      creditsPaid: number;
    };
    poxCountersForServer: (serverId: Exclude<ServerId, "new_remote">) => number;
  };
  ice: {
    icebreakerHasSpecial: (
      breakerId: CardInstanceId,
      special: "dupre_strength_counter_and_last_fort",
    ) => boolean;
  };
  virus: {
    installedRunnerVirusSourceIds: (
      predicate?: (implementation: CardVirusCounterImplementation) => boolean,
    ) => CardInstanceId[];
    virusCounterImplementationForCard: (
      cardId: CardInstanceId,
    ) => CardVirusCounterImplementation | undefined;
  };
  aftermath: {
    tokyoUnsuccessfulRunAmountForCard: (cardId: CardInstanceId) => number | undefined;
    isTokyoUnsuccessfulRunSource: (cardId: CardInstanceId) => boolean;
  };
  followups: {
    applyBodyweightDataCrecheSuccessfulRun: (
      legalAction?: LegalAction,
    ) => SuccessfulRunFollowupExecutionResult;
    cleanupDelayedSuccessfulRunTemporaryIce: (
      run: ActiveRun | undefined,
      legalAction?: LegalAction,
    ) => unknown;
    resolveTestSpinRunEnd: (
      run: ActiveRun,
      legalAction?: LegalAction,
    ) => { handled: boolean; stateChanged?: boolean };
  };
  cleanup: {
    cleanupEmptyRemotes: () => void;
  };
};

function purgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
  counterType: PurgeableRunnerVirusCounterType,
): number {
  return Math.max(0, Math.floor(Number(bucket?.[counterType] ?? 0)));
}

function setPurgeableRunnerVirusCounterAmount(
  bucket: PurgeableRunnerVirusCounterBucket,
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
): void {
  const normalized = Math.max(0, Math.floor(amount));
  if (normalized > 0) bucket[counterType] = normalized;
  else delete bucket[counterType];
}

function compactPurgeableRunnerVirusCounters(state: GameState): void {
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

function addPurgeableRunnerVirusCounter(
  state: GameState,
  scope:
    | { kind: "corp" }
    | { kind: "server"; serverId: Exclude<ServerId, "new_remote"> },
  counterType: PurgeableRunnerVirusCounterType,
  amount: number,
): number {
  const normalized = Math.max(0, Math.floor(amount));
  if (normalized <= 0) return 0;
  const counters = (state.purgeableRunnerVirusCounters ??= {});
  const bucket =
    scope.kind === "corp"
      ? (counters.corp ??= {})
      : ((counters.servers ??= {})[scope.serverId] ??= {});
  const next = purgeableRunnerVirusCounterAmount(bucket, counterType) + normalized;
  setPurgeableRunnerVirusCounterAmount(bucket, counterType, next);
  return normalized;
}

function socketCounterTypeForServer(
  serverId: Exclude<ServerId, "new_remote">,
): Extract<
  PurgeableRunnerVirusCounterType,
  "socket_archives" | "socket_hq" | "socket_rd"
> | undefined {
  if (serverId === "archives") return "socket_archives";
  if (serverId === "hq") return "socket_hq";
  if (serverId === "rd") return "socket_rd";
  return undefined;
}

function convertCompleteSocketSetsToPipeCounters(state: GameState): number {
  const servers = state.purgeableRunnerVirusCounters?.servers;
  if (!servers) return 0;
  const archives = servers.archives;
  const hq = servers.hq;
  const rd = servers.rd;
  const completeSets = Math.min(
    purgeableRunnerVirusCounterAmount(archives, "socket_archives"),
    purgeableRunnerVirusCounterAmount(hq, "socket_hq"),
    purgeableRunnerVirusCounterAmount(rd, "socket_rd"),
  );
  if (completeSets <= 0) return 0;
  if (!archives || !hq || !rd)
    throw new Error("Viral-Pipeline-Socket-Counter fehlen.");
  setPurgeableRunnerVirusCounterAmount(
    archives,
    "socket_archives",
    purgeableRunnerVirusCounterAmount(archives, "socket_archives") - completeSets,
  );
  setPurgeableRunnerVirusCounterAmount(
    hq,
    "socket_hq",
    purgeableRunnerVirusCounterAmount(hq, "socket_hq") - completeSets,
  );
  setPurgeableRunnerVirusCounterAmount(
    rd,
    "socket_rd",
    purgeableRunnerVirusCounterAmount(rd, "socket_rd") - completeSets,
  );
  addPurgeableRunnerVirusCounter(state, { kind: "corp" }, "pipe", completeSets);
  compactPurgeableRunnerVirusCounters(state);
  return completeSets;
}

export function clearEncounterTemporaryTraceCredits(
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const credits = run.encounterTemporaryTraceCredits;
  if (!credits) return;
  const returned = Math.max(0, Math.floor(credits.remaining ?? 0));
  delete run.encounterTemporaryTraceCredits;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryCreditsReturned: returned,
      temporaryTraceCreditsSourceDefinitionId: credits.sourceDefinitionId,
    };
  }
}

export function handleRunEndCleanup(
  host: RunEndCleanupHost,
  successful: boolean,
  legalAction?: LegalAction,
): RunEndCleanupResult {
  const run = host.state.run;
  if (run) clearEncounterTemporaryTraceCredits(run, legalAction);
  const dupre = run ? applyDupreRunEndCounters(host, run) : { handled: false };
  const olivia = run
    ? derezOliviaSalazarTemporaryIce(host, run, legalAction)
    : { handled: false };
  if (run && successful)
    applyV181SuccessfulRunCounterTriggers(host, run, legalAction);
  if (run && successful)
    host.followups.applyBodyweightDataCrecheSuccessfulRun(legalAction);
  if (run && successful) {
    const flags = host.runner.ensureTurnFlags();
    flags.successfulRunThisTurn = true;
    flags.lastSuccessfulRunServerId = run.attackedServerId;
    if (run.attackedServerId === "hq") flags.successfulHqRunThisTurn = true;
    if (run.attackedServerId === "rd") flags.successfulRdRunThisTurn = true;
    if (
      (run.attackedServerId === "hq" || run.attackedServerId === "rd") &&
      (Math.max(0, Math.floor(run.liberatedBlackOpsAgendaCount ?? 0)) > 0 ||
        Math.max(0, Math.floor(run.trashedBlackOpsCount ?? 0)) > 0)
    ) {
      flags.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn = true;
    }
  }
  if (run) applyBadPublicityRunAftermath(host, run, successful, legalAction);
  const pirateBroadcast = run
    ? applyPirateBroadcastRunResult(host, run, successful, legalAction)
    : { handled: false };
  const allNighterBonusRunOnFinish =
    run?.grantAllNighterBonusRunOnFinish === true;
  const bonus = successful ? (run?.pendingSuccessBonusCredits ?? 0) : 0;
  const corpBonus = tokyoChibaUnsuccessfulRunBonus(host, run, successful);
  host.followups.cleanupDelayedSuccessfulRunTemporaryIce(run, legalAction);
  if (run) host.followups.resolveTestSpinRunEnd(run, legalAction);
  host.credits.gainRunner(bonus);
  host.credits.gainCorp(corpBonus.amount);
  if (run && corpBonus.amount > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tokyoChibaInfightingBonus: true,
      sourceDefinitionId: corpBonus.sourceCardId
        ? host.cards.definitionFor(corpBonus.sourceCardId).id
        : TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE,
      serverId: run.attackedServerId,
      corpCreditsGained: corpBonus.amount,
      corpCreditsAfter: host.state.corp.credits,
      ...(corpBonus.sourceCardId ? { sourceCardId: corpBonus.sourceCardId } : {}),
    };
  }
  let postRunBridge: PostRunBridgeResult = { handled: false };
  if (allNighterBonusRunOnFinish && !host.state.winner) {
    host.runner.ensureTurnFlags().allNighterBonusRunPending = true;
    postRunBridge = { handled: true, followupRunChoiceStarted: true };
  }
  const temporary = applyRunnerRunTemporaryCreditCleanupAndDamage(
    host,
    run,
    legalAction,
  );
  const spendCapShortfall = run
    ? applyRunCreditSpendCapShortfall(host, run, legalAction)
    : { handled: false, lostCredits: 0, shortfall: 0 };
  resetBreakerStrength(host.state);
  delete host.state.run;
  host.state.phase = "runner_action_phase";
  host.state.timingPoint = "runner_action.main";
  host.state.activeSide = "runner";
  if (!pirateBroadcast.deferActionDebtConsumption)
    host.runner.consumeFutureActionDebt();
  host.cleanup.cleanupEmptyRemotes();
  return {
    handled: true,
    runWasSuccessful: successful,
    ...(run ? { serverId: run.attackedServerId } : {}),
    ...(temporary.returnedTemporaryCredits !== undefined
      ? { returnedTemporaryCredits: temporary.returnedTemporaryCredits }
      : {}),
    ...(temporary.damageAmount !== undefined
      ? { damageAmount: temporary.damageAmount }
      : {}),
    ...(temporary.damageType !== undefined ? { damageType: temporary.damageType } : {}),
    ...(temporary.unpreventableDamage !== undefined
      ? { unpreventableDamage: temporary.unpreventableDamage }
      : {}),
    ...(spendCapShortfall.handled
      ? {
          runCreditSpendCapShortfall: spendCapShortfall.shortfall,
          lostCredits: spendCapShortfall.lostCredits,
        }
      : {}),
    ...(postRunBridge.followupRunChoiceStarted !== undefined
      ? { followupRunChoiceStarted: postRunBridge.followupRunChoiceStarted }
      : {}),
    ...(olivia.derezCardIds ? { derezCardIds: olivia.derezCardIds } : {}),
    ...(dupre.placedCounters !== undefined
      ? { placedCounters: dupre.placedCounters }
      : {}),
    ...(corpBonus.amount > 0 ? { gainedCredits: corpBonus.amount } : {}),
    ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
    stateChanged: true,
  };
}

function applyRunCreditSpendCapShortfall(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): { handled: boolean; shortfall: number; lostCredits: number } {
  const cap = run.runCreditSpendCap;
  if (!cap) return { handled: false, shortfall: 0, lostCredits: 0 };
  const announced = Math.max(0, Math.floor(cap.announcedSpendCap ?? 0));
  const spent = Math.max(0, Math.floor(cap.spentDuringRun ?? 0));
  const shortfall = Math.max(0, announced - spent);
  const lostCredits = Math.min(shortfall, Math.max(0, host.state.runner.credits));
  if (lostCredits > 0) host.state.runner.credits -= lostCredits;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runCreditSpendCap: announced,
      runCreditSpentDuringRun: spent,
      runCreditSpendCapShortfall: shortfall,
      runnerCreditsLost: lostCredits,
      runnerCreditsAfter: host.state.runner.credits,
      sourceDefinitionId: cap.sourceDefinitionId,
    };
  }
  return { handled: true, shortfall, lostCredits };
}

function applyBadPublicityRunAftermath(
  host: RunEndCleanupHost,
  run: ActiveRun,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  const aftermath = run.badPublicityRunAftermath;
  if (!aftermath) return;
  let badPublicityAdded = 0;
  if (aftermath.kind === "live_news_feed") {
    if (!successful) return;
    const tagAmount = 2;
    host.state.runner.tags += tagAmount;
    badPublicityAdded =
      Math.max(0, Math.floor(run.encounteredBlackIceCount ?? 0)) +
      Math.max(0, Math.floor(run.rezzedBlackOpsCount ?? 0)) +
      Math.max(0, Math.floor(run.liberatedBlackOpsAgendaCount ?? 0));
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded: tagAmount,
        runnerTagsAfter: host.state.runner.tags,
        liveNewsFeedEncounteredBlackIceCount: Math.max(
          0,
          Math.floor(run.encounteredBlackIceCount ?? 0),
        ),
        liveNewsFeedRezzedBlackOpsCount: Math.max(
          0,
          Math.floor(run.rezzedBlackOpsCount ?? 0),
        ),
        liveNewsFeedLiberatedBlackOpsAgendaCount: Math.max(
          0,
          Math.floor(run.liberatedBlackOpsAgendaCount ?? 0),
        ),
      };
    }
  } else {
    badPublicityAdded = Math.max(
      0,
      Math.floor(run.trashedAdvertisementCount ?? 0),
    );
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        subliminalCorruptionTrashedAdvertisementCount: badPublicityAdded,
      };
    }
  }
  if (badPublicityAdded <= 0) return;
  const before = host.state.corp.badPublicity;
  host.state.corp.badPublicity += badPublicityAdded;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: aftermath.sourceDefinitionId,
      badPublicityAdded:
        Math.max(0, Math.floor(Number(legalAction.payload?.badPublicityAdded ?? 0))) +
        badPublicityAdded,
      corpBadPublicityBefore:
        typeof legalAction.payload?.corpBadPublicityBefore === "number"
          ? legalAction.payload.corpBadPublicityBefore
          : before,
      corpBadPublicityAfter: host.state.corp.badPublicity,
    };
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      {
        effectId: `${run.runId}.${aftermath.sourceCardId}.bad_publicity_after_run`,
        kind: "add_bad_publicity",
        visibility: "public",
        side: "corp",
        amount: badPublicityAdded,
        reason: aftermath.kind,
        sourceDefinitionId: aftermath.sourceDefinitionId,
        sourceTitle: aftermath.sourceTitle,
      },
    ];
  }
}

function applyPirateBroadcastRunResult(
  host: RunEndCleanupHost,
  run: ActiveRun,
  successful: boolean,
  legalAction?: LegalAction,
): { handled: boolean; deferActionDebtConsumption?: boolean } {
  const sequence = run.pirateBroadcast;
  if (!sequence) return { handled: false };
  if (!successful) {
    if (host.runner.addFutureActionDebt) {
      host.runner.addFutureActionDebt(1);
    } else {
      const flags = host.runner.ensureTurnFlags();
      flags.forgoNextActionsPending =
        Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + 1;
    }
    delete host.runner.ensureTurnFlags().pirateBroadcastPending;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        pirateBroadcastFailed: true,
        actionDebtAdded: 1,
        sourceDefinitionId: sequence.sourceDefinitionId,
      };
    }
    return { handled: true, deferActionDebtConsumption: true };
  }
  const successfulServerIds = [
    ...sequence.successfulServerIds,
    run.attackedServerId,
  ];
  const remainingPendingServerIds =
    sequence.pendingServerIds[0] === run.attackedServerId
      ? sequence.pendingServerIds.slice(1)
      : sequence.pendingServerIds.filter(
          (serverId) => serverId !== run.attackedServerId,
        );
  if (remainingPendingServerIds.length > 0) {
    host.runner.ensureTurnFlags().pirateBroadcastPending = {
      ...sequence,
      pendingServerIds: remainingPendingServerIds,
      successfulServerIds,
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        pirateBroadcastRunSuccessful: true,
        pirateBroadcastPendingServerCount: remainingPendingServerIds.length,
        sourceDefinitionId: sequence.sourceDefinitionId,
      };
    }
    return { handled: true, deferActionDebtConsumption: true };
  }
  delete host.runner.ensureTurnFlags().pirateBroadcastPending;
  if (!host.runner.awardEventAgendaPoint)
    throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
  host.runner.awardEventAgendaPoint(
    sequence.sourceCardId,
    sequence.sourceDefinitionId,
    legalAction,
  );
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      pirateBroadcastComplete: true,
      pirateBroadcastSuccessfulServerCount: successfulServerIds.length,
      sourceDefinitionId: sequence.sourceDefinitionId,
    };
  }
  return { handled: true };
}

export function recordDupreBreakUsage(
  host: RunEndCleanupHost,
  breakerId: CardInstanceId,
): void {
  const run = host.state.run;
  if (
    !run ||
    !host.ice.icebreakerHasSpecial(
      breakerId,
      "dupre_strength_counter_and_last_fort",
    )
  )
    return;
  const instance = host.cards.cardInstanceFor(breakerId);
  if (
    instance.selectedServerId &&
    instance.selectedServerId !== run.attackedServerId
  ) {
    host.counters.setCardCounter(breakerId, "power", 0);
  }
  const usedBreakerIds = run.dupreUsedBreakerIdsThisRun ?? [];
  if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
  run.dupreUsedBreakerIdsThisRun = usedBreakerIds;
}

export function resolvePattelsVirusCounterChoice(
  host: RunEndCleanupHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v181.pattels_virus"))
    throw new Error("Es ist keine Pattel's-Virus-Choice offen.");
  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  const targetIceId = typeof option?.value === "string" ? option.value : "";
  if (
    !targetIceId ||
    !choice.source.includes(targetIceId) ||
    !host.state.cardInstances[targetIceId]
  ) {
    throw new Error("Die Pattel's-Virus-Auswahl ist ungültig.");
  }
  const amount = Math.max(
    1,
    Math.floor(Number(choice.source.match(/amount=(\d+)/)?.[1] ?? 1)),
  );
  const added = host.counters.addVirusCounterWithDisinfectantPrevention(
    targetIceId,
    amount,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v181RunnerProgramAbility: "pattels_virus_counter",
    pattelsVirusCounterAdded: added,
    targetCardDefinitionId: host.cards.definitionFor(targetIceId).id,
    remainingCounters: host.counters.cardCounter(targetIceId, "virus"),
    choiceVisibility: "public",
  };
  delete host.state.pendingChoice;
}

export function resetBreakerStrength(state: GameState): void {
  for (const id of state.runner.rig.programs) {
    const instance = state.cardInstances[id];
    if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
    state.cardInstances[id] = { ...instance, strengthModifier: 0 };
  }
}

function applyRunnerRunTemporaryCreditCleanupAndDamage(
  host: RunEndCleanupHost,
  run: ActiveRun | undefined,
  legalAction?: LegalAction,
): RunTemporaryCreditCleanupResult {
  if (!run) return { handled: false };
  const runTemporaryCredits = run.runnerRunTemporaryCredits;
  const corpRunTemporaryCredits = run.corpRunTemporaryCredits;
  const unpreventableCoreDamage = run.unpreventableCoreDamageAtRunEnd;
  if (!runTemporaryCredits && !corpRunTemporaryCredits && !unpreventableCoreDamage)
    return { handled: false };
  const unusedTemporaryCredits = runTemporaryCredits?.remaining ?? 0;
  const unusedCorpTemporaryCredits = Math.max(
    0,
    Math.floor(corpRunTemporaryCredits?.remaining ?? 0),
  );
  if (unusedCorpTemporaryCredits > 0)
    host.state.corp.credits = Math.max(
      0,
      host.state.corp.credits - unusedCorpTemporaryCredits,
    );
  let damageSummary: RunEndDamageSummary | undefined;
  if (unpreventableCoreDamage && unpreventableCoreDamage.amount > 0) {
    damageSummary = host.damage.dealUnpreventableCoreDamage(
      run,
      unpreventableCoreDamage.sourceDefinitionId,
      unpreventableCoreDamage.amount,
    );
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...(runTemporaryCredits
        ? {
            temporaryRunCreditsReturned: unusedTemporaryCredits,
            temporaryRunCreditsRemaining: 0,
          }
        : {}),
      ...(corpRunTemporaryCredits
        ? {
            corpTemporaryRunCreditsReturned: unusedCorpTemporaryCredits,
            corpTemporaryRunCreditsRemaining: 0,
            corpCreditsAfter: host.state.corp.credits,
          }
        : {}),
      ...(damageSummary
        ? {
            damageCannotBePrevented: true,
            damageResolved: true,
            damageType: damageSummary.damageType,
            damageAmount: damageSummary.amount,
            cardsTrashed: damageSummary.cardsTrashed,
            flatline: damageSummary.flatline,
            ...(damageSummary.coreDamageAfter !== undefined
              ? { coreDamageAfter: damageSummary.coreDamageAfter }
              : {}),
            ...(damageSummary.runnerMaxHandSizeAfter !== undefined
              ? { runnerMaxHandSizeAfter: damageSummary.runnerMaxHandSizeAfter }
              : {}),
          }
        : {}),
    };
  }
  return {
    handled: true,
    ...(runTemporaryCredits
      ? { returnedTemporaryCredits: unusedTemporaryCredits }
      : {}),
    ...(damageSummary
      ? {
          damageAmount: damageSummary.amount,
          damageType: damageSummary.damageType,
          unpreventableDamage: true,
        }
      : {}),
    ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
  };
}

function derezOliviaSalazarTemporaryIce(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): RunDurationCleanupResult {
  const iceIds = [...new Set(run.oliviaSalazarTemporaryRezzedIceIds ?? [])].sort();
  const derezCardIds: CardInstanceId[] = [];
  for (const iceId of iceIds) {
    const instance = host.state.cardInstances[iceId];
    if (!instance?.rezzed) continue;
    if (
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.zone.serverId !== run.attackedServerId
    )
      continue;
    host.state.cardInstances[iceId] = {
      ...host.cards.withoutVariableIceState(instance),
      faceup: false,
      rezzed: false,
    };
    derezCardIds.push(iceId);
  }
  if (derezCardIds.length > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      oliviaSalazarRunEndDerez: true,
      derezzedCount: derezCardIds.length,
    };
  }
  return {
    handled: derezCardIds.length > 0,
    ...(derezCardIds.length > 0 ? { derezCardIds } : {}),
  };
}

function applyDupreRunEndCounters(
  host: RunEndCleanupHost,
  run: ActiveRun,
): RunDurationCleanupResult {
  const usedBreakerIds = run.dupreUsedBreakerIdsThisRun?.slice().sort() ?? [];
  let placedCounters = 0;
  for (const breakerId of usedBreakerIds) {
    const instance = host.state.cardInstances[breakerId];
    if (!instance || !host.state.runner.rig.programs.includes(breakerId)) continue;
    if (
      !host.ice.icebreakerHasSpecial(
        breakerId,
        "dupre_strength_counter_and_last_fort",
      )
    )
      continue;
    if (
      instance.selectedServerId &&
      instance.selectedServerId !== run.attackedServerId
    ) {
      host.counters.setCardCounter(breakerId, "power", 0);
    }
    host.state.cardInstances[breakerId] = {
      ...host.cards.cardInstanceFor(breakerId),
      selectedServerId: run.attackedServerId,
    };
    host.counters.addCardCounter(breakerId, "power", 1);
    placedCounters += 1;
  }
  return {
    handled: placedCounters > 0,
    ...(placedCounters > 0 ? { placedCounters } : {}),
  };
}

function applyV181SuccessfulRunCounterTriggers(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const sourceIds = host.virus.installedRunnerVirusSourceIds(
    (implementation) =>
      implementation.addOnSuccessfulRun !== undefined &&
      successfulRunMatchesVirusTrigger(host, run, implementation),
  );
  const pattelSources = sourceIds.filter(
    (cardId) =>
      host.virus.virusCounterImplementationForCard(cardId)?.addOnSuccessfulRun
        ?.target === "chosen_fully_broken_ice",
  );
  if (pattelSources.length > 0) {
    const targetIceIds = (run.fullyBrokenIceIds ?? []).filter(
      (targetIceId) => host.state.cardInstances[targetIceId],
    );
    if (targetIceIds.length === 1) {
      const targetIceId = targetIceIds[0]!;
      const added = host.counters.addVirusCounterWithDisinfectantPrevention(
        targetIceId,
        pattelSources.length,
        legalAction,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v181RunnerProgramAbility: "pattels_virus_counter",
          pattelsVirusCounterAdded: added,
          targetCardDefinitionId: host.cards.definitionFor(targetIceId).id,
          remainingCounters: host.counters.cardCounter(targetIceId, "virus"),
        };
      }
    } else if (targetIceIds.length > 1) {
      startPattelsVirusCounterChoice(
        host,
        targetIceIds,
        legalAction,
        pattelSources.length,
      );
    }
  }

  for (const cardId of sourceIds) {
    const implementation = host.virus.virusCounterImplementationForCard(cardId);
    const trigger = implementation?.addOnSuccessfulRun;
    if (!implementation || !trigger || trigger.target === "chosen_fully_broken_ice")
      continue;
    const definition = host.cards.definitionFor(cardId);
    if (
      trigger.target === "corp_purgeable_runner_virus_counter" &&
      CORP_PURGEABLE_SUCCESSFUL_RUN_COUNTERS.has(
        implementation.counterKind as PurgeableRunnerVirusCounterType,
      )
    ) {
      const counterType =
        implementation.counterKind as PurgeableRunnerVirusCounterType;
      const added = addPurgeableRunnerVirusCounter(
        host.state,
        { kind: "corp" },
        counterType,
        trigger.amount,
      );
      if (legalAction) {
        const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          proteusRunnerVirusCounter: true,
          runId: run.runId,
          serverId: run.attackedServerId,
          counterType,
          counterDelta: added,
          counterTotalAfter: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.corp,
            counterType,
          ),
          sourceCardDefinitionId: definition.id,
        };
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
      continue;
    }
    if (trigger.target === "central_server_socket_counters") {
      const socketCounterType = socketCounterTypeForServer(run.attackedServerId);
      if (!socketCounterType) continue;
      const added = addPurgeableRunnerVirusCounter(
        host.state,
        { kind: "server", serverId: run.attackedServerId },
        socketCounterType,
        trigger.amount,
      );
      const pipeCounterAdded = convertCompleteSocketSetsToPipeCounters(host.state);
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          proteusRunnerVirusCounter: true,
          runId: run.runId,
          serverId: run.attackedServerId,
          counterType: socketCounterType,
          counterDelta: added,
          counterTotalAfter: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.servers?.[run.attackedServerId],
            socketCounterType,
          ),
          sourceCardDefinitionId: definition.id,
          ...(pipeCounterAdded > 0
            ? {
                pipeCounterAdded,
                pipeCounterTotalAfter: purgeableRunnerVirusCounterAmount(
                  host.state.purgeableRunnerVirusCounters?.corp,
                  "pipe",
                ),
              }
            : {}),
        };
        const socketEffectInput: Parameters<typeof appendRunnerVirusCounterEffect>[1] = {
          run,
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          side: "corp",
          counterType: socketCounterType,
          added,
          remainingCounters: purgeableRunnerVirusCounterAmount(
            host.state.purgeableRunnerVirusCounters?.servers?.[run.attackedServerId],
            socketCounterType,
          ),
          serverId: run.attackedServerId,
        };
        const socketServerLabel = host.servers.publicServerLabel(run.attackedServerId);
        if (socketServerLabel) socketEffectInput.serverLabel = socketServerLabel;
        appendRunnerVirusCounterEffect(legalAction, socketEffectInput);
        if (pipeCounterAdded > 0) {
          appendRunnerVirusCounterEffect(legalAction, {
            run,
            sourceCardId: cardId,
            sourceDefinitionId: definition.id,
            sourceTitle: definition.title,
            side: "corp",
            counterType: "pipe",
            added: pipeCounterAdded,
            remainingCounters: purgeableRunnerVirusCounterAmount(
              host.state.purgeableRunnerVirusCounters?.corp,
              "pipe",
            ),
          });
        }
      }
      continue;
    }
    if (trigger.target === "source") {
      const added = host.counters.addVirusCounterWithDisinfectantPrevention(
        cardId,
        trigger.amount,
        legalAction,
      );
      if (legalAction) {
        if (implementation.counterKind === "cockroach" && added > 0) {
          appendRunnerVirusCounterEffect(legalAction, {
            run,
            sourceCardId: cardId,
            sourceDefinitionId: definition.id,
            sourceTitle: definition.title,
            side: "corp",
            counterType: "cockroach",
            added,
            remainingCounters: host.counters.cardCounter(cardId, "virus"),
            reason: "cockroach_successful_hq_run",
          });
        }
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "source",
          sourceDefinitionId: definition.id,
          virusCountersAfter: host.counters.cardCounter(cardId, "virus"),
        };
      }
      continue;
    }
    const serverId = run.attackedServerId;
    if (implementation.counterKind === "pox") {
      const current = host.counters.poxCountersForServer(serverId);
      const added = host.counters.preventOneVirusCounterWithDisinfectant().prevented
        ? 0
        : trigger.amount;
      host.state.poxCountersByServer = {
        ...(host.state.poxCountersByServer ?? {}),
        [serverId]: current + added,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v181RunnerProgramAbility: "pox_counter",
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "server",
          sourceDefinitionId: definition.id,
          poxCounterAdded: added,
          poxCountersAfter: current + added,
          targetServerLabel: host.servers.publicServerLabel(serverId) ?? serverId,
        };
      }
      continue;
    }
    if (implementation.counterKind === "fait") {
      const current = Math.max(
        0,
        Math.floor(host.state.faitAccompliCountersByServer?.[serverId] ?? 0),
      );
      const added = host.counters.preventOneVirusCounterWithDisinfectant().prevented
        ? 0
        : trigger.amount;
      host.state.faitAccompliCountersByServer = {
        ...(host.state.faitAccompliCountersByServer ?? {}),
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
          targetServerLabel: host.servers.publicServerLabel(serverId) ?? serverId,
        };
      }
    }
  }
}

function appendRunnerVirusCounterEffect(
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
    reason?: "proteus_runner_virus_successful_run" | "cockroach_successful_hq_run";
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
    reason: input.reason ?? "proteus_runner_virus_successful_run",
    sourceDefinitionId: input.sourceDefinitionId,
    sourceTitle: input.sourceTitle,
    ...(input.serverId ? { serverId: input.serverId } : {}),
    ...(input.serverLabel ? { serverLabel: input.serverLabel } : {}),
  };
  legalAction.resolvedEffects = [...(legalAction.resolvedEffects ?? []), effect];
}

function successfulRunMatchesVirusTrigger(
  host: RunEndCleanupHost,
  run: ActiveRun,
  implementation: CardVirusCounterImplementation,
): boolean {
  const trigger = implementation.addOnSuccessfulRun;
  if (!trigger) return false;
  if (trigger.server === "any") return true;
  if (
    trigger.server === "hq" ||
    trigger.server === "rd" ||
    trigger.server === "archives"
  )
    return run.attackedServerId === trigger.server;
  if (trigger.server === "central")
    return (
      run.attackedServerId === "archives" ||
      run.attackedServerId === "hq" ||
      run.attackedServerId === "rd"
    );
  if (trigger.server === "subsidiary_data_fort") {
    return host.servers.mustServer(run.attackedServerId).kind === "remote";
  }
  return false;
}

function startPattelsVirusCounterChoice(
  host: RunEndCleanupHost,
  targetIceIds: CardInstanceId[],
  legalAction?: LegalAction,
  amount = 1,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = targetIceIds
    .filter((cardId) => host.state.cardInstances[cardId])
    .sort()
    .map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "Gebrochenes ICE",
        value: cardId,
      };
    });
  if (options.length === 0) return;
  host.state.pendingChoice = {
    choiceId: `v181_pattels_virus_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v181.pattels_virus:${options.map((option) => option.value).join(",")}:${host.state.stateVersion + 1}:amount=${amount}`,
    prompt: "Pattel's Virus: ICE für Virus-Counter wählen.",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v181RunnerProgramAbility: "pattels_virus_counter_choice",
      pattelsVirusCandidateCount: options.length,
      pattelsVirusCounterAmount: amount,
      pattelsVirusChoiceOpened: true,
      choiceVisibility: "public",
    };
  }
}

function tokyoChibaUnsuccessfulRunBonus(
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
    return instance.rezzed && host.aftermath.isTokyoUnsuccessfulRunSource(cardId);
  });
  if (!sourceCardId) return { handled: false, amount: 0 };
  const amount = host.aftermath.tokyoUnsuccessfulRunAmountForCard(sourceCardId) ?? 2;
  return {
    handled: amount > 0,
    amount,
    gainedCredits: amount,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
  };
}
