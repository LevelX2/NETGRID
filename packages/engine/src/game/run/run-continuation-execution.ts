import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  SubroutineDefinition,
} from "@netgrid/shared";
import type { DamageSummary as CoreDamageSummary } from "../damage/damage-core";
import {
  appendResolvedSubroutineEffect,
  appendUnpaidPayOrEndRunEffects,
  cleanupEncounterDurationMarkers,
  preparePayOrEndRunSubroutinePayment,
  resolvePostEncounterNetDamage,
  type DamageSummary,
  type EncounterResolutionHost,
} from "./encounter-resolution";
import {
  resolvePrintedDamageSubroutine,
  resolvePrintedRandomDamageSubroutine,
  startTraceFromPrintedSubroutine,
  type EncounterPrintedEffectHost,
} from "./encounter-printed-effects";
import {
  resolveEncounterPrintedNonTraceEffect,
  type EncounterPrintedNonTraceHost,
} from "./encounter-printed-nontrace-effects";
import {
  resolveEncounterSpecialWindowSubroutine,
  type EncounterSpecialWindowHost,
} from "./encounter-special-windows";
import {
  subroutineIsUnavailable,
  trodeSetIgnoresSubroutine,
} from "./trode-set";
import { movePastCurrentIce, type RunMovementHost } from "./run-movement";
import {
  finalizeDelayedSuccessfulRunAfterPassedIce,
  type SuccessfulRunInterventionHost,
} from "./successful-run-interventions";

type ActiveRun = NonNullable<GameState["run"]>;

export type RunContinuationExecutionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
  };
  encounter: {
    currentSubroutines: (
      iceDefinition: CardDefinition,
    ) => readonly SubroutineDefinition[];
    resolutionHost: () => EncounterResolutionHost;
    printedEffectHost: (
      legalAction?: LegalAction,
    ) => EncounterPrintedEffectHost;
    printedNonTraceHost: (
      legalAction?: LegalAction,
    ) => EncounterPrintedNonTraceHost;
    specialWindowHost: () => EncounterSpecialWindowHost;
    successfulRunInterventionHost: () => SuccessfulRunInterventionHost;
  };
  movement: {
    host: () => RunMovementHost;
  };
  damage: {
    createDamageImminentEvent: EncounterPrintedEffectHost["callbacks"]["createDamageImminentEvent"];
    openDamageResolutionWindow: EncounterPrintedEffectHost["callbacks"]["openDamageResolutionWindow"];
    resolveDamageImminentEvent: EncounterPrintedEffectHost["callbacks"]["resolveDamageImminentEvent"];
    setDamagePayload: (
      legalAction: LegalAction,
      summary: CoreDamageSummary,
    ) => void;
  };
  cleanup: {
    resetBreakerStrength: () => void;
  };
  callbacks: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    icebreakerSpecialSourceDefinitionId: (
      breakerId: CardInstanceId,
      special: "bartmoss_post_encounter_self_trash_check",
    ) => string | undefined;
    rollDeterministicDie: (purpose: string) => number;
    trashRunnerInstalledProgram: (breakerId: CardInstanceId) => void;
  };
};

export function continueRun(
  host: RunContinuationExecutionHost,
  legalAction?: LegalAction,
): void {
  assertRequiredHostGroups(host);
  const { state } = host;
  const run = mustRun(state);
  if (run.phase !== "encounter_ice" || !run.encounteredIceId) {
    if (run.phase === "access") {
      host.callbacks.finishRun(true, legalAction);
      return;
    }
    throw new Error("Run kann in diesem Schritt nicht fortgesetzt werden.");
  }
  const definition = host.cards.definitionFor(run.encounteredIceId);
  let ended = false;
  const damageSummaries: DamageSummary[] = [];
  const subroutines = host.encounter.currentSubroutines(definition);
  const payOrEndRunPayment = preparePayOrEndRunSubroutinePayment(
    host.encounter.resolutionHost(),
    subroutines,
    legalAction,
  );
  if (state.runnerCostPenaltySupportWindow) return;
  const payOrEndRunIndexesForThisContinue =
    payOrEndRunPayment.payOrEndRunIndexesForThisContinue ?? new Set<number>();
  const paidPayOrEndRunIndexes =
    payOrEndRunPayment.paidPayOrEndRunIndexes ?? new Set<number>();
  const paidPayOrTrashProgramIndexes =
    payOrEndRunPayment.paidPayOrTrashProgramIndexes ?? new Set<number>();
  const printedNonTraceHost = host.encounter.printedNonTraceHost(legalAction);
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      state.winner ||
      subroutineIsUnavailable(run, index) ||
      ended
    )
      continue;
    if (trodeSetIgnoresSubroutine(state, definition, subroutine)) {
      run.ignoredSubroutineIndexes = [
        ...new Set([...(run.ignoredSubroutineIndexes ?? []), index]),
      ];
      if (legalAction)
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runnerHardwareIgnoredApSubroutine: true,
          ignoredSubroutineIndexes: run.ignoredSubroutineIndexes.join(","),
        };
      continue;
    }
    const runnerForgoneActionOrdinal =
      subroutine.type === "set_runner_forgo_next_action" ||
      subroutine.type === "end_the_run_and_runner_forgoes_next_action"
        ? currentRunnerForgoneActionOrdinal(state)
        : undefined;
    if (subroutine.requiresSuccessfulTraceSubroutineIndex !== undefined) {
      const traceIndex = subroutine.requiresSuccessfulTraceSubroutineIndex;
      if (run.traceSuccessBySubroutineIndex?.[traceIndex] !== true) {
        if (!run.resolvedSubroutineIndexes.includes(index))
          run.resolvedSubroutineIndexes.push(index);
        continue;
      }
    }
    appendResolvedSubroutineEffect(
      legalAction,
      definition,
      index,
      subroutine,
      undefined,
      subroutine.amount !== undefined ? { amount: subroutine.amount } : {},
    );
    if (runnerForgoneActionOrdinal !== undefined && legalAction) {
      const resolvedEffect = legalAction.resolvedEffects?.find(
        (effect) =>
          effect.kind === "resolve_subroutine" &&
          effect.sourceDefinitionId === definition.id &&
          effect.subroutineIndex === index,
      );
      if (resolvedEffect)
        resolvedEffect.runnerForgoneActionOrdinal = runnerForgoneActionOrdinal;
    }
    if (subroutine.type === "initiate_trace") {
      startTraceFromPrintedSubroutine(
        host.encounter.printedEffectHost(legalAction),
        {
          sourceCardInstanceId: run.encounteredIceId,
          subroutineIndex: index,
          subroutine,
          legalAction,
        },
      );
      return;
    }
    if (subroutine.type === "do_damage") {
      const damageResult = resolvePrintedDamageSubroutine(
        host.encounter.printedEffectHost(legalAction),
        {
          definition,
          subroutine,
          subroutineIndex: index,
          damageSummaries,
          legalAction,
        },
      );
      if (damageResult.suspended) return;
      if (state.winner) return;
    }
    if (subroutine.type === "random_damage") {
      const damageResult = resolvePrintedRandomDamageSubroutine(
        host.encounter.printedEffectHost(legalAction),
        {
          definition,
          subroutine,
          subroutineIndex: index,
          damageSummaries,
          legalAction,
        },
      );
      if (damageResult.suspended) return;
      if (state.winner) return;
    }
    const nonTraceResult = resolveEncounterPrintedNonTraceEffect(
      printedNonTraceHost,
      {
        definition,
        subroutine,
        subroutineIndex: index,
        legalAction,
        paidPayOrEndRunIndexes,
        paidPayOrTrashProgramIndexes,
      },
    );
    if (nonTraceResult.suspended) return;
    if (nonTraceResult.runRedirected) return;
    if (!state.run) return;
    if (nonTraceResult.runShouldEnd) ended = true;
    const specialWindow = resolveEncounterSpecialWindowSubroutine(
      host.encounter.specialWindowHost(),
      { definition, subroutine, subroutineIndex: index, legalAction },
    );
    const specialWindowDieRoll =
      "dieRoll" in specialWindow && typeof specialWindow.dieRoll === "number"
        ? specialWindow.dieRoll
        : undefined;
    if (specialWindow.handled && specialWindowDieRoll !== undefined) {
      appendResolvedSubroutineEffect(
        legalAction,
        definition,
        index,
        subroutine,
        undefined,
        { dieRoll: specialWindowDieRoll },
      );
    }
    if (specialWindow.suspended) return;
  }
  ended = appendUnpaidPayOrEndRunEffects({
    definition,
    subroutines,
    legalAction,
    payOrEndRunIndexesForThisContinue,
    paidPayOrEndRunIndexes,
    ended,
  }).ended;
  if (state.winner) return;
  const encounteredIceId = run.encounteredIceId;
  const postEncounterDamage = resolvePostEncounterNetDamage(
    host.encounter.resolutionHost(),
    {
      subroutines,
      damageSummaries,
      legalAction,
      createDamageImminentEvent: (input) =>
        host.damage.createDamageImminentEvent(input),
      openDamageResolutionWindow: (event, action) =>
        host.damage.openDamageResolutionWindow(event, action),
      resolveDamageImminentEvent: (event) =>
        host.damage.resolveDamageImminentEvent(event),
      setDamagePayload: (summary) => {
        if (legalAction) host.damage.setDamagePayload(legalAction, summary);
      },
    },
  );
  if (postEncounterDamage.suspended) return;
  if (state.winner) return;
  cleanupEncounterDurationMarkers(host.encounter.resolutionHost());
  host.cleanup.resetBreakerStrength();
  if (ended) {
    host.callbacks.finishRun(false, legalAction);
    return;
  }
  applyBartmossPostEncounterTrigger(host, run, legalAction);
  if (encounteredIceId)
    finalizeDelayedSuccessfulRunAfterPassedIce(
      host.encounter.successfulRunInterventionHost(),
      encounteredIceId,
      legalAction,
    );
  movePastCurrentIce(host.movement.host(), legalAction);
}

function currentRunnerForgoneActionOrdinal(
  state: GameState,
): number | undefined {
  const clicksBefore = Math.max(0, Math.floor(state.runner.clicks));
  if (clicksBefore <= 0) return undefined;
  const baseActionCount = Math.max(
    0,
    Math.floor(state.runnerActionsPerTurnOverride ?? 4),
  );
  const turnActionCapacity = Math.max(baseActionCount, clicksBefore);
  return turnActionCapacity - clicksBefore + 1;
}

function applyBartmossPostEncounterTrigger(
  host: RunContinuationExecutionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter?.slice() ?? [];
  if (usedBreakerIds.length === 0) return;
  const encounteredIceId = run.encounteredIceId ?? "unknown_ice";
  const outcomes: Array<{
    breakerId: CardInstanceId;
    die: number;
    trashed: boolean;
  }> = [];
  for (const breakerId of usedBreakerIds) {
    if (!host.state.runner.rig.programs.includes(breakerId)) continue;
    const sourceDefinitionId =
      host.callbacks.icebreakerSpecialSourceDefinitionId(
        breakerId,
        "bartmoss_post_encounter_self_trash_check",
      );
    if (!sourceDefinitionId) continue;
    const die = host.callbacks.rollDeterministicDie(
      `${sourceDefinitionId}.post_encounter.${run.runId}.${encounteredIceId}.${breakerId}`,
    );
    const trashed = die === 1;
    if (trashed) host.callbacks.trashRunnerInstalledProgram(breakerId);
    outcomes.push({ breakerId, die, trashed });
  }
  if (legalAction && outcomes.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bartmossPostEncounterChecked: true,
      bartmossPostEncounterOutcomes: outcomes
        .map(
          (outcome) =>
            `${outcome.breakerId}:${outcome.die}:${outcome.trashed ? "trashed" : "survived"}`,
        )
        .join(","),
    };
  }
}

function assertRequiredHostGroups(host: RunContinuationExecutionHost): void {
  for (const group of [
    "state",
    "cards",
    "encounter",
    "movement",
    "damage",
    "cleanup",
    "callbacks",
  ] as const) {
    if (!host[group])
      throw new Error(`RunContinuationExecutionHost missing group: ${group}`);
  }
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
