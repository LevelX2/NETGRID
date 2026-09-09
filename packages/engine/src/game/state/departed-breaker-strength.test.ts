import { describe, expect, it, vi } from "vitest";
import type { CardInstanceId } from "@netgrid/shared";
import {
  createGameAfterSetup,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  apply,
  applyChoice,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { createLifecycleRuntime } from "../engine-runtime-internal/lifecycle-runtime";
import type { RuntimeDeps } from "../engine-runtime-internal/runtime-shared";
import {
  definitionFor,
  mustInstance,
  runnerInstalledCardIds,
} from "./card-server-lookup";
import { hostedCardsOn, removeFromAllZones } from "./zone-mutation";
import { clearCardCounters } from "./turn-flags-counters";
import {
  placeProgramsOnMicrotechBackupDrive,
  trashMicrotechBackedProgram,
} from "./microtech-backup";

const runtime = createLifecycleRuntime({
  definitionFor,
  mustInstance,
  runnerInstalledCardIds,
  hostedCardsOn,
  removeFromAllZones,
  clearCardCounters,
  executeCardImplementationLifecycleEffects: vi.fn(),
} as unknown as RuntimeDeps);

function fixture() {
  const state = toRunnerTurn(
    createGameAfterSetup({ seed: "departed-breaker-strength" }),
  );
  state.runner.credits = 30;
  const cardId = "boosted-breaker" as CardInstanceId;
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId: "onr_v1_023_evil-twin",
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 4,
  };
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += 1;
  return { state, cardId };
}

describe("breaker strength ends when its installation leaves play", () => {
  it("clears run/turn target bindings without cancelling bonuses on other cards", () => {
    let { state, cardId } = fixture();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const otherId = "other-breaker" as CardInstanceId;
    state.cardInstances[otherId] = {
      ...state.cardInstances[cardId]!,
      instanceId: otherId,
    };
    state.runner.rig.programs.push(otherId);
    state.runner.memoryUsed += 1;
    state.temporaryBreakerStrengthModifiersUntilEndOfTurn = [
      cardId,
      otherId,
    ].map((targetBreakerId) => ({
      sourceCardInstanceId: cardId,
      sourceDefinitionId: state.cardInstances[cardId]!.definitionId,
      targetBreakerId,
      amount: 2,
      turnSerial: state.turnSerial ?? 0,
      expires: "turn_end",
    }));
    const run = state.run!;
    run.breakerState = {
      strengthModifiersByBreakerInstanceId: {
        [cardId]: [{ amount: 2, duration: "current_run", source: "paid_pump" }],
        [otherId]: [
          { amount: 1, duration: "current_run", source: "paid_pump" },
        ],
      },
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [],
    };
    run.remainderStrengthBonusByBreaker = { [cardId]: 2, [otherId]: 1 };
    run.runStartRandomStrengthByBreaker = { [cardId]: 5, [otherId]: 6 };
    run.runStartRandomStrengthSourceCardId = cardId;
    run.runStartRandomStrength = 5;
    runtime.trashRunnerInstalledProgram(state, cardId);
    expect(
      state.temporaryBreakerStrengthModifiersUntilEndOfTurn?.map(
        (entry) => entry.targetBreakerId,
      ),
    ).toEqual([otherId]);
    expect(run.breakerState.strengthModifiersByBreakerInstanceId).toEqual({
      [otherId]: [{ amount: 1, duration: "current_run", source: "paid_pump" }],
    });
    expect(run.remainderStrengthBonusByBreaker).toEqual({ [otherId]: 1 });
    expect(run.runStartRandomStrengthByBreaker).toEqual({ [otherId]: 6 });
    expect(run).not.toHaveProperty("runStartRandomStrengthSourceCardId");
    expect(run).not.toHaveProperty("runStartRandomStrength");
    expect(state.cardInstances[otherId]!.strengthModifier).toBe(4);
    expect(
      getPlayerView(state, "runner").own.heapOrArchives.find(
        (card) => card.instanceId === cardId,
      )?.strength,
    ).toBe(3);
  });

  it("ends the strength bonus when a program is set aside on backup storage", () => {
    const { state, cardId } = fixture();
    const backupId = "backup-storage" as CardInstanceId;
    state.cardInstances[backupId] = {
      ...state.cardInstances[cardId]!,
      instanceId: backupId,
      definitionId: "onr_v1_131_microtech-backup-drive",
      strengthModifier: 0,
    };
    state.runner.rig.hardware.push(backupId);
    placeProgramsOnMicrotechBackupDrive(state, backupId, [cardId]);
    expect(state.cardInstances[cardId]!.strengthModifier).toBe(0);
    expect(state.specialZones?.setAside).toContain(cardId);
    trashMicrotechBackedProgram(state, cardId);
    expect(state.runner.heap).toContain(cardId);
    expect(state.cardInstances[cardId]!.strengthModifier).toBe(0);
  });

  it("clears a paid encounter boost through an actual trash subroutine and replays identically", () => {
    let { state, cardId } = fixture();
    state.cardInstances[cardId]!.strengthModifier = 0;
    const iceId = "trash-subroutine-ice" as CardInstanceId;
    state.cardInstances[iceId] = {
      instanceId: iceId,
      definitionId: "onr_v1_223_banpei",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.corp.servers.find((server) => server.id === "hq")!.ice.push(iceId);
    state.corp.credits = 30;
    const initial = structuredClone(state);
    const eventStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    for (let boost = 0; boost < 4; boost++)
      state = apply(
        state,
        "runner",
        (action) => action.type === "pump_breaker" && action.source === cardId,
      );
    expect(state.cardInstances[cardId]!.strengthModifier).toBe(4);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", `card_${cardId}`);
    expect(state.runner.heap).toContain(cardId);
    expect(state.cardInstances[cardId]!.strengthModifier).toBe(0);
    expect(
      getPlayerView(state, "runner").own.heapOrArchives.find(
        (card) => card.instanceId === cardId,
      ),
    ).toMatchObject({ strength: 3 });
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  for (const route of ["trash", "batch-trash", "return-to-grip"] as const) {
    it(`${route} clears the stored bonus and its public projection before reinstalling`, () => {
      let { state, cardId } = fixture();
      expect(
        getPlayerView(state, "runner").own.rig?.find(
          (card) => card.instanceId === cardId,
        ),
      ).toMatchObject({ strength: 7, strengthModifier: 4 });
      if (route === "trash") runtime.trashRunnerInstalledProgram(state, cardId);
      else if (route === "batch-trash")
        runtime.trashRunnerInstalledCardsToHeapBatch(state, [cardId]);
      else runtime.returnRunnerInstalledCardToGrip(state, cardId);
      expect(state.cardInstances[cardId]!.strengthModifier).toBe(0);
      const view = getPlayerView(state, "runner");
      const departed = [...view.own.heapOrArchives, ...view.own.gripOrHq].find(
        (card) => card.instanceId === cardId,
      );
      expect(departed?.strength).toBe(3);
      expect(departed).not.toHaveProperty("strengthModifier");

      // Arrange recovery independently of whichever recovery card a deck contains.
      // Reinstallation itself must execute through the real LegalActions/engine.
      if (route !== "return-to-grip") {
        removeFromAllZones(state, cardId);
        state.runner.grip.push(cardId);
        state.cardInstances[cardId]!.zone = { side: "runner", zone: "grip" };
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" && action.payload?.cardId === cardId,
      );
      expect(state.runner.rig.programs).toContain(cardId);
      expect(
        getPlayerView(state, "runner").own.rig?.find(
          (card) => card.instanceId === cardId,
        ),
      ).toMatchObject({ strength: 3 });
    });
  }
});
