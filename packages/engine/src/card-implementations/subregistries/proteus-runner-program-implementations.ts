import type { CardImplementationDefinition } from "../types";
import { PROTEUS_RUNNER_PROGRAM_ARMAGEDDON_TO_TAXMAN_IMPLEMENTATIONS } from "./proteus-runner-program-armageddon-to-taxman";
import { PROTEUS_RUNNER_PROGRAM_VIENNA_22_TO_WRECKING_BALL_IMPLEMENTATIONS } from "./proteus-runner-program-vienna-22-to-wrecking-ball";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const PROTEUS_RUNNER_PROGRAM_IMPLEMENTATIONS = [
  ...PROTEUS_RUNNER_PROGRAM_ARMAGEDDON_TO_TAXMAN_IMPLEMENTATIONS,
  ...PROTEUS_RUNNER_PROGRAM_VIENNA_22_TO_WRECKING_BALL_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
