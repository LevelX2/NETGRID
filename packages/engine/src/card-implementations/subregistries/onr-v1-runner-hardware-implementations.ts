import type { CardImplementationDefinition } from "../types";
import { ONR_V1_RUNNER_HARDWARE_ARASAKA_PORTABLE_PROTOTYPE_TO_PK_6089A_IMPLEMENTATIONS } from "./onr-v1-runner-hardware-arasaka-portable-prototype-to-pk-6089a";
import { ONR_V1_RUNNER_HARDWARE_R_D_INTERFACE_TO_ZZ22_SPEED_CHIP_IMPLEMENTATIONS } from "./onr-v1-runner-hardware-r-d-interface-to-zz22-speed-chip";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_RUNNER_HARDWARE_IMPLEMENTATIONS = [
  ...ONR_V1_RUNNER_HARDWARE_ARASAKA_PORTABLE_PROTOTYPE_TO_PK_6089A_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_HARDWARE_R_D_INTERFACE_TO_ZZ22_SPEED_CHIP_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
