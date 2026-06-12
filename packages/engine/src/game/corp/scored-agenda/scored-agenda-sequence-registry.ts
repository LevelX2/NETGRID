import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
  resolveHqToNewRemoteInstallRezChoice,
  resolveHqToNewRemoteInstallRezRezChoice,
} from "./data-fort-reclamation-sequence";
import {
  isPriorityRequisitionChoiceSource,
  resolvePriorityRequisitionChoice,
} from "./priority-requisition-sequence";
import {
  isSecurityPurgeInstallTargetChoiceSource,
  resolveSecurityPurgeInstallTargetChoice,
} from "./security-purge-sequence";
import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda-sequence-host";

export type ScoredAgendaChoiceResolver = {
  id: string;
  matches: (source: string) => boolean;
  resolve: (
    host: CorpInstallRezSequenceHandlerHost,
  ) => CorpInstallRezSequenceHandlerResult;
};

export const SCORED_AGENDA_CHOICE_RESOLVERS: readonly ScoredAgendaChoiceResolver[] =
  [
    {
      id: "priority_requisition_choice",
      matches: isPriorityRequisitionChoiceSource,
      resolve: resolvePriorityRequisitionChoice,
    },
    {
      id: "data_fort_reclamation_rez_choice",
      matches: isHqToNewRemoteInstallRezRezChoiceSource,
      resolve: resolveHqToNewRemoteInstallRezRezChoice,
    },
    {
      id: "data_fort_reclamation_install_choice",
      matches: isHqToNewRemoteInstallRezChoiceSource,
      resolve: resolveHqToNewRemoteInstallRezChoice,
    },
    {
      id: "security_purge_target_choice",
      matches: isSecurityPurgeInstallTargetChoiceSource,
      resolve: resolveSecurityPurgeInstallTargetChoice,
    },
  ];

export function resolveScoredAgendaSequenceChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const source = host.state.pendingChoice?.source ?? "";
  const resolver = SCORED_AGENDA_CHOICE_RESOLVERS.find((candidate) =>
    candidate.matches(source),
  );
  return resolver?.resolve(host) ?? { handled: false };
}
