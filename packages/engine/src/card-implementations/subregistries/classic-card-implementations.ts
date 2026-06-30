import type { CardImplementationDefinition } from "../types";
import { classicCorporateShuffleImplementation } from "../classic/corp/operations/corporate-shuffle";
import { classicReclamationProjectImplementation } from "../classic/corp/operations/reclamation-project";
import { classicFindersKeepersImplementation } from "../classic/runner/events/finders-keepers";
import { classicMeatUpgradeImplementation } from "../classic/runner/events/meat-upgrade";
import { classicNetworkingImplementation } from "../classic/runner/events/networking";
import { classicPanzerRunImplementation } from "../classic/runner/events/panzer-run";
import { classicEarlyWormImplementation } from "../classic/runner/programs/early-worm";
import { classicMatadorImplementation } from "../classic/runner/programs/matador";
import { classicMsTodonImplementation } from "../classic/runner/programs/ms-todon";
import { classicPsychicFriendImplementation } from "../classic/runner/programs/psychic-friend";
import { classicRentIConImplementation } from "../classic/runner/programs/rent-i-con";
import { classicSchematicsSearchEngineImplementation } from "../classic/runner/programs/schematics-search-engine";
import { classicSuperglueImplementation } from "../classic/runner/programs/superglue";

export const CLASSIC_CARD_IMPLEMENTATIONS = [
  classicCorporateShuffleImplementation,
  classicReclamationProjectImplementation,
  classicFindersKeepersImplementation,
  classicMeatUpgradeImplementation,
  classicNetworkingImplementation,
  classicPanzerRunImplementation,
  classicEarlyWormImplementation,
  classicMatadorImplementation,
  classicMsTodonImplementation,
  classicPsychicFriendImplementation,
  classicRentIConImplementation,
  classicSchematicsSearchEngineImplementation,
  classicSuperglueImplementation,
] as const satisfies readonly CardImplementationDefinition[];
