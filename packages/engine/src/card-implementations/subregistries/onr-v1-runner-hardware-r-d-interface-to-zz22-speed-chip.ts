import type { CardImplementationDefinition } from "../types";
import { rAndDInterfaceImplementation } from "../onr-v1/runner/hardware/r-d-interface";
import { ravenMicrocybEagleImplementation } from "../onr-v1/runner/hardware/raven-microcyb-eagle";
import { ravenMicrocybOwlImplementation } from "../onr-v1/runner/hardware/raven-microcyb-owl";
import { recordReconstructorImplementation } from "../onr-v1/runner/hardware/record-reconstructor";
import { techtronicaUtilitySuitImplementation } from "../onr-v1/runner/hardware/techtronica-utility-suit";
import { tychoMemChipImplementation } from "../onr-v1/runner/hardware/tycho-mem-chip";
import { wutechMemChipImplementation } from "../onr-v1/runner/hardware/wutech-mem-chip";
import { zetatechMemChipImplementation } from "../onr-v1/runner/hardware/zetatech-mem-chip";
import { zz22SpeedChipImplementation } from "../onr-v1/runner/hardware/zz22-speed-chip";

export const ONR_V1_RUNNER_HARDWARE_R_D_INTERFACE_TO_ZZ22_SPEED_CHIP_IMPLEMENTATIONS =
  [
    rAndDInterfaceImplementation,
    ravenMicrocybEagleImplementation,
    ravenMicrocybOwlImplementation,
    recordReconstructorImplementation,
    techtronicaUtilitySuitImplementation,
    tychoMemChipImplementation,
    wutechMemChipImplementation,
    zetatechMemChipImplementation,
    zz22SpeedChipImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
