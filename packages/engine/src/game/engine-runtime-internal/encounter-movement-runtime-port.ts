/** Declarative typed port implemented by encounter-movement-runtime-hosts.ts. */
import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import type { RunnerAccessActionHost } from "../access/access-actions";
import type { SuccessfulRunInterventionHost } from "../run/successful-run-interventions";
import type { RunEndCleanupHost } from "../run/run-end-cleanup";
import type { EncounterResolutionHost } from "../run/encounter-resolution";
import type { EncounterSpecialWindowHost } from "../run/encounter-special-windows";
import type { EncounterPrintedEffectHost } from "../run/encounter-printed-effects";
import type { EncounterPrintedNonTraceHost } from "../run/encounter-printed-nontrace-effects";
import type { RunnerEncounterActionHost } from "../run/encounter-actions";
import type { EncounterEntryHost } from "../run/encounter-entry";
import type { RunRezWindowHost } from "../run/run-rez-window";
import type { FortPassWindowHost } from "../run/fort-pass-window";
import type { FortRunSideFamiliesHost } from "../run/fort-run-side-families";
import type { RunMovementHost } from "../run/run-movement";
import type { RunnerBreakerActionExecutionHost } from "../run/runner-breaker-action-execution";
import type { StartRunActionExecutionHost } from "../run/start-run-action-execution";
import type { RezActionExecutionHost } from "../rez/rez-action-execution";
import type { RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";

export type EncounterMovementRuntimePort = {
  resolveBlinkBreakSubroutineAction: (
    state: GameState,
    breakerId: CardInstanceId,
    subroutineIndex: number,
    legalAction: LegalAction,
  ) => void;
  recordBartmossEncounterUsage: (
    state: GameState,
    breakerId: CardInstanceId,
  ) => void;
  recordSnowballBreakUsage: (
    state: GameState,
    breakerId: CardInstanceId,
  ) => void;
  icebreakerHasSpecial: (
    state: GameState,
    breakerId: CardInstanceId,
    special: NonNullable<RuntimeIcebreakerAbility["special"]>,
  ) => boolean;
  runnerAccessActionHost: (state: GameState) => RunnerAccessActionHost;
  runnerEncounterActionHostForState: (
    state: GameState,
  ) => RunnerEncounterActionHost;
  runMovementHostForState: (state: GameState) => RunMovementHost;
  runRezWindowHostForState: (state: GameState) => RunRezWindowHost;
  fortPassWindowHostForState: (state: GameState) => FortPassWindowHost;
  fortRunSideFamiliesHostForState: (
    state: GameState,
  ) => FortRunSideFamiliesHost;
  encounterEntryHostForState: (state: GameState) => EncounterEntryHost;
  successfulRunInterventionHost: (
    state: GameState,
  ) => SuccessfulRunInterventionHost;
  encounterResolutionHostForState: (
    state: GameState,
  ) => EncounterResolutionHost;
  encounterSpecialWindowHostForState: (
    state: GameState,
  ) => EncounterSpecialWindowHost;
  encounterPrintedEffectHostForState: (
    state: GameState,
    legalAction?: LegalAction,
  ) => EncounterPrintedEffectHost;
  encounterPrintedNonTraceHostForState: (
    state: GameState,
    legalAction?: LegalAction,
  ) => EncounterPrintedNonTraceHost;
  runEndCleanupHost: (state: GameState) => RunEndCleanupHost;
  runnerBreakerActionExecutionHost: (
    state: GameState,
  ) => RunnerBreakerActionExecutionHost;
  startRunActionExecutionHost: (
    state: GameState,
  ) => StartRunActionExecutionHost;
  rezActionExecutionHost: (state: GameState) => RezActionExecutionHost;
};
