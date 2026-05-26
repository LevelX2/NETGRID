import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const reportPath = path.join(
  repoRoot,
  "docs/reviews/ai/aufgabe-010-batch2-normalization-dry-run-report-2026-05-25.json",
);

type BatchTwoNormalizationDryRunReport = {
  taskId: string;
  batch: string;
  hardErrorCount: number;
  normalizationRuleCounts: Record<string, number>;
  normalizedDifferenceCount: number;
  remainingShapeDifferenceCount: number;
  remainingTargetProfileDifferenceCount: number;
  remainingTrashCreditTargetDifferenceCount: number;
  remainingCostProfileDifferenceCount: number;
  boardContextInfoCount: number;
  realSemanticConflictCount: number;
  remainingDifferences: unknown[];
  cards: Array<{
    cardId: string;
    normalizedEquivalences: Array<{
      fact: string;
      rules: string[];
      normalizedForms: Array<{
        rule: string;
        form: Record<string, unknown>;
      }>;
      conflict: boolean;
    }>;
    boardContextInfos: Array<{
      fact: string;
      rule: string;
      normalizedForm: Record<string, unknown>;
      conflict: boolean;
    }>;
  }>;
};

describe("generated fact Batch-2 normalization dry run", () => {
  it("is deterministic against the committed report", () => {
    const first = runNormalizationJson();
    const second = runNormalizationJson();
    expect(first).toEqual(second);
    expect(first).toEqual(readReport());
  });

  it("normalizes all Batch-2 diff classes without semantic conflicts", () => {
    const report = readReport();
    expect(report.taskId).toBe("Aufgabe 010");
    expect(report.batch).toBe("batch_2_breaker_target_trash_credit");
    expect(report.hardErrorCount).toBe(0);
    expect(report.normalizedDifferenceCount).toBe(15);
    expect(report.remainingShapeDifferenceCount).toBe(0);
    expect(report.remainingTargetProfileDifferenceCount).toBe(0);
    expect(report.remainingTrashCreditTargetDifferenceCount).toBe(0);
    expect(report.remainingCostProfileDifferenceCount).toBe(0);
    expect(report.boardContextInfoCount).toBe(7);
    expect(report.realSemanticConflictCount).toBe(0);
    expect(report.remainingDifferences).toEqual([]);
  });

  it("keeps SMC normal-cost install distinct from Mystery Box free install", () => {
    const report = readReport();
    const smcTarget = normalizedForm(
      report,
      "onr_v1_059_self-modifying-code",
      "target_profile_install_cost_normalization",
    );
    const mysteryTarget = normalizedForm(
      report,
      "onr_v1_043_mystery-box",
      "target_profile_install_cost_normalization",
      "targetProfile",
    );
    expect(smcTarget).toMatchObject({
      installCost: "normal",
      discountEffect: false,
      profileClass: "full_stack_program_search_install",
    });
    expect(mysteryTarget).toMatchObject({
      installCost: "free",
      discountEffect: true,
      profileClass: "top_five_stack_program_look_install",
    });
  });

  it("keeps stack and top-stack search profiles distinct", () => {
    const report = readReport();
    expect(
      normalizedForm(
        report,
        "onr_v1_059_self-modifying-code",
        "target_profile_stack_search_normalization",
      ),
    ).toMatchObject({
      zone: "stack",
      profileClass: "full_stack_program_search_install",
    });
    expect(
      normalizedForm(
        report,
        "onr_v1_043_mystery-box",
        "target_profile_stack_search_normalization",
      ),
    ).toMatchObject({
      zone: "stack_top",
      lookCount: 5,
      profileClass: "top_five_stack_program_look_install",
    });
  });

  it("keeps trash-credit targets and breaker profiles safe", () => {
    const report = readReport();
    expect(
      normalizedForm(
        report,
        "onr_v1_048_poltergeist",
        "trash_credit_target_normalization",
      ),
    ).toMatchObject({ target: "node" });
    expect(
      normalizedForm(
        report,
        "onr_v1_057_scatter-shot",
        "trash_credit_target_normalization",
      ),
    ).toMatchObject({ target: "upgrade" });
    expect(
      normalizedForm(
        report,
        "onr_v1_039_krash",
        "breaker_profile_shape_normalization",
      ),
    ).toMatchObject({ coverage: ["universal"] });
    expect(
      normalizedForm(
        report,
        "onr_v1_037_japanese-water-torture",
        "breaker_profile_shape_normalization",
      ),
    ).toMatchObject({ sideEffects: ["forgo_actions"] });
  });

  it("splits CostProfile and downgrades BoardContext to info", () => {
    const report = readReport();
    expect(report.normalizationRuleCounts).toEqual({
      target_profile_install_cost_normalization: 3,
      target_profile_stack_search_normalization: 2,
      trash_credit_target_normalization: 4,
      breaker_profile_shape_normalization: 2,
      cost_profile_split_normalization: 6,
      board_context_required_classification: 7,
    });
    for (const card of report.cards) {
      expect(
        card.normalizedEquivalences.some((equivalence) =>
          equivalence.rules.includes("cost_profile_split_normalization"),
        ),
      ).toBe(true);
    }
    expect(report.cards.flatMap((card) => card.boardContextInfos)).toHaveLength(
      7,
    );
  });

  it("does not emit hidden-info or runtime state fields", () => {
    const serialized = JSON.stringify(readReport());
    for (const blockedField of [
      "opponentDeckList",
      "actualRndOrder",
      "privatePayload",
      "fullGameState",
      "legalActions",
      "stateVersion",
      "stateHash",
    ]) {
      expect(serialized).not.toContain(`"${blockedField}"`);
    }
  });
});

function normalizedForm(
  report: BatchTwoNormalizationDryRunReport,
  cardId: string,
  rule: string,
  fact?: string,
) {
  const card = report.cards.find((item) => item.cardId === cardId);
  if (!card) throw new Error(`Missing card ${cardId}`);
  const equivalence = card.normalizedEquivalences.find(
    (item) => item.rules.includes(rule) && (!fact || item.fact === fact),
  );
  if (!equivalence) throw new Error(`Missing rule ${rule} for ${cardId}`);
  const form = equivalence.normalizedForms.find((item) => item.rule === rule);
  if (!form) throw new Error(`Missing form ${rule} for ${cardId}`);
  return form.form;
}

function runNormalizationJson(): BatchTwoNormalizationDryRunReport {
  return JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/check-ai-generated-fact-batch2-normalization-dry-run.mjs",
        "--json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as BatchTwoNormalizationDryRunReport;
}

function readReport(): BatchTwoNormalizationDryRunReport {
  return JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  ) as BatchTwoNormalizationDryRunReport;
}
