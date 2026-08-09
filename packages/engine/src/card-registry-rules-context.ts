import { createEngineRegistryRulesContext } from "@netgrid/cards/engine";
import { CURRENT_RULES_BASELINE } from "@netgrid/shared";

export const CARD_IMPLEMENTATION_PRIMITIVE_CONTRACT_VERSION =
  "card-implementation-primitives-v1" as const;

/**
 * Caller-owned engine/primitive versions complete CardSpec rules fingerprints.
 * The selected pool remains empty until productive CardSpecs migrate in CS06.
 */
export function createCurrentCardRegistryRulesContext(params: {
  cardPoolSnapshotId: string;
  matchCardPoolDefinitionIds: readonly string[];
}) {
  return createEngineRegistryRulesContext({
    engineSchemaVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
    cardImplementationVersion: CURRENT_RULES_BASELINE.cardImplementationVersion,
    primitiveContractVersion: CARD_IMPLEMENTATION_PRIMITIVE_CONTRACT_VERSION,
    cardPoolSnapshotId: params.cardPoolSnapshotId,
    matchCardPoolDefinitionIds: params.matchCardPoolDefinitionIds,
  });
}
