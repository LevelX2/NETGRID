import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import heapJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-heap-coverage-d360.json";
import breakJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-pooled-break-d228.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { projectRunnerEncounterCashCost } from "../../actions/runner-encounter-cost-projection";

function replay(json: unknown) {
  const capture = structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input as AiDecisionInput);
  const action = capture.input.legalActions.find(
    (entry) => entry.actionId === decision.actionId,
  );
  return {
    capture,
    decision,
    action,
    portfolio: residentPlanPortfolioSnapshot(capture.input),
  };
}

describe("pairing 422 recovery and pooled break checkpoints", () => {
  it("preserves an exact heap answer when the stack has no remaining breaker", () => {
    const { capture, decision, action, portfolio } = replay(heapJson);
    expect(capture.input.playerView.own.credits).toBe(24);
    expect(action?.type).toBe("play_event");
    expect([
      "onr_v1_087_forgotten-backup-chip",
      "onr_v1_110_sneak-preview",
    ]).toContain(
      action?.payload?.sourceDefinitionId ??
        capture.input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === action?.source,
        )?.definitionId,
    );
    expect(decision.fallbackUsed).toBe(false);
    const executor = portfolio?.instances.find(
      (entry) => entry.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "runner.rig_and_coverage",
      moduleState: {
        kind: "coverage",
        gap: {
          directSearchActionIds: expect.arrayContaining([decision.actionId]),
          directSearchChoiceBindings: expect.arrayContaining([
            expect.objectContaining({
              actionId: decision.actionId,
              targetDefinitionId: "onr_classic_031_rent-i-con",
              targetCardInstanceId: "runner_onr_classic_031_rent-i-con_1",
            }),
          ]),
        },
      },
    });
  });

  it("uses the legal pooled-credit break to preserve the terminal remote contest", () => {
    const { capture, decision, action, portfolio } = replay(breakJson);
    expect(capture.input.playerView.own.credits).toBe(0);
    expect(action?.type).toBe("break_subroutine");
    expect(action?.payload).toMatchObject({
      subroutineIndex: 0,
      iceId: "corp_onr_v1_237_data-wall_1",
    });
    expect(decision.fallbackUsed).toBe(false);
    expect(
      portfolio?.instances.find(
        (entry) => entry.instanceId === portfolio.executorInstanceId,
      )?.moduleId,
    ).toBe("runner.convert_run_window");
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine
        ?.phases[0]?.nodes[0]?.boundaryAfter,
    ).toBe("engine_continuation");
  });

  it.each([
    { pool: 2, noisy: false, badPublicity: 0, expectedCash: 0 },
    { pool: 0, noisy: false, badPublicity: 0, expectedCash: 1 },
    { pool: 2, noisy: true, badPublicity: 0, expectedCash: 1 },
    { pool: 2, noisy: true, badPublicity: 1, expectedCash: 0 },
  ])(
    "keeps payment restrictions exact: %j",
    ({ pool, noisy, badPublicity, expectedCash }) => {
      const input = structuredClone(breakJson.input) as AiDecisionInput;
      const rig = input.playerView.own.rig!;
      const poolCard = rig.find(
        (card) => card.definitionId === "onr_v1_071_vewy-vewy-quiet",
      )!;
      poolCard.counters = { bit: pool };
      poolCard.counterDisplays![0]!.amount = pool;
      if (noisy)
        rig.find(
          (card) => card.definitionId === "onr_classic_031_rent-i-con",
        )!.subtypes = ["icebreaker", "noisy"];
      input.playerView.run!.badPublicityCredits = badPublicity;
      const action = input.legalActions.find(
        (entry) => entry.type === "break_subroutine",
      )!;
      const candidate = buildActionSemanticCandidates({
        legalActions: [action],
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      })[0]!;
      const projected = projectRunnerEncounterCashCost(input, candidate);
      expect(projected.costProfile.creditCost).toBe(expectedCash);
      expect(projected.actionId).toBe(action.actionId);
      expect(action.costs).toEqual([{ credits: 1 }]);
      expect(candidate.costProfile.creditCost).toBe(1);
    },
  );
});
