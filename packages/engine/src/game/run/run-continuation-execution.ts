import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  SubroutineDefinition,
} from "@netgrid/shared";
import { BARTMOSS_ID } from "../../compatibility/runtime-compatibility";
import type { DamageSummary as CoreDamageSummary } from "../damage/damage-core";
import {
  appendUnpaidPayOrEndRunEffects,
  cleanupEncounterDurationMarkers,
  preparePayOrEndRunSubroutinePayment,
  resolveFatalAttractorPostEncounter,
  type DamageSummary,
  type EncounterResolutionHost,
} from "./encounter-resolution";
import {
  resolvePrintedDamageSubroutine,
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
    printedEffectHost: (legalAction?: LegalAction) => EncounterPrintedEffectHost;
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
    dealDamage: (input: {
      damageId: string;
      damageType: "net";
      amount: number;
      source: string;
    }) => CoreDamageSummary;
    setDamagePayload: (legalAction: LegalAction, summary: CoreDamageSummary) => void;
  };
  cleanup: {
    resetBreakerStrength: () => void;
  };
  callbacks: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    icebreakerHasBartmossPostEncounterSelfTrashCheck: (
      breakerId: CardInstanceId,
    ) => boolean;
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
  const payOrEndRunIndexesForThisContinue =
    payOrEndRunPayment.payOrEndRunIndexesForThisContinue ?? new Set<number>();
  const paidPayOrEndRunIndexes =
    payOrEndRunPayment.paidPayOrEndRunIndexes ?? new Set<number>();
  const paidPayOrTrashProgramIndexes =
    payOrEndRunPayment.paidPayOrTrashProgramIndexes ?? new Set<number>();
  const printedNonTraceHost =
    host.encounter.printedNonTraceHost(legalAction);
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      state.winner ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index) ||
      ended
    )
      continue;
    if (subroutine.requiresSuccessfulTraceSubroutineIndex !== undefined) {
      const traceIndex = subroutine.requiresSuccessfulTraceSubroutineIndex;
      if (run.traceSuccessBySubroutineIndex?.[traceIndex] !== true) {
        if (!run.resolvedSubroutineIndexes.includes(index))
          run.resolvedSubroutineIndexes.push(index);
        continue;
      }
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
    if (nonTraceResult.runShouldEnd) ended = true;
    const specialWindow = resolveEncounterSpecialWindowSubroutine(
      host.encounter.specialWindowHost(),
      { definition, subroutine, subroutineIndex: index, legalAction },
    );
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
  resolveFatalAttractorPostEncounter(host.encounter.resolutionHost(), {
    subroutines,
    damageSummaries,
    legalAction,
    dealDamage: (input) => host.damage.dealDamage(input),
    setDamagePayload: (summary) => {
      if (legalAction) host.damage.setDamagePayload(legalAction, summary);
    },
  });
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
    if (
      !host.callbacks.icebreakerHasBartmossPostEncounterSelfTrashCheck(
        breakerId,
      )
    )
      continue;
    const die = host.callbacks.rollDeterministicDie(
      `${BARTMOSS_ID}.post_encounter.${run.runId}.${encounteredIceId}.${breakerId}`,
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
