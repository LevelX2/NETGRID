import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { icebreakerAbilitiesForDefinition } from "../../ability-engine/icebreaker-abilities";

type AuditEntry = {
  cardDefinitionId: string;
  title: string;
  printedStrength: number;
  pump: { available: boolean; creditCost?: number; strengthGain?: number };
  breakAbility: { creditCost: number; maxSubroutinesPerUse: number };
  engineImplementationStatus: "complete" | "missing";
  aiProfileStatus: "complete" | "missing";
  preRunSolverStatus: "complete" | "partial";
  remainingCardIdSpecialCase: boolean;
  remainingRuleTextFallback: boolean;
};

function auditEntries(): AuditEntry[] {
  const path = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../../../../../docs/reviews/ai/icebreaker-run-semantics-audit-2026-08-05.json",
  );
  return (JSON.parse(readFileSync(path, "utf8")) as { entries: AuditEntry[] })
    .entries;
}

describe("icebreaker run semantics audit", () => {
  it("matches generated breaker values to the structured engine definitions", () => {
    for (const entry of auditEntries()) {
      expect(entry.engineImplementationStatus, `${entry.title}: engine status`).toBe(
        "complete",
      );
      expect(entry.aiProfileStatus, `${entry.title}: AI profile status`).toBe(
        "complete",
      );
      expect(entry.preRunSolverStatus, `${entry.title}: pre-run status`).toBe(
        "complete",
      );
      expect(
        entry.remainingCardIdSpecialCase,
        `${entry.title}: card-id special case`,
      ).toBe(false);
      expect(
        entry.remainingRuleTextFallback,
        `${entry.title}: rule-text fallback`,
      ).toBe(false);
      const definition = CARD_DEFINITIONS_BY_ID[entry.cardDefinitionId];
      expect(definition, entry.title).toBeDefined();
      expect(definition?.strength ?? 0, entry.title).toBe(
        entry.printedStrength,
      );
      if (!definition) continue;
      const abilities = icebreakerAbilitiesForDefinition(definition);
      const pumps = abilities.filter(
        (ability) => ability.type === "pump_strength",
      );
      expect(pumps.length > 0, `${entry.title}: pump availability`).toBe(
        entry.pump.available,
      );
      if (entry.pump.available) {
        expect(
          pumps.some(
            (ability) =>
              ability.cost.credits === entry.pump.creditCost &&
              ability.amount === entry.pump.strengthGain,
          ),
          `${entry.title}: pump values`,
        ).toBe(true);
      }
      const breaks = abilities.filter(
        (ability) => ability.type === "break_subroutine",
      );
      expect(
        breaks.some(
          (ability) =>
            ability.cost.credits === entry.breakAbility.creditCost &&
            Math.max(1, ability.count ?? 1) >=
              entry.breakAbility.maxSubroutinesPerUse,
        ),
        `${entry.title}: break values`,
      ).toBe(true);
    }
  });
});
