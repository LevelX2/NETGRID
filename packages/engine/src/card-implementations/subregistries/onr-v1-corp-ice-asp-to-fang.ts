import type { CardImplementationDefinition } from "../types";
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
import { dataNagaImplementation } from "../onr-v1/corp/ice/data-naga";
import { dataRavenImplementation } from "../onr-v1/corp/ice/data-raven";
import { endlessCorridorImplementation } from "../onr-v1/corp/ice/endless-corridor";
import { fangImplementation } from "../onr-v1/corp/ice/fang";

export const ONR_V1_CORP_ICE_ASP_TO_FANG_IMPLEMENTATIONS = [
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
  dataNagaImplementation,
  dataRavenImplementation,
  endlessCorridorImplementation,
  fangImplementation,
] as const satisfies readonly CardImplementationDefinition[];
