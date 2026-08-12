import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const planningEntries = cardSpecPlanningCards();

function planningEntry(cardId: string) {
  const entry = planningEntries.find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  return entry;
}

function hint(cardId: string) {
  return deriveCardSpecAiHint(planningEntry(cardId));
}

function forgedHint(cardId: string, mutate: (entry: any) => void) {
  const entry = structuredClone(planningEntry(cardId));
  mutate(entry);
  return () => deriveCardSpecAiHint(entry as never);
}

describe("generic CardSpec AI-hint repair block", () => {
  it("projects expose, dynamic ICE trash and Corp rez-or-trash choices from exact typed effects", () => {
    expect(hint("onr_v1_042_mouse").effects).toContainEqual(
      expect.objectContaining({
        kind: "expose_info",
        scope: "installed_card",
        target: "info.expose_installed_card",
      }),
    );
    expect(hint("onr_v1_080_core-command-jettison-ice").effects).toContainEqual(
      expect.objectContaining({
        kind: "ice_trash",
        resource: "credits",
        target: "pay_rez_cost_to_trash_rezzed_ice",
      }),
    );
    expect(hint("onr_v1_086_forged-activation-orders").effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "rez",
          target: "corp_choice_rez_or_trash_ice",
        }),
        expect.objectContaining({
          kind: "ice_trash",
          target: "corp_choice_rez_or_trash_ice",
        }),
      ]),
    );
  });

  it("keeps top-trash recovery both recovery- and search-visible", () => {
    const junkyard = hint("onr_v1_165_junkyard-bbs");
    expect(junkyard.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "card_recovery",
          scope: "heap",
          target: "move_top_trash_to_grip",
        }),
        expect.objectContaining({
          kind: "search",
          scope: "heap",
          target: "top_trash_card",
        }),
      ]),
    );
    expect(junkyard.functionSignals).toEqual(
      expect.arrayContaining([
        "setup.recovery",
        "setup.search",
        "setup.top_trash_recovery",
      ]),
    );
  });

  it("projects typed free-trash access without widening ordinary runs", () => {
    const kilroy = hint("onr_v1_096_kilroy-was-here");
    expect(kilroy.effects).toContainEqual(
      expect.objectContaining({
        kind: "trash_credit",
        scope: "rnd",
        timing: "successful_run",
        resource: "trash_credits",
        target: "access.free_trash",
        finite: true,
      }),
    );
    expect(kilroy.functionSignals).toContain("economy.trash_credit");

    const ordinaryRun = structuredClone(
      planningEntry("onr_v1_096_kilroy-was-here"),
    );
    (ordinaryRun.planning.engine.abilities![0]!.effects[0] as any).freeTrashAccessZones =
      [];
    const ordinaryRunHint = deriveCardSpecAiHint(ordinaryRun as never);
    expect(ordinaryRunHint.effects).not.toContainEqual(
      expect.objectContaining({ target: "access.free_trash" }),
    );
    expect(ordinaryRunHint.functionSignals).not.toContain(
      "economy.trash_credit",
    );
  });

  it("projects typed installed-program trash replacement as defense support", () => {
    const microtech = hint("onr_v1_131_microtech-backup-drive");
    expect(microtech.effects).toContainEqual(
      expect.objectContaining({
        kind: "program_trash_prevention",
        scope: "runner",
        timing: "prevention_window",
        resource: "cards",
        target: "installed_program",
      }),
    );
    expect(microtech.conditions).toContainEqual({
      kind: "requires_prevention_window",
    });
    expect(microtech.functionSignals).toContain(
      "defense.program_trash_prevention",
    );

    const ordinaryHardware = structuredClone(
      planningEntry("onr_v1_131_microtech-backup-drive"),
    );
    delete (ordinaryHardware.planning.engine as any).runnerUtilityLongtail;
    const ordinaryHardwareHint = deriveCardSpecAiHint(
      ordinaryHardware as never,
    );
    expect(ordinaryHardwareHint.effects ?? []).not.toContainEqual(
      expect.objectContaining({ kind: "program_trash_prevention" }),
    );
    expect(ordinaryHardwareHint.functionSignals ?? []).not.toContain(
      "defense.program_trash_prevention",
    );
  });

  it("projects a targeted bypass run only from the exact hidden replacement contract", () => {
    const social = hint("onr_v1_111_social-engineering");
    expect(social.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_run_effect",
          scope: "server",
          timing: "action",
          target: "make_run",
        }),
        expect.objectContaining({
          kind: "future_encounter_effect",
          scope: "ice",
          timing: "during_run",
          target: "bypass_chosen_ice",
        }),
      ]),
    );
    expect(social.functionSignals).toEqual(
      expect.arrayContaining(["run.make_run", "run.bypass_chosen_ice"]),
    );

    expect(
      forgedHint("onr_v1_111_social-engineering", (entry) => {
        entry.planning.engine.hiddenReplacementLongtail.visibility = "public";
      }),
    ).toThrow("card_spec_unknown_targeted_bypass_run_shape");
  });

  it("projects typed stack search and Blink random-break risk without card text", () => {
    expect(hint("onr_v1_177_the-short-circuit").effects).toContainEqual(
      expect.objectContaining({
        kind: "search",
        scope: "stack",
        target: "program",
      }),
    );
    expect(hint("onr_v1_007_blink").breakerProfile?.randomOutcome).toEqual({
      kind: "random_break_or_damage",
      successProbabilityPerAttempt: 0.5,
      failureDamageType: "net",
      maxSingleFailureDamage: 3,
    });

    const ordinaryBreaker = structuredClone(planningEntry("onr_v1_007_blink"));
    (ordinaryBreaker.planning.engine.icebreakerAbilities![0]! as any).special =
      {
        kind: "run_end_trash_source_if_used",
      };
    expect(
      deriveCardSpecAiHint(ordinaryBreaker as never).breakerProfile
        ?.randomOutcome,
    ).toBeUndefined();
  });

  it("projects static central access modifiers and keeps non-noisy credits restricted", () => {
    expect(hint("onr_v1_129_hq-interface").effects).toContainEqual(
      expect.objectContaining({
        kind: "multiaccess",
        scope: "hq",
        target: "access.hq_multiaccess",
        amount: 1,
      }),
    );
    expect(hint("onr_v1_011_cloak").effects).toContainEqual(
      expect.objectContaining({
        kind: "recurring_economy",
        economyMode: "restricted_credit",
        target: "non_noisy_icebreaker",
      }),
    );
    expect(hint("onr_v1_011_cloak").effects).not.toContainEqual(
      expect.objectContaining({
        kind: "recurring_economy",
        target: "link",
      }),
    );
  });

  it("normalizes shared damage prevention and tag avoidance without per-type duplicates", () => {
    const skullcap = hint("onr_proteus_096_skullcap");
    expect(
      skullcap.effects?.filter((effect) => effect.kind === "damage_prevention"),
    ).toEqual([
      expect.objectContaining({
        scope: "runner",
        resource: "damage",
        target: "prevent.core_and_net_damage",
      }),
    ]);
    expect(hint("onr_v1_135_nasuko-cycle").effects).toContainEqual(
      expect.objectContaining({
        kind: "tag_prevention",
        target: "avoid_tag",
        amount: 1,
      }),
    );
  });

  it("projects tagged meat damage and threshold score swings with explicit risks", () => {
    const taggedDamage = hint("onr_v1_327_i-got-a-rock");
    expect(taggedDamage.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "damage",
          resource: "meat_damage",
          amount: 15,
        }),
        expect.objectContaining({
          kind: "tag_punish_payoff",
          resource: "tags",
          amount: 2,
        }),
      ]),
    );
    expect(taggedDamage.conditions).toContainEqual({
      kind: "requires_runner_tagged",
    });

    const scorchedEarth = hint("onr_v1_302_scorched-earth");
    expect(scorchedEarth.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "damage",
          resource: "meat_damage",
          amount: 4,
        }),
        expect.objectContaining({
          kind: "tag_punish_payoff",
          target: "tagged_runner_damage",
          amount: 4,
        }),
      ]),
    );
    expect(scorchedEarth.conditions).toContainEqual({
      kind: "requires_runner_tagged",
    });

    const corporateWar = hint("onr_v1_196_corporate-war");
    expect(corporateWar.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "economy",
          target: "score.credit_threshold_swing",
          amount: 12,
        }),
        expect.objectContaining({
          kind: "delayed_penalty",
          target: "score.lose_all_credits_below_threshold",
          amountKind: "all_available",
        }),
      ]),
    );
    expect(corporateWar.tacticSignals).toEqual(
      expect.arrayContaining([
        "risk.requires_corp_credit_threshold",
        "risk.economy_crash_on_score",
      ]),
    );
    expect(corporateWar.riskTags).toEqual(
      expect.arrayContaining([
        "credit_threshold",
        "credit_swing",
        "economy_crash_on_score",
      ]),
    );
  });

  it("projects advancement-counter cashout and deferred encounter damage from their typed contracts", () => {
    const laundering = hint("onr_v1_328_information-laundering");
    expect(laundering.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "economy",
          scope: "corp",
          target: "economy.corp_counter_cashout",
          amount: 4,
        }),
        expect.objectContaining({
          kind: "advanceable_economy",
          resource: "advancement_counters",
          target: "advance.corp_counter_bank",
        }),
        expect.objectContaining({
          kind: "advanceable_economy",
          resource: "credits",
          target: "economy.corp_counter_cashout",
          amount: 4,
        }),
      ]),
    );
    expect(laundering.conditions).toContainEqual({
      kind: "requires_advancement_counter",
    });

    const fatalAttractor = hint("onr_v1_242_fatal-attractor");
    expect(fatalAttractor.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_encounter_effect",
          resource: "net_damage",
          amount: 3,
        }),
        expect.objectContaining({
          kind: "damage",
          timing: "encounter",
          resource: "net_damage",
          amount: 3,
        }),
      ]),
    );
  });

  it("projects advancement score conversion and keeps typed action capacity", () => {
    expect(hint("onr_v1_292_management-shake-up").effects).toContainEqual(
      expect.objectContaining({
        kind: "advance_burst",
        resource: "advancement_counters",
        target: "advance.any_combination",
        amount: 3,
      }),
    );
    const falsified = hint("onr_v1_291_falsified-transactions-expert");
    expect(falsified.effects).toContainEqual(
      expect.objectContaining({
        kind: "advance",
        resource: "advancement_counters",
        target: "advance.counter_transfer",
      }),
    );
    expect(falsified.tacticSignals).toEqual(
      expect.arrayContaining([
        "advance.corp_counter_transfer",
        "advance.score_window_support",
      ]),
    );
    expect(
      hint("onr_v1_297_overtime-incentives").actionCapacityProfiles,
    ).toContainEqual(
      expect.objectContaining({
        class: "immediate_gain",
        recipient: "corp",
        amount: 2,
      }),
    );
  });

  it("projects hosted-credit load/cashout and Hacker Tracker trace pools", () => {
    const braindance = hint("onr_v1_311_braindance-campaign");
    expect(braindance.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "finite_economy_pool",
          timing: "on_rez",
          economyMode: "fixed_pool",
          amount: 12,
        }),
        expect.objectContaining({
          kind: "economy",
          timing: "start_of_turn",
          economyMode: "bank_cashout",
        }),
      ]),
    );

    const hackerTracker = hint("onr_v1_325_hacker-tracker-central");
    expect(hackerTracker.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "persistent_counter_effect",
          target: "trace.counter_pool_after_attempt",
          amount: 1,
        }),
        expect.objectContaining({
          kind: "trace_credit",
          target: "trace.value_and_limit_per_counter",
          amount: 1,
        }),
      ]),
    );
    expect(hackerTracker.functionSignals).toEqual(
      expect.arrayContaining([
        "trace.counter_pool",
        "trace.value_support",
        "trace.limit_support",
      ]),
    );
  });

  it("never emits a trace limit as trace strength or effect amount", () => {
    for (const entry of planningEntries) {
      const traceEffects = (deriveCardSpecAiHint(entry).effects ?? []).filter(
        (effect) => effect.kind === "trace",
      );
      for (const effect of traceEffects)
        expect(effect, entry.definition.id).not.toHaveProperty("amount");
    }
  });

  it("projects Emergency Rig from the unbounded chosen-X free-rez contract", () => {
    expect(hint("onr_proteus_049_emergency-rig").effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "rez",
          target: "corp_ice.free_rez",
        }),
        expect.objectContaining({
          kind: "rez",
          target: "corp_ice.temporary_rez",
        }),
      ]),
    );
    expect(
      forgedHint("onr_proteus_049_emergency-rig", (entry) => {
        entry.planning.engine.abilities[0].effects[0].amount = {
          kind: "bounded_x_by_rez_cost_min_one",
        };
      }),
    ).toThrow("card_spec_unknown_free_rez_ice_shape");
  });

  it("fails closed for malformed near-shapes and does not widen restrictions", () => {
    const malformed = [
      forgedHint("onr_v1_042_mouse", (entry) => {
        entry.planning.engine.abilities[0].effects[0].visibility = "private";
      }),
      forgedHint("onr_v1_165_junkyard-bbs", (entry) => {
        entry.planning.engine.abilities[0].effects[0].recipient = "corp";
      }),
      forgedHint("onr_v1_080_core-command-jettison-ice", (entry) => {
        entry.planning.engine.abilities[0].effects[0].target =
          "chosen_unrezzed_ice";
      }),
      forgedHint("onr_v1_086_forged-activation-orders", (entry) => {
        entry.planning.engine.abilities[0].effects[0].visibility = "private";
      }),
      forgedHint("onr_v1_129_hq-interface", (entry) => {
        entry.planning.engine.modifiers[0].amount = 0;
      }),
      forgedHint("onr_proteus_096_skullcap", (entry) => {
        entry.planning.engine.damagePreventionSources[0].damageTypes = [];
      }),
      forgedHint("onr_v1_135_nasuko-cycle", (entry) => {
        entry.planning.engine.tagPreventionSources[0].amount = 2;
      }),
      forgedHint("onr_v1_327_i-got-a-rock", (entry) => {
        entry.planning.engine.uniqueDirectLongtail.damageType = "net";
      }),
      forgedHint("onr_v1_196_corporate-war", (entry) => {
        entry.planning.engine.scoredAgenda.threshold = 0;
      }),
      forgedHint("onr_v1_291_falsified-transactions-expert", (entry) => {
        entry.planning.engine.abilities[0].effects[0].maxAmount = 0;
      }),
      forgedHint("onr_v1_311_braindance-campaign", (entry) => {
        entry.planning.engine.lifecycle.on_rez[0].amount = 0;
      }),
      forgedHint("onr_v1_325_hacker-tracker-central", (entry) => {
        entry.planning.engine.remainingReplacementLongtail.traceValueAndLimitPerBit = 0;
      }),
    ];
    for (const derive of malformed)
      expect(derive).toThrow(/card_spec_unknown_/);

    const linkOnly = structuredClone(planningEntry("onr_v1_011_cloak"));
    (linkOnly as any).planning.engine.restrictedHostedCreditSource.usableFor = [
      "increase_link",
    ];
    const linkHint = deriveCardSpecAiHint(linkOnly as never);
    expect(linkHint.effects).toContainEqual(
      expect.objectContaining({
        kind: "recurring_economy",
        target: "link",
      }),
    );
    expect(linkHint.effects).not.toContainEqual(
      expect.objectContaining({ target: "non_noisy_icebreaker" }),
    );
  });
});
