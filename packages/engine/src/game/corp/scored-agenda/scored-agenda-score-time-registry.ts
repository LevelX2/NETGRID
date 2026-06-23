import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import { startScoredRezzedIceMarkModifierChoice } from "./scored-rezzed-ice-mark-modifier-sequence";
import { resolveScoredFortIceStrengthBonusOnScore } from "./scored-fort-ice-strength-bonus-sequence";
import type {
  ScoredAgendaScoreTimeContext,
  ScoredAgendaScoreTimeResolver,
} from "./scored-agenda-score-time-types";
import { startScoredSubtypeRevealChoiceOrResolve } from "./subtype-reveal-economy-sequence";

export const SCORED_AGENDA_SCORE_TIME_RESOLVERS: readonly ScoredAgendaScoreTimeResolver[] =
  [
    {
      id: "hq_to_new_remote_install_rez_score_start",
      kind: "score_install_hq_cards_into_new_remote_then_rez",
      mode: "delegated_host_choice",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.startHqToNewRemoteInstallRez(cardId);
      },
    },
    {
      id: "scored_rezzed_ice_mark_modifier_score_start",
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
      id: "scored_agenda_free_rez_score_start",
      kind: "score_rez_installed_ice_at_no_cost",
      mode: "delegated_host_choice",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.startScoredAgendaFreeRez(cardId);
      },
    },
    {
      id: "agenda_purge_score_start",
      kind: "reveal_top_rd_install_and_rez_ice_trash_rest",
      mode: "immediate_effect",
      resolveOnScore: ({ host, cardId }) => {
        host.choices.resolveAgendaPurge(cardId);
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
    {
      id: "scored_hq_agenda_shuffle_credits_score_start",
      kind: "shuffle_selected_hq_agendas_into_rd_gain_credits",
      mode: "delegated_host_choice",
      resolveOnScore: ({ host, cardId, scoredAgenda }) => {
        if (
          scoredAgenda.kind !==
          "shuffle_selected_hq_agendas_into_rd_gain_credits"
        )
          throw new Error("HQ-Agenda-Shuffle-Score-Time-Vertrag ungueltig.");
        host.choices.startScoredAgendaHqShuffleCredits(
          cardId,
          scoredAgenda.creditPerAgendaPoint,
        );
      },
    },
    {
      id: "scored_fort_ice_strength_bonus_score_start",
      kind: "choose_fort_ice_strength_bonus",
      mode: "immediate_effect",
      resolveOnScore: ({ host, cardId, instanceBefore, legalAction }) => {
        resolveScoredFortIceStrengthBonusOnScore(
          host,
          cardId,
          instanceBefore,
          legalAction,
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
