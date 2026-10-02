import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
import type { RunnerRunWindowActionAssessment } from "../../plans/runner-tactical-plan-contracts";
import {
  currentEncounteredIceCard,
  currentEncounterUnbrokenSubroutineIndexes,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import { runnerRigAfterEncounter } from "../../runtime/runner-rig-after-encounter";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { isVisibleHardEndRunSubroutine } from "../../run-analysis/visible-subroutine-semantics";
import { runnerVisibleDeckBreaker } from "../rig-coverage/coverage-card-facts";
import { runnerCandidateExecutesProgramSearch } from "../../runtime/runner-program-search-facts";
import type { RunnerRunContinuationPayment } from "./run-window-services";

/** Search belongs to the active run, not to main-phase rig development. */
export function runnerRunProgramSearchAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  origin: RunnerRunOrigin | undefined,
  preservesReserve: (payment: RunnerRunContinuationPayment) => boolean,
): RunnerRunWindowActionAssessment | undefined {
  const installEffects = (candidate.functionalEffects ?? []).filter(
    (effect) => effect.kind === "install" && effect.target === "program",
  );
  if (
    !runnerCandidateExecutesProgramSearch(input, candidate) ||
    installEffects.length === 0
  )
    return undefined;
  const reject = (reason: string): RunnerRunWindowActionAssessment => ({
    admissible: false,
    evidenceCodes: ["runner_run_program_search_not_admissible", reason],
  });
  const run = input.playerView.run;
  const continuation = input.legalActions.find(
    (entry) =>
      entry.type === "continue_run" &&
      entry.payload?.encounterContinue === true,
  );
  const source = input.playerView.own.rig?.find(
    (card) => card.instanceId === candidate.sourceCardInstanceId,
  );
  if (
    input.side !== "runner" ||
    run?.phase !== "encounter_ice" ||
    typeof run.runId !== "string" ||
    run.runId.length === 0 ||
    input.playerView.timingPoint !== "run.encounter_ice" ||
    continuation?.payload?.encounterWillEndRun !== true ||
    !origin?.runRiskContract ||
    origin.runRiskContract.serverId !== run.attackedServerId ||
    candidate.abilityBindingMethod !== "canonical_capability_id" ||
    action.type !== "activated_card_ability" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.source !== source?.instanceId ||
    !source?.definitionId ||
    source.hostedOn !== undefined ||
    (input.playerView.own.rig ?? []).some(
      (card) => card.hostedOn === source.instanceId,
    ) ||
    action.payload?.cardImplementationTrashSourceCost !== true ||
    action.costs.length !== 0 ||
    installEffects.some((effect) => effect.installCost !== "normal") ||
    !Number.isSafeInteger(source.memoryCost) ||
    source.memoryCost! < 0 ||
    !Number.isSafeInteger(input.playerView.own.memoryUsed) ||
    !Number.isSafeInteger(input.playerView.own.memoryLimit)
  )
    return reject(
      "runner_run_program_search_requires_exact_current_source_and_bound_run",
    );
  const ice = currentEncounteredIceCard(input);
  if (!ice?.known || !ice.effectiveRunQuote)
    return reject("runner_run_program_search_requires_known_encounter_quote");
  const open = currentEncounterUnbrokenSubroutineIndexes(input);
  const subroutines = ice.effectiveRunQuote.subroutines.filter((_, i) =>
    open.has(i),
  );
  if (
    !subroutines.length ||
    subroutines.some((s) => !isVisibleHardEndRunSubroutine(s))
  )
    return reject("runner_run_program_search_requires_access_only_encounter");
  const currentIce = {
    ...ice,
    effectiveRunQuote: { ...ice.effectiveRunQuote, subroutines },
  };
  const context = currentRunPathContext(input);
  const currentRig = input.playerView.own.rig ?? [];
  const currentPath = assessKnownRezzedIcePath(
    [currentIce],
    currentRig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      currentRig,
    ),
    [],
    input.playerView.opponent.credits,
    context,
  );
  if (!currentPath.knownPathBlockedByMissingCoverage)
    return reject("runner_run_program_search_has_no_current_missing_coverage");
  const keptRig = currentRig.filter(
    (card) => card.instanceId !== source.instanceId,
  );
  const inventory = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckCapabilities?.runner?.breakerInventory;
  const alternatives = (inventory ?? [])
    .flatMap((breaker) => {
      const target = runnerVisibleDeckBreaker(breaker);
      const cost = breaker.installCost;
      const memory = target?.memoryCost;
      if (
        !target ||
        breaker.confidence !== "high" ||
        breaker.quantityKnownInDeck <= 0 ||
        !breaker.locations.includes("in_deck") ||
        !Number.isSafeInteger(cost) ||
        cost! < 0 ||
        cost! > input.playerView.own.credits ||
        !Number.isSafeInteger(memory) ||
        memory! < 0 ||
        input.playerView.own.memoryUsed! - source.memoryCost! + memory! >
          input.playerView.own.memoryLimit!
      )
        return [];
      const rig = [...keptRig, target];
      const credits = input.playerView.own.credits - cost!;
      const current = assessKnownRezzedIcePath(
        [currentIce],
        rig,
        runnerRunPathCreditBudgetWithVisiblePools(credits, rig),
        [],
        input.playerView.opponent.credits,
        context,
      );
      if (
        !current.canReachAccess ||
        current.visibleBreakCost === undefined ||
        !current.creditBudgetAfterPath ||
        current.conditionalRiskReasons?.length ||
        current.conditionalAccessReasons?.length ||
        current.futureClicksLost
      )
        return [];
      const payment = {
        cost: current.visibleBreakCost,
        rig: runnerRigAfterEncounter(rig),
        budget: current.creditBudgetAfterPath,
      };
      if (!preservesReserve(payment)) return [];
      const server = input.playerView.servers.find(
        (entry) => entry.id === run.attackedServerId,
      );
      const remaining = assessKnownRezzedIcePath(
        currentRunRemainingIce(input),
        payment.rig,
        payment.budget,
        server?.root ?? [],
        input.playerView.opponent.credits,
        context,
      );
      if (
        !remaining.canReachAccess ||
        remaining.conditionalRiskReasons?.length ||
        remaining.conditionalAccessReasons?.length ||
        remaining.futureClicksLost
      )
        return [];
      return [
        {
          target: breaker.cardId,
          cost: cost!,
          memory: memory!,
          currentCost: current.visibleBreakCost,
          remainingCost: remaining.visibleBreakCost ?? 0,
          creditsAfterPath: remaining.creditsAfterPath,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.creditsAfterPath - a.creditsAfterPath ||
        a.cost +
          a.currentCost +
          a.remainingCost -
          b.cost -
          b.currentCost -
          b.remainingCost ||
        a.target.localeCompare(b.target),
    );
  const best = alternatives[0];
  if (!best)
    return reject(
      "runner_run_program_search_has_no_funded_memory_safe_remaining_route",
    );
  return {
    admissible: true,
    value: 450,
    evidenceCodes: [
      "runner_run_window_action_plan_admissible",
      "runner_run_program_search_restores_bound_access",
      `runner_run_program_search_target:${best.target}`,
      `runner_run_program_search_install_cost:${best.cost}`,
    ],
    programSearchCommitment: {
      sourceActionId: action.actionId,
      sourceCardInstanceId: source.instanceId,
      sourceDefinitionId: source.definitionId,
      targetDefinitionId: best.target,
      serverId: run.attackedServerId,
      runId: run.runId,
      plannedAtStateVersion: input.playerView.stateVersion,
      installCost: best.cost,
      targetMemoryCost: best.memory,
    },
  };
}
