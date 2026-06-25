import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
  resolveHqToNewRemoteInstallRezChoice,
  resolveHqToNewRemoteInstallRezRezChoice,
} from "./hq-to-new-remote-install-rez-sequence";
import {
  isScoredAgendaFreeRezChoiceSource,
  resolveScoredAgendaFreeRezChoice,
} from "./scored-agenda-free-rez-sequence";
import {
  isAgendaPurgeInstallTargetChoiceSource,
  resolveAgendaPurgeInstallTargetChoice,
} from "./agenda-purge-install-target-sequence";
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
      id: "scored_agenda_free_rez_choice",
      matches: isScoredAgendaFreeRezChoiceSource,
      resolve: resolveScoredAgendaFreeRezChoice,
    },
    {
      id: "hq_to_new_remote_rez_choice",
      matches: isHqToNewRemoteInstallRezRezChoiceSource,
      resolve: resolveHqToNewRemoteInstallRezRezChoice,
    },
    {
      id: "hq_to_new_remote_install_rez_install_choice",
      matches: isHqToNewRemoteInstallRezChoiceSource,
      resolve: resolveHqToNewRemoteInstallRezChoice,
    },
    {
      id: "agenda_purge_target_choice",
      matches: isAgendaPurgeInstallTargetChoiceSource,
      resolve: resolveAgendaPurgeInstallTargetChoice,
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
