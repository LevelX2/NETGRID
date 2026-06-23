import type { ChoiceRequest, LegalAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
} from "./hq-to-new-remote-install-rez-sequence";
import { isScoredIceMarkModifierChoiceSource } from "./scored-rezzed-ice-mark-modifier-sequence";
import { orderedFortRebuildPublicPayload } from "../../run/windows/ordered-fort-rebuild-sequence";
import { isScoredAgendaFreeRezChoiceSource } from "./scored-agenda-free-rez-sequence";
import {
  resolveScoredAgendaSequenceChoice,
  SCORED_AGENDA_CHOICE_RESOLVERS,
} from "./scored-agenda-sequence-registry";
import {
  findScoredAgendaScoreTimeResolver,
  SCORED_AGENDA_SCORE_TIME_RESOLVERS,
} from "./scored-agenda-score-time-registry";
import { SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS } from "./scored-agenda-direct-effect-registry";
import { SCORED_AGENDA_FLOW_CHOICE_RESOLVERS } from "./scored-agenda-flow-choice-registry";
import type { CorpInstallRezSequenceHandlerHost } from "./scored-agenda-sequence-host";
import {
  applySequenceResolution,
  applySequencePayloadPatch,
  corpSequenceContextPayload,
} from "./scored-agenda-sequence-types";
import { isAgendaPurgeInstallTargetChoiceSource } from "./agenda-purge-install-target-sequence";

describe("scored agenda sequence contract matrix", () => {
  it("keeps score-time resolver kinds unique and explicit", () => {
    const kinds = SCORED_AGENDA_SCORE_TIME_RESOLVERS.map(
      (resolver) => resolver.kind,
    );
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(
      SCORED_AGENDA_SCORE_TIME_RESOLVERS.map((resolver) => resolver.id).sort(),
    ).toEqual([
      "agenda_purge_score_start",
      "hq_to_new_remote_install_rez_score_start",
      "scored_agenda_free_rez_score_start",
      "scored_fort_ice_strength_bonus_score_start",
      "scored_hq_agenda_shuffle_credits_score_start",
      "scored_rezzed_ice_mark_modifier_score_start",
      "subtype_reveal_economy_score_start",
    ]);
    expect(
      new Set(
        SCORED_AGENDA_SCORE_TIME_RESOLVERS.map((resolver) => resolver.mode),
      ),
    ).toEqual(
      new Set(["choice_start", "delegated_host_choice", "immediate_effect"]),
    );
  });

  it("maps registered score-time kinds to the expected start resolvers", () => {
    const cases = [
      {
        kind: "score_install_hq_cards_into_new_remote_then_rez",
        id: "hq_to_new_remote_install_rez_score_start",
      },
      {
        kind: "select_rezzed_ice_mark_modifier",
        id: "scored_rezzed_ice_mark_modifier_score_start",
      },
      {
        kind: "score_rez_installed_ice_at_no_cost",
        id: "scored_agenda_free_rez_score_start",
      },
      {
        kind: "reveal_top_rd_install_and_rez_ice_trash_rest",
        id: "agenda_purge_score_start",
      },
      {
        kind: "reveal_installed_ice_subtype_for_credits",
        id: "subtype_reveal_economy_score_start",
      },
      {
        kind: "shuffle_selected_hq_agendas_into_rd_gain_credits",
        id: "scored_hq_agenda_shuffle_credits_score_start",
      },
      {
        kind: "choose_fort_ice_strength_bonus",
        id: "scored_fort_ice_strength_bonus_score_start",
      },
    ] as const;

    for (const candidate of cases) {
      expect(
        findScoredAgendaScoreTimeResolver({
          kind: candidate.kind,
        } as never)?.id,
      ).toBe(candidate.id);
    }
  });

  it("keeps score-time resolver ids separate from pending-choice resolver ids", () => {
    const choiceResolverIds = new Set(
      SCORED_AGENDA_CHOICE_RESOLVERS.map((resolver) => resolver.id),
    );
    expect(
      SCORED_AGENDA_SCORE_TIME_RESOLVERS.some((resolver) =>
        choiceResolverIds.has(resolver.id),
      ),
    ).toBe(false);
  });

  it("keeps scored-agenda flow choice resolver ids unique and separated", () => {
    const flowResolverIds = SCORED_AGENDA_FLOW_CHOICE_RESOLVERS.map(
      (resolver) => resolver.id,
    );
    const installRezResolverIds = new Set(
      SCORED_AGENDA_CHOICE_RESOLVERS.map((resolver) => resolver.id),
    );
    const scoreTimeResolverIds = new Set(
      SCORED_AGENDA_SCORE_TIME_RESOLVERS.map((resolver) => resolver.id),
    );

    expect(new Set(flowResolverIds).size).toBe(flowResolverIds.length);
    expect(flowResolverIds.sort()).toEqual([
      "scored_agenda_start_draw_flow_choice",
      "scored_rezzed_ice_mark_modifier_flow_choice",
      "subtype_reveal_flow_choice",
    ]);
    expect(flowResolverIds.some((id) => installRezResolverIds.has(id))).toBe(
      false,
    );
    expect(flowResolverIds.some((id) => scoreTimeResolverIds.has(id))).toBe(
      false,
    );
  });

  it("keeps scored-agenda direct effect resolver ids unique", () => {
    const directResolverIds = SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS.map(
      (resolver) => resolver.id,
    );
    const reservedResolverIds = new Set([
      ...SCORED_AGENDA_CHOICE_RESOLVERS.map((resolver) => resolver.id),
      ...SCORED_AGENDA_FLOW_CHOICE_RESOLVERS.map((resolver) => resolver.id),
      ...SCORED_AGENDA_SCORE_TIME_RESOLVERS.map((resolver) => resolver.id),
    ]);

    expect(new Set(directResolverIds).size).toBe(directResolverIds.length);
    expect(directResolverIds.sort()).toEqual([
      "add_counters_on_score_effect",
      "fixed_bonus_agenda_points_score_effect",
      "gain_credits_on_score_effect",
      "overadvance_score_effects",
      "score_credit_swing_threshold_effect",
      "scored_agenda_install_rez_credit_score_effect",
    ]);
    expect(directResolverIds.some((id) => reservedResolverIds.has(id))).toBe(
      false,
    );
  });

  it("keeps migrated score-time kinds out of the scored-agenda orchestrator", () => {
    const flowSource = readFileSync(
      new URL("../scored-agenda-flow.ts", import.meta.url),
      "utf8",
    );
    const migratedKinds = [
      "choose_fort_ice_strength_bonus",
      "reveal_installed_ice_subtype_for_credits",
      "shuffle_selected_hq_agendas_into_rd_gain_credits",
      "gain_credits_on_score",
      "add_counters_on_score",
      "overadvance_bonus_agenda_points",
      "overadvance_start_of_corp_turn_credits",
      "overadvance_start_of_corp_turn_actions",
    ];

    for (const kind of migratedKinds) {
      expect(flowSource).not.toContain(kind);
    }
  });

  it("routes each registered choice source to exactly one resolver", () => {
    const cases: readonly { source: string; resolverId: string }[] = [
      {
        source: "card_implementation.scored_agenda_free_rez:priority_agenda:8",
        resolverId: "scored_agenda_free_rez_choice",
      },
      {
        source: "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:8",
        resolverId: "hq_to_new_remote_install_rez_install_choice",
      },
      {
        source: "card_implementation.hq_to_new_remote_rez:data_fort_agenda:remote_1:4:8",
        resolverId: "hq_to_new_remote_rez_choice",
      },
      {
        source:
          "card_implementation.agenda_purge_install_targets:agenda_purge_agenda:ice_1:8",
        resolverId: "agenda_purge_target_choice",
      },
    ];

    for (const candidate of cases) {
      const matchingIds = SCORED_AGENDA_CHOICE_RESOLVERS.filter((resolver) =>
        resolver.matches(candidate.source),
      ).map((resolver) => resolver.id);
      expect(matchingIds).toEqual([candidate.resolverId]);
    }
  });

  it("routes each registered scored-agenda flow choice source to exactly one resolver", () => {
    const cases: readonly { source: string; resolverId: string }[] = [
      {
        source: "scored_agenda.subtype_reveal:agenda_1:wall:2:8",
        resolverId: "subtype_reveal_flow_choice",
      },
      {
        source: "scored_agenda.rezzed_ice_mark_modifier:transmutation_agenda:8",
        resolverId: "scored_rezzed_ice_mark_modifier_flow_choice",
      },
      {
        source: "scored_agenda.start_draw_choice:employee:8",
        resolverId: "scored_agenda_start_draw_flow_choice",
      },
    ];

    for (const candidate of cases) {
      const matchingIds = SCORED_AGENDA_FLOW_CHOICE_RESOLVERS.filter(
        (resolver) => resolver.matches(candidate.source),
      ).map((resolver) => resolver.id);
      expect(matchingIds).toEqual([candidate.resolverId]);
    }
  });

  it("keeps source recognizers disjoint across representative sequences", () => {
    const recognizers = [
      isScoredAgendaFreeRezChoiceSource,
      isHqToNewRemoteInstallRezChoiceSource,
      isHqToNewRemoteInstallRezRezChoiceSource,
      isAgendaPurgeInstallTargetChoiceSource,
      isScoredIceMarkModifierChoiceSource,
    ];
    const sources = [
      "card_implementation.scored_agenda_free_rez:priority_agenda:8",
      "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:8",
      "card_implementation.hq_to_new_remote_rez:data_fort_agenda:remote_1:4:8",
      "card_implementation.agenda_purge_install_targets:agenda_purge_agenda:ice_1:8",
      "scored_agenda.rezzed_ice_mark_modifier:transmutation_agenda:8",
    ];

    for (const source of sources) {
      expect(
        recognizers.filter((recognizer) => recognizer(source)),
      ).toHaveLength(1);
    }
  });

  it("does not mutate host state or payload for unknown registered choices", () => {
    const choice: ChoiceRequest = {
      choiceId: "unknown_choice",
      side: "corp",
      source: "v999.unknown_sequence:agenda_1:8",
      prompt: "Unknown",
      kind: "select_option",
      options: [],
      minSelections: 0,
      maxSelections: 0,
      stateVersion: 8,
      visibility: "public",
    };
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;
    const host = {
      state: { pendingChoice: choice },
      legalAction,
    } as unknown as CorpInstallRezSequenceHandlerHost;

    expect(resolveScoredAgendaSequenceChoice(host)).toEqual({
      handled: false,
    });
    expect(host.state.pendingChoice).toBe(choice);
    expect(legalAction.payload).toEqual({ existing: true });
  });

  it("rejects hidden card lists before sequence payload patches mutate", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    expect(() =>
      applySequencePayloadPatch(legalAction, {
        hqCardIds: "secret_card",
      }),
    ).toThrow(/hidden card data/i);
    expect(legalAction.payload).toEqual({ existing: true });
  });

  it("applies sequence resolutions through sanitized payload patches", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    const result = applySequenceResolution(legalAction, {
      result: { handled: true },
      stateChanged: true,
      payloadPatch: { scoredAgendaFreeRezChoiceOpened: false },
    });

    expect(result).toEqual({
      handled: true,
      stateChanged: true,
      resolvedPayload: {
        existing: true,
        scoredAgendaFreeRezChoiceOpened: false,
      },
    });
    expect(legalAction.payload).toEqual(result.resolvedPayload);
  });

  it("keeps public sequence contexts and ordered-fort payloads count-only", () => {
    expect(() =>
      corpSequenceContextPayload({
        step: "select_hq_cards",
        hqCardIds: "secret_card",
      }),
    ).toThrow(/hidden card data/i);

    const orderedFortPayload = orderedFortRebuildPublicPayload({
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 2,
      replacementCardCount: 2,
      installedIceCount: 1,
      installedRootCount: 1,
    });
    expect(Object.keys(orderedFortPayload)).not.toContain("hqCardIds");
    expect(JSON.stringify(orderedFortPayload)).not.toContain("secret_card");
  });
});
