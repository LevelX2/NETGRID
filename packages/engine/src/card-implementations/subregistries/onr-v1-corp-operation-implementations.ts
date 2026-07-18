import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_OPERATION_ACCOUNTS_RECEIVABLE_TO_PROJECT_CONSULTANTS_IMPLEMENTATIONS } from "./onr-v1-corp-operation-accounts-receivable-to-project-consultants";
import { ONR_V1_CORP_OPERATION_PUNITIVE_COUNTERSTRIKE_TO_URBAN_RENEWAL_IMPLEMENTATIONS } from "./onr-v1-corp-operation-punitive-counterstrike-to-urban-renewal";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_CORP_OPERATION_IMPLEMENTATIONS = [
  ...ONR_V1_CORP_OPERATION_ACCOUNTS_RECEIVABLE_TO_PROJECT_CONSULTANTS_IMPLEMENTATIONS,
  ...ONR_V1_CORP_OPERATION_PUNITIVE_COUNTERSTRIKE_TO_URBAN_RENEWAL_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
