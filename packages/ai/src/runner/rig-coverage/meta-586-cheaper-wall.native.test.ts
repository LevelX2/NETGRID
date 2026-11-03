import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { createRunnerProgramInstallTrashContext } from "../../runtime/runner-program-install-trash-context";
import {
  visibleBreakerRoles,
  visibleBreakerRoleCounts,
} from "../../runtime/runner-visible-breaker-coverage";
import {
  visibleCounterValue,
  visibleMemoryCost,
  visibleInstallCost,
} from "../../runtime/visible-card-heuristics";
import { breakerPreparationHasCurrentLiability } from "./coverage-same-turn-breaker-preparation";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta586-g30-d339-cheaper-wall.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

function nativeInput(): AiDecisionInputWithDeckCapabilities {
  const source = checkpoint();
  return { ...source.input, ...buildAiDecisionInputDto(source.input) };
}

function installAssessment(input: AiDecisionInputWithDeckCapabilities) {
  const context = createRunnerProgramInstallTrashContext({
    safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
    visibleMemoryCost,
    visibleBreakerRoles,
    visibleBreakerRoleCounts,
    visibleCounterValue,
    visibleInstallCost,
    visibleCardsByInstanceId: (view) =>
      new Map((view.own.rig ?? []).map((card) => [card.instanceId, card])),
    rolesForCardId: () => [],
    isRunnerPressureRole: () => false,
    isRunnerEconomyRole: () => false,
  });
  const incoming = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === "onr_v1_036_jackhammer",
  )!;
  return context.runnerProgramInstallTrashAssessmentForCard(input, incoming);
}

describe("native same-turn cheaper breaker replacement", () => {
  it("prepares the affordable wall breaker for the exact terminal remote", () => {
    const source = checkpoint();
    expect(Object.values(source.validation)).toEqual(Array(9).fill(true));
    const input = nativeInput();
    expect(input.playerView.own).toMatchObject({
      credits: 3,
      clicks: 4,
      memoryUsed: 4,
      memoryLimit: 4,
    });
    const held = input.playerView.own.gripOrHq.find(
      (card) => card.definitionId === "onr_v1_036_jackhammer",
    );
    const install = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === held!.instanceId &&
        action.payload?.runnerProgramTrashBeforeInstall === true,
    );
    expect(install).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      source.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(decision.actionId).toBe(install!.actionId);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toMatch(/^plan:runner\.contest_remote:/);
    expect(plan?.leafExecutorInstanceId).toMatch(
      /^plan:runner\.rig_and_coverage:/,
    );
    expect(plan?.route).toMatchObject({
      actionId: install!.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  });

  it("preserves gate and sentry coverage while replacing the wall breaker", () => {
    const assessment = installAssessment(nativeInput());
    expect(assessment.canFreeRequiredMemory).toBe(true);
    expect(
      assessment.selectedCandidates.map((c) => c.card?.definitionId),
    ).toEqual(["onr_v1_047_pile-driver"]);
    for (const id of ["onr_v1_014_codecracker", "onr_v1_023_evil-twin"])
      expect(
        assessment.candidates.find((c) => c.card?.definitionId === id)
          ?.protectedRole,
      ).toBe(true);
  });

  it.each(["low-confidence", "restriction", "new-risk", "unknown-incoming"])(
    "keeps the existing unique wall coverage for %s",
    (kind) => {
      const input = nativeInput();
      const breaker = input.ownDeckCapabilities!.runner!.breakerInventory.find(
        (b) => b.cardId === "onr_v1_036_jackhammer",
      )!;
      if (kind === "low-confidence") breaker.confidence = "low";
      if (kind === "restriction") breaker.restrictions.push("once_per_run");
      if (kind === "new-risk") breaker.risks.push("tag_risk");
      if (kind === "unknown-incoming")
        input.playerView.own.gripOrHq.find(
          (c) => c.definitionId === breaker.cardId,
        )!.known = false;
      const candidate = installAssessment(input).candidates.find(
        (c) => c.card?.definitionId === "onr_v1_047_pile-driver",
      )!;
      expect(candidate.protectedRole).toBe(true);
      expect(candidate.acceptable).toBe(false);
    },
  );

  it("retains the Stealth liability when actual Stealth credits would be lost", () => {
    const input = nativeInput();
    const breaker = input.ownDeckCapabilities!.runner!.breakerInventory.find(
      (b) => b.cardId === "onr_v1_036_jackhammer",
    )!;
    expect(breakerPreparationHasCurrentLiability(input, breaker)).toBe(false);
    input.playerView.own.rig!.push({
      instanceId: "stealth-source",
      known: true,
      type: "program",
      subtypes: ["stealth"],
      counterDisplays: [
        {
          id: "credits",
          amount: 2,
          displayKind: "restricted_pool",
          label: "Credits",
          ariaLabel: "2 Credits",
          creditPool: {
            kind: "restricted_credit",
            uses: ["using_icebreaker_during_run_non_noisy"],
          },
        },
      ],
    });
    expect(breakerPreparationHasCurrentLiability(input, breaker)).toBe(true);
  });

  it("keeps other risk and generic side-effect penalties blocking preparation", () => {
    const input = nativeInput();
    const breaker = input.ownDeckCapabilities!.runner!.breakerInventory.find(
      (b) => b.cardId === "onr_v1_036_jackhammer",
    )!;
    expect(
      breakerPreparationHasCurrentLiability(input, {
        ...breaker,
        risks: ["tag_risk"],
      }),
    ).toBe(true);
    expect(
      breakerPreparationHasCurrentLiability(input, {
        ...breaker,
        risks: ["side_effect_penalty"],
      }),
    ).toBe(true);
  });
});
