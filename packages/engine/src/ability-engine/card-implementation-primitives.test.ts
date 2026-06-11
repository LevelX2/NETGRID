import type { CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";
import type { CardImplementationDefinition } from "../card-implementations/types";

type PrimitiveAbilityRecord = {
  abilityKey: string;
  cardDefinitionId: CardDefinitionId;
  scope: string;
};

describe("card implementation primitive ability keys", () => {
  it("are unique per card definition for primitive-backed abilities", () => {
    const failures: string[] = [];

    for (const implementation of CARD_IMPLEMENTATIONS) {
      const seen = new Map<string, string[]>();
      for (const record of primitiveAbilityRecords(implementation)) {
        if (record.abilityKey.trim() === "") {
          failures.push(
            `${record.cardDefinitionId}:${record.scope}: empty abilityKey`,
          );
          continue;
        }
        seen.set(record.abilityKey, [
          ...(seen.get(record.abilityKey) ?? []),
          record.scope,
        ]);
      }

      for (const [abilityKey, scopes] of seen) {
        if (scopes.length > 1) {
          failures.push(
            `${implementation.cardDefinitionId}: duplicate abilityKey ${abilityKey} in ${scopes.join(", ")}`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

function primitiveAbilityRecords(
  implementation: CardImplementationDefinition,
): PrimitiveAbilityRecord[] {
  const records: PrimitiveAbilityRecord[] = [];
  implementation.successfulRunFollowups?.forEach((followup, index) => {
    if (followup.kind !== "successful_run_before_access_effect") return;
    records.push({
      abilityKey: followup.abilityKey ?? "successful_run_before_access:0",
      cardDefinitionId: implementation.cardDefinitionId,
      scope: `successfulRunFollowups[${index}].${followup.kind}`,
    });
  });

  const scoredAgenda = implementation.scoredAgenda;
  if (scoredAgenda?.kind === "select_rezzed_ice_mark_modifier") {
    records.push({
      abilityKey: scoredAgenda.abilityKey ?? "scored_ice_mark:0",
      cardDefinitionId: implementation.cardDefinitionId,
      scope: `scoredAgenda.${scoredAgenda.kind}`,
    });
  }
  if (
    scoredAgenda?.kind === "score_install_hq_cards_into_new_remote_then_rez"
  ) {
    records.push({
      abilityKey: scoredAgenda.abilityKey ?? "hq_to_new_remote_install_rez:0",
      cardDefinitionId: implementation.cardDefinitionId,
      scope: `scoredAgenda.${scoredAgenda.kind}`,
    });
  }

  return records;
}
