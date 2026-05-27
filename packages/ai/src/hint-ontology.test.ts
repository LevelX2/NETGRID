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

    for (const cardId of pilotCardIds) {
      const hint = hintsByCard.get(cardId);
      expect(hint, cardId).toBeDefined();
      expect(validateAiHintOntologyFields(hint).errors, cardId).toEqual([]);
      expect(hint?.effects?.length, cardId).toBeGreaterThan(0);
      expect(hint?.quality?.hintReviewed, cardId).toBe(true);
      expect(hint?.quality?.strategyCovered, cardId).toBe(false);
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
});
