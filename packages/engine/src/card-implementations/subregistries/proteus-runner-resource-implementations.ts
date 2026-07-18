import type { CardImplementationDefinition } from "../types";
import { PROTEUS_RUNNER_RESOURCE_AIRPORT_LOCKER_TO_TIME_TO_COLLECT_IMPLEMENTATIONS } from "./proteus-runner-resource-airport-locker-to-time-to-collect";
import { PROTEUS_RUNNER_RESOURCE_WIRED_SWITCHBOARD_TO_WIRED_SWITCHBOARD_IMPLEMENTATIONS } from "./proteus-runner-resource-wired-switchboard-to-wired-switchboard";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const PROTEUS_RUNNER_RESOURCE_IMPLEMENTATIONS = [
  ...PROTEUS_RUNNER_RESOURCE_AIRPORT_LOCKER_TO_TIME_TO_COLLECT_IMPLEMENTATIONS,
  ...PROTEUS_RUNNER_RESOURCE_WIRED_SWITCHBOARD_TO_WIRED_SWITCHBOARD_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
