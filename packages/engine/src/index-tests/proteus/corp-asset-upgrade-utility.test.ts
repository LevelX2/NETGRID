import { describe, expect, it } from "vitest";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";

const PRO014_IDS = [
  "onr_proteus_055_cybertech-think-tank",
  "onr_proteus_056_department-of-misinformation",
  "onr_proteus_059_government-contract",
  "onr_proteus_061_ldl-traffic-analyzers",
  "onr_proteus_067_panic-button",
  "onr_proteus_071_raymond-ellison",
  "onr_proteus_074_siren",
  "onr_proteus_076_syd-meyer-superstores",
] as const;

describe("Proteus PRO014 Corp asset/upgrade utility suite", () => {
  it("registers exactly the eight PRO014 CardImplementation definitions", () => {
    const implementations = new Map(
      CARD_IMPLEMENTATIONS.map((implementation) => [
        implementation.cardDefinitionId,
        implementation,
      ]),
    );

    for (const cardDefinitionId of PRO014_IDS) {
      expect(implementations.get(cardDefinitionId)).toBeDefined();
    }
  });

  it("models the utility suite through declarative CardImplementation hooks", () => {
    const implementations = new Map(
      CARD_IMPLEMENTATIONS.map((implementation) => [
        implementation.cardDefinitionId,
        implementation,
      ]),
    );

    expect(
      implementations.get("onr_proteus_059_government-contract")?.abilities?.[0]
        ?.effects[0]?.kind,
    ).toBe("gain_temporary_corp_credits");
    expect(
      implementations.get("onr_proteus_061_ldl-traffic-analyzers")?.abilities?.[0]
        ?.effects[0]?.kind,
    ).toBe("gain_temporary_trace_credits");
    expect(
      implementations.get("onr_proteus_071_raymond-ellison")?.abilities?.[0]
        ?.effects[0]?.kind,
    ).toBe("remove_same_fort_advancement_counters_for_run_credits");
    expect(
      implementations.get("onr_proteus_076_syd-meyer-superstores")?.abilities?.[0]
        ?.effects[0]?.kind,
    ).toBe("trash_own_rezzed_ice_for_credits");
  });
});
