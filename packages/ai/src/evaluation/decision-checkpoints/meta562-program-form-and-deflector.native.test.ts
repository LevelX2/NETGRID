import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { GameState, PlayerAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  stateHash: string;
  validation: Record<string, boolean>;
};
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta562-program-form-and-deflector.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    memory: Capture;
    memoryState: GameState;
    memoryPrefixProof: { checkedStates: number; originalAppliedPrefix: number };
    trapdoor: Capture;
    trapdoorState: GameState;
    trapdoorPrefixProof: {
      checkedStates: number;
      originalAppliedPrefix: number;
    };
  };
}
function restore(capture: Capture) {
  expect(Object.keys(capture.validation)).toHaveLength(9);
  expect(Object.values(capture.validation).every(Boolean)).toBe(true);
  capture.input.planningStateIdentity = buildPlanningStateIdentity(
    capture.input,
  );
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
}
function apply(
  state: GameState,
  side: PlayerAction["side"],
  actionId: string,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
beforeEach(resetResidentPlanPortfolioMemory);

it("resolves the original accessed-agenda MU choice with an installed program-form agenda", () => {
  const f = fixture();
  expect(f.memoryPrefixProof).toMatchObject({
    checkedStates: 158,
    originalAppliedPrefix: 157,
  });
  expect(hashGameState(f.memoryState)).toBe(f.memory.stateHash);
  restore(f.memory);
  const before = JSON.stringify(f.memory.input);
  const decision = chooseAiAction(f.memory.input);
  expect(JSON.stringify(f.memory.input)).toBe(before);
  expect(decision).toMatchObject({
    actionId: "runner.resolve_choice",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    lane: "engine_window",
    rootPlanInstanceId: "run:run_146",
    leafExecutorInstanceId: "rules.window_resolution",
    selectedStep: { stepId: "access.resolve_card:157" },
  });
  const choice = f.memory.input.playerView.pendingChoice!;
  expect(decision.selectedChoices?.choiceId).toBe(choice.choiceId);
  const selectedOptionIds = decision.selectedChoices?.selectedOptionIds;
  if (!Array.isArray(selectedOptionIds))
    throw Error("Expected selected option IDs");
  expect(
    selectedOptionIds.every((id) =>
      choice.options.some((option) => option.id === id),
    ),
  ).toBe(true);
  const after = apply(
    f.memoryState,
    "runner",
    decision.actionId!,
    decision.selectedChoices,
  );
  expect(after.runner.memoryUsed).toBeLessThanOrEqual(
    f.memory.input.playerView.own.memoryLimit!,
  );
  expect(after.runner.rig.programs).toContain(
    "corp_onr_classic_004_theorem-proof_1",
  );
  expect(
    after.cardInstances["corp_onr_classic_004_theorem-proof_1"]
      ?.installedAsRunnerProgram?.memoryCost,
  ).toBe(2);
});

it("keeps three credits when the original Trapdoor has no subsidiary target", () => {
  const f = fixture();
  expect(f.trapdoorPrefixProof).toMatchObject({
    checkedStates: 39,
    originalAppliedPrefix: 38,
  });
  expect(hashGameState(f.trapdoorState)).toBe(f.trapdoor.stateHash);
  restore(f.trapdoor);
  const before = JSON.stringify(f.trapdoor.input);
  const decision = chooseAiAction(f.trapdoor.input);
  expect(JSON.stringify(f.trapdoor.input)).toBe(before);
  expect(decision).toMatchObject({
    actionId: "corp.decline_rez",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  const rez = getLegalActions(f.trapdoorState, "corp").find(
    (a) => a.type === "rez_ice",
  )!;
  const access = (actionId: string) => {
    let state = apply(f.trapdoorState, "corp", actionId);
    for (let step = 0; step < 8; step++) {
      if (state.run?.phase === "access") return state;
      const continuation = getLegalActions(state, "runner").find(
        (a) => a.type === "continue_run",
      );
      if (!continuation)
        throw Error("Original run has no deterministic continuation");
      state = apply(state, "runner", continuation.actionId);
    }
    throw Error("Original access not reached");
  };
  const held = access(decision.actionId!),
    paid = access(rez.actionId);
  expect(held.corp.credits - paid.corp.credits).toBe(3);
  expect(held.run?.attackedServerId).toBe("hq");
  expect(paid.run?.attackedServerId).toBe("hq");
  expect(held.run?.breach).toEqual(paid.run?.breach);
});

it("retains the same native Trapdoor rez when an actual subsidiary target exists", () => {
  const f = fixture(),
    state = f.trapdoorState;
  const targetIce = state.corp.hq.find(
    (id) => state.cardInstances[id]?.definitionId === "onr_classic_015_vortex",
  )!;
  expect(targetIce).toBeDefined();
  state.corp.hq = state.corp.hq.filter((id) => id !== targetIce);
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [targetIce],
    root: [],
  });
  state.cardInstances[targetIce]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: "remote_1",
  };
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: f.trapdoor.input.ownDeckSnapshot!,
  });
  const rez = input.legalActions.find((a) => a.type === "rez_ice")!;
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: rez.actionId,
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(apply(state, "corp", decision.actionId!).corp.credits).toBe(
    state.corp.credits - 3,
  );
});
