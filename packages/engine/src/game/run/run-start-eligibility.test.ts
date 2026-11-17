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
  runStartRestrictionCapabilityKey,
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
    const sourceCardInstanceId = putCorpRootInRemote(state, 580);
    const source = state.cardInstances[sourceCardInstanceId]!;
    source.rezzed = true;
    source.faceup = true;

    expect(evaluateRunStartEligibility(state, "r1")).toMatchObject({
      allowed: false,
      serverRestrictions: [
        {
          kind: "run_prohibited",
          targetServerId: "r1",
          sourceCardInstanceId,
          sourceAbilityId: "fort_activity_gate",
        },
      ],
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "r1",
      ),
    ).toBe(false);

    markFortActivitySinceCorpTurnStart(state, "r1");

    expect(serverRunStartRestrictions(state, "r1")).toEqual([]);
    expect(evaluateRunStartEligibility(state, "r1").allowed).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "r1",
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
    const sourceCardInstanceId = putCorpRootInRemote(state, 580);
    const source = state.cardInstances[sourceCardInstanceId]!;
    source.selectedServerId = "rd";

    expect(
      resolveRunStartRestrictionTargetServerId(source, "source_fort"),
    ).toBe("r1");
    expect(
      resolveRunStartRestrictionTargetServerId(source, "selected_server"),
    ).toBe("rd");
  });

  it("resolves exactly one canonical or legacy restriction identity", () => {
    const base = {
      kind: "server_run_start_restriction",
      target: "source_fort",
      condition:
        "corp_installed_or_advanced_on_target_server_during_latest_corp_turn",
    };
    type Restriction = Parameters<typeof runStartRestrictionCapabilityKey>[1];

    expect(
      runStartRestrictionCapabilityKey(1843825557, {
        ...base,
        capabilityKey: "fort_activity_gate",
      } as Restriction),
    ).toBe("fort_activity_gate");
    expect(
      runStartRestrictionCapabilityKey(3167603822, {
        ...base,
        abilityKey: "legacy_fort_activity_gate",
      } as Restriction),
    ).toBe("legacy_fort_activity_gate");
    expect(() =>
      runStartRestrictionCapabilityKey(2368939379, {
        ...base,
        capabilityKey: "fort_activity_gate",
        abilityKey: "legacy_fort_activity_gate",
      } as Restriction),
    ).toThrow("hybrid_run_restriction_capability_identity: 2368939379");
    expect(() =>
      runStartRestrictionCapabilityKey(3069454615, base as Restriction),
    ).toThrow("run_restriction_capability_identity_missing: 3069454615");
  });
});
