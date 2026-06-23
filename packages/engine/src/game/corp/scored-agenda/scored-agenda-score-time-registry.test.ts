import { describe, expect, it } from "vitest";
import {
  findScoredAgendaScoreTimeResolver,
  SCORED_AGENDA_SCORE_TIME_RESOLVERS,
} from "./scored-agenda-score-time-registry";

describe("scored agenda score-time registry", () => {
  it("uses unique resolver ids and kinds", () => {
    const ids = SCORED_AGENDA_SCORE_TIME_RESOLVERS.map(
      (resolver) => resolver.id,
    );
    const kinds = SCORED_AGENDA_SCORE_TIME_RESOLVERS.map(
      (resolver) => resolver.kind,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("classifies score-time resolvers by explicit mode", () => {
    const resolverModes = Object.fromEntries(
      SCORED_AGENDA_SCORE_TIME_RESOLVERS.map((resolver) => [
        resolver.id,
        resolver.mode,
      ]),
    );

    expect(resolverModes).toMatchObject({
      hq_to_new_remote_install_rez_score_start: "delegated_host_choice",
      corporate_downsizing_score_start: "delegated_host_choice",
      scored_rezzed_ice_mark_modifier_score_start: "choice_start",
      scored_agenda_free_rez_score_start: "delegated_host_choice",
      agenda_purge_score_start: "immediate_effect",
      scored_fort_ice_strength_bonus_score_start: "immediate_effect",
      subtype_reveal_economy_score_start: "choice_start",
    });
  });

  it("matches score-time resolvers by scored agenda kind", () => {
    expect(
      findScoredAgendaScoreTimeResolver({
        kind: "select_rezzed_ice_mark_modifier",
      } as never)?.id,
    ).toBe("scored_rezzed_ice_mark_modifier_score_start");
    expect(
      findScoredAgendaScoreTimeResolver({
        kind: "score_install_hq_cards_into_new_remote_then_rez",
      } as never)?.id,
    ).toBe("hq_to_new_remote_install_rez_score_start");
    expect(
      findScoredAgendaScoreTimeResolver({
        kind: "reveal_installed_ice_subtype_for_credits",
      } as never)?.id,
    ).toBe("subtype_reveal_economy_score_start");
    expect(
      findScoredAgendaScoreTimeResolver({
        kind: "shuffle_selected_hq_agendas_into_rd_gain_credits",
      } as never)?.id,
    ).toBe("corporate_downsizing_score_start");
    expect(
      findScoredAgendaScoreTimeResolver({
        kind: "choose_fort_ice_strength_bonus",
      } as never)?.id,
    ).toBe("scored_fort_ice_strength_bonus_score_start");
    expect(findScoredAgendaScoreTimeResolver(undefined)).toBeUndefined();
  });
});
