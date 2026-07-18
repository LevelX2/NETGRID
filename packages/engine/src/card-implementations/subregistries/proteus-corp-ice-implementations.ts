import type { CardImplementationDefinition } from "../types";
import { PROTEUS_CORP_ICE_BRAIN_WASH_TO_MARIONETTE_IMPLEMENTATIONS } from "./proteus-corp-ice-brain-wash-to-marionette";
import { PROTEUS_CORP_ICE_MASTERMIND_TO_RIDDLER_IMPLEMENTATIONS } from "./proteus-corp-ice-mastermind-to-riddler";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const PROTEUS_CORP_ICE_IMPLEMENTATIONS = [
  ...PROTEUS_CORP_ICE_BRAIN_WASH_TO_MARIONETTE_IMPLEMENTATIONS,
  ...PROTEUS_CORP_ICE_MASTERMIND_TO_RIDDLER_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
