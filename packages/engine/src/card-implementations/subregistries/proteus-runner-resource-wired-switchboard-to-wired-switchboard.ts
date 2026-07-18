import type { CardImplementationDefinition } from "../types";
import { proteusWiredSwitchboardImplementation } from "../proteus/runner/resources/wired-switchboard";

export const PROTEUS_RUNNER_RESOURCE_WIRED_SWITCHBOARD_TO_WIRED_SWITCHBOARD_IMPLEMENTATIONS =
  [
    proteusWiredSwitchboardImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
