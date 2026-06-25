import type { CardImplementationDefinition } from "../types";
import { virizzImplementation } from "../onr-v1/corp/ice/virizz";
import { wallOfIceImplementation } from "../onr-v1/corp/ice/wall-of-ice";
import { wallOfStaticImplementation } from "../onr-v1/corp/ice/wall-of-static";
import { zombieImplementation } from "../onr-v1/corp/ice/zombie";
import { tychoMemChipImplementation } from "../onr-v1/runner/hardware/tycho-mem-chip";
import { wutechMemChipImplementation } from "../onr-v1/runner/hardware/wutech-mem-chip";
import { zetatechMemChipImplementation } from "../onr-v1/runner/hardware/zetatech-mem-chip";
import { zz22SpeedChipImplementation } from "../onr-v1/runner/hardware/zz22-speed-chip";
import { antiquatedInterfaceRoutinesImplementation } from "../onr-v1/corp/upgrades/antiquated-interface-routines";
import { bizarreEncryptionSchemeImplementation } from "../onr-v1/corp/upgrades/bizarre-encryption-scheme";
import { chesterMixImplementation } from "../onr-v1/corp/upgrades/chester-mix";
import { chimeraImplementation } from "../onr-v1/corp/upgrades/chimera";
import { crybabyImplementation } from "../onr-v1/corp/upgrades/crybaby";
import { crystalPalaceStationGridImplementation } from "../onr-v1/corp/upgrades/crystal-palace-station-grid";
import { taggedRunnerMeatDamageUpgradeImplementation } from "../onr-v1/corp/upgrades/dedicated-response-team";
import { accessNetDamageUpgradeImplementation } from "../onr-v1/corp/upgrades/dieter-esslin";
import { drDreffImplementation } from "../onr-v1/corp/upgrades/dr-dreff";
import { jennyJettImplementation } from "../onr-v1/corp/upgrades/jenny-jett";
import { jerusalemCityGridImplementation } from "../onr-v1/corp/upgrades/jerusalem-city-grid";
import { namatokiPlazaImplementation } from "../onr-v1/corp/upgrades/namatoki-plaza";

export const CARD_IMPLEMENTATION_GROUP_018 = [
  virizzImplementation,
  wallOfIceImplementation,
  wallOfStaticImplementation,
  zombieImplementation,
  tychoMemChipImplementation,
  wutechMemChipImplementation,
  zetatechMemChipImplementation,
  zz22SpeedChipImplementation,
  antiquatedInterfaceRoutinesImplementation,
  bizarreEncryptionSchemeImplementation,
  chesterMixImplementation,
  chimeraImplementation,
  crybabyImplementation,
  crystalPalaceStationGridImplementation,
  taggedRunnerMeatDamageUpgradeImplementation,
  accessNetDamageUpgradeImplementation,
  drDreffImplementation,
  jennyJettImplementation,
  jerusalemCityGridImplementation,
  namatokiPlazaImplementation,
] as const satisfies readonly CardImplementationDefinition[];
