import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpClassicDeflectorDefenseChoiceSignal } from "../../corp/defense/defense-choice-signals";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r7-g39-d318-deflector-reserve.json",
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
  return { input, result: chooseAiAction(input) };
}

function signal(cp: ReturnType<typeof checkpoint>) {
  const action = cp.input.legalActions.find(
    (a) => a.type === "resolve_choice",
  )!;
  const candidate = {
    actionId: action.actionId,
    semanticActionType: "choice.resolve",
  } as ActionSemanticCandidate;
  return corpClassicDeflectorDefenseChoiceSignal(
    cp.input,
    [candidate],
    undefined,
    1,
  );
}

it.each([
  [2, "server_remote_2"],
  [3, "server_hq"],
] as const)(
  "pays the native terminal redirect at %i credits before retaining later score cash",
  (credits, optionId) => {
    const cp = checkpoint();
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    cp.input.playerView.own.credits = credits;
    const { input, result } = choose(cp);
    expect(result.actionId).toBe("corp.resolve_choice");
    expect(result.selectedChoices).toEqual({
      choiceId: "classic_deflector_317",
      selectedOptionIds: [optionId],
    });
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan!.moduleId).toBe("corp.defend_servers");
    expect(pf.leafExecutorInstanceId).toBe(pf.rootPlanInstanceId);
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: 317,
      planInstanceId: pf.leafExecutorInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
    expect(input.playerView.pendingChoice!.stateVersion).toBe(317);
  },
);

it("preserves the score floor when the current remote cannot supply matchpoint", () => {
  const cp = checkpoint();
  cp.input.playerView.opponent.agendaPoints = 3;
  expect(choose(cp).result.selectedChoices?.selectedOptionIds).toEqual([
    "decline",
  ]);
});

it("can spend the reserve on the remaining known agenda-free Archives exit", () => {
  const cp = checkpoint();
  cp.input.playerView.servers.find((s) => s.id === "remote_2")!.root[0]!.known =
    false;
  expect(signal(cp)?.choiceResolution).toMatchObject({
    disposition: "redirect",
    selectedOptionId: "server_archives",
  });
});

it("does not pay an unaffordable redirect even for current matchpoint", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 1;
  expect(choose(cp).result.selectedChoices?.selectedOptionIds).toEqual([
    "decline",
  ]);
});

it("does not invent the current agenda value when its fact is missing", () => {
  const cp = checkpoint();
  const agenda = cp.input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .root.find((c) => c.type === "agenda")!;
  delete agenda.agendaPoints;
  expect(signal(cp)?.choiceResolution).toMatchObject({
    disposition: "decline",
    selectedOptionId: "decline",
  });
});

it("requires known zero agenda exposure at the redirect destination", () => {
  const cp = checkpoint();
  cp.input.playerView.servers.find((s) => s.id === "remote_2")!.root[0]!.known =
    false;
  cp.input.playerView.own.heapOrArchives[0]!.known = false;
  expect(signal(cp)?.choiceResolution).toMatchObject({
    disposition: "decline",
    selectedOptionId: "decline",
  });
});

it("does not certify a destination with a further ICE continuation as an agenda-free exit", () => {
  const cp = checkpoint();
  const source = cp.input.playerView.servers.find((s) => s.id === "remote_1")!;
  cp.input.playerView.servers.find((s) => s.id === "remote_2")!.ice = [
    structuredClone(source.ice[0]!),
  ];
  cp.input.playerView.servers.find((s) => s.id === "archives")!.ice = [
    structuredClone(source.ice[0]!),
  ];
  expect(signal(cp)?.choiceResolution).toMatchObject({
    disposition: "decline",
    selectedOptionId: "decline",
  });
});
