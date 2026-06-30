import type { CardImplementationDefinition } from "../types";
import { classicBoostergangConnectionsImplementation } from "../classic/runner/events/boostergang-connections";
import { classicCorruptionImplementation } from "../classic/runner/events/corruption";
import { classicDoTheDrineImplementation } from "../classic/runner/events/do-the-drine";
import { classicFindersKeepersImplementation } from "../classic/runner/events/finders-keepers";
import { classicGypsytmScheduleAnalyzerImplementation } from "../classic/runner/events/gypsytm-schedule-analyzer";
import { classicLibrarySearchImplementation } from "../classic/runner/events/library-search";
import { classicMeatUpgradeImplementation } from "../classic/runner/events/meat-upgrade";
import { classicNetworkingImplementation } from "../classic/runner/events/networking";
import { classicPanzerRunImplementation } from "../classic/runner/events/panzer-run";
import { classicRunningInterferenceImplementation } from "../classic/runner/events/running-interference";

export const CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS = [
  classicBoostergangConnectionsImplementation,
  classicCorruptionImplementation,
  classicDoTheDrineImplementation,
  classicFindersKeepersImplementation,
  classicGypsytmScheduleAnalyzerImplementation,
  classicLibrarySearchImplementation,
  classicMeatUpgradeImplementation,
  classicNetworkingImplementation,
  classicPanzerRunImplementation,
  classicRunningInterferenceImplementation,
] as const satisfies readonly CardImplementationDefinition[];
