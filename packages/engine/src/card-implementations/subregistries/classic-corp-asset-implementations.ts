import type { CardImplementationDefinition } from "../types";
import { classicIndiscriminateResponseTeamImplementation } from "../classic/corp/assets/indiscriminate-response-team";
import { classicSatelliteMonitorsImplementation } from "../classic/corp/assets/satellite-monitors";
import { classicStrategicPlanningGroupImplementation } from "../classic/corp/assets/strategic-planning-group";

export const CLASSIC_CORP_ASSET_IMPLEMENTATIONS = [
  classicIndiscriminateResponseTeamImplementation,
  classicSatelliteMonitorsImplementation,
  classicStrategicPlanningGroupImplementation,
] as const satisfies readonly CardImplementationDefinition[];
