import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_UPGRADE_AARDVARK_TO_ROVING_SUBMARINE_IMPLEMENTATIONS } from "./onr-v1-corp-upgrade-aardvark-to-roving-submarine";
import { ONR_V1_CORP_UPGRADE_SINGAPORE_CITY_GRID_TO_WASHINGTON_D_C_CITY_GRID_IMPLEMENTATIONS } from "./onr-v1-corp-upgrade-singapore-city-grid-to-washington-d-c-city-grid";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_CORP_UPGRADE_IMPLEMENTATIONS = [
  ...ONR_V1_CORP_UPGRADE_AARDVARK_TO_ROVING_SUBMARINE_IMPLEMENTATIONS,
  ...ONR_V1_CORP_UPGRADE_SINGAPORE_CITY_GRID_TO_WASHINGTON_D_C_CITY_GRID_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
