import { createGameAfterSetup } from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type CardDefinitionId,
} from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { toRunnerTurn } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

const SHELL_TRADERS = 388;
const WUTECH_MEM_CHIP = 357;
const ZETATECH_MEM_CHIP = 358;
const SNOWBALL = 278;
const WALL_OF_STATIC = 491;
const HAND_EVENTS = [291, 307, 318, 600];

afterEach(resetResidentPlanPortfolioMemory);

function native(targetDefinitionId: CardDefinitionId) {
  const runnerDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.runner,
    cards: [
      { id: SHELL_TRADERS, quantity: 1 },
      { id: targetDefinitionId, quantity: 1 },
      ...HAND_EVENTS.map((id) => ({ id, quantity: 1 })),
      { id: 595, quantity: 3 },
    ],
  };
  const corpDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.corp,
    cards: [
      ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
        (card) => card.id !== WALL_OF_STATIC,
      ),
      { id: WALL_OF_STATIC, quantity: 2 },
    ],
  };
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed: `shell-traders-current-need:${targetDefinitionId}`,
      runnerDeck,
      corpDeck,
    }),
  );
  const builder = RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerResourceInstalled(SHELL_TRADERS)
    .withRunnerCardInGrip(targetDefinitionId)
    .withRunnerCredits(targetDefinitionId === SNOWBALL ? 17 : 1)
    .withRunnerClicks(1)
    .withRezzedCorpIceOnServer("rd", WALL_OF_STATIC);
  for (const event of HAND_EVENTS) builder.withRunnerCardInGrip(event);

  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "shell-traders-current-need",
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const preparation = input.legalActions.find(
    (action) =>
      action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
      action.payload.targetCardDefinitionId === targetDefinitionId,
  );
  if (!preparation)
    throw new Error(
      `Missing Shell Traders action for card ${targetDefinitionId}`,
    );
  return { input, preparation };
}

it.each([
  ["WuTech Mem Chip", WUTECH_MEM_CHIP],
  ["Zetatech Mem Chip", ZETATECH_MEM_CHIP],
] as const)(
  "rejects delayed preparation for %s when the current rig has no memory demand",
  (_target, definitionId) => {
    const { input, preparation } = native(definitionId);
    const frames: Array<{
      projected: boolean;
      currentNeed: string | undefined;
    }> = [];
    const runtime = createAiLiveRuntimeComposition({
      ...aiLiveRuntimeDependencies,
      evaluateRunnerHandDevelopment: (args, prepared) => {
        const evaluations =
          aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment(
            args,
            prepared,
          );
        frames.push({
          projected: args.rigDemandProjection !== undefined,
          currentNeed: evaluations.find(
            (evaluation) => evaluation.definitionId === definitionId,
          )?.currentNeed,
        });
        return evaluations;
      },
    });
    const before = JSON.stringify(input);
    const decision = runtime.chooseAiAction(input, {
      persistTacticalPlanMemory: false,
    });
    expect(frames.at(-1)).toEqual({ projected: true, currentNeed: "none" });
    expect(decision.actionId).not.toBe(preparation.actionId);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.dispositions).toContainEqual(
      expect.objectContaining({
        actionId: preparation.actionId,
        ownerModuleId: "runner.shell_traders_pipeline",
        disposition: "explicitly_nonproductive",
        evidenceCode: "runner_shell_traders_rejected_no_current_target_need",
      }),
    );
    expect(
      input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
    expect(JSON.stringify(input)).toBe(before);
  },
);

it("keeps delayed breaker investment available without current memory demand", () => {
  const { input, preparation } = native(SNOWBALL);
  const runtime = createAiLiveRuntimeComposition(aiLiveRuntimeDependencies);
  const decision = runtime.chooseAiAction(input, {
    persistTacticalPlanMemory: false,
  });
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(
    decision.actionId,
    JSON.stringify({
      selected: plan.selectedPlan,
      preparation: plan.dispositions.filter(
        (entry) => entry.actionId === preparation.actionId,
      ),
    }),
  ).toBe(preparation.actionId);
  expect(plan.selectedPlan?.moduleId).toBe("runner.shell_traders_pipeline");
  expect(plan.route).toMatchObject({
    actionId: preparation.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  const line = plan.turnPlanning!.consideredLines!.find(
    (candidate) =>
      candidate.firstActionId === preparation.actionId &&
      candidate.stepCount === 1,
  );
  const projectedGripSize = input.playerView.own.gripOrHq.length - 1;
  expect(line?.projectedEndState).toMatchObject({
    handMinimum: projectedGripSize,
    handMaximum: projectedGripSize,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
