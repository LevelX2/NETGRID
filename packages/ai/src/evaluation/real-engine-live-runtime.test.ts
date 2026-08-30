import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { chooseAiAction } from "../index";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";

describe("real Engine inputs through the live Semantic Runtime", () => {
  it("selects the expected action family from every competitive annotated scenario", () => {
    expect(
      evaluateAnnotatedScenarios((input) =>
        chooseWithoutPersistentMemory(input),
      ),
    ).toEqual([]);
  }, 60_000);

  it("would fail for a deterministic chooser that ignores the scenario context", () => {
    const failures = evaluateAnnotatedScenarios(
      (input) => input.legalActions.at(-1)?.actionId ?? "missing-action",
    );

    expect(failures.length).toBeGreaterThan(0);
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/runner_real_(?:safe_hq_access|safe_rd_access)/),
        expect.stringMatching(/corp_real_score_now_vs_gain_credit/),
      ]),
    );
  });

  it("keeps the remote-contest owner and target across direct and event run routes", () => {
    const expectedRouteByScenario = new Map([
      [
        "runner_real_target_choice_hq_remote_mix",
        {
          targetServerId: "remote_1",
          actionTypes: ["play_event", "start_run"],
        },
      ],
      [
        "runner_real_remote_score_threat",
        {
          targetServerId: "remote_1",
          actionTypes: ["play_event", "start_run"],
        },
      ],
      [
        "runner_real_remote_known_agenda_contest",
        {
          targetServerId: "remote_2",
          actionTypes: ["play_event", "start_run"],
        },
      ],
    ]);
    const scenarios = buildRealEngineDecisionCorpusScenarios().filter(
      (scenario) => expectedRouteByScenario.has(scenario.scenarioId),
    );

    expect(scenarios).toHaveLength(3);
    for (const scenario of scenarios) {
      resetResidentPlanPortfolioMemory();
      resetRunnerRunPlanMemory();
      resetStrategicIntentMemory();
      const decision = chooseAiAction(scenario.input, {
        persistTacticalPlanMemory: false,
      });
      expect(decision.selectionKind ?? "direct").toBe("direct");
      const selected = scenario.input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      );
      const expectedRoute = expectedRouteByScenario.get(scenario.scenarioId);
      if (!expectedRoute) throw new Error("Expected route is missing.");
      const sourceDefinitionId = scenario.input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === selected?.source,
      )?.definitionId;

      expect(selected).toMatchObject({
        payload: {
          serverId: expectedRoute.targetServerId,
        },
      });
      expect(expectedRoute.actionTypes).toContain(selected?.type);
      if (selected?.type === "play_event") {
        expect(selected?.payload?.cardId).toBe(selected?.source);
        expect(selected?.payload?.runnerEventRun).toBe(true);
        expect(sourceDefinitionId).toBe("simple_run_event");
      }
      expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
      expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
        capabilityId: "contest_remote",
        actionType: selected?.type,
        semanticActionType:
          selected?.type === "play_event" ? "play.runner_event" : "run.start",
        target: { kind: "server", id: expectedRoute.targetServerId },
      });
    }
  });
});

function evaluateAnnotatedScenarios(
  selectActionId: (input: AiDecisionInput) => string,
): string[] {
  const scenarios = buildRealEngineDecisionCorpusScenarios().filter(
    (scenario) => scenario.leagueExpectation,
  );
  const failures: string[] = [];

  expect(scenarios).toHaveLength(20);
  for (const scenario of scenarios) {
    const firstActionId = selectActionId(scenario.input);
    const secondActionId = selectActionId(scenario.input);
    const selected = scenario.input.legalActions.find(
      (action) => action.actionId === firstActionId,
    );

    if (!selected) {
      failures.push(
        `${scenario.scenarioId}: returned non-legal action ${firstActionId}`,
      );
      continue;
    }
    if (secondActionId !== firstActionId) {
      failures.push(
        `${scenario.scenarioId}: non-deterministic ${firstActionId} -> ${secondActionId}`,
      );
    }
    const expectedTypes =
      scenario.leagueExpectation?.expectedTopActionTypes ?? [];
    if (expectedTypes.length > 0 && !expectedTypes.includes(selected.type)) {
      failures.push(
        `${scenario.scenarioId}: expected ${expectedTypes.join("|")}, chose ${selected.type}:${selected.actionId}`,
      );
    }
    const forbiddenTypes =
      scenario.leagueExpectation?.forbiddenTopActionTypes ?? [];
    if (forbiddenTypes.includes(selected.type)) {
      failures.push(
        `${scenario.scenarioId}: forbids ${forbiddenTypes.join("|")}, chose ${selected.type}:${selected.actionId}`,
      );
    }
  }

  return failures;
}

function chooseWithoutPersistentMemory(input: AiDecisionInput): string {
  resetResidentPlanPortfolioMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
  const decision = chooseAiAction(input, {
    persistTacticalPlanMemory: false,
  });
  if (decision.selectionKind && decision.selectionKind !== "direct") {
    throw new Error("test_requires_applied_engine_randomized_decision");
  }
  return decision.actionId;
}
