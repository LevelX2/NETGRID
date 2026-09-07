import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-configurable-breaker-coverage.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";

it("SP-250 binds the legal configurable breaker installation to the missing decoder parent", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const install = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.actionId.includes("fubar") &&
      a.payload?.runnerProgramTrashBeforeInstall !== true,
  )!;
  expect(install.expiresAtStateVersion).toBe(281);
  const d = chooseAiAction(input);
  expect(d).toMatchObject({
    actionId: install.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        route: {
          actionId: install.actionId,
          stateVersion: 281,
          capabilityId: "install_breaker_code_gate",
        },
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate",
      },
    },
  });
});

it("keeps a once-selected wall Fubar from masquerading as simultaneous decoder coverage", () => {
  const input =
    checkpoint.input as unknown as AiDecisionInputWithDeckCapabilities;
  const fubar = input.playerView.own.gripOrHq.find(
    (c) => c.definitionId === "onr_proteus_088_fubar",
  )!;
  const rd = input.playerView.servers.find((s) => s.id === "rd")!;
  const path = (selectedSubtype?: string) =>
    assessKnownRezzedIcePath(
      rd.ice,
      [
        ...(input.playerView.own.rig ?? []),
        { ...fubar, ...(selectedSubtype ? { selectedSubtype } : {}) },
      ],
      26,
      rd.root,
      input.playerView.opponent.credits,
    );
  expect(path().canReachAccess).toBe(true);
  expect(path("code_gate").canReachAccess).toBe(true);
  expect(path("wall").canReachAccess).toBe(false);
});
