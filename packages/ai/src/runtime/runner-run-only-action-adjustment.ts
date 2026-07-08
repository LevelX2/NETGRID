import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import { sortSemanticRuntimeChoices } from "./semantic-runtime-choice-builder";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeRunOnlyActionAdjustment,
} from "./semantic-runtime-types";

export type RunnerRunOnlyActionAdjustmentDependencies = {
  compareAction: (left: LegalAction, right: LegalAction) => number;
};

export type RunnerRunOnlyActionContext = {
  runnerRunOnlyActionAdjustedSemanticChoice: (
    input: AiDecisionInput,
    rankedChoices: readonly SemanticRuntimeChoice[],
    selectedChoice: SemanticRuntimeChoice,
  ) => SemanticRuntimeRunOnlyActionAdjustment;
};

export function createRunnerRunOnlyActionContext(
  dependencies: RunnerRunOnlyActionAdjustmentDependencies,
): RunnerRunOnlyActionContext {
  function adjustedSemanticChoice(
    input: AiDecisionInput,
    rankedChoices: readonly SemanticRuntimeChoice[],
    selectedChoice: SemanticRuntimeChoice,
  ): SemanticRuntimeRunOnlyActionAdjustment {
    return runnerRunOnlyActionAdjustedSemanticChoice(
      input,
      rankedChoices,
      selectedChoice,
      dependencies,
    );
  }

  return { runnerRunOnlyActionAdjustedSemanticChoice: adjustedSemanticChoice };
}

export function runnerRunOnlyActionAdjustedSemanticChoice(
  input: AiDecisionInput,
  rankedChoices: readonly SemanticRuntimeChoice[],
  selectedChoice: SemanticRuntimeChoice,
  dependencies: RunnerRunOnlyActionAdjustmentDependencies,
): SemanticRuntimeRunOnlyActionAdjustment {
  if (input.side !== "runner" || selectedChoice.action.type !== "start_run") {
    return { choice: selectedChoice, rankedChoices: rankedChoices.slice() };
  }
  const targetServerId = semanticRuntimeServerId(selectedChoice.action);
  if (!targetServerId) {
    return { choice: selectedChoice, rankedChoices: rankedChoices.slice() };
  }
  const capAssessment = runnerRunActionSpendingCapAssessment(
    input,
    selectedChoice.action,
  );
  const capEvidence = [
    `run_action_spending_cap_target_server:${targetServerId}`,
    `run_action_spending_cap_visible_break_cost:${capAssessment.visibleBreakCost}`,
    "run_action_spending_cap_limit:3",
  ];

  if (!capAssessment.ok) {
    const hasRunOnlyActionOption = rankedChoices.some(
      (choice) =>
        choice.action.type === "start_run" &&
        choice.action.payload?.runOnlyAction === true &&
        semanticRuntimeServerId(choice.action) === targetServerId,
    );
    if (!hasRunOnlyActionOption) {
      return { choice: selectedChoice, rankedChoices: rankedChoices.slice() };
    }
    const adjusted = semanticRuntimeChoiceWithEvidence(selectedChoice, {
      evidence: [
        `run_action_spending_cap_risk_skip:${capAssessment.reason}`,
        ...capEvidence,
      ],
    });
    return {
      choice: adjusted,
      rankedChoices: replaceSemanticRuntimeChoice(
        rankedChoices,
        adjusted,
        dependencies,
      ),
    };
  }

  if (selectedChoice.action.payload?.runOnlyAction === true) {
    const adjusted = semanticRuntimeChoiceWithEvidence(selectedChoice, {
      evidence: ["run_only_action_preferred", ...capEvidence],
    });
    return {
      choice: adjusted,
      rankedChoices: replaceSemanticRuntimeChoice(
        rankedChoices,
        adjusted,
        dependencies,
      ),
    };
  }

  const runOnlyActionChoice = rankedChoices.find(
    (choice) =>
      !choice.exclusion &&
      choice.action.type === "start_run" &&
      choice.action.payload?.runOnlyAction === true &&
      semanticRuntimeServerId(choice.action) === targetServerId,
  );
  if (runOnlyActionChoice) {
    const adjusted = semanticRuntimeChoiceWithEvidence(runOnlyActionChoice, {
      minimumScore: selectedChoice.score + 80,
      reasonCode: "runner.run_only_action.preferred",
      explanation:
        "Eine Run-only-Aktion stellt für dasselbe Ziel eine legale Zusatz-Run-Aktion bereit.",
      evidence: ["run_only_action_preferred", ...capEvidence],
    });
    return {
      choice: adjusted,
      rankedChoices: replaceSemanticRuntimeChoice(
        rankedChoices,
        adjusted,
        dependencies,
      ),
      memoryAction: selectedChoice.action,
    };
  }

  return { choice: selectedChoice, rankedChoices: rankedChoices.slice() };
}

export function runnerRunActionSpendingCapAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): {
  ok: boolean;
  reason: string;
  visibleBreakCost: number;
} {
  const serverId = semanticRuntimeServerId(action);
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (!server)
    return { ok: false, reason: "server_unknown", visibleBreakCost: 0 };
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server.root,
  );
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  if (assessment.assessedKnownIceCount > 0 && !assessment.canReachAccess) {
    return { ok: false, reason: "known_path_no_access", visibleBreakCost };
  }
  if (visibleBreakCost > 3) {
    return { ok: false, reason: "visible_break_cost_gt_cap", visibleBreakCost };
  }
  const hasUnknownIceCost = server.ice.some(
    (ice) => !ice.known || ice.rezzed !== true,
  );
  if (hasUnknownIceCost) {
    return { ok: false, reason: "unknown_ice_cap_risk", visibleBreakCost };
  }
  return { ok: true, reason: "visible_cost_within_cap", visibleBreakCost };
}

function replaceSemanticRuntimeChoice(
  choices: readonly SemanticRuntimeChoice[],
  adjusted: SemanticRuntimeChoice,
  dependencies: RunnerRunOnlyActionAdjustmentDependencies,
): SemanticRuntimeChoice[] {
  return sortSemanticRuntimeChoices(
    choices.map((choice) =>
      choice.action.actionId === adjusted.action.actionId ? adjusted : choice,
    ),
    dependencies.compareAction,
  );
}
