import { cs06PlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD, type AiCardHint } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const scenarioRef =
  "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported";

const cases: Array<{
  id: string;
  roles: string[];
  risks: string[];
  values: Record<string, number>;
  purposes: string[];
  effectTargets: string[];
  strategies: string[];
  strategyCovered: boolean;
  qualityConfidence?: "low" | "medium" | "high";
}> = [
  {
    id: "onr_v1_154_broker",
    roles: ["economy", "resource"],
    risks: ["resource_trash_if_tagged"],
    values: { economy: 3 },
    purposes: [],
    effectTargets: [
      "resource.connection",
      "economy.bank_load",
      "economy.bank_cashout_all",
    ],
    strategies: [],
    strategyCovered: false,
  },
  {
    id: "onr_v1_168_loan-from-chiba",
    roles: ["economy", "resource"],
    risks: [
      "opportunity_cost",
      "reserve_risk",
      "credit_swing",
      "leave_play_penalty",
    ],
    values: {
      installCreditGain: 12,
      startOfTurnCreditLoss: 1,
      leavePlayPayCost: 10,
    },
    effectTargets: [
      "economy.high_risk_burst_credit",
      "economy.turn_start_credit",
      "risk.debt_loss_condition",
      "risk.lose_game_debt",
    ],
    purposes: [],
    strategies: [],
    strategyCovered: false,
  },
  {
    id: "onr_proteus_080_black-widow",
    roles: ["icebreaker", "program", "breaker_killer"],
    risks: [],
    values: {},
    purposes: ["strength_bonus_vs_chosen_ice"],
    effectTargets: [],
    strategies: [],
    strategyCovered: false,
  },
  {
    id: "onr_proteus_092_morphing-tool",
    roles: [
      "icebreaker",
      "program",
      "breaker_decoder",
      "breaker_killer",
      "breaker_fracter",
    ],
    risks: [],
    values: {},
    purposes: [
      "choose_current_breaker_coverage",
      "choose_current_breaker_coverage",
    ],
    effectTargets: [],
    strategies: [],
    strategyCovered: false,
  },
  {
    id: "onr_v1_110_sneak-preview",
    roles: ["hidden_zone_tool", "temporary_program_install"],
    risks: [
      "opportunity_cost",
      "reserve_risk",
      "hidden_info_barrier",
      "temporary_install",
    ],
    values: {},
    purposes: [
      "temporary_program_install",
      "choose_stack_or_trash_program_install:install_program_from_stack_or_trash",
    ],
    effectTargets: [
      "program_search",
      "program",
      "temporary_program_install",
      "end_of_turn_bounce",
    ],
    strategies: [],
    strategyCovered: false,
  },
  {
    id: "onr_v1_317_data-masons",
    roles: ["ice_modifier", "economy_asset", "remote_support"],
    values: { economy: 2, remoteRootValue: 2 },
    risks: [],
    purposes: ["rez_best_defensive_ice"],
    strategies: ["corp.ice_tax_glacier"],
    strategyCovered: true,
    qualityConfidence: "high",
    effectTargets: ["ice.corp_strength_support"],
  },
  {
    id: "onr_proteus_020_digiconda",
    roles: ["ice", "damage_ice", "etr_ice", "sentry_ice"],
    risks: [],
    values: {},
    purposes: [],
    effectTargets: [
      "corp_ice.net_damage",
      "corp_ice.end_run",
      "corp_ice.rez_paid_scaling",
    ],
    strategies: ["corp.ice_tax_glacier"],
    strategyCovered: true,
    qualityConfidence: "medium",
  },
  {
    id: "onr_v1_348_virus-test-site",
    roles: ["ambush", "net_damage", "hidden_zone"],
    risks: [
      "hidden_info_barrier",
      "access_window",
      "damage_window",
      "hidden_zone_barrier",
    ],
    values: { damage: 1, remoteRootValue: 1 },
    strategies: ["corp.ambush_bluff", "corp.damage_kill"],
    strategyCovered: true,
    qualityConfidence: "high",
    purposes: [],
    effectTargets: [
      "access.corp_net_damage_ambush",
      "access.corp_net_damage_ambush",
      "access.corp_net_damage_ambush",
      "remote.ambush",
    ],
  },
  {
    id: "onr_v1_197_data-fort-reclamation",
    roles: ["corp", "agenda", "per_card_longtail"],
    risks: ["hidden_info_barrier"],
    values: {},
    purposes: ["create_remote_with_best_hq_cards"],
    strategies: ["corp.remote_scoring"],
    strategyCovered: true,
    qualityConfidence: "high",
    effectTargets: [],
  },
  {
    id: "onr_v1_368_roving-submarine",
    roles: ["upgrade", "advance", "agenda"],
    risks: [],
    values: { remoteRootValue: 1 },
    effectTargets: ["run.corp_server_lock"],
    strategies: ["corp.remote_scoring"],
    strategyCovered: true,
    qualityConfidence: "medium",
    purposes: [],
  },
];

const signalCases: Record<
  string,
  {
    functionSignals: string[];
    tacticSignals: string[];
    actionTacticSignals: string[];
    conditions: string[];
    requiredMechanics: string[];
  }
> = {
  onr_v1_154_broker: {
    functionSignals: [
      "economy.action",
      "economy.action_credit",
      "economy.counter",
      "economy.generic",
      "economy.temporary_resource_bank",
      "resource.connection",
      "economy.hosted_credit_bank",
      "economy.hosted_credit_cashout",
    ],
    tacticSignals: ["economy.card"],
    actionTacticSignals: [
      "economy.card",
      "effect:action_economy",
      "effect:counter_economy",
      "effect:global_modifier",
      "effect_scope:runner",
      "effect_timing:action",
      "effect_timing:persistent",
    ],
    conditions: ["requires_installed_resource", "requires_credit_pool"],
    requiredMechanics: [
      "abilities",
      "action",
      "activated",
      "add_hosted_credits",
      "bit_depot",
      "gain_credit",
      "install_resource",
      "once_per_turn_per_source",
      "resource_tag_interaction",
      "source_has_hosted_credits",
      "take_click_ability",
      "take_hosted_credits",
    ],
  },
  "onr_v1_168_loan-from-chiba": {
    functionSignals: [
      "economy.counter",
      "economy.generic",
      "economy.high_risk_burst_credit",
      "risk.debt_loss_condition",
      "risk.lose_game_debt",
    ],
    tacticSignals: ["economy.card"],
    actionTacticSignals: [
      "economy.card",
      "effect:counter_economy",
      "effect:delayed_penalty",
      "effect:economy",
      "effect_scope:runner",
      "effect_timing:action",
      "effect_timing:on_leave_play",
      "effect_timing:persistent",
      "effect_timing:start_of_turn",
    ],
    conditions: ["requires_start_of_turn"],
    requiredMechanics: [
      "gain_credits",
      "install_resource",
      "lifecycle",
      "lose_credits",
      "pay_credits_or_lose_game",
      "trash_source",
    ],
  },
  "onr_proteus_080_black-widow": {
    functionSignals: [
      "breaker.sentry",
      "breaker.strength_bonus_vs_chosen_ice",
      "breaker.targeted_ice_bonus",
    ],
    tacticSignals: ["coverage.breaker"],
    actionTacticSignals: [
      "coverage.breaker",
      "effect:breaker",
      "effect_scope:runner",
      "effect_timing:persistent",
    ],
    conditions: [],
    requiredMechanics: [
      "against_selected_installed_ice",
      "break_subroutine",
      "choose_installed_ice_on_install",
      "credit",
      "ice_subtype",
      "icebreakerAbilities",
      "icebreakerEncounterStrengthBonus",
      "increase_strength",
      "installTargetBinding",
      "install_program",
    ],
  },
  "onr_proteus_092_morphing-tool": {
    functionSignals: [
      "breaker.configurable_coverage",
      "breaker.reconfigurable_type",
    ],
    tacticSignals: ["coverage.breaker"],
    actionTacticSignals: [
      "coverage.breaker",
      "effect:breaker",
      "effect_scope:runner",
      "effect_timing:persistent",
    ],
    conditions: [],
    requiredMechanics: [
      "break_subroutine",
      "choose_icebreaker_subtype_on_install",
      "credit",
      "icebreakerAbilities",
      "icebreakerSubtypeChange",
      "increase_strength",
      "installTargetBinding",
      "install_program",
      "selected_ice_subtype",
    ],
  },
  "onr_v1_110_sneak-preview": {
    functionSignals: [
      "setup.end_of_turn_bounce",
      "setup.install_discount",
      "setup.program_install",
      "setup.program_search",
      "setup.search",
      "setup.temporary_program_install",
    ],
    tacticSignals: ["setup.search"],
    actionTacticSignals: [
      "effect:delayed_penalty",
      "effect:install",
      "effect:install_discount",
      "effect:search",
      "effect_scope:installed_card",
      "effect_scope:runner",
      "effect_timing:action",
      "effect_timing:runner_turn",
    ],
    conditions: [],
    requiredMechanics: [
      "abilities",
      "choose_stack_or_trash_program_install",
      "on_play",
      "play_event",
    ],
  },
  "onr_v1_317_data-masons": {
    functionSignals: [
      "economy.rez_discount",
      "ice.strength_modifier",
      "ice.corp_strength_support",
    ],
    tacticSignals: [
      "corp.remote_protection",
      "ice.corp_rez_discount",
      "ice.corp_strength_support",
      "tax.ice",
    ],
    actionTacticSignals: [
      "corp.remote_protection",
      "effect:remote_protection",
      "effect:rez_discount",
      "effect_scope:ice",
      "effect_timing:persistent",
      "remote_role:ice_modifier",
    ],
    conditions: ["requires_installed_ice"],
    requiredMechanics: [
      "ice_strength",
      "install_remote",
      "modifiers",
      "rez_card",
      "rez_cost",
      "trash_on_access",
    ],
  },
  onr_proteus_020_digiconda: {
    functionSignals: [
      "corp_ice.end_run",
      "corp_ice.net_damage",
      "corp_ice.rez_paid_scaling",
      "ice.etr",
      "ice.strength_modifier",
    ],
    tacticSignals: [
      "corp_ice.damage_source",
      "corp_ice.end_run",
      "corp_ice.net_damage",
      "corp_ice.rez_paid_scaling",
      "damage.payoff",
    ],
    actionTacticSignals: [
      "damage.payoff.runner",
      "effect:damage",
      "effect:etr",
      "effect:global_modifier",
      "effect_scope:ice",
      "effect_scope:run_path",
      "effect_scope:runner",
      "effect_timing:encounter_resolution",
      "effect_timing:on_rez",
    ],
    conditions: ["requires_encounter", "requires_unbroken_subroutine"],
    requiredMechanics: [
      "damage",
      "encounter_ice",
      "end_the_run",
      "install_ice",
      "printedSubroutines",
      "rez_ice",
      "variableRez",
      "x_strength",
    ],
  },
  "onr_v1_348_virus-test-site": {
    functionSignals: [
      "access.archives_safe_exception",
      "access.corp_net_damage_ambush",
      "access.rnd_reveal_requirement",
      "advance.corp_counter_bank",
      "access.punish",
      "remote.ambush",
    ],
    tacticSignals: [
      "access.archives_safe_exception",
      "access.corp_net_damage_ambush",
      "access.punish",
      "access.rnd_reveal_requirement",
      "advance.corp_counter_bank",
      "damage.payoff",
      "remote.ambush",
    ],
    actionTacticSignals: [
      "access.punish",
      "damage.payoff.runner",
      "effect:ambush",
      "effect:damage",
      "effect_scope:accessed_card",
      "effect_scope:runner",
      "effect_timing:on_access",
      "remote.ambush",
    ],
    conditions: [
      "requires_accessed_card",
      "requires_advancement_counter",
      "requires_rnd_top",
    ],
    requiredMechanics: [
      "accessEffects",
      "advanceable",
      "damage",
      "damage_from_source_advancement_counters",
      "install_remote",
      "on_access",
      "rez_card",
      "trash_on_access",
    ],
  },
  "onr_v1_197_data-fort-reclamation": {
    functionSignals: [
      "economy.corp_install_rez_budget",
      "install.corp_new_remote_fort_from_hq",
      "score.remote_fort_creation",
      "score.remote_install_budget",
    ],
    tacticSignals: [
      "score.remote_fort_creation",
      "score.remote_install_budget",
    ],
    actionTacticSignals: [
      "effect:economy",
      "effect:install",
      "effect:remote_build",
      "effect:rez",
      "effect_scope:corp",
      "effect_scope:remote",
      "effect_timing:when_scored",
    ],
    conditions: ["requires_score_window", "requires_scored_agenda"],
    requiredMechanics: [
      "advance",
      "install_remote",
      "score_agenda",
      "score_install_hq_cards_into_new_remote_then_rez",
      "scoredAgenda",
    ],
  },
  "onr_v1_368_roving-submarine": {
    functionSignals: [
      "condition.corp_installed_or_advanced_this_fort_last_turn",
      "run.corp_server_lock",
      "tax.remote",
    ],
    tacticSignals: [
      "condition.corp_installed_or_advanced_this_fort_last_turn",
      "run.corp_server_lock",
    ],
    actionTacticSignals: [
      "effect:remote_tax",
      "effect_scope:remote",
      "effect_timing:during_run",
      "remote_role:run_tax",
    ],
    conditions: ["requires_remote_server"],
    requiredMechanics: [
      "fortRunWindows",
      "installCapabilities",
      "install_only_inside_subsidiary_data_fort",
      "install_remote",
      "rez_card",
      "rez_on_install",
      "server_run_start_restriction",
      "trash_on_access",
    ],
  },
};

describe("CS06 effective AI hint compatibility", () => {
  it.each(cases)(
    "projects $id from mechanics, planning and evidence",
    (expected) => {
      const hint = requiredHint(expected.id);
      expect(hint.roles).toEqual(expected.roles);
      expect(hint.riskTags ?? []).toEqual(expected.risks);
      expect(hint.valueHints).toEqual(expected.values);
      expect(
        hint.targetProfiles?.flatMap((profile) =>
          "purpose" in profile ? [profile.purpose] : [],
        ) ?? [],
      ).toEqual(expected.purposes);
      expect(
        hint.effects?.flatMap((effect) => effect.target ?? []) ?? [],
      ).toEqual(expected.effectTargets);
      expect(
        hint.strategySupportPairs?.map((pair) => pair.strategyId) ?? [],
      ).toEqual(expected.strategies);
      expect(hint.aiSupportStatus).toBe("ai_supported");
      expect(hint.quality).toEqual({
        hintReviewed: true,
        needsHumanReview: false,
        strategyCovered: expected.strategyCovered,
        ...(expected.qualityConfidence === undefined
          ? {}
          : { confidence: expected.qualityConfidence }),
      });
      expect(hint.scenarioRefs).toEqual([scenarioRef]);
    },
  );

  it("keeps breaker details and strategy evidence exact", () => {
    expect(
      requiredHint("onr_proteus_080_black-widow").breakerProfile,
    ).toMatchObject({
      coverage: ["sentry"],
      breakCost: 1,
      pumpCost: 2,
      pumpStrengthAmount: 1,
      strengthBonusVsChosenIce: true,
    });
    expect(
      requiredHint("onr_proteus_092_morphing-tool").breakerProfile,
    ).toMatchObject({
      coverageCandidates: ["code_gate", "sentry", "wall"],
      breakCost: 2,
      pumpCost: 1,
      reconfigurableType: true,
    });
    const virus = requiredHint("onr_v1_348_virus-test-site");
    expect(virus.strategySupportPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyId: "corp.ambush_bluff",
          evidence: [
            "access.corp_net_damage_ambush",
            "access.punish",
            "remote.ambush",
          ],
        }),
        expect.objectContaining({
          strategyId: "corp.damage_kill",
          evidence: [
            "access.corp_damage_ambush",
            "access.corp_net_damage_ambush",
            "damage.payoff",
          ],
        }),
      ]),
    );
  });

  it("derives access-ambush damage semantics from the mechanical damage type", () => {
    const vacantSoulkiller = requiredHint("onr_v1_346_vacant-soulkiller");

    expect(vacantSoulkiller.roles).toEqual(
      expect.arrayContaining(["ambush", "brain_damage"]),
    );
    expect(vacantSoulkiller.functionSignals).toContain(
      "access.corp_brain_damage_ambush",
    );
    expect(vacantSoulkiller.functionSignals).not.toContain(
      "access.corp_net_damage_ambush",
    );
    expect(vacantSoulkiller.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "damage",
          resource: "brain_damage",
          target: "access.corp_brain_damage_ambush",
        }),
      ]),
    );
  });

  it("keeps strategy-support interpretations and derived evidence exact", () => {
    expect(
      cases.flatMap(({ id }) =>
        (requiredHint(id).strategySupportPairs ?? []).map((pair) => ({
          cardId: id,
          ...pair,
        })),
      ),
    ).toEqual([
      {
        cardId: "onr_v1_317_data-masons",
        strategyId: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "ice_tax_support",
        evidence: [
          "ice.corp_rez_discount",
          "ice.corp_strength_support",
          "tax.ice",
        ],
        confidence: "high",
      },
      {
        cardId: "onr_proteus_020_digiconda",
        strategyId: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "rez_paid_scaling_ice",
        evidence: ["corp_ice.rez_paid_scaling"],
        confidence: "medium",
      },
      {
        cardId: "onr_v1_348_virus-test-site",
        strategyId: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_net_damage_payoff",
        evidence: [
          "access.corp_net_damage_ambush",
          "access.punish",
          "remote.ambush",
        ],
        confidence: "high",
      },
      {
        cardId: "onr_v1_348_virus-test-site",
        strategyId: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "access_net_damage_payoff",
        evidence: [
          "access.corp_damage_ambush",
          "access.corp_net_damage_ambush",
          "damage.payoff",
        ],
        confidence: "medium",
      },
      {
        cardId: "onr_v1_197_data-fort-reclamation",
        strategyId: "corp.remote_scoring",
        role: "engine_anchor",
        roleDetail: "remote_setup_engine",
        evidence: ["score.remote_fort_creation", "score.remote_install_budget"],
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Data Fort Reclamation to corp.remote_scoring as engine_anchor/remote_setup_engine.",
      },
      {
        cardId: "onr_v1_368_roving-submarine",
        strategyId: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "conditional_server_lock",
        evidence: [
          "condition.corp_installed_or_advanced_this_fort_last_turn",
          "run.corp_server_lock",
        ],
        confidence: "medium",
        rationale:
          "Conditional run lock can protect a dormant or staged remote.",
      },
    ]);
  });

  it.each(Object.entries(signalCases))(
    "keeps the full semantic signal surface exact for %s",
    (id, expected) => {
      const hint = requiredHint(id);
      expect(hint.functionSignals ?? []).toEqual(expected.functionSignals);
      expect(hint.tacticSignals ?? []).toEqual(expected.tacticSignals);
      expect(hint.actionTacticSignals ?? []).toEqual(
        expected.actionTacticSignals,
      );
      expect(hint.conditions?.map((condition) => condition.kind) ?? []).toEqual(
        expected.conditions,
      );
      expect(hint.requiredMechanics ?? []).toEqual(expected.requiredMechanics);
    },
  );

  it("keeps payoff use in planning while preserving mechanical damage facts", () => {
    const source = cs06PlanningCards().find(
      (entry) => entry.definition.id === "onr_proteus_020_digiconda",
    );
    if (!source) throw new Error("missing Digiconda planning fixture");
    const withoutTacticInterpretation = structuredClone(source) as unknown as {
      planning: {
        planningAnnotations: {
          card: Array<Record<string, unknown>>;
        };
      };
    };
    withoutTacticInterpretation.planning.planningAnnotations.card =
      withoutTacticInterpretation.planning.planningAnnotations.card.filter(
        (annotation) => annotation.kind !== "tactic_interpretation",
      );
    const hint = deriveCardSpecAiHint(withoutTacticInterpretation as never);
    expect(hint.functionSignals).toEqual([
      "corp_ice.end_run",
      "corp_ice.net_damage",
      "corp_ice.rez_paid_scaling",
      "ice.etr",
      "ice.strength_modifier",
    ]);
    expect(
      hint.effects?.map((effect) => effect.target).filter(Boolean),
    ).toEqual([
      "corp_ice.net_damage",
      "corp_ice.end_run",
      "corp_ice.rez_paid_scaling",
    ]);
    expect(hint.tacticSignals).not.toContain("damage.payoff");
    expect(hint.actionTacticSignals).not.toContain("damage.payoff.runner");
  });

  it("fails closed for an unknown Engine family or closed ontology value", () => {
    const source = cs06PlanningCards()[0];
    const unknownFamily = structuredClone(source) as unknown as {
      planning: { engine: Record<string, unknown> };
    };
    unknownFamily.planning.engine.unownedFamily = {};
    expect(() => deriveCardSpecAiHint(unknownFamily as never)).toThrow(
      "card_spec_hint_unsupported_family: unownedFamily",
    );

    const unknownExchange = structuredClone(source) as unknown as {
      planning: {
        planningAnnotations: {
          card: Array<Record<string, unknown>>;
        };
      };
    };
    unknownExchange.planning.planningAnnotations.card.push({
      kind: "strategic_exchange",
      exchange: "unowned_exchange",
    });
    expect(() => deriveCardSpecAiHint(unknownExchange as never)).toThrow(
      "card_spec_unknown_strategic_exchange: unowned_exchange",
    );

    const unknownTactic = structuredClone(source) as unknown as {
      planning: {
        planningAnnotations: {
          card: Array<Record<string, unknown>>;
        };
      };
    };
    unknownTactic.planning.planningAnnotations.card.push({
      kind: "tactic_interpretation",
      signal: "unowned_tactic",
      use: "economy.card",
    });
    expect(() => deriveCardSpecAiHint(unknownTactic as never)).toThrow(
      "card_spec_unknown_tactic_signal: unowned_tactic",
    );
  });
});

function requiredHint(id: string): AiCardHint {
  const hint = AI_HINTS_BY_CARD.get(id);
  if (!hint) throw new Error(`missing effective hint: ${id}`);
  return hint;
}
