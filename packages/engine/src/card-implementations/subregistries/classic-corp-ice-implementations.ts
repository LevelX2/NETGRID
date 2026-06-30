import type { CardImplementationDefinition } from "../types";
import { classicBaskervilleImplementation } from "../classic/corp/ice/baskerville";
import { classicBolterSwarmImplementation } from "../classic/corp/ice/bolter-swarm";
import { classicBrainDrainImplementation } from "../classic/corp/ice/brain-drain";
import { classicDeadeyeImplementation } from "../classic/corp/ice/deadeye";
import { classicDumpsterImplementation } from "../classic/corp/ice/dumpster";
import { classicEntrapmentImplementation } from "../classic/corp/ice/entrapment";
import { classicGlacierImplementation } from "../classic/corp/ice/glacier";
import { classicImperialGuardImplementation } from "../classic/corp/ice/imperial-guard";
import { classicPuzzleImplementation } from "../classic/corp/ice/puzzle";
import { classicTrapdoorImplementation } from "../classic/corp/ice/trapdoor";
import { classicVortexImplementation } from "../classic/corp/ice/vortex";

export const CLASSIC_CORP_ICE_IMPLEMENTATIONS = [
  classicBaskervilleImplementation,
  classicBolterSwarmImplementation,
  classicBrainDrainImplementation,
  classicDeadeyeImplementation,
  classicDumpsterImplementation,
  classicEntrapmentImplementation,
  classicGlacierImplementation,
  classicImperialGuardImplementation,
  classicPuzzleImplementation,
  classicTrapdoorImplementation,
  classicVortexImplementation,
] as const satisfies readonly CardImplementationDefinition[];
