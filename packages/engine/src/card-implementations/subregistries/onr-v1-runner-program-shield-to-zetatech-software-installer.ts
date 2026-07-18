import type { CardImplementationDefinition } from "../types";
import { shieldImplementation } from "../onr-v1/runner/programs/shield";
import { shredderUplinkProtocolImplementation } from "../onr-v1/runner/programs/shredder-uplink-protocol";
import { signpostImplementation } from "../onr-v1/runner/programs/signpost";
import { smarteyeImplementation } from "../onr-v1/runner/programs/smarteye";
import { skivvissImplementation } from "../onr-v1/runner/programs/skivviss";
import { snowballImplementation } from "../onr-v1/runner/programs/snowball";
import { speedTrapImplementation } from "../onr-v1/runner/programs/speed-trap";
import { startupImmolatorImplementation } from "../onr-v1/runner/programs/startup-immolator";
import { succubusImplementation } from "../onr-v1/runner/programs/succubus";
import { tinweaselImplementation } from "../onr-v1/runner/programs/tinweasel";
import { vewyVewyQuietImplementation } from "../onr-v1/runner/programs/vewy-vewy-quiet";
import { wildCardImplementation } from "../onr-v1/runner/programs/wild-card";
import { wizardsBookImplementation } from "../onr-v1/runner/programs/wizards-book";
import { wormImplementation } from "../onr-v1/runner/programs/worm";
import { zetatechSoftwareInstallerImplementation } from "../onr-v1/runner/programs/zetatech-software-installer";

export const ONR_V1_RUNNER_PROGRAM_SHIELD_TO_ZETATECH_SOFTWARE_INSTALLER_IMPLEMENTATIONS =
  [
    shieldImplementation,
    shredderUplinkProtocolImplementation,
    signpostImplementation,
    smarteyeImplementation,
    skivvissImplementation,
    snowballImplementation,
    speedTrapImplementation,
    startupImmolatorImplementation,
    succubusImplementation,
    tinweaselImplementation,
    vewyVewyQuietImplementation,
    wildCardImplementation,
    wizardsBookImplementation,
    wormImplementation,
    zetatechSoftwareInstallerImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
