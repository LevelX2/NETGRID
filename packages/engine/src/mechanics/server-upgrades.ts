import { crybabyImplementation } from "../card-implementations/onr-v1/corp/upgrades/crybaby";
import { taggedRunnerMeatDamageUpgradeImplementation } from "../card-implementations/onr-v1/corp/upgrades/dedicated-response-team";
import { accessNetDamageUpgradeImplementation } from "../card-implementations/onr-v1/corp/upgrades/dieter-esslin";
import { drDreffImplementation } from "../card-implementations/onr-v1/corp/upgrades/dr-dreff";
import { omniKismetPhDImplementation } from "../card-implementations/onr-v1/corp/upgrades/omni-kismet-ph-d";
import { parisCityGridImplementation } from "../card-implementations/onr-v1/corp/upgrades/paris-city-grid";
import { oncePerRunAccessTraceUpgradeImplementation } from "../card-implementations/onr-v1/corp/upgrades/turbeau-delacroix";
import { twentyFourHourSurveillanceImplementation } from "../card-implementations/onr-v1/corp/upgrades/twenty-four-hour-surveillance";

export const DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID =
  taggedRunnerMeatDamageUpgradeImplementation.cardDefinitionId;

export const DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID =
  accessNetDamageUpgradeImplementation.cardDefinitionId;

export const CRYBABY_ACCESS_COST_UPGRADE_ID =
  crybabyImplementation.cardDefinitionId;

export const DR_DREFF_COUNTER_RUN_TAX_UPGRADE_ID =
  drDreffImplementation.cardDefinitionId;

export const OMNI_KISMET_TAG_CONDITION_UPGRADE_ID =
  omniKismetPhDImplementation.cardDefinitionId;

export const PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID =
  parisCityGridImplementation.cardDefinitionId;

export const TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID =
  oncePerRunAccessTraceUpgradeImplementation.cardDefinitionId;

export const TWENTY_FOUR_HOUR_SURVEILLANCE_RUN_TAX_UPGRADE_ID =
  twentyFourHourSurveillanceImplementation.cardDefinitionId;
