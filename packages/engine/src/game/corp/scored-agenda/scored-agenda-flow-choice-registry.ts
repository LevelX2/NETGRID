import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";
import {
  isScoredAgendaStartDrawChoiceSource,
  resolveScoredAgendaStartDrawChoice,
} from "./scored-agenda-start-draw-choice-sequence";
import {
  isScoredIceMarkModifierChoiceSource,
  resolveScoredRezzedIceMarkModifierChoice,
} from "./ice-transmutation-sequence";
import {
  isScoredSubtypeRevealChoiceSource,
  resolveScoredSubtypeRevealChoice,
} from "./subtype-reveal-economy-sequence";

export type ScoredAgendaFlowChoiceResolver = {
  id: string;
  matches: (source: string) => boolean;
  resolve: (host: ScoredAgendaFlowHost) => void;
};

export const SCORED_AGENDA_FLOW_CHOICE_RESOLVERS: readonly ScoredAgendaFlowChoiceResolver[] =
  [
    {
      id: "subtype_reveal_flow_choice",
      matches: isScoredSubtypeRevealChoiceSource,
      resolve: resolveScoredSubtypeRevealChoice,
    },
    {
      id: "ice_transmutation_flow_choice",
      matches: isScoredIceMarkModifierChoiceSource,
      resolve: resolveScoredRezzedIceMarkModifierChoice,
    },
    {
      id: "scored_agenda_start_draw_flow_choice",
      matches: isScoredAgendaStartDrawChoiceSource,
      resolve: resolveScoredAgendaStartDrawChoice,
    },
  ];

export function findScoredAgendaFlowChoiceResolver(
  source: string,
): ScoredAgendaFlowChoiceResolver | undefined {
  return SCORED_AGENDA_FLOW_CHOICE_RESOLVERS.find((resolver) =>
    resolver.matches(source),
  );
}

export function resolveScoredAgendaFlowChoice(
  host: ScoredAgendaFlowHost,
): boolean {
  const source = host.state.pendingChoice?.source ?? "";
  const resolver = findScoredAgendaFlowChoiceResolver(source);
  if (!resolver) return false;
  resolver.resolve(host);
  return true;
}
