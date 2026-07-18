import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_ASSET_ACME_SAVINGS_AND_LOAN_TO_INFORMATION_LAUNDERING_IMPLEMENTATIONS } from "./onr-v1-corp-asset-acme-savings-and-loan-to-information-laundering";
import { ONR_V1_CORP_ASSET_I_GOT_A_ROCK_TO_SOUTH_AFRICAN_MINING_CORP_IMPLEMENTATIONS } from "./onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp";
import { ONR_V1_CORP_ASSET_SPINN_PUBLIC_RELATIONS_TO_SPINN_PUBLIC_RELATIONS_IMPLEMENTATIONS } from "./onr-v1-corp-asset-spinn-public-relations-to-spinn-public-relations";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_CORP_ASSET_IMPLEMENTATIONS = [
  ...ONR_V1_CORP_ASSET_ACME_SAVINGS_AND_LOAN_TO_INFORMATION_LAUNDERING_IMPLEMENTATIONS,
  ...ONR_V1_CORP_ASSET_I_GOT_A_ROCK_TO_SOUTH_AFRICAN_MINING_CORP_IMPLEMENTATIONS,
  ...ONR_V1_CORP_ASSET_SPINN_PUBLIC_RELATIONS_TO_SPINN_PUBLIC_RELATIONS_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
