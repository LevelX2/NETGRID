import type { CardImplementationDefinition } from "../types";
import { classicLondonCityGridImplementation } from "../classic/corp/upgrades/london-city-grid";
import { classicSelfDestructImplementation } from "../classic/corp/upgrades/self-destruct";
import { classicShockTreatmentImplementation } from "../classic/corp/upgrades/shock-treatment";
import { classicSterdroidImplementation } from "../classic/corp/upgrades/sterdroid";
import { classicStreetEnforcerImplementation } from "../classic/corp/upgrades/street-enforcer";

export const CLASSIC_CORP_UPGRADE_IMPLEMENTATIONS = [
  classicLondonCityGridImplementation,
  classicSelfDestructImplementation,
  classicShockTreatmentImplementation,
  classicSterdroidImplementation,
  classicStreetEnforcerImplementation,
] as const satisfies readonly CardImplementationDefinition[];
