import type { CardImplementationDefinition } from "../types";
import { singaporeCityGridImplementation } from "../onr-v1/corp/upgrades/singapore-city-grid";
import { tesseractFortConstructionImplementation } from "../onr-v1/corp/upgrades/tesseract-fort-construction";
import { twentyFourHourSurveillanceImplementation } from "../onr-v1/corp/upgrades/twenty-four-hour-surveillance";
import { tokyoChibaInfightingImplementation } from "../onr-v1/corp/upgrades/tokyo-chiba-infighting";
import { oncePerRunAccessTraceUpgradeImplementation } from "../onr-v1/corp/upgrades/turbeau-delacroix";
import { washingtonDcCityGridImplementation } from "../onr-v1/corp/upgrades/washington-d-c-city-grid";

export const ONR_V1_CORP_UPGRADE_SINGAPORE_CITY_GRID_TO_WASHINGTON_D_C_CITY_GRID_IMPLEMENTATIONS =
  [
    singaporeCityGridImplementation,
    tesseractFortConstructionImplementation,
    twentyFourHourSurveillanceImplementation,
    tokyoChibaInfightingImplementation,
    oncePerRunAccessTraceUpgradeImplementation,
    washingtonDcCityGridImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
