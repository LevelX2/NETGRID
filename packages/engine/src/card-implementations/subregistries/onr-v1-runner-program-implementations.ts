import type { CardImplementationDefinition } from "../types";
import { ONR_V1_RUNNER_PROGRAM_AFREET_TO_DUPRE_IMPLEMENTATIONS } from "./onr-v1-runner-program-afreet-to-dupre";
import { ONR_V1_RUNNER_PROGRAM_DWARF_TO_LOONY_GOON_IMPLEMENTATIONS } from "./onr-v1-runner-program-dwarf-to-loony-goon";
import { ONR_V1_RUNNER_PROGRAM_RABBIT_TO_SHAKA_IMPLEMENTATIONS } from "./onr-v1-runner-program-rabbit-to-shaka";
import { ONR_V1_RUNNER_PROGRAM_SHIELD_TO_ZETATECH_SOFTWARE_INSTALLER_IMPLEMENTATIONS } from "./onr-v1-runner-program-shield-to-zetatech-software-installer";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_RUNNER_PROGRAM_IMPLEMENTATIONS = [
  ...ONR_V1_RUNNER_PROGRAM_AFREET_TO_DUPRE_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_PROGRAM_DWARF_TO_LOONY_GOON_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_PROGRAM_RABBIT_TO_SHAKA_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_PROGRAM_SHIELD_TO_ZETATECH_SOFTWARE_INSTALLER_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
