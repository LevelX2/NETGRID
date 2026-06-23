import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda/scored-agenda-sequence-host";
import { resolveScoredAgendaSequenceChoice } from "./scored-agenda/scored-agenda-sequence-registry";
export { startHqToNewRemoteInstallRezChoice } from "./scored-agenda/hq-to-new-remote-install-rez-sequence";
export { startScoredAgendaFreeRezChoice } from "./scored-agenda/scored-agenda-free-rez-sequence";
export { resolveAgendaPurgeInstallTargets } from "./scored-agenda/agenda-purge-install-target-sequence";
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
