import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpClassicDeflectorDefenseChoiceSignal } from "../../corp/defense/defense-choice-signals";
import { corpVisibleSingleSubroutineIsUnbreakable } from "../../runtime/corp-score-protection-assessment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint(game: 6 | 10) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r8-g${game}-d${game === 6 ? 147 : 359}-deflector-return.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}

function choose(cp: ReturnType<typeof checkpoint>) {
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return chooseAiAction(input);
}

function signal(cp: ReturnType<typeof checkpoint>) {
  const action = cp.input.legalActions.find(
    (a) => a.type === "resolve_choice",
  )!;
  return corpClassicDeflectorDefenseChoiceSignal(
    cp.input,
    [
      {
        actionId: action.actionId,
        semanticActionType: "choice.resolve",
      } as ActionSemanticCandidate,
    ],
    undefined,
    0,
  )?.choiceResolution;
}

function trap(cp: ReturnType<typeof checkpoint>) {
  return cp.input.playerView.servers
    .find((s) => s.id === "rd")!
    .ice.find(
      (ice) => ice.rezzed && ice.effectiveRunQuote!.subroutines.length === 1,
    )!;
}

it.each([
  [6, "server_hq", 146],
  // Archives exposes another two-point agenda; keeping all nine credits and
  // accepting the current two-point access beats paying for a forced return.
  [10, "decline", 358],
] as const)(
  "avoids the native forced-return entry in game %i",
  (game, optionId, version) => {
    const cp = checkpoint(game);
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    const result = choose(cp);
    expect(result.actionId).toBe("corp.resolve_choice");
    expect(result.selectedChoices).toEqual({
      choiceId: cp.input.playerView.pendingChoice!.choiceId,
      selectedOptionIds: [optionId],
    });
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan!.moduleId).toBe("corp.defend_servers");
    expect(pf.leafExecutorInstanceId).toBe(pf.rootPlanInstanceId);
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: version,
      planInstanceId: pf.leafExecutorInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
  },
);

it.each([
  [7, true],
  [8, false],
] as const)(
  "certifies the single redirect only below its eight-credit break boundary: %i",
  (credits, unbreakable) => {
    const cp = checkpoint(10);
    expect(
      corpVisibleSingleSubroutineIsUnbreakable({
        ice: trap(cp),
        runnerRig: cp.input.playerView.opponent.rig!,
        runnerCredits: credits,
      }),
    ).toBe(unbreakable);
  },
);

it("keeps the low-exposure route when its entry can be broken", () => {
  const cp = checkpoint(10);
  cp.input.playerView.opponent.credits = 8;
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("does not certify a return when another subsidiary destination exists", () => {
  const cp = checkpoint(10);
  const remote = structuredClone(
    cp.input.playerView.servers.find((s) => s.id === "remote_1")!,
  );
  remote.id = "remote_2";
  remote.ice = [];
  remote.root = [];
  cp.input.playerView.servers.push(remote);
  cp.input.playerView.pendingChoice!.options.push({
    id: "server_remote_2",
    label: "Remote 2",
    value: "remote_2",
  });
  cp.input.legalActions
    .find((a) => a.type === "resolve_choice")!
    .choiceRequirements![0]!.optionIds.push("server_remote_2");
  // Keep the new empty remote out of the minimum-exposure comparison.
  remote.root = structuredClone(
    cp.input.playerView.servers.find((s) => s.id === "remote_1")!.root,
  );
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("does not treat an optional paid return as a forced continuation", () => {
  const cp = checkpoint(10);
  trap(cp).effectiveRunQuote!.subroutines[0]!.deflectorCost = 2;
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("requires the exact quote of the ICE actually entered", () => {
  const cp = checkpoint(10);
  trap(cp).effectiveRunQuote!.iceInstanceId = "other_ice";
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("does not extend the single-subroutine proof across other encounter effects", () => {
  const cp = checkpoint(10);
  const ice = trap(cp);
  ice.effectiveRunQuote!.subroutines.push({
    id: "other_effect",
    type: "end_the_run",
  });
  expect(
    corpVisibleSingleSubroutineIsUnbreakable({
      ice,
      runnerRig: cp.input.playerView.opponent.rig!,
      runnerCredits: 7,
    }),
  ).toBe(false);
});

it("counts visible restricted credit pools before certifying an unaffordable break", () => {
  const cp = checkpoint(10);
  cp.input.playerView.opponent.rig![0]!.counterDisplays = [
    {
      id: "breaker_credits",
      amount: 1,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "1 Credit",
      creditPool: {
        kind: "stored_credit",
        uses: ["using_icebreaker_during_run"],
      },
    },
  ];
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("does not invent a stop or forced return for an unknown Runner rig card", () => {
  const cp = checkpoint(10);
  cp.input.playerView.opponent.rig![0]!.known = false;
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});

it("does not substitute an empty rig when the public rig fact is missing", () => {
  const cp = checkpoint(10);
  delete cp.input.playerView.opponent.rig;
  expect(signal(cp)).toMatchObject({ selectedOptionId: "server_rd" });
});
