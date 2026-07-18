import type { CardImplementationDefinition } from "../types";
import { ONR_V1_RUNNER_RESOURCE_ACCESS_THROUGH_ALPHA_TO_LELAND_CORPORATE_BODYGUARD_IMPLEMENTATIONS } from "./onr-v1-runner-resource-access-through-alpha-to-leland-corporate-bodyguard";
import { ONR_V1_RUNNER_RESOURCE_LOAN_FROM_CHIBA_TO_UMBRELLA_POLICY_IMPLEMENTATIONS } from "./onr-v1-runner-resource-loan-from-chiba-to-umbrella-policy";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_RUNNER_RESOURCE_IMPLEMENTATIONS = [
  ...ONR_V1_RUNNER_RESOURCE_ACCESS_THROUGH_ALPHA_TO_LELAND_CORPORATE_BODYGUARD_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_RESOURCE_LOAN_FROM_CHIBA_TO_UMBRELLA_POLICY_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
