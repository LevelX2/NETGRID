import type { CardImplementationDefinition } from "../types";
import { proteusVienna22Implementation } from "../proteus/runner/programs/vienna-22";
import { proteusViralPipelineImplementation } from "../proteus/runner/programs/viral-pipeline";
import { proteusWreckingBallImplementation } from "../proteus/runner/programs/wrecking-ball";

export const PROTEUS_RUNNER_PROGRAM_VIENNA_22_TO_WRECKING_BALL_IMPLEMENTATIONS =
  [
    proteusVienna22Implementation,
    proteusViralPipelineImplementation,
    proteusWreckingBallImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
