import { afterEach, expect, it } from "vitest";
import game16 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r04-g16-d309-stable-loan.json";
import game37 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r04-g37-d298-stable-loan.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each(["insufficient_exit_reserve", "no_installed_coverage"] as const)(
  "rejects the explicitly modified countermodel: %s",
  (change) => {
    const cp = structuredClone(game37) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (change === "insufficient_exit_reserve")
      cp.input.playerView.own.credits = 17;
    else
      cp.input.playerView.own.rig = cp.input.playerView.own.rig.filter(
        (card) => card.type !== "program",
      );
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(cp.input);
    const action = cp.input.legalActions.find(
      (entry) => entry.actionId === decision.actionId,
    )!;
    expect(
      cp.input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === action.source,
      )?.definitionId,
    ).not.toBe("onr_v1_168_loan-from-chiba");
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  },
);

it.each([
  { game: 16, checkpoint: game16 },
  { game: 37, checkpoint: game37 },
])(
  "funds game $game's bound contest with stable universal coverage and a full debt reserve",
  ({ checkpoint }) => {
    const cp = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const loan = cp.input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        cp.input.playerView.own.gripOrHq.some(
          (card) =>
            card.instanceId === action.source &&
            card.definitionId === "onr_v1_168_loan-from-chiba",
        ),
    )!;
    expect(loan).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = JSON.stringify(cp.input);
    const decision = chooseAiAction(cp.input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(decision.actionId).toBe(loan.actionId);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedPlan: {
        moduleId: "runner.economy",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        parentNeedId: "run-support:remote:remote_1",
      },
      route: {
        actionId: loan.actionId,
        stateVersion: cp.input.playerView.stateVersion,
      },
    });
    expect(JSON.stringify(cp.input)).toBe(before);
  },
);
