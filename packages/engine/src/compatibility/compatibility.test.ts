import { describe, expect, it } from "vitest";
import {
  ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS,
  isP358FortressRespecificationChoiceSource,
  isP358HiddenReplacementCompatibilityChoiceSource,
  isP358NewBloodReorderChoiceSource,
  isSecretSpendGuessTargetedBypassRunChoiceSource,
  isReplayCompatibilityActionPayload,
} from "./payload-compatibility";
import {
  BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
  BIZARRE_ENCRYPTION_SCHEME_ID,
  CODE_VIRAL_CACHE_ID,
  FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE,
  MICROTECH_TRODE_SET_ID,
  MIT_WEST_TIER_REMOVED_FROM_GAME_REASON,
  SHELL_TRADERS_ID,
  TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE,
} from "./runtime-compatibility";

describe("P3.71 PendingChoice replay compatibility marker stability", () => {
  it("keeps legacy PublicPayload ability fields stable for ActionID and replay compatibility", () => {
    expect(ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS).toStrictEqual([
      "v1911HiddenZoneAbility",
      "v1917AssetAbility",
      "v1918UpgradeAbility",
      "v1919AssetAbility",
      "v1919OperationAbility",
      "v1919UpgradeAbility",
      "v1919RunnerProgramAbility",
      "v1919RunnerEventAbility",
      "v1920AssetAbility",
      "v1921AssetAbility",
      "v1921UpgradeAbility",
      "v1921RunnerProgramAbility",
      "v1921RunnerResourceAbility",
      "resourceAbility",
      "runnerAbility",
      "delayedInstallAbility",
      "obligationDebtAbility",
      "agendaAbility",
    ]);
  });

  it("keeps P3.58 PendingChoice source helpers stable", () => {
    expect(
      isP358HiddenReplacementCompatibilityChoiceSource(
        "hidden_zone.successful_run_fort_ice_reorder:source:rd:1",
      ),
    ).toBe(true);
    expect(
      isP358FortressRespecificationChoiceSource(
        "hidden_zone.successful_run_fort_ice_reorder:source:rd:1",
      ),
    ).toBe(true);
    expect(
      isSecretSpendGuessTargetedBypassRunChoiceSource(
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:source:1",
      ),
    ).toBe(true);
    expect(
      isP358NewBloodReorderChoiceSource("hidden_zone.conceal_and_reorder_installed_ice:source:1"),
    ).toBe(true);
    expect(
      isP358HiddenReplacementCompatibilityChoiceSource("p3_59.future_marker"),
    ).toBe(false);
  });

  it("keeps replay PlayerAction compatibility guard narrow", () => {
    expect(
      isReplayCompatibilityActionPayload({
        matchId: "match",
        side: "runner",
        actionId: "runner.resolve_choice.choice",
        clientKnownStateVersion: 12,
      }),
    ).toBe(true);
    expect(
      isReplayCompatibilityActionPayload({
        matchId: "match",
        side: "runner",
        actionId: "runner.resolve_choice.choice",
      }),
    ).toBe(false);
  });

  it("keeps runtime compatibility source marker values stable", () => {
    expect(MIT_WEST_TIER_REMOVED_FROM_GAME_REASON).toBe(
      "onr_v1_101_mit_west_tier",
    );
    expect(BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE).toBe(
      "onr_v1_222_ball-and-chain",
    );
    expect(FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE).toBe(
      "subroutine:onr_v1_242_fatal-attractor:next_encounter",
    );
    expect(TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE).toBe(
      "onr_v1_371_tokyo-chiba-infighting",
    );
    expect(SHELL_TRADERS_ID).toBe("onr_v1_176_the-shell-traders");
    expect(BIZARRE_ENCRYPTION_SCHEME_ID).toBe(
      "onr_v1_351_bizarre-encryption-scheme",
    );
    expect(CODE_VIRAL_CACHE_ID).toBe("onr_v1_155_code-viral-cache");
    expect(MICROTECH_TRODE_SET_ID).toBe("onr_v1_132_microtech-trode-set");
  });
});
