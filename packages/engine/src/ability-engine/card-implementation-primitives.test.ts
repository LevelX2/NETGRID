import { describe, expect, it } from "vitest";
import primitiveContractManifest from "../../../../data/ai/card-implementation-primitive-contracts.json";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";
import {
  primitiveContractRecords,
  type CardImplementationPrimitiveContractRecord,
} from "./card-implementation-primitive-contracts";

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
});

function primitiveAbilityRecordScope(
  record: CardImplementationPrimitiveContractRecord,
): string {
  return `${record.primitiveKind}.${record.effectKind}`;
}
