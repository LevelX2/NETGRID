import type { CardImplementationDefinition } from "../types";
import { classicLittleBlackBoxImplementation } from "../classic/runner/hardware/little-black-box";
import { classicOmnitechSpinalTapCybermodemImplementation } from "../classic/runner/hardware/omnitech-spinal-tap-cybermodem";
import { classicOmnitechWetDriveImplementation } from "../classic/runner/hardware/omnitech-wet-drive";
import { classicVintageCamaroImplementation } from "../classic/runner/hardware/vintage-camaro";
import { classicZetatechPortastationImplementation } from "../classic/runner/hardware/zetatech-portastation";

export const CLASSIC_RUNNER_HARDWARE_IMPLEMENTATIONS = [
  classicLittleBlackBoxImplementation,
  classicOmnitechSpinalTapCybermodemImplementation,
  classicOmnitechWetDriveImplementation,
  classicVintageCamaroImplementation,
  classicZetatechPortastationImplementation,
] as const satisfies readonly CardImplementationDefinition[];
