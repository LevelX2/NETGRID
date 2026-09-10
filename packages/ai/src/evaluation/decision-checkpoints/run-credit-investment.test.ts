import { afterEach, expect, it } from "vitest";
import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-run-credit-investment.json";
import deferredFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-run-credit-deferred.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerHandDevelopment } from "../../runner-hand-development";
import {
  evaluateRunnerRunTargets,
  buildRunnerEconomyPosture,
} from "../../runner-run-target-evaluation";
import { assessRunnerSuccessfulRunCreditInvestment } from "../../runtime/runner-successful-run-credit-investment";

afterEach(resetResidentPlanPortfolioMemory);
function context() {
  const input = structuredClone(
    fixture.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const params = {
    input,
    ...(input.ownRunnerStrategicIntent
      ? { strategicIntent: input.ownRunnerStrategicIntent }
      : {}),
    ...(input.ownDeckCapabilities
      ? { deckCapabilities: input.ownDeckCapabilities }
      : {}),
  };
  const evaluation = evaluateRunnerHandDevelopment(params).find(
    (e) => e.definitionId === "onr_v1_166_karl-de-veres-corporate-stooge",
  )!;
  return {
    input,
    evaluation,
    targets: evaluateRunnerRunTargets(params),
    economy: buildRunnerEconomyPosture(params),
  };
}
it("develops the real run-income source through its existing owner without spending future credits", () => {
  const { input, evaluation, targets, economy } = context();
  expect(evaluation.liquidityTiming).not.toBe("immediate");
  expect(
    evaluation.persistentInstallEvaluation?.engineAssessment,
  ).toMatchObject({ repeatable: true, outputCapabilities: ["credits"] });
  expect(
    assessRunnerSuccessfulRunCreditInvestment(
      input,
      evaluation,
      targets,
      economy,
    ),
  ).toMatchObject({ admitted: true, projectedNetCredits: 2 });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(evaluation.legalActionId);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    stateVersion: input.playerView.stateVersion,
    rootPlanInstanceId:
      "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_166_karl-de-veres-corporate-stooge_1",
    leafExecutorInstanceId:
      "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_166_karl-de-veres-corporate-stooge_1",
    route: {
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
});
it("does not re-admit a deferred late investment through generic hand development", () => {
  const input = structuredClone(
    deferredFixture.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const install = input.legalActions.find(
    (a) => a.type === "install_card" && a.source.includes("corporate-stooge"),
  )!;
  expect(install).toBeDefined();
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe(install.actionId);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.portfolio.some(
      (p) =>
        p.moduleId === "runner.develop_board_and_hand" &&
        p.target?.id === install.source,
    ),
  ).toBe(false);
});
it.each([
  "tagged",
  "matchpoint",
  "short_horizon",
  "last_click",
  "saturated",
  "blocked",
  "unquoted",
  "expensive",
])("does not promote an investment for %s", (fault) => {
  const { input, evaluation, targets, economy } = context();
  if (fault === "tagged") input.playerView.own.tags = 1;
  if (fault === "matchpoint") input.playerView.opponent.agendaPoints = 6;
  if (fault === "short_horizon") input.playerView.opponent.deckCount = 1;
  if (fault === "last_click") input.playerView.own.clicks = 1;
  if (fault === "saturated") input.playerView.own.credits = 59;
  if (fault === "blocked")
    targets.forEach((t) => (t.pathPassability = "blocked_unpayable"));
  if (fault === "unquoted") targets.forEach((t) => delete t.prerunReserveQuote);
  if (fault === "expensive") targets.forEach((t) => (t.pathCost = 4));
  expect(
    assessRunnerSuccessfulRunCreditInvestment(
      input,
      evaluation,
      targets,
      economy,
    )?.admitted,
  ).toBe(false);
});
