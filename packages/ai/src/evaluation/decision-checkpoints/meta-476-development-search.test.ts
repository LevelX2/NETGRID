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
import { AI_HINTS_BY_CARD } from "../../catalog-ai-hint-authority";

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
      functionalEffects: AI_HINTS_BY_CARD.get(source.sourceDefinitionId)!
        .effects,
    } as unknown as ActionSemanticCandidate;
    const strategy = input.ownRunnerStrategicIntent!;
    // This is a choice checkpoint: the historical source is no longer Legal.
    // A fake source candidate cannot manufacture a new development root here.
    expect(
      input.legalActions.some((a) => a.actionId === candidate.actionId),
    ).toBe(false);
    const discovery = () =>
      runnerProgramSearchStrategyDevelopmentSignals(
        input,
        [candidate],
        strategy,
        [],
        [],
      );
    if (game === 38) expect(discovery).toThrow(/invalid_plan_identity/);
    else expect(discovery()).toEqual([]);
    // The historical wrong commitment remains invalid: no resolver substitute.
    expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
  },
);
