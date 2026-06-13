import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import { startScoredRezzedIceMarkModifierChoice } from "./ice-transmutation-sequence";
import type {
  ScoredAgendaScoreTimeContext,
  ScoredAgendaScoreTimeResolver,
} from "./scored-agenda-score-time-types";
import { startScoredSubtypeRevealChoiceOrResolve } from "./subtype-reveal-economy-sequence";

export const SCORED_AGENDA_SCORE_TIME_RESOLVERS: readonly ScoredAgendaScoreTimeResolver[] =
  [
    {
      id: "data_fort_reclamation_score_start",
      kind: "score_install_hq_cards_into_new_remote_then_rez",
      mode: "delegated_host_choice",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.startDataFortReclamation(cardId);
      },
    },
    {
      id: "ice_transmutation_score_start",
      kind: "select_rezzed_ice_mark_modifier",
      mode: "choice_start",
      resolveOnScore: ({ host, cardId, legalAction, scoredAgenda }) => {
        if (scoredAgenda.kind !== "select_rezzed_ice_mark_modifier")
          throw new Error("Ice-Transmutation-Score-Time-Vertrag ungueltig.");
        startScoredRezzedIceMarkModifierChoice(
          host,
          cardId,
          legalAction,
          scoredAgenda,
        );
      },
    },
    {
      id: "priority_requisition_score_start",
      kind: "score_rez_installed_ice_at_no_cost",
      mode: "delegated_host_choice",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.startPriorityRequisition(cardId);
      },
    },
    {
      id: "security_purge_score_start",
      kind: "reveal_top_rd_install_and_rez_ice_trash_rest",
      mode: "immediate_effect",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.resolveSecurityPurge(cardId);
      },
    },
    {
      id: "subtype_reveal_economy_score_start",
      kind: "reveal_installed_ice_subtype_for_credits",
      mode: "choice_start",
      resolveOnScore: ({ host, cardId, legalAction, scoredAgenda }) => {
        if (scoredAgenda.kind !== "reveal_installed_ice_subtype_for_credits")
          throw new Error("Subtype-Reveal-Score-Time-Vertrag ungueltig.");
        startScoredSubtypeRevealChoiceOrResolve(
          host,
          cardId,
          legalAction,
          scoredAgenda.subtype,
          scoredAgenda.creditPerRevealedOrRezzed,
        );
      },
    },
  ];

export function findScoredAgendaScoreTimeResolver(
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): ScoredAgendaScoreTimeResolver | undefined {
  if (!scoredAgenda) return undefined;
  return SCORED_AGENDA_SCORE_TIME_RESOLVERS.find(
    (resolver) => resolver.kind === scoredAgenda.kind,
  );
}

export function resolveScoredAgendaScoreTime(
  context: ScoredAgendaScoreTimeContext,
): boolean {
  const resolver = findScoredAgendaScoreTimeResolver(context.scoredAgenda);
  if (!resolver) return false;
  resolver.resolveOnScore(context);
  return true;
}
