import {
  type CardDefinition,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type DamageType,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type SubroutineDefinition,
  type TraceSuccessEffect,
  type ServerId,
} from "@netgrid/shared";
import { MICROTECH_TRODE_SET_ID } from "../../compatibility/runtime-compatibility";
import { describeTraceResultFromTrace } from "../trace/trace-result";
import {
  appendResolvedSubroutineEffect,
  type DamageSummary,
} from "./encounter-resolution";

type ActiveRun = NonNullable<GameState["run"]>;
type CurrentTrace = NonNullable<GameState["trace"]>;

export type EncounterPrintedEffectHost = {
  state: GameState;
  callbacks: {
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addHackerTrackerTraceCounters: () => number;
    calculateRunnerLink: () => number;
    cardCounter: (cardId: CardInstanceId, counterType: CounterType) => number;
    createDamageImminentEvent: (request: {
      damageId: string;
      damageType: DamageType;
      amount: number;
      source: string;
    }) => ImminentEvent;
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    ensureRunnerTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
    finishRun: (successful: boolean) => void;
    hasInstalledMicrotechTrodeSet: () => boolean;
    hackerTrackerCounterTotal: () => number;
    krumzTraceBitTotal: () => number;
    openEventModificationWindow: (
      event: ImminentEvent,
      legalAction: LegalAction,
    ) => boolean;
    openReplacementWindow: (
      event: ImminentEvent,
      legalAction: LegalAction,
    ) => boolean;
    openDamageResolutionWindow: (
      event: ImminentEvent,
      legalAction: LegalAction,
    ) => boolean;
    parisCityGridTracePoolSource: () =>
      | { cardId: CardInstanceId; serverId: Exclude<ServerId, "new_remote"> }
      | undefined;
    rabbitTraceLimitReductionForIceTrace: () => number;
    resolveDamageImminentEvent: (event: ImminentEvent) => DamageSummary;
    resolveTraceHardwareWreckerSuccess: (
      sourceDefinitionId: string,
      sourceCardInstanceId: CardInstanceId,
      traceId: string,
    ) => Record<string, unknown>;
    resolveTraceTrashRunnerResourceSuccess: (
      sourceDefinitionId: string,
      sourceCardInstanceId: CardInstanceId,
      traceId: string,
      targetCardId: CardInstanceId,
    ) => Record<string, unknown>;
    resolveTrashInstalledProgramSubroutine: (
      legalAction?: LegalAction,
    ) => { definitionId: string; title: string } | undefined;
    setDamagePayload: (summary: DamageSummary) => void;
    supportsTraceSuccessEffect: (effect: TraceSuccessEffect) => boolean;
    traceBidChoice: (
      side: "corp" | "runner",
      traceId: string,
      prompt: string,
      maxBid: number,
    ) => ChoiceRequest;
  };
};

export type EncounterPrintedEffectResult = {
  handled: boolean;
  suspended?: boolean;
  stateChanged?: boolean;
};

export type PrintedDamageResult = EncounterPrintedEffectResult & {
  damageSummary?: DamageSummary;
  damageType?: DamageType;
  damageAmount?: number;
};

export type PrintedTraceStartResult = EncounterPrintedEffectResult & {
  traceId?: string;
  baseTraceStrength?: number;
  corpBidMax?: number;
};

export type TraceSuccessFollowupResult = EncounterPrintedEffectResult & {
  traceSuccessful?: boolean;
  tagsAdded?: number;
  hackerTrackerCountersAdded?: number;
  runnerRunEnded?: boolean;
  runnerRunLockCreditCost?: number;
  payload: Record<string, unknown>;
};

export function encounterPrintedEffectHost(
  state: GameState,
  callbacks: EncounterPrintedEffectHost["callbacks"],
): EncounterPrintedEffectHost {
  return { state, callbacks };
}

export function isSupportedEncounterTraceSuccessEffect(
  effect: TraceSuccessEffect,
  traceCounterEffectDefinitionFor: (counterType: unknown) => unknown,
): boolean {
  if (effect.type === "none") return true;
  if (effect.type === "add_counter") {
    return (
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (effect.type === "add_tag_and_counter") {
    return (
      Number.isInteger(effect.tagAmount) &&
      effect.tagAmount >= 0 &&
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (
    effect.type === "end_run_and_run_lock" ||
    effect.type === "end_run_trash_program_and_run_lock"
  ) {
    return Number.isInteger(effect.amount) && effect.amount > 0;
  }
  if (effect.type === "end_run_trash_hardware_and_unpreventable_meat_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  if (effect.type === "net_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  if (effect.type === "add_tags_by_trace_margin_over_runner_link") return true;
  if (effect.type === "trash_runner_resource_and_add_tag")
    return (
      typeof effect.targetCardInstanceId === "string" &&
      effect.targetCardInstanceId.length > 0
    );
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}

export function resolvePrintedDamageSubroutine(
  host: EncounterPrintedEffectHost,
  options: {
    definition: CardDefinition;
    subroutine: SubroutineDefinition;
    subroutineIndex: number;
    damageSummaries: DamageSummary[];
    legalAction?: LegalAction | undefined;
  },
): PrintedDamageResult {
  if (options.subroutine.type !== "do_damage") return { handled: false };
  const state = host.state;
  const run = mustRun(state);
  const { definition, subroutine, subroutineIndex, legalAction } = options;
  const damageType = subroutine.damageType ?? "net";
  const printedAmount = subroutine.amount ?? 1;
  const microtechApNetReduction =
    damageType === "net" &&
    printedAmount > 1 &&
    cardHasSubtype(definition, "ap") &&
    host.callbacks.hasInstalledMicrotechTrodeSet();
  const damageAmount = microtechApNetReduction ? 1 : printedAmount;
  const event = host.callbacks.createDamageImminentEvent({
    damageId: `${run.runId}.${run.encounteredIceId}.${subroutineIndex}`,
    damageType,
    amount: damageAmount,
    source: `subroutine:${definition.id}:${subroutine.id}`,
  });
  if (microtechApNetReduction && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerHardwareAbility: "microtech_trode_set_ap_net_damage_reduction",
      sourceDefinitionId: MICROTECH_TRODE_SET_ID,
      printedDamageAmount: printedAmount,
      damageAmount,
    };
  }
  if (
    legalAction &&
    host.callbacks.openDamageResolutionWindow(event, legalAction)
  ) {
    if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
      run.resolvedSubroutineIndexes.push(subroutineIndex);
    return {
      handled: true,
      suspended: true,
      damageType,
      damageAmount,
      stateChanged: true,
    };
  }
  const summary = host.callbacks.resolveDamageImminentEvent(event);
  options.damageSummaries.push(summary);
  appendResolvedSubroutineEffect(
    legalAction,
    definition,
    subroutineIndex,
    subroutine,
    summary,
  );
  if (legalAction)
    host.callbacks.setDamagePayload(aggregateDamageSummaries(options.damageSummaries));
  return {
    handled: true,
    damageSummary: summary,
    damageType,
    damageAmount,
    stateChanged: true,
  };
}

export function startTraceFromPrintedSubroutine(
  host: EncounterPrintedEffectHost,
  options: {
    sourceCardInstanceId: CardInstanceId;
    subroutineIndex: number;
    subroutine: SubroutineDefinition;
    legalAction?: LegalAction | undefined;
  },
): PrintedTraceStartResult {
  const { state } = host;
  const { sourceCardInstanceId, subroutineIndex, subroutine, legalAction } =
    options;
  if (subroutine.type !== "initiate_trace") return { handled: false };
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  const baseTraceStrength =
    subroutine.baseTraceStrength ?? subroutine.amount ?? 0;
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0)
    throw new Error("Trace strength ist ungueltig.");
  const traceBidLimit =
    typeof subroutine.traceBidLimit === "number"
      ? Math.max(0, Math.floor(subroutine.traceBidLimit))
      : undefined;
  const successEffect = subroutine.traceSuccessEffect;
  if (!successEffect || !host.callbacks.supportsTraceSuccessEffect(successEffect))
    throw new Error("Dieser Trace-Effekt ist nicht freigegeben.");

  const run = mustRun(state);
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
    run.resolvedSubroutineIndexes.push(subroutineIndex);
  const sourceDefinition = host.callbacks.definitionFor(sourceCardInstanceId);
  const traceId = `${run.runId}.${sourceCardInstanceId}.${subroutineIndex}.trace`;
  const parisPoolSource = host.callbacks.parisCityGridTracePoolSource();
  const encounterTemporaryTraceCredits =
    run.encounterTemporaryTraceCredits?.sourceIceId === sourceCardInstanceId
      ? Math.max(0, Math.floor(run.encounterTemporaryTraceCredits.remaining ?? 0))
      : 0;
  const parisBits = parisPoolSource
    ? host.callbacks.cardCounter(parisPoolSource.cardId, "bit")
    : 0;
  const baseCorpBidMax =
    state.corp.credits +
    encounterTemporaryTraceCredits +
    host.callbacks.hackerTrackerCounterTotal() +
    host.callbacks.krumzTraceBitTotal() +
    parisBits;
  const rabbitTraceLimitReduction =
    host.callbacks.rabbitTraceLimitReductionForIceTrace();
  const corpBidMax = Math.max(
    0,
    Math.min(baseCorpBidMax, traceBidLimit ?? baseCorpBidMax) -
      rabbitTraceLimitReduction,
  );
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinition.id,
    subroutineIndex,
    baseTraceStrength,
    ...(traceBidLimit !== undefined ? { traceBidLimit } : {}),
    corpBidMax,
    ...(rabbitTraceLimitReduction > 0 ? { rabbitTraceLimitReduction } : {}),
    ...(parisPoolSource
      ? {
          parisCityGridPoolSourceCardInstanceId: parisPoolSource.cardId,
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
    ...(encounterTemporaryTraceCredits > 0
      ? {
          encounterTemporaryTraceCreditSourceIceId: sourceCardInstanceId,
          encounterTemporaryTraceCreditSourceDefinitionId: sourceDefinition.id,
        }
      : {}),
    status: "corp_bid",
    successEffect,
  };
  state.pendingChoice = host.callbacks.traceBidChoice(
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    corpBidMax,
  );
  state.activeSide = "corp";
  state.timingPoint = "run.encounter_ice";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceStarted: true,
      traceId,
      sourceCardId: sourceCardInstanceId,
      sourceDefinitionId: sourceDefinition.id,
      baseTraceStrength,
      ...(traceBidLimit !== undefined ? { traceBidLimit } : {}),
      corpBidMax,
      ...(rabbitTraceLimitReduction > 0 ? { rabbitTraceLimitReduction } : {}),
      ...(parisPoolSource
        ? {
            parisCityGridPoolAvailable: parisBits,
            parisCityGridPoolServerId: parisPoolSource.serverId,
            sourceDefinitionId: sourceDefinition.id,
          }
        : {}),
      ...(encounterTemporaryTraceCredits > 0
        ? {
            temporaryTraceCreditsAvailable: encounterTemporaryTraceCredits,
            temporaryTraceCreditsSourceDefinitionId: sourceDefinition.id,
          }
        : {}),
    };
  }
  return {
    handled: true,
    suspended: true,
    traceId,
    baseTraceStrength,
    corpBidMax,
    stateChanged: true,
  };
}

export function applyPrintedTraceSuccessFollowups(
  host: EncounterPrintedEffectHost,
  options: {
    trace: CurrentTrace;
    traceStep: "runner_bid" | "post_bid_link";
    legalAction: LegalAction;
    runnerLinkFallback?: number;
    extraPayload?: Record<string, unknown> | undefined;
    deletePendingChoice?: boolean | undefined;
  },
): TraceSuccessFollowupResult {
  const { state } = host;
  const { trace, traceStep, legalAction } = options;
  const result = describeTraceResultFromTrace(trace, {
    runnerLinkFallback:
      options.runnerLinkFallback ?? host.callbacks.calculateRunnerLink(),
  });
  const traceStrength = result.corpTraceStrength;
  const runnerLink = result.runnerLink;
  const runnerBid = result.runnerBid;
  const runnerStrength = result.runnerTraceStrength;
  const successful = result.successful;
  const tagsAdded = traceSuccessTagAmount(trace.successEffect, successful, result);
  const hackerTrackerCountersAdded =
    host.callbacks.addHackerTrackerTraceCounters();
  const traceAvoidReward = successful
    ? { amount: 0, sourceDefinitionIds: [] as string[] }
    : applyTraceAvoidRewards(host, trace);
  let runnerRunLockCreditCost = 0;
  let runnerRunEnded = false;
  let traceDamagePayload: Record<string, unknown> = {};
  let traceHardwareWreckerPayload: Record<string, unknown> = {};
  let traceResourceTrashPayload: Record<string, unknown> = {};
  if (successful) state.runner.tags += tagsAdded;
  const traceCounterPayload = successful
    ? applyTraceCounterSuccess(host, trace.successEffect)
    : {};
  if (successful && trace.successEffect.type === "trash_runner_resource_and_add_tag") {
    traceResourceTrashPayload =
      host.callbacks.resolveTraceTrashRunnerResourceSuccess(
        trace.sourceDefinitionId,
        trace.sourceCardInstanceId,
        trace.traceId,
        trace.successEffect.targetCardInstanceId,
      );
  }
  if (
    successful &&
    (trace.successEffect.type === "end_run_and_run_lock" ||
      trace.successEffect.type === "end_run_trash_program_and_run_lock")
  ) {
    runnerRunLockCreditCost = trace.successEffect.amount;
    host.callbacks.ensureRunnerTurnFlags().fangRunLockCreditCost =
      runnerRunLockCreditCost;
    runnerRunEnded = true;
    if (trace.successEffect.type === "end_run_trash_program_and_run_lock")
      host.callbacks.resolveTrashInstalledProgramSubroutine(legalAction);
  }
  if (successful && trace.successEffect.type === "net_damage") {
    const damageAmount = Math.max(0, Math.floor(trace.successEffect.amount));
    const event = host.callbacks.createDamageImminentEvent({
      damageId: `${trace.traceId}.success.net_damage`,
      damageType: "net",
      amount: damageAmount,
      source: `trace:${trace.sourceDefinitionId}:${trace.traceId}`,
    });
    if (options.deletePendingChoice) delete state.pendingChoice;
    delete state.trace;
    if (host.callbacks.openDamageResolutionWindow(event, legalAction)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        traceId: trace.traceId,
        traceStep,
        sourceDefinitionId: trace.sourceDefinitionId,
        traceSuccessful: true,
        traceNetDamageAmount: damageAmount,
        damagePreventionWindowOpened: true,
      };
      return {
        handled: true,
        suspended: true,
        traceSuccessful: true,
        tagsAdded,
        hackerTrackerCountersAdded,
        runnerRunEnded,
        runnerRunLockCreditCost,
        payload: legalAction.payload,
        stateChanged: true,
      };
    }
    const summary = host.callbacks.resolveDamageImminentEvent(event);
    host.callbacks.setDamagePayload(summary);
    traceDamagePayload = {
      traceNetDamageAmount: damageAmount,
      damageType: summary.damageType,
      damageAmount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
      ...(summary.coreDamageAfter !== undefined
        ? { coreDamageAfter: summary.coreDamageAfter }
        : {}),
      ...(summary.runnerMaxHandSizeAfter !== undefined
        ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
        : {}),
    };
  }
  if (options.deletePendingChoice) delete state.pendingChoice;
  delete state.trace;
  if (state.run) {
    if (trace.subroutineIndex !== undefined) {
      state.run.traceSuccessBySubroutineIndex = {
        ...(state.run.traceSuccessBySubroutineIndex ?? {}),
        [trace.subroutineIndex]: successful,
      };
    }
    if (
      successful &&
      trace.successEffect.type ===
        "end_run_trash_hardware_and_unpreventable_meat_damage"
    ) {
      traceHardwareWreckerPayload =
        host.callbacks.resolveTraceHardwareWreckerSuccess(
          trace.sourceDefinitionId,
          trace.sourceCardInstanceId,
          trace.traceId,
        );
      if (!state.winner && state.run) host.callbacks.finishRun(false);
    } else if (runnerRunEnded) {
      host.callbacks.finishRun(false);
    } else {
      state.timingPoint = "run.encounter_ice";
      state.activeSide = "runner";
    }
  } else if (
    trace.returnTimingPoint &&
    trace.returnActiveSide &&
    trace.returnPhase
  ) {
    state.timingPoint = trace.returnTimingPoint;
    state.activeSide = trace.returnActiveSide;
    state.phase = trace.returnPhase;
  }
  const payload = {
    traceId: trace.traceId,
    traceStep,
    baseTraceStrength: trace.baseTraceStrength,
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid,
    ...(options.extraPayload ?? {}),
    runnerStrength,
    ...(traceStep === "post_bid_link"
      ? { postBidTraceLinkBonus: trace.postBidLinkBonus ?? 0 }
      : {}),
    traceSuccessful: successful,
    tagsAdded,
    ...traceCounterPayload,
    ...(hackerTrackerCountersAdded > 0
      ? {
          hackerTrackerCountersAdded,
          traceHostedCreditsAdded: hackerTrackerCountersAdded,
        }
      : {}),
    ...(traceAvoidReward.amount > 0
      ? {
          traceAvoidRewardCredits: traceAvoidReward.amount,
          gainedCredits: traceAvoidReward.amount,
          runnerCreditsAfter: state.runner.credits,
          traceAvoidRewardSourceDefinitionIds:
            traceAvoidReward.sourceDefinitionIds.sort().join(","),
        }
      : {}),
    ...(runnerRunEnded
      ? {
          fangRunEnded: true,
          runnerRunEnded: true,
          fangRunLockCreditCost: runnerRunLockCreditCost,
          runnerRunLockCreditCost,
        }
      : {}),
    ...traceHardwareWreckerPayload,
    ...traceResourceTrashPayload,
    ...traceDamagePayload,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return {
    handled: true,
    traceSuccessful: successful,
    tagsAdded,
    hackerTrackerCountersAdded,
    runnerRunEnded,
    runnerRunLockCreditCost,
    payload,
    stateChanged: true,
  };
}

function applyTraceAvoidRewards(
  host: EncounterPrintedEffectHost,
  trace: CurrentTrace,
): { amount: number; sourceDefinitionIds: string[] } {
  let amount = 0;
  const sourceDefinitionIds: string[] = [];
  for (const reward of trace.traceAvoidRewardUsages ?? []) {
    if (!Number.isInteger(reward.amount) || reward.amount <= 0) continue;
    amount += reward.amount;
    sourceDefinitionIds.push(reward.sourceDefinitionId);
  }
  if (amount > 0) host.state.runner.credits += amount;
  return { amount, sourceDefinitionIds };
}

function traceSuccessTagAmount(
  successEffect: TraceSuccessEffect,
  successful: boolean,
  result: ReturnType<typeof describeTraceResultFromTrace>,
): number {
  if (!successful) return 0;
  if (successEffect.type === "add_tag_and_counter")
    return successEffect.tagAmount;
  if (successEffect.type === "add_tag") return successEffect.amount;
  if (successEffect.type === "add_tags_by_trace_margin_over_runner_link")
    return Math.max(0, result.corpTraceStrength - result.runnerLink);
  if (successEffect.type === "trash_runner_resource_and_add_tag") return 1;
  return 0;
}

function applyTraceCounterSuccess(
  host: EncounterPrintedEffectHost,
  successEffect: TraceSuccessEffect,
): Record<string, string | number> {
  if (
    successEffect.type !== "add_counter" &&
    successEffect.type !== "add_tag_and_counter"
  )
    return {};
  host.callbacks.addCardCounter(
    host.state.runner.identity,
    successEffect.counterType,
    successEffect.amount,
  );
  return {
    addedCounterAmount: successEffect.amount,
    counterType: successEffect.counterType,
    remainingCounters: host.callbacks.cardCounter(
      host.state.runner.identity,
      successEffect.counterType,
    ),
  };
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es gibt keinen aktiven Run.");
  return state.run;
}

function aggregateDamageSummaries(summaries: DamageSummary[]): DamageSummary {
  return summaries.reduce<DamageSummary>(
    (aggregate, summary) => ({
      damageType: summary.damageType,
      amount: aggregate.amount + summary.amount,
      cardsTrashed: aggregate.cardsTrashed + summary.cardsTrashed,
      flatline: aggregate.flatline || summary.flatline,
      ...(summary.coreDamageAfter !== undefined
        ? { coreDamageAfter: summary.coreDamageAfter }
        : {}),
      ...(summary.runnerMaxHandSizeAfter !== undefined
        ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
        : {}),
    }),
    {
      damageType: summaries[0]?.damageType ?? "net",
      amount: 0,
      cardsTrashed: 0,
      flatline: false,
    },
  );
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  return (definition.subtypes ?? []).includes(subtype);
}
