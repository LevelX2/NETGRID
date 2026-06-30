import type { CardImplementationDefinition } from "../types";
import { classicCorporateShuffleImplementation } from "../classic/corp/operations/corporate-shuffle";
import { classicReclamationProjectImplementation } from "../classic/corp/operations/reclamation-project";

export const CLASSIC_CORP_OPERATION_IMPLEMENTATIONS = [
  classicCorporateShuffleImplementation,
  classicReclamationProjectImplementation,
] as const satisfies readonly CardImplementationDefinition[];
