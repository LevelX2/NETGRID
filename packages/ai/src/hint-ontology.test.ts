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
