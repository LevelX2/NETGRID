import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerCreditReserveTargetForInput } from "../simulation/runner-credit-reserve";
import { createRunnerAccessPathContext } from "./runner-access-path-context";
import { createRunnerEncounterBreakContext } from "./runner-encounter-break-context";
import { createRunnerPumpFuturePathContext } from "./runner-pump-future-path-context";
import {
  createRunnerPumpViabilityContext,
  type RunnerPumpViabilityContextDependencies,
} from "./runner-pump-viability-context";

export type RunnerEncounterCompositionContextDependencies = Omit<
  RunnerPumpViabilityContextDependencies,
  | "encounterFuturePathAfterPumpBreakAssessment"
  | "encounterRemotePayoffAfterBreakAssessment"
  | "runnerCreditReserveTarget"
> & {
  rolesForCardId: (definitionId: string | undefined) => string[];
  breakSubroutineIndexesForAction: (action: LegalAction) => Set<number>;
  currentEncounteredIceCard: (
    input: AiDecisionInput,
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
  const { encounterBreakReserveContext } = createRunnerEncounterBreakContext({
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
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownIcePathReason: dependencies.knownIcePathReason,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    definitionType: dependencies.definitionType,
    remoteRootTrashCost: dependencies.remoteRootTrashCost,
  });
  const { encounterFuturePathAfterPumpBreakAssessment } =
    createRunnerPumpFuturePathContext({
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
    encounterFuturePathAfterPumpBreakAssessment,
    encounterRemotePayoffAfterBreakAssessment,
    runnerCreditReserveTarget: runnerCreditReserveTargetForInput,
  });

  return {
    runnerCreditReserveTargetForInput,
    encounterBreakReserveContext,
    breakAccessPathAssessment,
    encounterRemotePayoffAfterBreakAssessment,
    encounterFuturePathAfterPumpBreakAssessment,
    pumpViabilityAssessment,
  };
}
