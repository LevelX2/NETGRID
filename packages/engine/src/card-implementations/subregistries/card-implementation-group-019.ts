import type { CardImplementationDefinition } from "../types";
import { newGalvestonCityGridImplementation } from "../onr-v1/corp/upgrades/new-galveston-city-grid";
import { oliviaSalazarImplementation } from "../onr-v1/corp/upgrades/olivia-salazar";
import { omniKismetPhDImplementation } from "../onr-v1/corp/upgrades/omni-kismet-ph-d";
import { parisCityGridImplementation } from "../onr-v1/corp/upgrades/paris-city-grid";
import { redHerringsImplementation } from "../onr-v1/corp/upgrades/red-herrings";
import { rioDeJaneiroCityGridImplementation } from "../onr-v1/corp/upgrades/rio-de-janeiro-city-grid";
import { rovingSubmarineImplementation } from "../onr-v1/corp/upgrades/roving-submarine";
import { singaporeCityGridImplementation } from "../onr-v1/corp/upgrades/singapore-city-grid";
import { tesseractFortConstructionImplementation } from "../onr-v1/corp/upgrades/tesseract-fort-construction";
import { twentyFourHourSurveillanceImplementation } from "../onr-v1/corp/upgrades/twenty-four-hour-surveillance";
import { tokyoChibaInfightingImplementation } from "../onr-v1/corp/upgrades/tokyo-chiba-infighting";
import { oncePerRunAccessTraceUpgradeImplementation } from "../onr-v1/corp/upgrades/turbeau-delacroix";
import { washingtonDcCityGridImplementation } from "../onr-v1/corp/upgrades/washington-d-c-city-grid";
import { proteusBrainWashImplementation } from "../proteus/corp/ice/brain-wash";
import { proteusChihuahuaImplementation } from "../proteus/corp/ice/chihuahua";
import { proteusCoyoteImplementation } from "../proteus/corp/ice/coyote";
import { proteusCorporateGuardRTempsImplementation } from "../proteus/corp/operations/corporate-guard-r-temps";
import { proteusCreditConsolidationImplementation } from "../proteus/corp/operations/credit-consolidation";
import { proteusDataSiftersImplementation } from "../proteus/corp/operations/data-sifters";
import { proteusEmergencyRigImplementation } from "../proteus/corp/operations/emergency-rig";

export const CARD_IMPLEMENTATION_GROUP_019 = [
  newGalvestonCityGridImplementation,
  oliviaSalazarImplementation,
  omniKismetPhDImplementation,
  parisCityGridImplementation,
  redHerringsImplementation,
  rioDeJaneiroCityGridImplementation,
  rovingSubmarineImplementation,
  singaporeCityGridImplementation,
  tesseractFortConstructionImplementation,
  twentyFourHourSurveillanceImplementation,
  tokyoChibaInfightingImplementation,
  oncePerRunAccessTraceUpgradeImplementation,
  washingtonDcCityGridImplementation,
  proteusBrainWashImplementation,
  proteusChihuahuaImplementation,
  proteusCoyoteImplementation,
  proteusCorporateGuardRTempsImplementation,
  proteusCreditConsolidationImplementation,
  proteusDataSiftersImplementation,
  proteusEmergencyRigImplementation,
] as const satisfies readonly CardImplementationDefinition[];
