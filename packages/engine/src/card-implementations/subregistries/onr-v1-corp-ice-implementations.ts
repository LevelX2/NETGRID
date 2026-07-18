import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_ICE_ASP_TO_FANG_IMPLEMENTATIONS } from "./onr-v1-corp-ice-asp-to-fang";
import { ONR_V1_CORP_ICE_FANG_2_0_TO_POCKET_VIRTUAL_REALITY_IMPLEMENTATIONS } from "./onr-v1-corp-ice-fang-2-0-to-pocket-virtual-reality";
import { ONR_V1_CORP_ICE_QUANDARY_TO_ZOMBIE_IMPLEMENTATIONS } from "./onr-v1-corp-ice-quandary-to-zombie";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_CORP_ICE_IMPLEMENTATIONS = [
  ...ONR_V1_CORP_ICE_ASP_TO_FANG_IMPLEMENTATIONS,
  ...ONR_V1_CORP_ICE_FANG_2_0_TO_POCKET_VIRTUAL_REALITY_IMPLEMENTATIONS,
  ...ONR_V1_CORP_ICE_QUANDARY_TO_ZOMBIE_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
