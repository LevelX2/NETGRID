import type { CardImplementationDefinition } from "../types";
import { ONR_V1_RUNNER_EVENT_ALL_NIGHTER_TO_JACK_N_JOE_IMPLEMENTATIONS } from "./onr-v1-runner-event-all-nighter-to-jack-n-joe";
import { ONR_V1_RUNNER_EVENT_KILROY_WAS_HERE_TO_TOTAL_GENETIC_RETROFIT_IMPLEMENTATIONS } from "./onr-v1-runner-event-kilroy-was-here-to-total-genetic-retrofit";
import { ONR_V1_RUNNER_EVENT_VALU_PAK_SOFTWARE_BUNDLE_TO_SCORE_IMPLEMENTATIONS } from "./onr-v1-runner-event-valu-pak-software-bundle-to-score";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_RUNNER_EVENT_IMPLEMENTATIONS = [
  ...ONR_V1_RUNNER_EVENT_ALL_NIGHTER_TO_JACK_N_JOE_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_EVENT_KILROY_WAS_HERE_TO_TOTAL_GENETIC_RETROFIT_IMPLEMENTATIONS,
  ...ONR_V1_RUNNER_EVENT_VALU_PAK_SOFTWARE_BUNDLE_TO_SCORE_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
