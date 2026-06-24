import type { CardImplementationDefinition } from "../types";
import { advancementCoreDamageAssetImplementation } from "../onr-v1/corp/assets/vacant-soulkiller";
import { advancementNetDamageAssetImplementation } from "../onr-v1/corp/assets/virus-test-site";
import { southAfricanMiningCorpImplementation } from "../onr-v1/corp/assets/south-african-mining-corp";
import { spinnPublicRelationsImplementation } from "../onr-v1/corp/assets/spinn-public-relations";
import { aspImplementation } from "../onr-v1/corp/ice/asp";
import { ballAndChainImplementation } from "../onr-v1/corp/ice/ball-and-chain";
import { banpeiImplementation } from "../onr-v1/corp/ice/banpei";
import { bolterClusterImplementation } from "../onr-v1/corp/ice/bolter-cluster";
import { canisMajorImplementation } from "../onr-v1/corp/ice/canis-major";
import { canisMinorImplementation } from "../onr-v1/corp/ice/canis-minor";
import { cerberusImplementation } from "../onr-v1/corp/ice/cerberus";
import { cinderellaImplementation } from "../onr-v1/corp/ice/cinderella";
import { codeCorpseImplementation } from "../onr-v1/corp/ice/code-corpse";
import { corticalScannerImplementation } from "../onr-v1/corp/ice/cortical-scanner";
import { corticalScrubImplementation } from "../onr-v1/corp/ice/cortical-scrub";
import { crystalWallImplementation } from "../onr-v1/corp/ice/crystal-wall";
import { dArcKnightImplementation } from "../onr-v1/corp/ice/d-arc-knight";
import { dataDartsImplementation } from "../onr-v1/corp/ice/data-darts";
import { dataWallImplementation } from "../onr-v1/corp/ice/data-wall";
import { dataWallTwoPointZeroImplementation } from "../onr-v1/corp/ice/data-wall-2-0";

export const CARD_IMPLEMENTATION_GROUP_015 = [
  advancementCoreDamageAssetImplementation,
  advancementNetDamageAssetImplementation,
  southAfricanMiningCorpImplementation,
  spinnPublicRelationsImplementation,
  aspImplementation,
  ballAndChainImplementation,
  banpeiImplementation,
  bolterClusterImplementation,
  canisMajorImplementation,
  canisMinorImplementation,
  cerberusImplementation,
  cinderellaImplementation,
  codeCorpseImplementation,
  corticalScannerImplementation,
  corticalScrubImplementation,
  crystalWallImplementation,
  dArcKnightImplementation,
  dataDartsImplementation,
  dataWallImplementation,
  dataWallTwoPointZeroImplementation,
] as const satisfies readonly CardImplementationDefinition[];
