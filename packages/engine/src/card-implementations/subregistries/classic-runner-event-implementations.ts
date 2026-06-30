import type { CardImplementationDefinition } from "../types";
import { classicFindersKeepersImplementation } from "../classic/runner/events/finders-keepers";
import { classicMeatUpgradeImplementation } from "../classic/runner/events/meat-upgrade";
import { classicNetworkingImplementation } from "../classic/runner/events/networking";
import { classicPanzerRunImplementation } from "../classic/runner/events/panzer-run";

export const CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS = [
  classicFindersKeepersImplementation,
  classicMeatUpgradeImplementation,
  classicNetworkingImplementation,
  classicPanzerRunImplementation,
] as const satisfies readonly CardImplementationDefinition[];
