import type { VisibleCard } from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCreditReserveTargetForInput } from "../simulation/runner-credit-reserve";
import { createRunnerAccessPathContext } from "./runner-access-path-context";
import {
  createRunnerEncounterBreakContext,
  type RunnerEncounterBreakContextDependencies,
} from "./runner-encounter-break-context";
import { createRunnerPumpFuturePathContext } from "./runner-pump-future-path-context";
import {
  createRunnerPumpViabilityContext,
  type RunnerPumpViabilityContextDependencies,
} from "./runner-pump-viability-context";

export type RunnerEncounterCompositionContextDependencies = Omit<
  RunnerEncounterBreakContextDependencies,
  "runnerCreditReserveTarget"
> &
  Omit<
    RunnerPumpViabilityContextDependencies,
    | "estimatedEncounterBreakCost"
    | "encounterFuturePathAfterPumpBreakAssessment"
    | "encounterRemotePayoffAfterBreakAssessment"
    | "runnerCreditReserveTarget"
  > & {
    rolesForCardId: (definitionId: string | undefined) => string[];
    breakSubroutineIndexesForAction: ReturnType<
      typeof createRunnerAccessPathContext
    > extends {
      breakAccessPathAssessment: unknown;
    }
      ? (action: Parameters<RunnerEncounterBreakContextDependencies["actionCreditCost"]>[0]) => Set<number>
      : never;
    currentEncounteredIceCard: (
      input: Parameters<
        RunnerEncounterBreakContextDependencies["runnerCreditReserveTarget"]
      >[0],
    ) => VisibleCard | undefined;
    assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
    knownIcePathReason: (
      assessment: ReturnType<typeof assessKnownRezzedIcePath>,
      serverId: string,
    ) => string;
    isRemoteServerTarget: (serverId: string | undefined) => boolean;
    definitionType: (definitionId: string) => string | undefined;
    remoteRootTrashCost: Parameters<
      typeof createRunnerAccessPathContext
    >[0]["remoteRootTrashCost"];
  };

export function createRunnerEncounterCompositionContext(
  dependencies: RunnerEncounterCompositionContextDependencies,
) {
  const runnerCreditReserveTargetForInput =
    createRunnerCreditReserveTargetForInput({
      rolesForCardId: dependencies.rolesForCardId,
    });
  const {
    estimatedEncounterBreakCost,
    encounterBreakReserveContext,
  } = createRunnerEncounterBreakContext({
    actionCreditCost: dependencies.actionCreditCost,
    findVisibleCard: dependencies.findVisibleCard,
    runnerCreditReserveTarget: runnerCreditReserveTargetForInput,
  });
  const {
    breakAccessPathAssessment,
    encounterRemotePayoffAfterBreakAssessment,
  } = createRunnerAccessPathContext({
    breakSubroutineIndexesForAction:
      dependencies.breakSubroutineIndexesForAction,
    currentEncounteredIceCard: dependencies.currentEncounteredIceCard,
    actionCreditCost: dependencies.actionCreditCost,
    estimatedEncounterBreakCost,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownIcePathReason: dependencies.knownIcePathReason,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    definitionType: dependencies.definitionType,
    remoteRootTrashCost: dependencies.remoteRootTrashCost,
  });
  const {
    encounterFuturePathAfterPumpBreakAssessment,
  } = createRunnerPumpFuturePathContext({
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownIcePathReason: dependencies.knownIcePathReason,
  });
  const { pumpViabilityAssessment } = createRunnerPumpViabilityContext({
    findVisibleCard: dependencies.findVisibleCard,
    encounterRunRemainderEffectAssessment:
      dependencies.encounterRunRemainderEffectAssessment,
    encounterHasImmediateUnbrokenThreat:
      dependencies.encounterHasImmediateUnbrokenThreat,
    actionCreditCost: dependencies.actionCreditCost,
    estimatedEncounterBreakCost,
    encounterFuturePathAfterPumpBreakAssessment,
    encounterRemotePayoffAfterBreakAssessment,
    runnerCreditReserveTarget: runnerCreditReserveTargetForInput,
  });

  return {
    runnerCreditReserveTargetForInput,
    estimatedEncounterBreakCost,
    encounterBreakReserveContext,
    breakAccessPathAssessment,
    encounterRemotePayoffAfterBreakAssessment,
    encounterFuturePathAfterPumpBreakAssessment,
    pumpViabilityAssessment,
  };
}
