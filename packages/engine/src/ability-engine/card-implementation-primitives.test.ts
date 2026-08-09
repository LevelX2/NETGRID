import { describe, expect, it } from "vitest";
import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import primitiveContractManifest from "../../../../data/ai/card-implementation-primitive-contracts.json";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";
import type { CardImplementationDefinition } from "../card-implementations/types";
import {
  primitiveContractRecords,
  type CardImplementationPrimitiveContractRecord,
} from "./card-implementation-primitive-contracts";
import {
  cardImplementationPrimitivePayload,
  CardImplementationPrimitiveIdentityError,
} from "./card-implementation-primitives";

const DATA_FORT_RECLAMATION_DEFINITION_ID = "onr_v1_197_data-fort-reclamation";

describe("card implementation primitive ability keys", () => {
  it("are unique per card definition for primitive-backed abilities", () => {
    const failures: string[] = [];

    const records = primitiveContractRecords(CARD_IMPLEMENTATIONS);
    for (const cardDefinitionId of new Set(
      records.map((record) => record.cardDefinitionId),
    )) {
      const seen = new Map<string, string[]>();
      for (const record of records.filter(
        (candidate) => candidate.cardDefinitionId === cardDefinitionId,
      )) {
        if (record.abilityKey.trim() === "") {
          failures.push(
            `${record.cardDefinitionId}:${primitiveAbilityRecordScope(record)}: empty abilityKey`,
          );
          continue;
        }
        seen.set(record.abilityKey, [
          ...(seen.get(record.abilityKey) ?? []),
          primitiveAbilityRecordScope(record),
        ]);
      }

      for (const [abilityKey, scopes] of seen) {
        if (scopes.length > 1) {
          failures.push(
            `${cardDefinitionId}: duplicate abilityKey ${abilityKey} in ${scopes.join(", ")}`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("matches the checked-in primitive contract manifest", () => {
    const derived = primitiveContractRecords(CARD_IMPLEMENTATIONS);
    const manifest =
      primitiveContractManifest as CardImplementationPrimitiveContractRecord[];

    expect(derived).toEqual(manifest);
    expect(manifest).toHaveLength(4);
    for (const record of manifest) {
      expect(record.visibility).toMatch(/^(public|hidden_info_barrier)$/);
      expect(record.hiddenInfoClass).toMatch(/^(public|hidden_info_barrier)$/);
      expect(record.resolverModule).toBeTruthy();
      if (record.hiddenInfoClass === "hidden_info_barrier") {
        expect(record.visibility).toBe("hidden_info_barrier");
      }
    }
  });

  it("requires the canonical Data Fort capability key without a legacy index fallback", () => {
    const canonical = CARD_IMPLEMENTATIONS.find(
      (implementation) =>
        implementation.cardDefinitionId === DATA_FORT_RECLAMATION_DEFINITION_ID,
    );
    expect(canonical).toBeDefined();
    const record = primitiveContractRecords(CARD_IMPLEMENTATIONS).find(
      (candidate) =>
        candidate.cardDefinitionId === DATA_FORT_RECLAMATION_DEFINITION_ID,
    );
    expect(record?.abilityKey).toBe("hq_to_new_remote_install_rez");
    expect(record?.abilityKey).not.toContain(":0");

    const scoredAgenda = Object.fromEntries(
      Object.entries(canonical!.scoredAgenda ?? {}).filter(
        ([key]) => key !== "capabilityKey",
      ),
    );
    const invalid = {
      ...canonical,
      scoredAgenda,
    } as CardImplementationDefinition;
    expect(() => primitiveContractRecords([invalid])).toThrowError(
      expect.objectContaining({
        name: "CardImplementationPrimitiveIdentityError",
        code: "missing_card_spec_capability_key",
        definitionId: DATA_FORT_RECLAMATION_DEFINITION_ID,
      }) as CardImplementationPrimitiveIdentityError,
    );
  });

  it("preserves legacy primitive payload identity without claiming an index binding", () => {
    const payload = cardImplementationPrimitivePayload({
      sourceCardId: "legacy_primitive_instance" as CardInstanceId,
      sourceDefinitionId: "onr_v1_204_ice-transmutation" as CardDefinitionId,
      primitiveKind: "select_rezzed_ice_mark_modifier",
      effectKind: "mark_modifier",
    });
    expect(payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_v1_204_ice-transmutation:scored_ice_mark:0",
      cardImplementationAbilityKey: "scored_ice_mark:0",
    });
    expect(payload).not.toHaveProperty(
      "cardImplementationCapabilityBindingKind",
    );
    expect(payload).not.toHaveProperty("cardImplementationAbilityIndex");
  });
});

function primitiveAbilityRecordScope(
  record: CardImplementationPrimitiveContractRecord,
): string {
  return `${record.primitiveKind}.${record.effectKind}`;
}
