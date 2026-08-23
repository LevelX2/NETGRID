import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { definitionFor } from "../state/card-server-lookup";
import { delayedInstallPreparedTargetIds } from "../abilities/runner-special-trigger-execution";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  hasCopyOrderIndependentDueCardImplementationStartOfRunnerTurnAbilities,
  hasDueCardImplementationStartOfRunnerTurnAbility,
} from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export type RunnerStartOrderingCandidate = {
  sourceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  lifecycleOnly: boolean;
  orderIndependentBetweenCopies: boolean;
};

export function runnerStartOrderingCandidate(
  deps: RuntimeDeps,
  state: GameState,
  sourceId: CardInstanceId,
  isDelayedAgendaSource: boolean,
): RunnerStartOrderingCandidate {
  return {
    sourceId,
    sourceDefinitionId: definitionFor(state, sourceId).id,
    lifecycleOnly:
      hasDueCardImplementationStartOfRunnerTurnAbility(
        deps.cardImplementationRuntimeDeps,
        state,
        sourceId,
      ) &&
      !hasAdditionalRunnerStartOfTurnPath(
        deps,
        state,
        sourceId,
        isDelayedAgendaSource,
      ),
    orderIndependentBetweenCopies:
      hasCopyOrderIndependentDueCardImplementationStartOfRunnerTurnAbilities(
        deps.cardImplementationRuntimeDeps,
        state,
        sourceId,
      ),
  };
}

export function hasAdditionalRunnerStartOfTurnPath(
  deps: RuntimeDeps,
  state: GameState,
  sourceId: CardInstanceId,
  isDelayedAgendaSource: boolean,
): boolean {
  if (isDelayedAgendaSource) return true;
  const runnerUtility = deps.runnerUtilityLongtailImplementationForCard(
    state,
    sourceId,
  );
  if (runnerUtility?.kind === "start_turn_random_effect_table") return true;
  const implementation = cardImplementationForDefinitionId(
    definitionFor(state, sourceId).id,
  );
  if (
    implementation?.uniqueDirectLongtail?.kind ===
      "runner_start_turn_drip_counter_action_or_core_damage" ||
    implementation?.uniqueDirectLongtail?.kind ===
      "runner_start_turn_forced_random_action" ||
    implementation?.uniqueDirectLongtail?.kind ===
      "start_turn_trash_for_credits"
  )
    return true;
  return (
    implementation?.hiddenReplacementLongtail?.kind ===
      "delayed_install_with_counter_countdown" &&
    delayedInstallPreparedTargetIds(
      deps.runnerSpecialTriggerExecutionHost(state),
    ).length > 0
  );
}

/**
 * Selects the first source only when the entire open ordering set consists of
 * explicitly safe copies of one lifecycle definition. Any mixed, unmarked or
 * multi-path set remains a player choice.
 */
export function automaticRunnerStartSourceId(
  candidates: readonly RunnerStartOrderingCandidate[],
): CardInstanceId | undefined {
  if (candidates.length < 2) return undefined;
  const definitionId = candidates[0]?.sourceDefinitionId;
  if (
    !definitionId ||
    candidates.some(
      (candidate) =>
        candidate.sourceDefinitionId !== definitionId ||
        !candidate.lifecycleOnly ||
        !candidate.orderIndependentBetweenCopies,
    )
  )
    return undefined;
  return candidates.map((candidate) => candidate.sourceId).sort()[0];
}
