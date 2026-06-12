import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
  resolveHqToNewRemoteInstallRezChoice,
  resolveHqToNewRemoteInstallRezRezChoice,
} from "./scored-agenda/data-fort-reclamation-sequence";
import {
  isSecurityPurgeInstallTargetChoiceSource,
  resolveSecurityPurgeInstallTargetChoice,
} from "./scored-agenda/security-purge-sequence";
import {
  isPriorityRequisitionChoiceSource,
  resolvePriorityRequisitionChoice,
} from "./scored-agenda/priority-requisition-sequence";
import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda/scored-agenda-sequence-host";
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
  const source = host.state.pendingChoice?.source ?? "";
  if (isPriorityRequisitionChoiceSource(source))
    return resolvePriorityRequisitionChoice(host);
  if (isHqToNewRemoteInstallRezRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezRezChoice(host);
  if (isHqToNewRemoteInstallRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezChoice(host);
  if (isSecurityPurgeInstallTargetChoiceSource(source))
    return resolveSecurityPurgeInstallTargetChoice(host);
  return { handled: false };
}
