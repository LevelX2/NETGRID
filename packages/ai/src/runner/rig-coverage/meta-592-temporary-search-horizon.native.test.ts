import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { runnerCoverageSearchLifecycleBinding } from "./coverage-support";
import { addRunnerCoverageRejectedSearchDispositions } from "./coverage-dispositions";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
function original(name: string) {
  const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../runtime/test-fixtures/" + name + ".json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
    input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("does not spend three credits on a temporary general Rig-first answer without a bound run consumer (SP-757)", () => {
  const { input } = original("meta592-r3-g29-d069"),
    before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(d.actionId).not.toContain("sneak-preview");
  expect(input.legalActions.some((a: any) => a.actionId === d.actionId)).toBe(
    true,
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
  const p = residentPlanPortfolioSnapshot(input)!;
  expect(
    p.instances
      .filter((x) => x.moduleId === "runner.rig_and_coverage")
      .every(
        (x) =>
          !JSON.stringify(
            (x.moduleState as any).gap?.directSearchActionIds,
          ).includes("sneak-preview"),
      ),
  ).toBe(true);
});
it("keeps the native urgent remote's actual temporary Rent-I-Con search", () => {
  const { input } = original("meta592-g34-d159-temporary-coverage"),
    d = chooseAiAction(input);
  expect(d.actionId).toContain("sneak-preview");
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.rig_and_coverage",
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
});
it.each([
  "temporary_unbound",
  "permanent_unbound",
  "temporary_bound",
  "temporary_partial_parent",
])(
  "binds the lifetime of the search answer to its existing need: %s",
  (variant) => {
    const gap: RunnerCoverageGapSignal = {
      gapId: "coverage:breaker_code_gate",
      requiredRole: "breaker_code_gate",
      priorityClass: "P5",
      evidenceCode: "test",
      deckHasAnswer: true,
      answerInHand: false,
      fundingActionIds: [],
      directSearchActionIds: ["search"],
      directSearchChoiceBindings: [
        {
          actionId: "search",
          sourceCardInstanceId: "source",
          sourceDefinitionId: "source_definition",
          targetDefinitionId: "target",
        },
      ],
      searchEngineSetupActionIds: [],
      drawForAnswerActionIds: ["draw"],
      ...(variant === "temporary_bound"
        ? {
            requesterModuleId: "runner.contest_remote",
            requesterPlanInstanceId: "parent",
            requesterNeedId: "need",
            targetRunActionId: "run",
          }
        : {}),
    };
    if (variant === "temporary_partial_parent")
      gap.requesterPlanInstanceId = "parent";
    const candidate: Pick<
        ActionSemanticCandidate,
        "actionId" | "functionalEffects"
      > = {
        actionId: "search",
        functionalEffects:
          variant === "permanent_unbound"
            ? []
            : [
                {
                  kind: "delayed_penalty",
                  scope: "installed_card",
                  timing: "runner_turn",
                  target: "end_of_turn_bounce",
                },
              ],
      },
      before = JSON.stringify(gap),
      bound = runnerCoverageSearchLifecycleBinding(gap, [candidate]),
      allowed =
        variant === "temporary_bound" || variant === "permanent_unbound";
    expect(JSON.stringify(gap)).toBe(before);
    expect(bound.directSearchActionIds).toEqual(allowed ? ["search"] : []);
    expect(bound.directSearchChoiceBindings).toHaveLength(allowed ? 1 : 0);
    expect(bound.drawForAnswerActionIds).toEqual(["draw"]);
    if (!allowed) {
      const dispositions: string[] = [];
      addRunnerCoverageRejectedSearchDispositions(
        { coverageGaps: [bound] },
        new Set(),
        new Set(),
        (_id, _owner, reason) => {
          dispositions.push(reason);
        },
      );
      expect(dispositions).toHaveLength(1);
      expect(dispositions[0]).toContain(
        "temporary_coverage_search_requires_bound_run_consumer",
      );
      const admitted: string[] = [];
      addRunnerCoverageRejectedSearchDispositions(
        { coverageGaps: [bound] },
        new Set(["search"]),
        new Set(),
        (_id, _owner, reason) => {
          admitted.push(reason);
        },
      );
      expect(admitted).toEqual([]);
    }
  },
);
