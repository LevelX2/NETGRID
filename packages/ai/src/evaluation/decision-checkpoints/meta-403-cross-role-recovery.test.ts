import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-cross-role-recovery.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { bindSyntheticAgendaStealQuotes } from "../../agenda-steal-quotes.test-support";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-288 installs the visible Code Gate answer that funds the whole mixed ICE path", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  bindSyntheticAgendaStealQuotes(input, "remote_1", 0, {});
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.stateVersion).toBe(274);
  const install = input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      action.source === "runner_onr_v1_014_codecracker_1" &&
      !action.payload?.runnerProgramTrashBeforeInstall,
  )!;
  expect(install).toBeDefined();
  expect(chooseAiAction(input)).toMatchObject({
    actionId: install.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate%3Aefficiency%3Aremote_1%3Arun%3Arunner.start_run.remote_1",
        route: { actionId: install.actionId },
      },
    },
  });
});

it("searches cheaper Wall coverage without inventing the absent Code Gate installation", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  bindSyntheticAgendaStealQuotes(input, "remote_1", 0, {});
  input.legalActions = input.legalActions.filter(
    (action) => action.source !== "runner_onr_v1_014_codecracker_1",
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(result).toMatchObject({
    actionId: "runner.draw_card",
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Aefficiency%3Aremote_1",
        route: {
          capabilityId: "draw_for_answer_breaker_wall",
          actionId: "runner.draw_card",
        },
      },
    },
  });
  expect(
    input.legalActions.some(
      (action) => action.source === "runner_onr_v1_014_codecracker_1",
    ),
  ).toBe(false);
  expect(result.evidence).toContain(
    "plan_assessment_evidence:coverage_efficiency_current_funding_gap:8",
  );
  expect(
    evaluateRunnerRunTargets({ input }).find(
      (target) => target.targetServerId === "remote_1",
    ),
  ).toMatchObject({
    pathPassability: "blocked_unpayable",
    accessPayoffContestable: false,
    accessPayoffRequiresFunding: true,
    fundingNeed: { reason: "route_funding_gap", routeFundingGap: 10 },
  });
  expect(result.fallbackUsed).toBe(false);
  expect(
    input.legalActions.some((action) => action.actionId === result.actionId),
  ).toBe(true);
});

it("does not invent a contest budget for the unmodified capture", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  expect(
    evaluateRunnerRunTargets({ input }).find(
      (target) => target.targetServerId === "remote_1",
    ),
  ).toMatchObject({ accessPayoffContestable: false });
});
