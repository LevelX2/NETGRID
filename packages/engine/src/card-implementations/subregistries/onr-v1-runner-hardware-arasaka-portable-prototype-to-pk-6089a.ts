import type { CardImplementationDefinition } from "../types";
import { arasakaPortablePrototypeImplementation } from "../onr-v1/runner/hardware/arasaka-portable-prototype";
import { armadilloArmoredRoadHomeImplementation } from "../onr-v1/runner/hardware/armadillo-armored-road-home";
import { armoredFridgeImplementation } from "../onr-v1/runner/hardware/armored-fridge";
import { artemis2020Implementation } from "../onr-v1/runner/hardware/artemis-2020";
import { bodyweightDataCrecheImplementation } from "../onr-v1/runner/hardware/bodyweight-data-creche";
import { corollaSpeedChipImplementation } from "../onr-v1/runner/hardware/corolla-speed-chip";
import { dermatechBodyplatingImplementation } from "../onr-v1/runner/hardware/dermatech-bodyplating";
import { drifterMobileEnvironmentImplementation } from "../onr-v1/runner/hardware/drifter-mobile-environment";
import { fullBodyConversionImplementation } from "../onr-v1/runner/hardware/full-body-conversion";
import { greenKnightSurgeBuffersImplementation } from "../onr-v1/runner/hardware/green-knight-surge-buffers";
import { hqInterfaceImplementation } from "../onr-v1/runner/hardware/hq-interface";
import { lifesaverNanosurgeonsImplementation } from "../onr-v1/runner/hardware/lifesaver-nanosurgeons";
import { microtechBackupDriveImplementation } from "../onr-v1/runner/hardware/microtech-backup-drive";
import { militechMramChipImplementation } from "../onr-v1/runner/hardware/militech-mram-chip";
import { microtechTrodeSetImplementation } from "../onr-v1/runner/hardware/microtech-trode-set";
import { mramChipImplementation } from "../onr-v1/runner/hardware/mram-chip";
import { nasukoCycleImplementation } from "../onr-v1/runner/hardware/nasuko-cycle";
import { pandorasDeckImplementation } from "../onr-v1/runner/hardware/pandoras-deck";
import { parraline5750Implementation } from "../onr-v1/runner/hardware/parraline-5750";
import { pk6089aImplementation } from "../onr-v1/runner/hardware/pk-6089a";

export const ONR_V1_RUNNER_HARDWARE_ARASAKA_PORTABLE_PROTOTYPE_TO_PK_6089A_IMPLEMENTATIONS =
  [
    arasakaPortablePrototypeImplementation,
    armadilloArmoredRoadHomeImplementation,
    armoredFridgeImplementation,
    artemis2020Implementation,
    bodyweightDataCrecheImplementation,
    corollaSpeedChipImplementation,
    dermatechBodyplatingImplementation,
    drifterMobileEnvironmentImplementation,
    fullBodyConversionImplementation,
    greenKnightSurgeBuffersImplementation,
    hqInterfaceImplementation,
    lifesaverNanosurgeonsImplementation,
    microtechBackupDriveImplementation,
    militechMramChipImplementation,
    microtechTrodeSetImplementation,
    mramChipImplementation,
    nasukoCycleImplementation,
    pandorasDeckImplementation,
    parraline5750Implementation,
    pk6089aImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
