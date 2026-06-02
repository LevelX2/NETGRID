import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import {
  KNOWN_HINT_EFFECT_KINDS,
  validateAiHintOntologyFields,
} from "./hint-ontology";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("AI hint ontology validation", () => {
  it("accepts all current legacy active hints without ontology errors", () => {
    const results = activeAiHintsData.cards.map((hint) => ({
      cardId: hint.cardId,
      result: validateAiHintOntologyFields(hint),
    }));
    const failures = results.filter(({ result }) => result.errors.length > 0);
    expect(failures).toEqual([]);
  });

  it("keeps the Phase 2 high-impact pilot cards structured and valid", () => {
    const pilotCardIds = [
      "onr_v1_210_political-overthrow",
      "onr_v1_037_japanese-water-torture",
      "onr_v1_059_self-modifying-code",
      "onr_v1_043_mystery-box",
      "onr_v1_057_scatter-shot",
      "onr_v1_355_crystal-palace-station-grid",
      "onr_v1_366_red-herrings",
      "onr_v1_274_tutor",
      "onr_v1_277_virizz",
      "onr_v1_302_scorched-earth",
    ];
    const hintsByCard = new Map(
      activeAiHintsData.cards.map((hint) => [hint.cardId, hint]),
    );
    const strategyCoveredPilotCardIds = new Set([
      "onr_v1_274_tutor",
      "onr_v1_277_virizz",
    ]);

    for (const cardId of pilotCardIds) {
      const hint = hintsByCard.get(cardId);
      expect(hint, cardId).toBeDefined();
      expect(validateAiHintOntologyFields(hint).errors, cardId).toEqual([]);
      expect(hint?.effects?.length, cardId).toBeGreaterThan(0);
      expect(hint?.quality?.hintReviewed, cardId).toBe(true);
      expect(hint?.quality?.strategyCovered, cardId).toBe(
        strategyCoveredPilotCardIds.has(cardId),
      );
    }
  });

  it("accepts a scored-agenda economy structured effect", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "economy",
          timing: "scored_activated",
          scope: "corp",
          resource: "credits",
          amount: 3,
          repeatable: true,
        },
      ],
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("accepts a breaker profile with side effects", () => {
    const result = validateAiHintOntologyFields({
      breakerProfile: {
        coverage: ["wall"],
        baseStrength: 2,
        pumpCost: 0,
        breakCost: 0,
        sideEffects: ["forgo_actions"],
      },
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts a future-run ICE effect fixture", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "future_run_effect",
          timing: "encounter",
          scope: "run_path",
        },
      ],
      conditions: [{ kind: "requires_during_run" }],
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts read-only target profiles for search/install effects", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "search",
          timing: "during_run",
          scope: "runner",
        },
      ],
      targetProfiles: [
        {
          zone: "stack_top",
          lookCount: 5,
          targetCardType: "program",
          installsTarget: true,
          installCost: "free",
          shuffleAfter: true,
          showToOpponent: true,
          oncePerRun: true,
        },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts read-only central information and expose effect kinds", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "hq_info",
          timing: "on_access",
          scope: "hq",
          resource: "cards",
        },
        {
          kind: "expose_info",
          timing: "action",
          scope: "installed_card",
        },
        {
          kind: "ice_trash",
          timing: "during_run",
          scope: "ice",
        },
      ],
      conditions: [
        { kind: "requires_accessed_card" },
        { kind: "requires_during_run" },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts read-only corp ICE longtail effect and context kinds", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "etr",
          timing: "encounter",
          scope: "run_path",
        },
        {
          kind: "run_lock",
          timing: "trace_success",
          scope: "runner",
          resource: "actions",
        },
        {
          kind: "no_jack_out",
          timing: "during_run",
          scope: "runner",
        },
        {
          kind: "persistent_counter_effect",
          timing: "persistent",
          scope: "runner",
          resource: "counters",
        },
        {
          kind: "trace_credit",
          timing: "encounter",
          scope: "corp",
          resource: "credits",
          amount: 4,
        },
      ],
      conditions: [
        { kind: "requires_encounter" },
        { kind: "requires_unbroken_subroutine" },
        { kind: "requires_later_encounter" },
        { kind: "requires_remaining_ice" },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("rejects an unknown effect kind", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "magic_win_game",
          timing: "action",
          scope: "runner",
        },
      ],
    });
    expect(result.errors.map((issue) => issue.kind)).toContain(
      "unknown_effect_kind",
    );
  });

  it("rejects an unknown condition kind", () => {
    const result = validateAiHintOntologyFields({
      conditions: [{ kind: "requires_private_runner_hand" }],
    });
    expect(result.errors.map((issue) => issue.kind)).toContain(
      "unknown_condition_kind",
    );
  });

  it("rejects unknown target profile values", () => {
    const result = validateAiHintOntologyFields({
      targetProfiles: [
        {
          zone: "private_runner_stack_order",
          targetCardType: "scheme",
          installCost: "discounted_by_guess",
          shuffleAfter: true,
        },
      ],
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ kind: "unknown_target_zone" }),
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ kind: "unknown_target_card_type" }),
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ kind: "unknown_target_install_cost" }),
    );
  });

  it("rejects hidden-info field names", () => {
    const result = validateAiHintOntologyFields({
      actualRndOrder: ["agenda", "ice"],
      effects: [],
    });
    expect(result.errors.map((issue) => issue.kind)).toContain(
      "hidden_info_risk",
    );
  });

  it("requires opponent signals to be visible-evidence-only", () => {
    const result = validateAiHintOntologyFields({
      opponentSignals: [{ kind: "corp_tag_punish" }],
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        kind: "hidden_info_risk",
        path: "$.opponentSignals[0].visibleEvidenceOnly",
      }),
    );
  });

  it("keeps the ontology module free of planner imports", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, "packages/ai/src/hint-ontology.ts"),
      "utf8",
    );
    expect(source).not.toContain("./corp-plans");
    expect(source).not.toContain("./runner-plans");
    expect(source).not.toContain("./deck-doctrine");
    expect(KNOWN_HINT_EFFECT_KINDS).toContain("scored_agenda_action");
  });

  it("accepts read-only generated Corp economy and score-conversion kinds", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        { kind: "advance_burst", timing: "action", scope: "corp" },
        { kind: "shuffle_draw", timing: "action", scope: "corp" },
        { kind: "card_recovery", timing: "action", scope: "corp" },
        { kind: "agenda_reveal_economy", timing: "when_scored", scope: "hq" },
        { kind: "advance", timing: "action", scope: "corp" },
        { kind: "install", timing: "action", scope: "corp" },
        { kind: "rez", timing: "action", scope: "corp" },
        { kind: "remote_build", timing: "action", scope: "corp" },
        { kind: "global_modifier", timing: "persistent", scope: "corp" },
        {
          kind: "finite_economy_pool",
          timing: "when_scored",
          scope: "score_area",
        },
      ],
      conditions: [
        { kind: "requires_agenda_in_hq" },
        { kind: "requires_agenda_reveal" },
        { kind: "requires_hq_agenda" },
        { kind: "requires_installed_ice" },
        { kind: "requires_rezzed_ice" },
        { kind: "requires_score_window" },
        { kind: "requires_corp_credits_threshold" },
        { kind: "requires_start_of_turn" },
        { kind: "requires_stolen_agenda_last_turn" },
        { kind: "requires_archives_card" },
        { kind: "requires_rnd_top" },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts read-only generated Corp node and ambush kinds", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        { kind: "action_economy", timing: "action", scope: "remote" },
        {
          kind: "start_of_turn_economy",
          timing: "start_of_turn",
          scope: "corp",
        },
        { kind: "recurring_economy", timing: "start_of_turn", scope: "corp" },
        { kind: "advanceable_economy", timing: "action", scope: "remote" },
        { kind: "ambush", timing: "on_access", scope: "remote" },
        { kind: "access_punish", timing: "on_access", scope: "accessed_card" },
        { kind: "remote_tax", timing: "during_run", scope: "runner" },
        { kind: "link_penalty", timing: "persistent", scope: "runner" },
        { kind: "economy", timing: "on_rez", scope: "corp" },
      ],
      conditions: [
        { kind: "requires_accessed_card" },
        { kind: "requires_advancement_counter" },
        { kind: "requires_rezzed_card" },
        { kind: "requires_runner_draw" },
        { kind: "requires_runner_pay_or_take_tag" },
      ],
      remoteRole: {
        kind: "tag_punish_asset",
        threatLevel: "medium",
        serverScope: "remote",
      },
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts read-only generated Runner prevention and survival kinds", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "damage_prevention",
          timing: "prevention_window",
          scope: "runner",
          resource: "damage",
          amount: 2,
        },
        {
          kind: "flatline_prevention",
          timing: "flatline_replacement",
          scope: "runner",
          resource: "damage",
        },
        {
          kind: "program_trash_prevention",
          timing: "prevention_window",
          scope: "installed_program",
        },
        {
          kind: "tag_prevention",
          timing: "prevention_window",
          scope: "runner",
          resource: "tags",
        },
        { kind: "trace_defense", timing: "trace_window", scope: "trace" },
        { kind: "base_link", timing: "trace_window", scope: "trace" },
        {
          kind: "hand_size_modifier",
          timing: "persistent",
          scope: "runner",
          resource: "hand_size",
        },
        {
          kind: "action_penalty",
          timing: "persistent",
          scope: "runner",
          resource: "actions",
        },
      ],
      conditions: [
        { kind: "requires_damage" },
        { kind: "requires_flatline" },
        { kind: "requires_program_trash" },
        { kind: "requires_trace_attempt" },
        { kind: "requires_prevention_window" },
        { kind: "requires_turn_limit_available" },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("accepts diagnostic TargetProfile V1 and hosting setup fields", () => {
    const result = validateAiHintOntologyFields({
      effects: [
        {
          kind: "program_host",
          timing: "persistent",
          scope: "runner",
          resource: "memory",
          target: "program",
          amount: 3,
        },
      ],
      breakerProfile: {
        configurableCoverage: true,
        coverageCandidates: ["code_gate", "sentry", "wall"],
        oneTimeModeChoice: true,
      },
      targetProfiles: [
        {
          schemaVersion: "target-profile-v1",
          kind: "mode_choice",
          timing: "paid_action",
          targetType: "ice_type",
          purpose: "choose_fixed_breaker_coverage",
          preferences: ["type_missing_in_current_rig"],
          avoid: ["hidden_info_dependent_choice"],
          hiddenInfoPolicy: "visible_or_known_only",
        },
      ],
    });

    expect(result.errors).toEqual([]);
  });
});
