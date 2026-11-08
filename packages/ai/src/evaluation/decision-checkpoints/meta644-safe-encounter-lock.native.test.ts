import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { createGame, getPlayerView } from "@netgrid/engine";
import type { CreateGameConfig } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/meta644-replay-d191-safe-lock.json", import.meta.url),
    "utf8",
  ),
) as {
  engineConfig: CreateGameConfig;
  checkpoint: {
    validation: Record<string, boolean>;
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
};
const checkpoint = fixture.checkpoint;
afterEach(resetResidentPlanPortfolioMemory);
const nativeInput = () => {
  expect(Object.keys(checkpoint.validation)).toHaveLength(9);
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  const captured = structuredClone(checkpoint.input);
  return { ...captured, ...buildAiDecisionInputDto(captured) };
};

// Historical input stays unchanged; contrast paths use fresh Engine quotes.
function freshlyQuotedSource() {
  const state = createGame({ ...fixture.engineConfig, setupMode: "completed" });
  const source = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_v1_268_shock-r",
  )!;
  expect(source).toBeDefined();
  for (const zone of [state.corp.hq, state.corp.rd, state.corp.archives]) {
    const index = zone.indexOf(source.instanceId);
    if (index >= 0) zone.splice(index, 1);
  }
  state.corp.servers.find((s) => s.id === "rd")!.ice.push(source.instanceId);
  source.zone = { side: "corp", zone: "serverIce", serverId: "rd" };
  source.rezzed = true;
  const visible = getPlayerView(state, "runner").servers.find(
    (s) => s.id === "rd",
  )!.ice[0]!;
  expect(visible.effectiveRunQuote?.subroutines[0]?.unbrokenRunEffect).toEqual({
    preventsFutureBreaking: true,
    preventsJackOut: true,
  });
  return visible;
}

it("quotes the native fully known no-break continuation as conditional zero-cost access", () => {
  const input = nativeInput();
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target).toMatchObject({
    pathPassability: "reachable",
    pathCost: 0,
    routeQuote: {
      reachability: "conditional_access",
      knownCost: 0,
      fundingGap: 0,
      conditionalReasons: expect.arrayContaining(["visible_random_rewind"]),
    },
  });
});

it("keeps the native remote-contest owner, action and state binding", () => {
  const input = nativeInput();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime),
  );
  const before = JSON.stringify(input.playerView);
  const result = chooseAiAction(input);
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(result).toMatchObject({
    actionId: "runner.start_run.remote_1",
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        route: { actionId: "runner.start_run.remote_1", stateVersion: 190 },
      },
    },
  });
});

it("does not certify an unknown next encounter", () => {
  const input = nativeInput(),
    remote = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const inner = remote.ice[0]!;
  const unknownInner = {
    instanceId: inner.instanceId,
    known: false,
    rezzed: false,
  };
  const assessment = assessKnownRezzedIcePath(
    [unknownInner, freshlyQuotedSource()],
    input.playerView.own.rig!,
    6,
  );
  expect(assessment.canReachAccess).toBe(false);
  expect(assessment.hardUnbrokenRunEffects).toContain("jack_out_lock");
});

it("keeps the benign continuation reachable with the complete fresh lock quote", () => {
  const input = nativeInput(),
    remote = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const assessment = assessKnownRezzedIcePath(
    [remote.ice[0]!, freshlyQuotedSource()],
    input.playerView.own.rig!,
    6,
  );
  expect(assessment.canReachAccess).toBe(true);
  expect(assessment.visibleBreakCost ?? 0).toBe(0);
  expect(assessment.conditionalAccessReasons).toContain(
    "visible_random_rewind",
  );
});

it("preserves the lock when the known next ICE must be broken", () => {
  const input = nativeInput(),
    remote = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const wall = input.playerView.servers
    .find((s) => s.id === "hq")!
    .ice.find((i) => i.definitionId === "onr_v1_245_fire-wall")!;
  expect(wall.effectiveRunQuote).toBeDefined();
  const assessment = assessKnownRezzedIcePath(
    [wall, freshlyQuotedSource()],
    input.playerView.own.rig!,
    6,
  );
  expect(assessment.canReachAccess).toBe(false);
  expect(assessment.hardUnbrokenRunEffects).toContain("jack_out_lock");
});
