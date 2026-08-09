import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction, makeActionId } from "./action-builders";

describe("turn action builders", () => {
  it("builds stable basic main actions without index.ts helpers", () => {
    const state = createGame({
      seed: "arch-2-turn-action-builder",
      setupMode: "completed",
    });

    expect(
      buildLegalAction(
        state,
        "corp",
        "gain_credit",
        "1 Credit nehmen",
        "basic_action",
        [{ clicks: 1 }],
      ),
    ).toMatchObject({
      actionId: "corp.gain_credit",
      side: "corp",
      type: "gain_credit",
      label: "1 Credit nehmen",
      source: "basic_action",
      timingPoint: state.timingPoint,
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: state.stateVersion,
    });
  });

  it("keeps payload-bearing action IDs stable", () => {
    expect(
      makeActionId(
        "start_run",
        "runner",
        { serverId: "rd", runStartTaxCredits: 2 },
        "basic_action",
      ),
    ).toBe("runner.start_run.rd");
  });

  it("does not reinterpret legacy primitive ability IDs as canonical action identity", () => {
    expect(
      makeActionId(
        "trigger_ability",
        "runner",
        { cardImplementationAbilityId: "legacy:primitive" },
        "legacy-source",
      ),
    ).toBe("runner.trigger_ability.legacy-source");
    expect(
      makeActionId(
        "trigger_ability",
        "runner",
        {
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId: "test_card:gain",
        },
        "canonical-source",
      ),
    ).toBe("runner.trigger_ability.canonical-source.test_card:gain");
  });

  it("distinguishes a bonus run from a normal run on the same server", () => {
    const normalRun = makeActionId(
      "start_run",
      "runner",
      { serverId: "rd", runStartTaxCredits: 0 },
      "basic_action",
    );
    const bonusRun = makeActionId(
      "start_run",
      "runner",
      {
        serverId: "rd",
        runStartTaxCredits: 0,
        bonusRunNoClick: true,
        bonusRunSource: "onr_v1_123_bodyweight-data-creche",
      },
      "basic_action",
    );

    expect(normalRun).toBe("runner.start_run.rd");
    expect(bonusRun).toBe(
      "runner.start_run.rd.bonus_run.onr_v1_123_bodyweight-data-creche",
    );
    expect(bonusRun).not.toBe(normalRun);
  });

  it("distinguishes side-safe target-server variants", () => {
    const hqTarget = makeActionId(
      "trigger_ability",
      "corp",
      {
        cardId: "source_ice",
        serverId: "rd",
        targetServerId: "hq",
        sourceIceIndex: 0,
        targetIceIndex: 0,
      },
      "source_ice",
    );
    const archivesTarget = makeActionId(
      "trigger_ability",
      "corp",
      {
        cardId: "source_ice",
        serverId: "rd",
        targetServerId: "archives",
        sourceIceIndex: 0,
        targetIceIndex: 0,
      },
      "source_ice",
    );

    expect(hqTarget).not.toBe(archivesTarget);
    expect(hqTarget).toContain(".hq.");
    expect(archivesTarget).toContain(".archives.");
  });

  it("distinguishes side-safe counter and decision variants", () => {
    const traceCounter = makeActionId(
      "trigger_ability",
      "runner",
      {
        cardId: "runner_identity",
        counterType: "trace_tag_counter",
        runnerAbility: "remove_runner_trace_counter",
      },
      "runner_identity",
    );
    const mastiffCounter = makeActionId(
      "trigger_ability",
      "runner",
      {
        cardId: "runner_identity",
        counterType: "mastiff",
        runnerAbility: "remove_runner_trace_counter",
      },
      "runner_identity",
    );
    const pay = makeActionId(
      "continue_run",
      "runner",
      { serverId: "rd", decision: "pay" },
      "game_rule",
    );
    const endRun = makeActionId(
      "continue_run",
      "runner",
      { serverId: "rd", decision: "end_run" },
      "game_rule",
    );

    expect(traceCounter).not.toBe(mastiffCounter);
    expect(pay).not.toBe(endRun);
  });
});
