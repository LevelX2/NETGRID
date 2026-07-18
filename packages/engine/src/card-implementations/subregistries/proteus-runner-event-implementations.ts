import type { CardImplementationDefinition } from "../types";
import { PROTEUS_RUNNER_EVENT_FAKED_HIT_TO_REMOTE_DETONATOR_IMPLEMENTATIONS } from "./proteus-runner-event-faked-hit-to-remote-detonator";
import { PROTEUS_RUNNER_EVENT_RUSH_HOUR_TO_STAKEOUT_IMPLEMENTATIONS } from "./proteus-runner-event-rush-hour-to-stakeout";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const PROTEUS_RUNNER_EVENT_IMPLEMENTATIONS = [
  ...PROTEUS_RUNNER_EVENT_FAKED_HIT_TO_REMOTE_DETONATOR_IMPLEMENTATIONS,
  ...PROTEUS_RUNNER_EVENT_RUSH_HOUR_TO_STAKEOUT_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
