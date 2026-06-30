import type { CardImplementationDefinition } from "../types";
import { classicEarlyWormImplementation } from "../classic/runner/programs/early-worm";
import { classicMatadorImplementation } from "../classic/runner/programs/matador";
import { classicMsTodonImplementation } from "../classic/runner/programs/ms-todon";
import { classicPsychicFriendImplementation } from "../classic/runner/programs/psychic-friend";
import { classicRentIConImplementation } from "../classic/runner/programs/rent-i-con";
import { classicSchematicsSearchEngineImplementation } from "../classic/runner/programs/schematics-search-engine";
import { classicSuperglueImplementation } from "../classic/runner/programs/superglue";

export const CLASSIC_RUNNER_PROGRAM_IMPLEMENTATIONS = [
  classicEarlyWormImplementation,
  classicMatadorImplementation,
  classicMsTodonImplementation,
  classicPsychicFriendImplementation,
  classicRentIConImplementation,
  classicSchematicsSearchEngineImplementation,
  classicSuperglueImplementation,
] as const satisfies readonly CardImplementationDefinition[];
