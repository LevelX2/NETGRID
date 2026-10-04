import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { runnerProgramSearchStrategyDevelopmentSignals } from "../../runner/hand-development/development-signals";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";

function native(game: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(`./fixtures/meta-ten-repairs/476-g${game}.json`, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { input, cp };
}
beforeEach(resetResidentPlanPortfolioMemory);

it.each([3, 30])(
  "keeps the exact development source through native G%s, including payment continuation",
  (game) => {
    const { input, cp } = native(game);
    const previous = cp.runtime.residentPlanPortfolio;
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.resolve_choice");
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice!.choiceId,
      selectedOptionIds: ["source_stack"],
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: previous.rootForegroundInstanceId,
      leafExecutorInstanceId: previous.executorInstanceId,
    });
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(
      portfolio.instances.find(
        (i) => i.instanceId === previous.executorInstanceId,
      )?.moduleState,
    ).toMatchObject({
      signal: {
        programSearchCommitment: {
          engineContinuationAtStateVersion: input.playerView.stateVersion,
          targetDefinitionId: "onr_v1_011_cloak",
        },
      },
    });
  },
);

it.each(["source", "state", "source_option"])(
  "rejects a changed %s in the native source window",
  (boundary) => {
    const { input } = native(30),
      choice = input.playerView.pendingChoice!;
    if (boundary === "source") choice.sourceCardInstanceId = "different_source";
    if (boundary === "state") choice.stateVersion++;
    if (boundary === "source_option")
      choice.options = choice.options.filter((o) => o.id !== "source_stack");
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);

it.each([38, 40])(
  "admits only an available strategic program target in native G%s",
  (game) => {
    const { input, cp } = native(game);
    const signal = cp.runtime.residentPlanPortfolio.instances.find(
      (i: { instanceId: string }) =>
        i.instanceId === cp.runtime.residentPlanPortfolio.executorInstanceId,
    ).moduleState.signal;
    const source = signal.programSearchCommitment;
    const candidate = {
      actionId: signal.actionIds[0],
      actionType: "play_event",
      sourceCardInstanceId: source.sourceCardInstanceId,
      sourceDefinitionId: source.sourceDefinitionId,
      functionalEffects: [
        { kind: "search", scope: "stack", target: "program" },
      ],
    } as unknown as ActionSemanticCandidate;
    const strategy = {
      setupEngine: ["runner.search_breaker_setup"],
      engineLineIds: ["runner.engine.compatible_recurring_economy"],
      engineProviders: input.ownDeckSnapshot!.cards.map((c) => ({
        cardId: c.cardId,
        capabilities: ["runner.economy.recurring_breaker"],
      })),
    } as unknown as RunnerStrategicIntentProfile;
    const plans = runnerProgramSearchStrategyDevelopmentSignals(
      input,
      [candidate],
      strategy,
      [],
      [],
    );
    if (game === 38) expect(plans).toHaveLength(1);
    for (const plan of plans) {
      const target = plan.programSearchCommitment!.targetDefinitionId;
      expect(target).not.toBe("onr_v1_011_cloak");
      expect(
        input.playerView.pendingChoice!.options.some(
          (o) => o.selectable !== false && o.card?.definitionId === target,
        ),
      ).toBe(true);
    }
    // The historical wrong commitment remains invalid: no resolver substitute.
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);
