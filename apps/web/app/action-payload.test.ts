import { describe, expect, it } from "vitest";
import {
  actionHasAbility,
  isDataFortReclamationInstallPayload,
  isDataFortReclamationRezPayload,
  isExposeOutermostIceEachDataFortPayload,
  isExposeServerCardPayload,
  isSecurityPurgePayload,
  payloadAbilityId,
  payloadHasAbility,
  payloadRandomRoll,
} from "./action-payload";

describe("action payload ability compatibility", () => {
  it("prefers stable abilityId over legacy release payload fields", () => {
    expect(
      payloadAbilityId({
        abilityId: "stable_program_install_action_bundle",
        v1922RunnerEventAbility: "legacy_program_install_action_bundle",
      }),
    ).toBe("stable_program_install_action_bundle");
  });

  it("keeps legacy payload fields and hidden-zone actions as fallback", () => {
    expect(
      actionHasAbility(
        { payload: { v1911HiddenZoneAbility: "self_modifying_code_install_program" } },
        "self_modifying_code_install_program",
      ),
    ).toBe(true);
    expect(payloadAbilityId({ hiddenZoneAction: "v1911_expose_server_card" })).toBe(
      "v1911_expose_server_card",
    );
  });

  it("keeps legacy agenda ability and random roll fields behind helper fallbacks", () => {
    expect(payloadHasAbility({ agendaAbility: "v1922_security_purge" }, "v1922_security_purge")).toBe(
      true,
    );
    expect(
      payloadRandomRoll({
        amounts: { randomRoll: 6 },
        v1921DieRoll: 1,
      }),
    ).toBe(6);
    expect(payloadRandomRoll({ v1921DieRoll: 4 })).toBe(4);
  });

  it("exposes semantic UI predicates for release-legacy payload details", () => {
    expect(
      isDataFortReclamationInstallPayload({
        hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
      }),
    ).toBe(true);
    expect(
      isDataFortReclamationRezPayload({
        hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
      }),
    ).toBe(true);
    expect(
      isExposeServerCardPayload({
        hiddenZoneAction: "v1911_expose_server_card",
      }),
    ).toBe(true);
    expect(
      isExposeOutermostIceEachDataFortPayload({
        hiddenZoneAction: "v1911_expose_outermost_ice_each_data_fort",
      }),
    ).toBe(true);
    expect(isSecurityPurgePayload({ agendaAbility: "v1922_security_purge" })).toBe(
      true,
    );
  });
});
