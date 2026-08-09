import type { CardImplementationDefinition } from "../types";
import { aardvarkImplementation } from "../onr-v1/corp/upgrades/aardvark";
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
import { newGalvestonCityGridImplementation } from "../onr-v1/corp/upgrades/new-galveston-city-grid";
import { oliviaSalazarImplementation } from "../onr-v1/corp/upgrades/olivia-salazar";
import { omniKismetPhDImplementation } from "../onr-v1/corp/upgrades/omni-kismet-ph-d";
import { parisCityGridImplementation } from "../onr-v1/corp/upgrades/paris-city-grid";
import { redHerringsImplementation } from "../onr-v1/corp/upgrades/red-herrings";
import { rioDeJaneiroCityGridImplementation } from "../onr-v1/corp/upgrades/rio-de-janeiro-city-grid";

export const ONR_V1_CORP_UPGRADE_AARDVARK_TO_ROVING_SUBMARINE_IMPLEMENTATIONS =
  [
    aardvarkImplementation,
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
    newGalvestonCityGridImplementation,
    oliviaSalazarImplementation,
    omniKismetPhDImplementation,
    parisCityGridImplementation,
    redHerringsImplementation,
    rioDeJaneiroCityGridImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
