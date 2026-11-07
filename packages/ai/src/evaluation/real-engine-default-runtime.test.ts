import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../index";
import type { AiDecisionRuntimeOptions } from "../runtime/choose-ai-action";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";

const scenarios = buildRealEngineDecisionCorpusScenarios();

describe("default live Engine authority", () => {
  it("binds all 53 current Engine decisions to their actual owner, route and commitment", () => {
    expect(scenarios).toHaveLength(53);
    const failures = scenarios.flatMap(({ scenarioId, input }) =>
      bindingViolations(input, choose(input)).map(
        (code) => `${scenarioId}:${code}`,
      ),
    );
    expect(failures).toEqual([]);
  }, 60_000);

  it.each(["runner_real_low_credits", "corp_real_low_credit_main_window"])(
    "rejects comparison-mode evidence for %s even when its action is legal",
    (scenarioId) => {
      const { input } = scenarios.find(
        (scenario) => scenario.scenarioId === scenarioId,
      )!;
      const decision = choose(input, {
        runnerTurnPlannerMode: "legacy_compare",
        corpTurnPlannerMode: "legacy_compare",
      });
      expect(
        input.legalActions.some(
          (action) => action.actionId === decision.actionId,
        ),
      ).toBe(true);
      expect(bindingViolations(input, decision)).toContain(
        "default_cutover_authority",
      );
    },
  );

  it.each(["owner", "action", "version", "target"] as const)(
    "detects a corrupted %s binding on an otherwise legal decision",
    (mutation) => {
      const { input } = scenarios.find(
        (scenario) =>
          scenario.scenarioId === "runner_real_target_choice_hq_remote_mix",
      )!;
      const decision = structuredClone(choose(input));
      const trace = decision.decisionDebug!.planFirstDecision!;
      if (mutation === "owner")
        trace.executionOrigin.rootPlanInstanceId = "other_owner";
      if (mutation === "action")
        trace.route!.actionId = input.legalActions.find(
          (action) => action.actionId !== decision.actionId,
        )!.actionId;
      if (mutation === "version") trace.route!.stateVersion -= 1;
      if (mutation === "target")
        trace.route!.target = { kind: "server", id: "other_server" };
      expect(bindingViolations(input, decision)).not.toEqual([]);
    },
  );

  it("detects a choice outside the current Engine offer", () => {
    const { input } = scenarios.find(
      (scenario) =>
        scenario.scenarioId === "runner_real_target_choice_discard_choice",
    )!;
    const decision = structuredClone(choose(input));
    decision.selectedChoices!.selectedOptionIds = ["other_card"];
    expect(bindingViolations(input, decision)).toContain(
      "current_choice_binding",
    );
  });
});

function choose(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions = {},
): AiDecision {
  resetResidentPlanPortfolioMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
  return chooseAiAction(input, {
    persistTacticalPlanMemory: false,
    ...options,
  });
}

function bindingViolations(
  input: AiDecisionInput,
  decision: AiDecision,
): string[] {
  const failures: string[] = [];
  const check = (valid: unknown, code: string): void => {
    if (!valid) failures.push(code);
  };
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === decision.actionId,
  );
  const trace = decision.decisionDebug?.planFirstDecision;
  if (!action || !trace) return ["missing_current_action_or_trace"];
  const version = input.playerView.stateVersion;
  check(
    (decision.selectionKind ?? "direct") === "direct" && !decision.fallbackUsed,
    "direct_selection",
  );
  check(
    action.side === input.side && action.expiresAtStateVersion === version,
    "current_legal_action",
  );
  check(
    trace.stateVersion === version &&
      trace.executionOrigin.stateVersion === version &&
      trace.executionOrigin.side === input.side &&
      trace.executionOrigin.timingPoint === input.playerView.timingPoint,
    "current_frame",
  );
  check(
    trace.rootPlanInstanceId === trace.executionOrigin.rootPlanInstanceId &&
      trace.leafExecutorInstanceId ===
        trace.executionOrigin.leafPlanInstanceId &&
      trace.selectedStep.planInstanceId === trace.leafExecutorInstanceId,
    "owner_binding",
  );
  if (trace.lane === "engine_window") {
    check(
      trace.selectionAuthority === "engine_window" &&
        trace.engineWindowAction?.actionId === action.actionId &&
        trace.engineWindowAction.actionType === action.type,
      "engine_window_binding",
    );
  } else {
    const planner = trace.turnPlanning;
    const route = trace.route;
    check(
      planner?.mode === "cutover" &&
        trace.selectionAuthority === "turn_plan_commitment",
      "default_cutover_authority",
    );
    check(
      route?.stateVersion === version &&
        route.actionId === action.actionId &&
        route.actionType === action.type &&
        route.planInstanceId === trace.leafExecutorInstanceId &&
        route.stepId === trace.selectedStep.stepId,
      "current_route_binding",
    );
    check(
      trace.selectedPlan?.instanceId === trace.leafExecutorInstanceId &&
        planner?.heads.some(
          (head) =>
            head.actionId === action.actionId &&
            head.rootPlanInstanceId === trace.rootPlanInstanceId &&
            head.executorPlanInstanceId === trace.leafExecutorInstanceId &&
            head.witnessValid &&
            head.semanticActionType === route?.semanticActionType,
        ),
      "selected_owner_witness",
    );
    check(
      planner?.stateVersion === version &&
        planner.commitment?.phaseEntry.status === "validated" &&
        planner.commitment.rematerialization.status === "executable" &&
        planner.commitment.rematerialization.actionId === action.actionId &&
        planner.commitment.commitmentId === trace.executionOrigin.commitmentId,
      "current_commitment_binding",
    );
    if (
      route?.target?.kind === "server" &&
      typeof action.payload?.serverId === "string"
    )
      check(
        route.target.id === action.payload.serverId,
        "current_target_binding",
      );
  }
  for (const requirement of action.choiceRequirements ?? []) {
    const selected = decision.selectedChoices;
    check(
      selected?.choiceId === requirement.choiceId &&
        Array.isArray(selected.selectedOptionIds) &&
        selected.selectedOptionIds.length >= requirement.minSelections &&
        selected.selectedOptionIds.length <= requirement.maxSelections &&
        new Set(selected.selectedOptionIds).size ===
          selected.selectedOptionIds.length &&
        selected.selectedOptionIds.every((id) =>
          requirement.optionIds.includes(id),
        ),
      "current_choice_binding",
    );
  }
  return failures;
}
