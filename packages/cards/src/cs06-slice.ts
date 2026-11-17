import { deepFreezeSerializable } from "./serializable";

/** Exact temporary CS06 cutover partition. Removal condition: CS11. */
export const CS06_CARD_DEFINITION_IDS = deepFreezeSerializable([
  78,
  138,
  150,
  322,
  366,
  380,
  409,
  529,
  560,
  580,
] as const);
