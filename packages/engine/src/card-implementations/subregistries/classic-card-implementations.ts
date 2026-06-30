import type { CardImplementationDefinition } from "../types";
import { classicCorporateShuffleImplementation } from "../classic/corp/operations/corporate-shuffle";
import { classicReclamationProjectImplementation } from "../classic/corp/operations/reclamation-project";
import { classicFindersKeepersImplementation } from "../classic/runner/events/finders-keepers";
import { classicMeatUpgradeImplementation } from "../classic/runner/events/meat-upgrade";
import { classicNetworkingImplementation } from "../classic/runner/events/networking";
import { classicPanzerRunImplementation } from "../classic/runner/events/panzer-run";

export const CLASSIC_CARD_IMPLEMENTATIONS = [
  classicCorporateShuffleImplementation,
  classicReclamationProjectImplementation,
  classicFindersKeepersImplementation,
  classicMeatUpgradeImplementation,
  classicNetworkingImplementation,
  classicPanzerRunImplementation,
] as const satisfies readonly CardImplementationDefinition[];
