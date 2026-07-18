import type { CardImplementationDefinition } from "../types";
import { quandaryImplementation } from "../onr-v1/corp/ice/quandary";
import { razorWireImplementation } from "../onr-v1/corp/ice/razor-wire";
import { reinforcedWallImplementation } from "../onr-v1/corp/ice/reinforced-wall";
import { rexImplementation } from "../onr-v1/corp/ice/rex";
import { rockIsStrongImplementation } from "../onr-v1/corp/ice/rock-is-strong";
import { scrambleImplementation } from "../onr-v1/corp/ice/scramble";
import { sentinelsPrimeImplementation } from "../onr-v1/corp/ice/sentinels-prime";
import { shockRImplementation } from "../onr-v1/corp/ice/shock-r";
import { shotgunWireImplementation } from "../onr-v1/corp/ice/shotgun-wire";
import { sleeperImplementation } from "../onr-v1/corp/ice/sleeper";
import { tkoTwoPointZeroImplementation } from "../onr-v1/corp/ice/tko-2-0";
import { tooManyDoorsImplementation } from "../onr-v1/corp/ice/too-many-doors";
import { triggermanImplementation } from "../onr-v1/corp/ice/triggerman";
import { tutorImplementation } from "../onr-v1/corp/ice/tutor";
import { vacuumLinkImplementation } from "../onr-v1/corp/ice/vacuum-link";
import { viral15Implementation } from "../onr-v1/corp/ice/viral-15";
import { virizzImplementation } from "../onr-v1/corp/ice/virizz";
import { wallOfIceImplementation } from "../onr-v1/corp/ice/wall-of-ice";
import { wallOfStaticImplementation } from "../onr-v1/corp/ice/wall-of-static";
import { zombieImplementation } from "../onr-v1/corp/ice/zombie";

export const ONR_V1_CORP_ICE_QUANDARY_TO_ZOMBIE_IMPLEMENTATIONS = [
  quandaryImplementation,
  razorWireImplementation,
  reinforcedWallImplementation,
  rexImplementation,
  rockIsStrongImplementation,
  scrambleImplementation,
  sentinelsPrimeImplementation,
  shockRImplementation,
  shotgunWireImplementation,
  sleeperImplementation,
  tkoTwoPointZeroImplementation,
  tooManyDoorsImplementation,
  triggermanImplementation,
  tutorImplementation,
  vacuumLinkImplementation,
  viral15Implementation,
  virizzImplementation,
  wallOfIceImplementation,
  wallOfStaticImplementation,
  zombieImplementation,
] as const satisfies readonly CardImplementationDefinition[];
