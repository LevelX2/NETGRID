import { describe, expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import {
  applyAction,
  CARD_DEFINITIONS_BY_ID,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  applyChoice,
  onrV1Game,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  addCorpCardToHqForTest,
  addInstalledRunnerProgramForTest,
  addRezzedCorpRootForTest,
} from "../../test-fixtures/index-test-helpers";

const MARIONETTE = "onr_proteus_029_marionette";
const returnCases = [
  ["onr_proteus_018_datacomb", "pay", 0],
  [MARIONETTE, "pay", 0],
  ["onr_proteus_043_twisty-passages", "pay", 0],
  ["onr_proteus_019_death-yo-yo", "decline", 1],
  ["onr_proteus_037_scaffolding", "decline", 1],
  ["onr_proteus_042_tumblers", "decline", 1],
] as const;

function setup(definitionId = MARIONETTE) {
  const state = toRunnerTurn(onrV1Game(`dreff-return-${definitionId}`));
  state.corp.credits = 20;
  state.runner.credits = 20;
  addRezzedCorpRootForTest(state, "onr_v1_358_dr-dreff", "remote_1", "dreff");
  const iceId = addCorpCardToHqForTest(state, definitionId, "temporary");
  const secretId = addCorpCardToHqForTest(state, "onr_v1_223_banpei", "secret");
  return { state, iceId, secretId };
}

function encounter(state: GameState, iceId: string) {
  state = apply(
    state,
    "runner",
    (a) => a.type === "start_run" && a.payload?.serverId === "remote_1",
  );
  const option = state.pendingChoice!.options.find((o) => o.value === iceId)!;
  return applyChoice(state, "corp", option.id);
}

function assertReplay(initial: GameState, state: GameState) {
  expect(validateGameState(state)).toMatchObject({ ok: true });
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(state));
}

describe("Dr. Dreff temporary ICE pass lifecycle", () => {
  it("returns Marionette before trash through real breaks, hides other HQ ICE and permits reuse", () => {
    const setupState = setup();
    let { state } = setupState;
    const { iceId, secretId } = setupState;
    addInstalledRunnerProgramForTest(state, "onr_v1_040_loony-goon", "breaker");
    const initial = structuredClone(state);
    for (let run = 0; run < 2; run++) {
      state = encounter(state, iceId);
      expect(state.cardInstances[iceId]).toMatchObject({
        rezzed: false,
        zone: { zone: "set_aside" },
      });
      for (const index of [0, 1])
        state = apply(
          state,
          "runner",
          (a) =>
            a.type === "break_subroutine" &&
            a.payload?.subroutineIndex === index,
        );
      state = apply(state, "runner", (a) => a.type === "continue_run");
      expect(state.run?.corpPostPassIceReturnToHq?.passedIceId).toBe(iceId);
      expect(state.run?.successful).toBe(false);
      expect(state.corp.archives).not.toContain(iceId);
      const actions = getLegalActions(state, "corp");
      expect(
        actions.every(
          (a) => a.payload?.postPassIceTrashedUnlessReturned === true,
        ),
      ).toBe(true);
      const returnAction = actions.find(
        (a) => a.payload?.decision === "return_to_hq",
      )!;
      expect(returnAction).toBeDefined();
      expect(getLegalActions(state, "runner")).toEqual([]);
      for (const [side, version] of [
        ["runner", state.stateVersion],
        ["corp", state.stateVersion - 1],
      ] as const) {
        expect(
          applyAction(state, {
            matchId: state.matchId,
            side,
            actionId: returnAction.actionId,
            clientKnownStateVersion: version,
            idempotencyKey: `invalid-${run}-${side}`,
          }).ok,
        ).toBe(false);
      }
      state = apply(state, "corp", (a) => a.actionId === returnAction.actionId);
      expect(state.corp.hq.filter((id) => id === iceId)).toHaveLength(1);
      expect(state.specialZones?.setAside).not.toContain(iceId);
      expect(state.corp.archives).not.toContain(iceId);
      expect(state.cardInstances[iceId]).toMatchObject({
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "hq" },
      });
      expect(state.run?.delayedSuccessfulRun).toBeUndefined();
      const event = state.eventLog.at(-1)!;
      expect(event.publicPayload).toMatchObject({
        returnedToHq: true,
        returnedCardDefinitionId: MARIONETTE,
        sourceDefinitionId: MARIONETTE,
      });
      for (const serialized of [
        JSON.stringify(event.publicPayload),
        JSON.stringify(getPlayerView(state, "runner")),
      ]) {
        expect(serialized).not.toContain(secretId);
        expect(serialized).not.toContain("onr_v1_223_banpei");
        expect(serialized).not.toContain(iceId);
      }
      state = apply(state, "runner", (a) => a.type === "continue_run");
      expect(state.run).toMatchObject({ successful: true, phase: "access" });
      // Leave the access window without trashing Dreff, then run the same fort again.
      state = apply(state, "runner", (a) => a.type === "access_card");
      state = apply(state, "runner", (a) => a.type === "decline_trash");
      expect(state.run).toBeUndefined();
    }
    expect(state.corp.credits).toBe(initial.corp.credits - 2);
    assertReplay(initial, state);
  });

  it.each(returnCases)(
    "returns temporary %s under its declared pass mode",
    (definitionId, alternative, gain) => {
      let { state, iceId } = setup(definitionId);
      state = encounter(state, iceId);
      state.run!.brokenSubroutineIndexes = CARD_DEFINITIONS_BY_ID[
        definitionId
      ]!.subroutines!.map((_, i) => i);
      const initial = structuredClone(state);
      state = apply(state, "runner", (a) => a.type === "continue_run");
      expect(
        getLegalActions(state, "corp")
          .map((a) => a.payload?.decision)
          .sort(),
      ).toEqual([alternative, "return_to_hq"].sort());
      expect(
        getLegalActions(state, "corp").every(
          (a) => a.payload?.postPassIceTrashedUnlessReturned === true,
        ),
      ).toBe(true);
      state = apply(
        state,
        "corp",
        (a) => a.payload?.decision === "return_to_hq",
      );
      expect(state.corp.hq).toContain(iceId);
      expect(state.corp.archives).not.toContain(iceId);
      expect(state.corp.credits).toBe(initial.corp.credits + gain);
      expect(state.run?.delayedSuccessfulRun).toBeUndefined();
      assertReplay(initial, state);
    },
  );

  it.each(returnCases)(
    "trashes temporary %s after choosing %s",
    (definitionId, alternative) => {
      let { state, iceId } = setup(definitionId);
      state = encounter(state, iceId);
      state.run!.brokenSubroutineIndexes = CARD_DEFINITIONS_BY_ID[
        definitionId
      ]!.subroutines!.map((_, i) => i);
      const initial = structuredClone(state);
      state = apply(state, "runner", (a) => a.type === "continue_run");
      state = apply(state, "corp", (a) => a.payload?.decision === alternative);
      expect(state.corp.archives.filter((id) => id === iceId)).toHaveLength(1);
      expect(state.corp.hq).not.toContain(iceId);
      expect(state.specialZones?.setAside).not.toContain(iceId);
      expect(state.corp.credits).toBe(
        initial.corp.credits - (alternative === "pay" ? 1 : 0),
      );
      expect(state.run?.delayedSuccessfulRun).toBeUndefined();
      assertReplay(initial, state);
    },
  );

  it("offers only return when the Corp cannot pay Marionette's pass cost", () => {
    let { state, iceId } = setup();
    state.corp.credits = 1;
    state = encounter(state, iceId);
    state.run!.brokenSubroutineIndexes = [0, 1];
    const initial = structuredClone(state);
    state = apply(state, "runner", (a) => a.type === "continue_run");
    expect(
      getLegalActions(state, "corp").map((a) => a.payload?.decision),
    ).toEqual(["return_to_hq"]);
    state = apply(state, "corp", (a) => a.payload?.decision === "return_to_hq");
    expect(state.corp.credits).toBe(0);
    assertReplay(initial, state);
  });

  it("trashes Marionette without a return window when its end-run subroutine resolves", () => {
    let { state, iceId } = setup();
    state = encounter(state, iceId);
    state.run!.brokenSubroutineIndexes = [0];
    const initial = structuredClone(state);
    state = apply(state, "runner", (a) => a.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.corp.archives.filter((id) => id === iceId)).toHaveLength(1);
    expect(state.corp.hq).not.toContain(iceId);
    assertReplay(initial, state);
  });
});
