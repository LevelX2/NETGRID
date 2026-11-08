import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { CreateGameConfig, PlayerAction } from "@netgrid/shared";
import { applyAction, createGame, getPlayerView } from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { runnerCentralPressureCadence } from "../../runner/central-pressure/central-pressure-signals";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/meta644-d53-card-run-prefix.json", import.meta.url),
    "utf8",
  ),
) as {
  config: CreateGameConfig;
  actions: PlayerAction[];
  checkpoint: {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
};

afterEach(resetResidentPlanPortfolioMemory);

function replayInput() {
  let state = createGame(fixture.config);
  for (const action of fixture.actions) {
    const next = applyAction(state, action);
    if (!next.ok)
      throw new Error(
        `native_prefix_rejected:${action.actionId}:${next.error.code}`,
      );
    state = next.state;
  }
  const playerView = getPlayerView(state, "runner");
  const captured = structuredClone(fixture.checkpoint.input);
  // Engine replay regenerates public facts. No recorded event is patched or
  // assigned the old checkpoint hash: AI turn-plan receipts are not replayed.
  const input = {
    ...captured,
    ...buildAiDecisionInputDto({
      ...captured,
      playerView,
      eventTail: playerView.publicEvents,
      legalActions: playerView.legalActions,
    }),
  };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  expect(input.playerView.stateVersion).toBe(52);
  expect(input.playerView.own.credits).toBe(6);
  expect(input.playerView.own.clicks).toBe(2);
  expect(input.playerView.own.gripOrHq.map((c) => c.instanceId)).toEqual(
    captured.playerView.own.gripOrHq.map((c) => c.instanceId),
  );
  return input;
}

it("publishes nested run starts and actual redirected access through the AI DTO", () => {
  const input = replayInput();
  const events = input.playerView.publicEvents;
  expect(
    events.find((e) => e.stateVersionAfter === 29)?.publicPayload,
  ).toMatchObject({
    abilityFamily: "run-access",
    effectKind: "run",
    serverId: "rd",
    resolvedEffects: expect.arrayContaining([
      expect.objectContaining({
        kind: "start_run",
        serverId: "rd",
        accessServerId: "rd",
        runId: expect.any(String),
      }),
      expect.objectContaining({ kind: "trash_source", reason: "run_start" }),
    ]),
  });
  expect(
    events.find((e) => e.stateVersionAfter === 36)?.publicPayload,
  ).toMatchObject({
    abilityFamily: "run-access",
    effectKind: "run",
    serverId: "hq",
    resolvedEffects: expect.arrayContaining([
      expect.objectContaining({
        kind: "start_run",
        serverId: "hq",
        accessServerId: "rd",
        runId: expect.any(String),
      }),
    ]),
  });
  expect(
    events.find((e) => e.stateVersionAfter === 51)?.publicPayload.serverId,
  ).toBe("rd");
  expect(
    events.find((e) => e.stateVersionAfter === 52)?.publicPayload.serverId,
  ).toBe("rd");
  expect(runnerCentralPressureCadence(input, "rd")).toMatchObject({
    routeAvailable: true,
    evidenceCode: expect.stringContaining("value_converted:rd"),
  });
});

it("keeps central-pressure ownership for the native affordable known-agenda run", () => {
  const input = replayInput();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(fixture.checkpoint.runtime),
  );
  const before = JSON.stringify(input.playerView);
  const action = input.legalActions.find(
    (a) => a.type === "start_run" && a.payload?.serverId === "rd",
  );
  expect(action).toBeDefined();
  const decision = chooseAiAction(input);
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(decision).toMatchObject({
    actionId: action!.actionId,
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
        leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ard",
        route: { actionId: action!.actionId, stateVersion: 52 },
      },
    },
  });
});

it("counts redirected access against R&D, not the attacked HQ", () => {
  const input = replayInput();
  input.playerView.publicEvents = input.playerView.publicEvents.filter(
    (e) => e.stateVersionAfter !== 52,
  );
  input.eventTail = input.playerView.publicEvents;
  expect(runnerCentralPressureCadence(input, "rd")).toMatchObject({
    routeAvailable: false,
    evidenceCode: expect.stringContaining("consumed:rd"),
  });
  expect(runnerCentralPressureCadence(input, "hq")).toMatchObject({
    routeAvailable: true,
    evidenceCode: expect.stringContaining("first_access:hq"),
  });
});

it("rejects genuinely unbound access even when labels and server facts exist", () => {
  const input = replayInput();
  for (const event of input.playerView.publicEvents) {
    if (event.stateVersionAfter !== 29 && event.stateVersionAfter !== 36)
      continue;
    event.publicPayload.resolvedEffects =
      event.publicPayload.resolvedEffects!.filter(
        (e) => e.kind !== "start_run",
      );
  }
  expect(runnerCentralPressureCadence(input, "rd")).toMatchObject({
    routeAvailable: false,
    evidenceCode: expect.stringContaining("access_unbound:rd"),
  });
});

it("rejects an incomplete nested-run binding", () => {
  const input = replayInput();
  const start = input.playerView.publicEvents
    .find((e) => e.stateVersionAfter === 36)!
    .publicPayload.resolvedEffects!.find((e) => e.kind === "start_run")!;
  delete start.accessServerId;
  expect(runnerCentralPressureCadence(input, "rd")).toMatchObject({
    routeAvailable: false,
    evidenceCode: expect.stringContaining("run_start_invalid:rd"),
  });
});
