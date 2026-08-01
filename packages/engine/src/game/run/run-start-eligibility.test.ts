import { describe, expect, it } from "vitest";
import { createGameAfterSetup, getLegalActions } from "../../index";
import {
  ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
  putCorpRootInRemote,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { evaluateRunStartEligibility } from "./run-start-eligibility";
import {
  markFortActivitySinceCorpTurnStart,
  resolveRunStartRestrictionTargetServerId,
  serverRunStartRestrictions,
} from "./server-run-start-restrictions";

describe("run-start eligibility", () => {
  it("uses one source-bound server restriction for legality and presentation", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "run-start-eligibility-source-bound",
        runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
        corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
      }),
    );
    const sourceCardInstanceId = putCorpRootInRemote(
      state,
      "onr_v1_368_roving-submarine",
    );
    const source = state.cardInstances[sourceCardInstanceId]!;
    source.rezzed = true;
    source.faceup = true;

    expect(evaluateRunStartEligibility(state, "remote_1")).toMatchObject({
      allowed: false,
      serverRestrictions: [
        {
          kind: "run_prohibited",
          targetServerId: "remote_1",
          sourceCardInstanceId,
          sourceAbilityId: "fort_activity_gate",
        },
      ],
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);

    markFortActivitySinceCorpTurnStart(state, "remote_1");

    expect(serverRunStartRestrictions(state, "remote_1")).toEqual([]);
    expect(evaluateRunStartEligibility(state, "remote_1").allowed).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(true);
  });

  it("keeps global locks distinct from target-server restrictions", () => {
    const state = createGameAfterSetup({
      seed: "run-start-eligibility-global-lock",
    });
    state.runnerTurnFlags!.runLockActionsPending = 2;

    expect(evaluateRunStartEligibility(state, "rd")).toEqual({
      allowed: false,
      globalLockReason: "required_actions_pending",
      serverRestrictions: [],
    });
  });

  it("resolves the target independently from the source card location", () => {
    const state = createGameAfterSetup({
      seed: "run-start-eligibility-target-binding",
      runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
      corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
    });
    const sourceCardInstanceId = putCorpRootInRemote(
      state,
      "onr_v1_368_roving-submarine",
    );
    const source = state.cardInstances[sourceCardInstanceId]!;
    source.selectedServerId = "rd";

    expect(
      resolveRunStartRestrictionTargetServerId(source, "source_fort"),
    ).toBe("remote_1");
    expect(
      resolveRunStartRestrictionTargetServerId(source, "selected_server"),
    ).toBe("rd");
  });
});
