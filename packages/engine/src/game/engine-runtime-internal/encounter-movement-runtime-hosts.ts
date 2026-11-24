import { type CardInstanceId, type GameState, type LegalAction } from "@netgrid/shared";
import { definitionFor, mustInstance, mustRun } from "../state/card-server-lookup";
import { rollDeterministicDie } from "../state/draw-random";
import { spendClick } from "../state/economy-mutation";
import { ensureRunnerTurnFlags } from "../state/turn-flags-counters";
import { rezCard as executeRezCard } from "../rez/rez-card";
import { doDamage, setDamagePayload } from "../damage/damage-core";
import { type RunnerAccessActionHost } from "../access/access-actions";
import { type SuccessfulRunInterventionHost } from "../run/successful-run-interventions";
import { recordFortBoundBreakerUsage, recordRunEndTrashBreakerUsage, type RunEndCleanupHost } from "../run/run-end-cleanup";
import { activeRunActionSpendingCapSourceIds, payRunStartTaxCredits, runDurationPaymentHost, spendRunnerRunCredits } from "../run/run-duration-payment";
import { type EncounterResolutionHost } from "../run/encounter-resolution";
import { type EncounterSpecialWindowHost } from "../run/encounter-special-windows";
import { type EncounterPrintedEffectHost } from "../run/encounter-printed-effects";
import { type EncounterPrintedNonTraceHost } from "../run/encounter-printed-nontrace-effects";
import { type RunnerEncounterActionHost } from "../run/encounter-actions";
import { type EncounterEntryHost } from "../run/encounter-entry";
import { passCorpRunRootRezWindow, type RunRezWindowHost } from "../run/run-rez-window";
import { type FortPassWindowHost } from "../run/fort-pass-window";
import { applyOncePerRunBreakTagAndAllStealthLoss, applyPostBreakStealthLoss, shouldOpenAardvarkInterception, startAardvarkInterceptionChoice, type FortRunSideFamiliesHost } from "../run/fort-run-side-families";
import { passApproachedIce, type RunMovementHost } from "../run/run-movement";
import { type RunnerBreakerActionExecutionHost } from "../run/runner-breaker-action-execution";
import { type StartRunActionExecutionHost } from "../run/start-run-action-execution";
import { type RezActionExecutionHost } from "../rez/rez-action-execution";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import type { RuntimeDeps } from "./runtime-shared";

export function createEncounterMovementRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): import("./encounter-movement-runtime-port").EncounterMovementRuntimePort {
  function resolveBlinkBreakSubroutineAction(
    state: GameState,
    breakerId: CardInstanceId,
    subroutineIndex: number,
    legalAction: LegalAction,
  ): void {
    const run = mustRun(state);
    const encounteredIceId = run.encounteredIceId;
    if (!encounteredIceId)
      throw new Error(
        "Blink kann nur waehrend eines ICE-Encounters verwendet werden.",
      );
    if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
      throw new Error("Blink-Subroutinenziel ist ungueltig.");
    const iceDefinition = definitionFor(state, encounteredIceId);
    deps.assertCurrentSubroutineMatchesLegalAction(
      state,
      iceDefinition,
      subroutineIndex,
      legalAction,
    );
    if (
      run.brokenSubroutineIndexes.includes(subroutineIndex) ||
      run.resolvedSubroutineIndexes.includes(subroutineIndex)
    ) {
      throw new Error("Diese Subroutine ist bereits aufgeloest.");
    }
    const blinkUsageByBreaker =
      (run.blinkUsedSubroutinesByBreakerThisEncounter ??= {});
    const usedIndexes = blinkUsageByBreaker[breakerId] ?? [];
    if (usedIndexes.includes(subroutineIndex))
      throw new Error(
        "Blink darf diese Subroutine in diesem Encounter nicht erneut anvisieren.",
      );
    usedIndexes.push(subroutineIndex);
    blinkUsageByBreaker[breakerId] = usedIndexes;

    const sourceDefinitionId = definitionFor(state, breakerId).id;
    const die = rollDeterministicDie(
      state,
      [20, sourceDefinitionId, run.runId, encounteredIceId, breakerId, subroutineIndex],
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      randomBreakOutcomeKind: "random_break_or_damage",
      randomBreakOutcomeRoll: die,
    };
    if (die >= 4) {
      deps.executeEffectCommands(state, [
        { type: "break_subroutine", subroutineIndex },
      ]);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        randomBreakOutcomeSuccess: true,
        randomBreakOutcomeDamageAmount: 0,
      };
      return;
    }

    const damageSummary = doDamage(state, {
      damageId: `v190.blink.${run.runId}.${encounteredIceId}.${breakerId}.${subroutineIndex}`,
      damageType: "net",
      amount: die,
      source: `ability:${sourceDefinitionId}`,
      randomSource: ["c", sourceDefinitionId, breakerId],
    });
    setDamagePayload(legalAction, damageSummary);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      randomBreakOutcomeSuccess: false,
      randomBreakOutcomeDamageAmount: die,
    };
  }

  function recordBartmossEncounterUsage(
    state: GameState,
    breakerId: CardInstanceId,
  ): void {
    const run = state.run;
    if (!run || run.phase !== "encounter_ice") return;
    if (
      !icebreakerHasSpecial(
        state,
        breakerId,
        "bartmoss_post_encounter_self_trash_check",
      )
    )
      return;
    const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter ?? [];
    if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
    run.bartmossUsedBreakerIdsThisEncounter = usedBreakerIds;
  }

  function recordSnowballBreakUsage(
    state: GameState,
    breakerId: CardInstanceId,
  ): void {
    const run = state.run;
    if (
      !run ||
      !icebreakerHasSpecial(
        state,
        breakerId,
        "snowball_run_strength_per_successful_break",
      )
    )
      return;
    const breakerState = run.breakerState ?? {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [],
    };
    run.breakerState = {
      ...breakerState,
      brokenSubroutineCountByBreakerInstanceId: {
        ...breakerState.brokenSubroutineCountByBreakerInstanceId,
        [breakerId]:
          (breakerState.brokenSubroutineCountByBreakerInstanceId[breakerId] ??
            0) + 1,
      },
      strengthModifiersByBreakerInstanceId: {
        ...breakerState.strengthModifiersByBreakerInstanceId,
        [breakerId]: [
          ...(breakerState.strengthModifiersByBreakerInstanceId[breakerId] ??
            []),
          { amount: 1, duration: "current_run", source: "successful_break" },
        ],
      },
    };
  }

  function icebreakerHasSpecial(
    state: GameState,
    breakerId: CardInstanceId,
    special: NonNullable<RuntimeIcebreakerAbility["special"]>,
  ): boolean {
    if (!state.cardInstances[breakerId]) return false;
    return icebreakerAbilitiesForDefinition(
      definitionFor(state, breakerId),
    ).some((ability) => ability.special === special);
  }

  function runnerAccessActionHost(state: GameState): RunnerAccessActionHost {
    return deps.accessFlow.runnerAccessActionHost(state);
  }

  function runnerEncounterActionHostForState(
    state: GameState,
  ): RunnerEncounterActionHost {
    return deps.runFlow.runnerEncounterActionHostForState(state);
  }

  function runMovementHostForState(state: GameState): RunMovementHost {
    return deps.runFlow.runMovementHostForState(state);
  }

  function runRezWindowHostForState(state: GameState): RunRezWindowHost {
    return deps.runFlow.runRezWindowHostForState(state);
  }

  function fortPassWindowHostForState(state: GameState): FortPassWindowHost {
    return deps.runFlow.fortPassWindowHostForState(state);
  }

  function fortRunSideFamiliesHostForState(
    state: GameState,
  ): FortRunSideFamiliesHost {
    return deps.runFlow.fortRunSideFamiliesHostForState(state);
  }

  function encounterEntryHostForState(state: GameState): EncounterEntryHost {
    return deps.runFlow.encounterEntryHostForState(state);
  }

  function successfulRunInterventionHost(
    state: GameState,
  ): SuccessfulRunInterventionHost {
    return deps.runFlow.successfulRunInterventionHost(state);
  }

  function encounterResolutionHostForState(
    state: GameState,
  ): EncounterResolutionHost {
    return deps.runFlow.encounterResolutionHostForState(state);
  }

  function encounterSpecialWindowHostForState(
    state: GameState,
  ): EncounterSpecialWindowHost {
    return deps.runFlow.encounterSpecialWindowHostForState(state);
  }

  function encounterPrintedEffectHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedEffectHost {
    return deps.runFlow.encounterPrintedEffectHostForState(state, legalAction);
  }

  function encounterPrintedNonTraceHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedNonTraceHost {
    return deps.runFlow.encounterPrintedNonTraceHostForState(
      state,
      legalAction,
    );
  }

  function runEndCleanupHost(state: GameState): RunEndCleanupHost {
    return deps.runFlow.runEndCleanupHost(state);
  }

  function runnerBreakerActionExecutionHost(
    state: GameState,
  ): RunnerBreakerActionExecutionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
        effectiveSubtypesForCard: (cardId, definition) =>
          deps.effectiveSubtypesForCard(state, cardId, definition),
      },
      run: {
        currentRun: () => mustRun(state),
        currentEncounterSubroutines: (iceDefinition) =>
          deps.subroutinesForCurrentEncounter(state, iceDefinition),
        runRemainderStrengthBonusForBreaker:
          deps.runRemainderStrengthBonusForBreaker,
        finishRun: (successful, legalAction) =>
          deps.finishRun(state, successful, legalAction),
      },
      breaker: {
        pumpAbilityForLegalAction: (legalAction) =>
          deps.pumpAbilityForLegalAction(state, legalAction),
        pumpAmountForLegalAction: (legalAction) =>
          deps.pumpAmountForLegalAction(state, legalAction),
        pumpDurationForLegalAction: (legalAction) =>
          deps.pumpDurationForLegalAction(state, legalAction),
        breakAbilityForLegalAction: (legalAction) =>
          deps.breakAbilityForLegalAction(state, legalAction),
        assertCurrentSubroutineMatchesLegalAction: (
          iceDefinition,
          subroutineIndex,
          legalAction,
        ) =>
          deps.assertCurrentSubroutineMatchesLegalAction(
            state,
            iceDefinition,
            subroutineIndex,
            legalAction,
          ),
        assertBreakSubroutineCostQuoteValid: (
          breakerId,
          legalAction,
          subroutine,
        ) =>
          deps.assertBreakSubroutineCostQuoteValid(
            state,
            breakerId,
            legalAction,
            subroutine,
          ),
        resolveMultiBreakSubroutinesAction: (breakerId, legalAction, options) =>
          deps.resolveMultiBreakSubroutinesAction(
            state,
            breakerId,
            legalAction,
            options,
          ),
        resolveBlinkBreakSubroutineAction: (
          breakerId,
          subroutineIndex,
          legalAction,
        ) =>
          resolveBlinkBreakSubroutineAction(
            state,
            breakerId,
            subroutineIndex,
            legalAction,
          ),
      },
      payment: {
        spendRunnerRunCredits: (amount, breakerId, legalAction) =>
          spendRunnerRunCredits(
            runDurationPaymentHost(state),
            amount,
            breakerId,
            legalAction,
          ),
      },
      fort: {
        shouldOpenAardvarkInterception: (breakerId) =>
          shouldOpenAardvarkInterception(
            fortRunSideFamiliesHostForState(state),
            breakerId,
          ),
        startAardvarkInterceptionChoice: (breakerId, actionType, legalAction) =>
          startAardvarkInterceptionChoice(
            fortRunSideFamiliesHostForState(state),
            breakerId,
            actionType,
            legalAction,
          ),
        applyPostBreakStealthLoss: (breakerId, legalAction) =>
          applyPostBreakStealthLoss(
            fortRunSideFamiliesHostForState(state),
            breakerId,
            legalAction,
          ),
        applyOncePerRunBreakTagAndAllStealthLoss: (breakerId, legalAction) =>
          applyOncePerRunBreakTagAndAllStealthLoss(
            fortRunSideFamiliesHostForState(state),
            breakerId,
            legalAction,
          ),
      },
      effects: {
        executeEffectCommands: (commands) =>
          deps.executeEffectCommands(state, commands),
        addRunnerFutureActionDebt: (amount) =>
          deps.addRunnerFutureActionDebt(state, amount),
      },
      turn: {
        ensureRunnerTurnFlags: () => ensureRunnerTurnFlags(state),
      },
      tracking: {
        recordBartmossEncounterUsage: (breakerId) =>
          recordBartmossEncounterUsage(state, breakerId),
        recordFortBoundBreakerUsage: (breakerId, awardsRunEndCounter) =>
          recordFortBoundBreakerUsage(
            runEndCleanupHost(state),
            breakerId,
            awardsRunEndCounter,
          ),
        recordSnowballBreakUsage: (breakerId) =>
          recordSnowballBreakUsage(state, breakerId),
        recordRunEndTrashBreakerUsage: (breakerId) =>
          recordRunEndTrashBreakerUsage(runEndCleanupHost(state), breakerId),
      },
    };
  }

  function startRunActionExecutionHost(
    state: GameState,
  ): StartRunActionExecutionHost {
    return {
      state,
      payment: {
        spendRunnerClick: () => spendClick(state, "runner"),
        payRunStartTaxCredits: (legalAction) =>
          payRunStartTaxCredits(runDurationPaymentHost(state), legalAction),
      },
      turn: {
        ensureRunnerTurnFlags: () => ensureRunnerTurnFlags(state),
      },
      run: {
        startRun: (serverId, legalAction, options) =>
          runtime.startRun(state, serverId, undefined, 1, options, legalAction),
        activeRunActionSpendingCapSourceIds: () =>
          activeRunActionSpendingCapSourceIds(runDurationPaymentHost(state)),
      },
    };
  }

  function rezActionExecutionHost(state: GameState): RezActionExecutionHost {
    return {
      rez: {
        executeRezCard: (cardId, rootRez, legalAction) =>
          executeRezCard(deps.rezCardHost(state), cardId, rootRez, legalAction),
        expireScoredAgendaInstallRezCreditAbilities: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
      },
      run: {
        passCorpRunRootRezWindow: (legalAction) =>
          passCorpRunRootRezWindow(
            runRezWindowHostForState(state),
            legalAction,
          ),
        passApproachedIce: (legalAction) =>
          passApproachedIce(runMovementHostForState(state), legalAction),
      },
    };
  }

  return {
    resolveBlinkBreakSubroutineAction,
    recordBartmossEncounterUsage,
    recordSnowballBreakUsage,
    icebreakerHasSpecial,
    runnerAccessActionHost,
    runnerEncounterActionHostForState,
    runMovementHostForState,
    runRezWindowHostForState,
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    encounterEntryHostForState,
    successfulRunInterventionHost,
    encounterResolutionHostForState,
    encounterSpecialWindowHostForState,
    encounterPrintedEffectHostForState,
    encounterPrintedNonTraceHostForState,
    runEndCleanupHost,
    runnerBreakerActionExecutionHost,
    startRunActionExecutionHost,
    rezActionExecutionHost,
  };
}
