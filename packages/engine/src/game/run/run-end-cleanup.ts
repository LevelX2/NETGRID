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
import { icebreakerHasRunEndCounterAward } from "../../ability-engine/icebreaker-abilities";
import type { SuccessfulRunFollowupExecutionResult } from "./successful-run-interventions";
import {
  applyV181SuccessfulRunCounterTriggers,
  compactPurgeableRunnerVirusCounters,
  purgeableRunnerVirusCounterAmount,
  setPurgeableRunnerVirusCounterAmount,
  unsuccessfulRunCorpCreditBonus,
} from "./run-end-counter-triggers";
import type {
  ActiveRun,
  PostRunBridgeResult,
  RunDurationCleanupResult,
  RunEndDamageSummary,
  RunEndAftermathResult,
  RunEndCleanupHost,
  RunEndCleanupResult,
  RunEndTagContinuation,
  RunnerTurnFlags,
  RunTemporaryCreditCleanupResult,
} from "./run-end-cleanup-contracts";
import { successfulRunServerId } from "./run-server-identities";

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
  tagContinuation?: RunEndTagContinuation,
): RunEndCleanupResult {
  // Die Reihenfolge ist Teil des Run-End-Vertrags: Run-Marker und temporäre
  // Werte müssen noch vorhanden sein, solange Trigger und Kosten sie auswerten.
  const resumeAfterTag = tagContinuation !== undefined;
  const run = host.state.run;
  if (!resumeAfterTag && run)
    clearEncounterTemporaryTraceCredits(run, legalAction);
  const fortBoundBreakerCounterAward =
    !resumeAfterTag && run
      ? applyFortBoundBreakerRunEndCounters(host, run)
      : { handled: false };
  const temporaryDiscountedDerez =
    !resumeAfterTag && run
      ? derezTemporaryDiscountedRunIce(host, run, legalAction)
      : { handled: false };
  if (!resumeAfterTag && run && successful)
    applyV181SuccessfulRunCounterTriggers(host, run, legalAction);
  if (!resumeAfterTag && run && successful)
    host.followups.applySuccessfulRunExtraRunFollowup(legalAction);
  if (!resumeAfterTag && run)
    applyRunEndVirusAccessTrashCounterRemoval(host, run, legalAction);
  if (!resumeAfterTag && run && successful) {
    const serverId = successfulRunServerId(run);
    const flags = host.runner.ensureTurnFlags();
    flags.successfulRunThisTurn = true;
    flags.lastSuccessfulRunServerId = serverId;
    if (serverId === "hq") flags.successfulHqRunThisTurn = true;
    if (serverId === "rd") flags.successfulRdRunThisTurn = true;
    if (
      (serverId === "hq" || serverId === "rd") &&
      (Math.max(0, Math.floor(run.liberatedBlackOpsAgendaCount ?? 0)) > 0 ||
        Math.max(0, Math.floor(run.trashedBlackOpsCount ?? 0)) > 0)
    ) {
      flags.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn = true;
    }
  }
  if (
    run &&
    applyBadPublicityRunAftermath(
      host,
      run,
      successful,
      legalAction,
      tagContinuation,
    )
  ) {
    return {
      handled: true,
      runWasSuccessful: successful,
      serverId: run.attackedServerId,
      ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
      stateChanged: true,
    };
  }
  const sequenceRun = run
    ? applyMultiServerSuccessSequenceRunResult(
        host,
        run,
        successful,
        legalAction,
      )
    : { handled: false };
  const bonusRunOnFinish = run?.grantBonusRunOnFinish === true;
  const bonus = successful ? (run?.pendingSuccessBonusCredits ?? 0) : 0;
  const corpBonus = unsuccessfulRunCorpCreditBonus(host, run, successful);
  host.followups.cleanupDelayedSuccessfulRunTemporaryIce(run, legalAction);
  if (run) host.followups.resolveTestSpinRunEnd(run, legalAction);
  host.credits.gainRunner(bonus);
  host.credits.gainCorp(corpBonus.amount);
  if (run && corpBonus.amount > 0 && legalAction) {
    if (!corpBonus.sourceCardId)
      throw new Error(
        "Unsuccessful-run credit bonus requires its source card.",
      );
    const sourceDefinition = host.cards.definitionFor(corpBonus.sourceCardId);
    const sourceDefinitionId = sourceDefinition.id;
    const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      unsuccessfulRunCorpCreditBonus: true,
      sourceDefinitionId,
      serverId: run.attackedServerId,
      corpCreditsGained: corpBonus.amount,
      corpCreditsAfter: host.state.corp.credits,
      ...(corpBonus.sourceCardId
        ? { sourceCardId: corpBonus.sourceCardId }
        : {}),
    };
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      {
        effectId: `${run.runId}.${
          corpBonus.sourceCardId ?? "unsuccessful-run-corp-credit-bonus"
        }.unsuccessful_run.gain_credits`,
        kind: "gain_credits",
        visibility: "public",
        side: "corp",
        amount: corpBonus.amount,
        reason: "unsuccessful_run",
        sourceDefinitionId,
        sourceTitle: sourceDefinition?.title ?? "Unsuccessful run credit bonus",
        serverId: run.attackedServerId,
        ...(serverLabel ? { serverLabel } : {}),
      },
    ];
  }
  let postRunBridge: PostRunBridgeResult = { handled: false };
  if (bonusRunOnFinish && !host.state.winner) {
    host.runner.ensureTurnFlags().bonusRunPending = true;
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
  const runEndTrash = run
    ? applyRunEndTrashUsedBreakers(host, run, legalAction)
    : { handled: false };
  resetBreakerStrength(host.state);
  delete host.state.run;
  host.state.phase = "runner_action_phase";
  host.state.timingPoint = "runner_action.main";
  host.state.activeSide = "runner";
  if (!sequenceRun.deferActionDebtConsumption)
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
    ...(temporary.damageType !== undefined
      ? { damageType: temporary.damageType }
      : {}),
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
    ...(temporaryDiscountedDerez.derezCardIds
      ? { derezCardIds: temporaryDiscountedDerez.derezCardIds }
      : {}),
    ...(fortBoundBreakerCounterAward.placedCounters !== undefined
      ? { placedCounters: fortBoundBreakerCounterAward.placedCounters }
      : {}),
    ...(runEndTrash.handled ? { stateChanged: true } : {}),
    ...(corpBonus.amount > 0 ? { gainedCredits: corpBonus.amount } : {}),
    ...(legalAction?.payload ? { resolvedPayload: legalAction.payload } : {}),
    stateChanged: true,
  };
}

export function applyRunEndVirusAccessTrashCounterRemoval(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const uses = run.virusAccessTrashCounterUses ?? [];
  if (uses.length === 0) return;
  const corpCounters = host.state.purgeableRunnerVirusCounters?.corp;
  if (!corpCounters)
    throw new Error("Run-end virus access-trash counters are missing.");
  for (const use of uses) {
    const before = purgeableRunnerVirusCounterAmount(
      corpCounters,
      use.counterType,
    );
    const removed = Math.min(before, use.removeAtRunEnd);
    setPurgeableRunnerVirusCounterAmount(
      corpCounters,
      use.counterType,
      before - removed,
    );
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        proteusRunnerVirusFreeTrashCounterType: use.counterType,
        garbageCountersSpent: removed,
        garbageCountersAfter: before - removed,
        garbageCounterRemovalSourceDefinitionId: use.sourceDefinitionId,
      };
    }
  }
  compactPurgeableRunnerVirusCounters(host.state);
}

export function recordRunEndTrashBreakerUsage(
  host: RunEndCleanupHost,
  breakerId: CardInstanceId,
): void {
  const run = host.state.run;
  if (!run || !host.state.runner.rig.programs.includes(breakerId)) return;
  if (!host.ice.icebreakerHasSpecial(breakerId, "run_end_trash_source_if_used"))
    return;
  const usedBreakerIds = run.runEndTrashUsedBreakerIdsThisRun ?? [];
  if (!usedBreakerIds.includes(breakerId))
    run.runEndTrashUsedBreakerIdsThisRun = [
      ...usedBreakerIds,
      breakerId,
    ].sort();
}

export function applyRunEndTrashUsedBreakers(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): RunDurationCleanupResult {
  const usedBreakerIds = [
    ...new Set(run.runEndTrashUsedBreakerIdsThisRun ?? []),
  ]
    .filter((breakerId) => host.state.runner.rig.programs.includes(breakerId))
    .filter((breakerId) =>
      host.ice.icebreakerHasSpecial(breakerId, "run_end_trash_source_if_used"),
    )
    .sort();
  if (usedBreakerIds.length === 0) return { handled: false };
  if (!host.cleanup.trashRunnerInstalledProgram)
    throw new Error("Run-End-Programmtrash-Callback fehlt.");

  const trashedDefinitionIds: CardDefinitionId[] = [];
  for (const breakerId of usedBreakerIds) {
    trashedDefinitionIds.push(host.cards.definitionFor(breakerId).id);
    host.cleanup.trashRunnerInstalledProgram(breakerId);
  }
  const trashedCardDefinitionId = trashedDefinitionIds[0];
  if (!trashedCardDefinitionId) return { handled: false };

  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "run_end_trash_used_breaker",
      trashedCount: trashedDefinitionIds.length,
      trashedCardDefinitionId,
      publicRevealDefinitionIds: trashedDefinitionIds.join(","),
    };
  }

  return {
    handled: true,
  };
}

export function applyRunCreditSpendCapShortfall(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): { handled: boolean; shortfall: number; lostCredits: number } {
  const cap = run.runCreditSpendCap;
  if (!cap) return { handled: false, shortfall: 0, lostCredits: 0 };
  const announced = Math.max(0, Math.floor(cap.announcedSpendCap ?? 0));
  const spent = Math.max(0, Math.floor(cap.spentDuringRun ?? 0));
  const shortfall = Math.max(0, announced - spent);
  const lostCredits = Math.min(
    shortfall,
    Math.max(0, host.state.runner.credits),
  );
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

export function applyBadPublicityRunAftermath(
  host: RunEndCleanupHost,
  run: ActiveRun,
  successful: boolean,
  legalAction?: LegalAction,
  tagContinuation?: RunEndTagContinuation,
): boolean {
  const resumeAfterTag = tagContinuation !== undefined;
  const aftermath = run.badPublicityRunAftermath;
  if (!aftermath) return false;
  let badPublicityAdded = 0;
  if (aftermath.kind === "successful_run_draw_event") {
    if (!successful) return false;
    let tagsAdded = tagContinuation
      ? Math.max(0, host.state.runner.tags - tagContinuation.runnerTagsBefore)
      : 2;
    if (!resumeAfterTag) {
      if (!legalAction)
        throw new Error("Run-end Add-Tag braucht eine LegalAction.");
      host.state.pendingAddTagContinuation = {
        kind: "run_end_cleanup",
        runId: run.runId,
        successful,
        runnerTagsBefore: host.state.runner.tags,
      };
      if (
        host.tags.addRunnerTagsWithPrevention(
          legalAction,
          tagsAdded,
          aftermath.sourceDefinitionId,
        )
      ) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
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
        return true;
      }
      const runnerTagsBefore =
        host.state.pendingAddTagContinuation.runnerTagsBefore;
      delete host.state.pendingAddTagContinuation;
      tagsAdded = Math.max(0, host.state.runner.tags - runnerTagsBefore);
    }
    badPublicityAdded =
      Math.max(0, Math.floor(run.encounteredBlackIceCount ?? 0)) +
      Math.max(0, Math.floor(run.rezzedBlackOpsCount ?? 0)) +
      Math.max(0, Math.floor(run.liberatedBlackOpsAgendaCount ?? 0));
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded,
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
  if (badPublicityAdded <= 0) return false;
  const before = host.state.corp.badPublicity;
  host.state.corp.badPublicity += badPublicityAdded;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: aftermath.sourceDefinitionId,
      badPublicityAdded:
        Math.max(
          0,
          Math.floor(Number(legalAction.payload?.badPublicityAdded ?? 0)),
        ) + badPublicityAdded,
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
  return false;
}

export function resumeRunEndCleanupAfterTagPrevention(
  host: RunEndCleanupHost,
  legalAction: LegalAction,
): RunEndCleanupResult {
  const continuation = host.state.pendingAddTagContinuation;
  const run = host.state.run;
  if (
    !continuation ||
    continuation.kind !== "run_end_cleanup" ||
    !run ||
    run.runId !== continuation.runId
  )
    throw new Error("Die Run-end-Tag-Fortsetzung ist veraltet.");
  if (host.state.pendingChoice || host.state.eventModificationWindow)
    throw new Error("Das Add-Tag-Fenster ist noch nicht abgeschlossen.");
  delete host.state.pendingAddTagContinuation;
  return handleRunEndCleanup(
    host,
    continuation.successful,
    legalAction,
    continuation,
  );
}

export function applyMultiServerSuccessSequenceRunResult(
  host: RunEndCleanupHost,
  run: ActiveRun,
  successful: boolean,
  legalAction?: LegalAction,
): { handled: boolean; deferActionDebtConsumption?: boolean } {
  const sequence = run.activeSequence;
  if (!sequence) return { handled: false };
  const successfulServerIds = successful
    ? [...sequence.successfulServerIds, run.attackedServerId]
    : sequence.successfulServerIds;
  const anyUnsuccessful = sequence.anyUnsuccessful || !successful;
  const remainingPendingServerIds =
    sequence.pendingServerIds[0] === run.attackedServerId
      ? sequence.pendingServerIds.slice(1)
      : sequence.pendingServerIds.filter(
          (serverId) => serverId !== run.attackedServerId,
        );
  if (remainingPendingServerIds.length > 0) {
    replacePendingSequence(host.runner.ensureTurnFlags(), {
      ...sequence,
      pendingServerIds: remainingPendingServerIds,
      successfulServerIds,
      anyUnsuccessful,
    });
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        multiServerSuccessSequenceRunSuccessful: successful,
        multiServerSuccessSequenceAnyUnsuccessful: anyUnsuccessful,
        multiServerSuccessSequencePendingServerCount:
          remainingPendingServerIds.length,
        sourceDefinitionId: sequence.sourceDefinitionId,
      };
    }
    return { handled: true, deferActionDebtConsumption: true };
  }
  removePendingSequence(host.runner.ensureTurnFlags(), sequence);
  if (anyUnsuccessful) {
    if (host.runner.addFutureActionDebt) {
      host.runner.addFutureActionDebt(1);
    } else {
      const flags = host.runner.ensureTurnFlags();
      flags.forgoNextActionsPending =
        Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + 1;
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        multiServerSuccessSequenceComplete: true,
        multiServerSuccessSequenceFailed: true,
        multiServerSuccessSequenceAnyUnsuccessful: true,
        actionDebtAdded: 1,
        sourceDefinitionId: sequence.sourceDefinitionId,
      };
    }
    return { handled: true, deferActionDebtConsumption: true };
  }
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
      multiServerSuccessSequenceComplete: true,
      multiServerSuccessSequenceSuccessfulServerCount:
        successfulServerIds.length,
      sourceDefinitionId: sequence.sourceDefinitionId,
    };
  }
  return { handled: true };
}

export function replacePendingSequence(
  flags: RunnerTurnFlags,
  nextSequence: NonNullable<ActiveRun["activeSequence"]>,
): void {
  flags.pendingSequences = [
    ...(flags.pendingSequences ?? []).filter(
      (sequence) => !samePendingSequenceSource(sequence, nextSequence),
    ),
    nextSequence,
  ];
}

export function removePendingSequence(
  flags: RunnerTurnFlags,
  sequenceToRemove: NonNullable<ActiveRun["activeSequence"]>,
): void {
  flags.pendingSequences = (flags.pendingSequences ?? []).filter(
    (sequence) => !samePendingSequenceSource(sequence, sequenceToRemove),
  );
  if (flags.pendingSequences.length === 0) delete flags.pendingSequences;
}

export function samePendingSequenceSource(
  left: NonNullable<RunnerTurnFlags["pendingSequences"]>[number],
  right: NonNullable<ActiveRun["activeSequence"]>,
): boolean {
  return (
    left.kind === right.kind &&
    left.sourceCardId === right.sourceCardId &&
    left.sourceDefinitionId === right.sourceDefinitionId
  );
}

export function recordFortBoundBreakerUsage(
  host: RunEndCleanupHost,
  breakerId: CardInstanceId,
  awardsRunEndCounter: boolean,
): void {
  const run = host.state.run;
  if (!run) return;
  const instance = host.cards.cardInstanceFor(breakerId);
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
  if (!awardsRunEndCounter) return;
  const usedBreakerIds = run.runEndCounterAwardBreakerIds ?? [];
  if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
  run.runEndCounterAwardBreakerIds = usedBreakerIds;
}

export function resolveBrokenIceVirusCounterChoice(
  host: RunEndCleanupHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("broken_ice.virus_counter"))
    throw new Error("Es ist keine Broken-ICE-Virus-Counter-Choice offen.");
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
  const targetIceId = typeof option?.value === "string" ? option.value : "";
  if (
    !targetIceId ||
    !choice.source.includes(targetIceId) ||
    !host.state.cardInstances[targetIceId]
  ) {
    throw new Error("Die Broken-ICE-Virus-Counter-Auswahl ist ungueltig.");
  }
  const amount = Math.max(
    1,
    Math.floor(Number(choice.source.match(/amount=(\d+)/)?.[1] ?? 1)),
  );
  if (!choice.source.includes("counterType=pattel"))
    throw new Error("Der Broken-ICE-Virus-Counter-Typ ist ungueltig.");
  const added = host.counters.addVirusCounterWithCounterPrevention(
    targetIceId,
    "pattel",
    amount,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    abilityId: "broken_ice_virus_counter",
    brokenIceVirusCounterAdded: added,
    targetCardDefinitionId: host.cards.definitionFor(targetIceId).id,
    remainingCounters: host.counters.cardCounter(targetIceId, "pattel"),
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

export function applyRunnerRunTemporaryCreditCleanupAndDamage(
  host: RunEndCleanupHost,
  run: ActiveRun | undefined,
  legalAction?: LegalAction,
): RunTemporaryCreditCleanupResult {
  if (!run) return { handled: false };
  const runTemporaryCredits = run.runnerRunTemporaryCredits;
  const corpRunTemporaryCredits = run.corpRunTemporaryCredits;
  const unpreventableCoreDamage = run.unpreventableCoreDamageAtRunEnd;
  if (
    !runTemporaryCredits &&
    !corpRunTemporaryCredits &&
    !unpreventableCoreDamage
  )
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

export function derezTemporaryDiscountedRunIce(
  host: RunEndCleanupHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): RunDurationCleanupResult {
  const iceIds = [...new Set(run.temporaryDiscountedRezzedIceIds ?? [])].sort();
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
      temporaryDiscountedRunEndDerez: true,
      derezzedCount: derezCardIds.length,
    };
  }
  return {
    handled: derezCardIds.length > 0,
    ...(derezCardIds.length > 0 ? { derezCardIds } : {}),
  };
}

export function applyFortBoundBreakerRunEndCounters(
  host: RunEndCleanupHost,
  run: ActiveRun,
): RunDurationCleanupResult {
  const usedBreakerIds = run.runEndCounterAwardBreakerIds?.slice().sort() ?? [];
  let placedCounters = 0;
  for (const breakerId of usedBreakerIds) {
    const instance = host.state.cardInstances[breakerId];
    if (!instance || !host.state.runner.rig.programs.includes(breakerId))
      continue;
    if (!icebreakerHasRunEndCounterAward(host.cards.definitionFor(breakerId)))
      continue;
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

export type {
  PostRunBridgeResult,
  RunDurationCleanupResult,
  RunEndAftermathResult,
  RunEndCleanupHost,
  RunEndCleanupResult,
  RunTemporaryCreditCleanupResult,
} from "./run-end-cleanup-contracts";
