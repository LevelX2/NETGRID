import type { CardDefinitionId } from "@netgrid/shared";
import type { CardImplementationDefinition } from "../card-implementations/types";
import { resolveCardImplementationPrimitiveIdentity } from "./card-implementation-primitives";

export type CardImplementationPrimitiveContractRecord = {
  cardDefinitionId: CardDefinitionId;
  abilityKey: string;
  primitiveKind: string;
  effectKind: string;
  timing: string;
  sourceZone: string;
  sourceType: string;
  visibility: "public" | "hidden_info_barrier";
  requiresTarget: boolean;
  targetKind: string;
  hiddenInfoClass: "public" | "hidden_info_barrier";
  resolverModule: string;
};

export function primitiveContractRecords(
  implementations: readonly CardImplementationDefinition[],
): CardImplementationPrimitiveContractRecord[] {
  const records: CardImplementationPrimitiveContractRecord[] = [];

  for (const implementation of implementations) {
    implementation.successfulRunFollowups?.forEach((followup) => {
      if (followup.kind !== "successful_run_before_access_effect") return;
      const capabilityKey =
        "capabilityKey" in followup &&
        typeof followup.capabilityKey === "string"
          ? followup.capabilityKey
          : undefined;
      records.push({
        cardDefinitionId: implementation.cardDefinitionId,
        abilityKey: resolveCardImplementationPrimitiveIdentity({
          sourceDefinitionId: implementation.cardDefinitionId,
          primitiveKind: followup.kind,
          effectKind: followup.effect.kind,
          abilityKey: followup.abilityKey,
          capabilityKey,
        }).abilityKey,
        primitiveKind: followup.kind,
        effectKind: followup.effect.kind,
        timing: followup.timing,
        sourceZone: "runner_rig",
        sourceType: followup.source,
        visibility: followup.visibility,
        requiresTarget: true,
        targetKind: followup.server,
        hiddenInfoClass: followup.visibility,
        resolverModule: "successful-run-intervention",
      });
    });

    const scoredAgenda = implementation.scoredAgenda;
    if (scoredAgenda?.kind === "select_rezzed_ice_mark_modifier") {
      const identity = resolveCardImplementationPrimitiveIdentity({
        sourceDefinitionId: implementation.cardDefinitionId,
        primitiveKind: scoredAgenda.kind,
        effectKind: "mark_modifier",
        abilityKey:
          "capabilityKey" in scoredAgenda ? undefined : scoredAgenda.abilityKey,
        capabilityKey:
          "capabilityKey" in scoredAgenda &&
          typeof scoredAgenda.capabilityKey === "string"
            ? scoredAgenda.capabilityKey
            : undefined,
      });
      records.push({
        cardDefinitionId: implementation.cardDefinitionId,
        abilityKey: identity.abilityKey,
        primitiveKind: scoredAgenda.kind,
        effectKind: "mark_modifier",
        timing: "score_window",
        sourceZone: "score_area",
        sourceType: "scored_agenda",
        visibility: scoredAgenda.visibility,
        requiresTarget: true,
        targetKind: scoredAgenda.target,
        hiddenInfoClass: scoredAgenda.visibility,
        resolverModule: "scored-agenda/mark-modifier-sequence",
      });
    }
    if (
      scoredAgenda?.kind === "score_install_hq_cards_into_new_remote_then_rez"
    ) {
      records.push({
        cardDefinitionId: implementation.cardDefinitionId,
        abilityKey: resolveCardImplementationPrimitiveIdentity({
          sourceDefinitionId: implementation.cardDefinitionId,
          primitiveKind: scoredAgenda.kind,
          effectKind: "install_rez_sequence",
          abilityKey: scoredAgenda.abilityKey,
          capabilityKey:
            "capabilityKey" in scoredAgenda &&
            typeof scoredAgenda.capabilityKey === "string"
              ? scoredAgenda.capabilityKey
              : undefined,
        }).abilityKey,
        primitiveKind: scoredAgenda.kind,
        effectKind: "install_rez_sequence",
        timing: "score_window",
        sourceZone: scoredAgenda.sourceZone,
        sourceType: "scored_agenda",
        visibility: scoredAgenda.visibility,
        requiresTarget: true,
        targetKind: scoredAgenda.targetServer,
        hiddenInfoClass: scoredAgenda.visibility,
        resolverModule: "scored-agenda/install-rez-sequence",
      });
    }
  }

  return records.sort(
    (left, right) =>
      left.cardDefinitionId.localeCompare(right.cardDefinitionId) ||
      left.abilityKey.localeCompare(right.abilityKey) ||
      left.primitiveKind.localeCompare(right.primitiveKind),
  );
}
