import type { CardImplementationDefinition } from "../types";
import { classicDataFortRemappingImplementation } from "../classic/corp/agendas/data-fort-remapping";
import { classicSuperserumImplementation } from "../classic/corp/agendas/superserum";
import { classicTheoremProofImplementation } from "../classic/corp/agendas/theorem-proof";
import { classicUnlistedResearchLabImplementation } from "../classic/corp/agendas/unlisted-research-lab";

export const CLASSIC_CORP_AGENDA_IMPLEMENTATIONS = [
  classicDataFortRemappingImplementation,
  classicSuperserumImplementation,
  classicUnlistedResearchLabImplementation,
  classicTheoremProofImplementation,
] as const satisfies readonly CardImplementationDefinition[];
