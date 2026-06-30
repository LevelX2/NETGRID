import type { CardImplementationDefinition } from "../types";
import { classicBadtimesImplementation } from "../classic/corp/operations/badtimes";
import { classicCorporateShuffleImplementation } from "../classic/corp/operations/corporate-shuffle";
import { classicReclamationProjectImplementation } from "../classic/corp/operations/reclamation-project";

export const CLASSIC_CORP_OPERATION_IMPLEMENTATIONS = [
  classicBadtimesImplementation,
  classicCorporateShuffleImplementation,
  classicReclamationProjectImplementation,
] as const satisfies readonly CardImplementationDefinition[];
