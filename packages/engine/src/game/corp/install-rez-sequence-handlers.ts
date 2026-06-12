import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda/scored-agenda-sequence-host";
import { resolveScoredAgendaSequenceChoice } from "./scored-agenda/scored-agenda-sequence-registry";
export { startDataFortReclamationChoice } from "./scored-agenda/data-fort-reclamation-sequence";
export { startPriorityRequisitionChoice } from "./scored-agenda/priority-requisition-sequence";
export { resolveSecurityPurgeAgendaPurge } from "./scored-agenda/security-purge-sequence";
export type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda/scored-agenda-sequence-host";

/**
 * @dispatcher Routes pending corp scored-agenda install/rez choices to the
 * owning sequence module. Card-specific legality and mutation stay inside the
 * delegated resolver and still run under the Rules Engine action contract.
 */
export function handleCorpInstallRezSequenceChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  return resolveScoredAgendaSequenceChoice(host);
}
