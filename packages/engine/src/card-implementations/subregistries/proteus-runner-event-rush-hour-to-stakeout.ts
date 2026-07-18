import type { CardImplementationDefinition } from "../types";
import { proteusRushHourImplementation } from "../proteus/runner/events/rush-hour";
import { proteusSenatorialFieldTripImplementation } from "../proteus/runner/events/senatorial-field-trip";
import { proteusSubliminalCorruptionImplementation } from "../proteus/runner/events/subliminal-corruption";
import { proteusTestSpinImplementation } from "../proteus/runner/events/test-spin";
import { proteusWeefleInitiationImplementation } from "../proteus/runner/events/weefle-initiation";
import { proteusPoisonedWaterSupplyImplementation } from "../proteus/runner/events/poisoned-water-supply";
import { proteusStakeoutImplementation } from "../proteus/runner/events/stakeout";

export const PROTEUS_RUNNER_EVENT_RUSH_HOUR_TO_STAKEOUT_IMPLEMENTATIONS = [
  proteusRushHourImplementation,
  proteusSenatorialFieldTripImplementation,
  proteusSubliminalCorruptionImplementation,
  proteusTestSpinImplementation,
  proteusWeefleInitiationImplementation,
  proteusPoisonedWaterSupplyImplementation,
  proteusStakeoutImplementation,
] as const satisfies readonly CardImplementationDefinition[];
