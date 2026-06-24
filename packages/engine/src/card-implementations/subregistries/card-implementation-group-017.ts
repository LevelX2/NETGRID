import type { CardImplementationDefinition } from "../types";
import { nerveLabyrinthImplementation } from "../onr-v1/corp/ice/nerve-labyrinth";
import { neuralBladeImplementation } from "../onr-v1/corp/ice/neural-blade";
import { piInTheFaceImplementation } from "../onr-v1/corp/ice/pi-in-the-face";
import { pocketVirtualRealityImplementation } from "../onr-v1/corp/ice/pocket-virtual-reality";
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

export const CARD_IMPLEMENTATION_GROUP_017 = [
  nerveLabyrinthImplementation,
  neuralBladeImplementation,
  piInTheFaceImplementation,
  pocketVirtualRealityImplementation,
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
] as const satisfies readonly CardImplementationDefinition[];
