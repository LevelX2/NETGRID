import type { CardImplementationDefinition } from "../types";
import { valuPakSoftwareBundleImplementation } from "../onr-v1/runner/preps/valu-pak-software-bundle";
import { weatherToFinancePipeImplementation } from "../onr-v1/runner/preps/weather-to-finance-pipe";
import { scoreImplementation } from "../onr-v1/runner/preps/score";

export const ONR_V1_RUNNER_EVENT_VALU_PAK_SOFTWARE_BUNDLE_TO_SCORE_IMPLEMENTATIONS =
  [
    valuPakSoftwareBundleImplementation,
    weatherToFinancePipeImplementation,
    scoreImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
