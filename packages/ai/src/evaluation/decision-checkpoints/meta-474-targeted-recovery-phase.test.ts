import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [3, 55, 54, "breaker_code_gate"],
  [36, 109, 108, "breaker_sentry"],
] as const)(
  "keeps targeted recovery in its actual draw phase at original game %i decision %i",
  (game, decisionIndex, stateVersion, requiredRole) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r2-g${game}-current-d${decisionIndex}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      provenance: string;
      actor: string;
      stateVersion: number;
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    expect(cp.provenance).toBe("current_persisted_state");
    expect(cp.actor).toBe("runner");
    expect(cp.stateVersion).toBe(stateVersion);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.draw_card");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (entry) => entry.instanceId === portfolio.executorInstanceId,
    )!;
    expect(executor.moduleId).toBe("runner.rig_and_coverage");
    expect(executor.moduleState).toMatchObject({
      phase: "draw_for_answer",
      gap: {
        needKind: "cost_ineffective_coverage",
        requiredRole,
        targetServerId: "hq",
        answerInHand: false,
        deckHasAnswer: true,
        installActionIds: [],
        drawForAnswerActionIds:
          game === 3
            ? [
                "runner.play_event.runner_onr_v1_101_mit-west-tier_2.runner_onr_v1_101_mit-west-tier_2.onr_v1_101_mit-west-tier:abilities_on_play_shuffle_grip_trash_and_stack_then_draw",
                decision.actionId,
              ]
            : [decision.actionId],
      },
    });
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion,
      planInstanceId: executor.instanceId,
      capabilityId: `draw_for_answer_${requiredRole}`,
    });
    expect(plan.selectedStep!.planInstanceId).toBe(executor.instanceId);
    expect(plan.selectedStep!.stepId).toBe(plan.route!.stepId);
    expect(plan.rootPlanInstanceId).toBe(executor.instanceId);
  },
);
