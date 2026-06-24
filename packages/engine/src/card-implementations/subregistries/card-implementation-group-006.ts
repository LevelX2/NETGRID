import type { CardImplementationDefinition } from "../types";
import { selfModifyingCodeImplementation } from "../onr-v1/runner/programs/self-modifying-code";
import { shakaImplementation } from "../onr-v1/runner/programs/shaka";
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
import { accessThroughAlphaImplementation } from "../onr-v1/runner/resources/access-through-alpha";
import { accessToArasakaImplementation } from "../onr-v1/runner/resources/access-to-arasaka";
import { accessToKiribatiImplementation } from "../onr-v1/runner/resources/access-to-kiribati";

export const CARD_IMPLEMENTATION_GROUP_006 = [
  selfModifyingCodeImplementation,
  shakaImplementation,
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
  accessThroughAlphaImplementation,
  accessToArasakaImplementation,
  accessToKiribatiImplementation,
] as const satisfies readonly CardImplementationDefinition[];
