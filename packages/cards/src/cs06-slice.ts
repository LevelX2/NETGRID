import { deepFreezeSerializable } from "./serializable";

/** Exact temporary CS06 cutover partition. Removal condition: CS11. */
export const CS06_CARD_DEFINITION_IDS = deepFreezeSerializable([
  "onr_proteus_020_digiconda",
  "onr_proteus_080_black-widow",
  "onr_proteus_092_morphing-tool",
  "onr_v1_110_sneak-preview",
  "onr_v1_154_broker",
  "onr_v1_168_loan-from-chiba",
  "onr_v1_197_data-fort-reclamation",
  "onr_v1_317_data-masons",
  "onr_v1_348_virus-test-site",
  "onr_v1_368_roving-submarine",
] as const);
