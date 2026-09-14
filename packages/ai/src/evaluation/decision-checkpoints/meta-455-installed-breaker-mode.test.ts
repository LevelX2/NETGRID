import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-g2-d132.json";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  return structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("recognizes the public installed mode before requesting another Code-Gate answer", () => {
  const { input, runtime } = fixture();
  const fubar = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_proteus_088_fubar",
  )!;
  expect(fubar.selectedSubtype).toBe("code_gate");
  input.ownDeckCapabilities = buildDeckCapabilityProfileFromInput(
    input,
    input.ownDeckSnapshot,
  );
  expect(
    input.ownDeckCapabilities.runner!.breakerCoverageMatrix.code_gate,
  ).toMatchObject({ installed: true, drawOnly: false, blockers: [] });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision).toMatchObject({
    actionId: "runner.gain_credit",
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId:
          "plan:runner.economy:runner-portfolio-credit-reserve",
        leafExecutorInstanceId:
          "plan:runner.economy:runner-portfolio-credit-reserve",
        selectedStep: {
          stepId:
            "plan:runner.economy:runner-portfolio-credit-reserve:fund:runner-portfolio-credit-reserve",
        },
        route: {
          actionId: "runner.gain_credit",
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it.each(["wall", "code_gate", "sentry", undefined] as const)(
  "keeps installed %s separate from possible future modes and hand copies",
  (selectedSubtype) => {
    const { input } = fixture();
    const fubar = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_proteus_088_fubar",
    )!;
    input.playerView.own.rig = [{ ...fubar, selectedSubtype }];
    input.playerView.own.gripOrHq.push({
      ...fubar,
      instanceId: "runner_fubar_hand_copy",
      selectedSubtype: undefined,
    });
    const matrix = buildDeckCapabilityProfileFromInput(
      input,
      input.ownDeckSnapshot,
    ).runner!.breakerCoverageMatrix;
    for (const kind of ["wall", "code_gate", "sentry"] as const)
      expect(matrix[kind].installed).toBe(kind === selectedSubtype);
  },
);

it("combines the actual modes of separate installed copies", () => {
  const { input } = fixture();
  const fubar = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_proteus_088_fubar",
  )!;
  input.playerView.own.rig = [
    { ...fubar, selectedSubtype: "wall" },
    {
      ...fubar,
      instanceId: "runner_second_fubar",
      selectedSubtype: "code_gate",
    },
  ];
  const matrix = buildDeckCapabilityProfileFromInput(
    input,
    input.ownDeckSnapshot,
  ).runner!.breakerCoverageMatrix;
  expect([
    matrix.wall.installed,
    matrix.code_gate.installed,
    matrix.sentry.installed,
  ]).toEqual([true, true, false]);
});

it.each(["wall", "code_gate", "sentry"] as const)(
  "uses Morphing Tool's actual %s mode instead of its prospective deck roles",
  (selectedSubtype) => {
    const { input } = fixture();
    const fubar = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_proteus_088_fubar",
    )!;
    input.playerView.own.rig = [
      {
        ...fubar,
        definitionId: "onr_proteus_092_morphing-tool",
        selectedSubtype,
      },
    ];
    const matrix = buildDeckCapabilityProfileFromInput(
      input,
      input.ownDeckSnapshot,
    ).runner!.breakerCoverageMatrix;
    for (const kind of ["wall", "code_gate", "sentry"] as const)
      expect(matrix[kind].installed).toBe(kind === selectedSubtype);
  },
);
