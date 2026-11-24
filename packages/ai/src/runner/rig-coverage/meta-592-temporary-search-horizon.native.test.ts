import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
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
import type { AiDecisionInput } from "@netgrid/shared";

function fromVisibleEvent(input: AiDecisionInput, actionId: string | undefined, definitionId: number): boolean {
  const action = input.legalActions.find((candidate) => candidate.actionId === actionId);
  return action !== undefined && input.playerView.own.gripOrHq.some((card) =>
    card.instanceId === action.source && card.definitionId === definitionId,
  );
}
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
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(false);
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
          !((x.moduleState as { gap?: RunnerCoverageGapSignal }).gap?.directSearchActionIds ?? []).some((id) =>
            fromVisibleEvent(input, id, 322),
          ),
      ),
  ).toBe(true);
});
it("keeps the native urgent remote's actual temporary Rent-I-Con search", () => {
  const { input } = original("meta592-g34-d159-temporary-coverage"),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(true);
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
          sourceDefinitionId: syntheticCardDefinitionId("source_definition"),
          targetDefinitionId: syntheticCardDefinitionId("target"),
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
        new Set(),
        (_id, _owner, reason) => {
          admitted.push(reason);
        },
      );
      expect(admitted).toEqual([]);
      const rejectedByDefense: string[] = [];
      addRunnerCoverageRejectedSearchDispositions(
        { coverageGaps: [bound] },
        new Set(),
        new Set(),
        new Set(["search"]),
        (_id, _owner, reason) => {
          rejectedByDefense.push(reason);
        },
      );
      expect(rejectedByDefense).toEqual([]);
    }
  },
);

it.each([
  ["meta592-r4-g03-d128-last-click", "search_and_run_clicks_do_not_fit"],
  [
    "meta592-r4-g05-d254-hand-buffer",
    "search_run_and_hand_preparation_do_not_fit",
  ],
  ["meta592-r4-g32-d314-funding", "no_complete_same_turn_funding_route"],
])(
  "does not spend a temporary search before an incomplete current-turn route: %s",
  (fixture, reason) => {
    const { input } = original(fixture),
      before = JSON.stringify(input),
      d = chooseAiAction(input);
    expect(fromVisibleEvent(input, d.actionId, 322)).toBe(false);
    expect(
      input.legalActions.some(
        (a: { actionId: string }) => a.actionId === d.actionId,
      ),
    ).toBe(true);
    expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
    const gaps = residentPlanPortfolioSnapshot(input)!
      .instances.filter((x) => x.moduleId === "runner.rig_and_coverage")
      .map((x) => (x.moduleState as { gap: RunnerCoverageGapSignal }).gap);
    expect(
      gaps.some((g) =>
        g.recoveryEvidenceCodes?.some(
          (code) =>
            code.startsWith("temporary_search_incomplete_horizon:") &&
            code.endsWith(reason),
        ),
      ),
    ).toBe(true);
  },
);
it("keeps the native three-click temporary search that actually reaches the remote this turn", () => {
  const { input } = original("meta592-r4-g04-d082-used-temporary"),
    before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(true);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("keeps the native terminal remote search with one guaranteed funding click (SP-757)", () => {
  const { input } = original("meta592-r5-g07-d182-terminal-search"),
    before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(true);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
  const gaps = residentPlanPortfolioSnapshot(input)!
    .instances.filter((x) => x.moduleId === "runner.rig_and_coverage")
    .map((x) => (x.moduleState as { gap: RunnerCoverageGapSignal }).gap);
  expect(
    gaps.some(
      (g) =>
        g.targetRunActionId === "rs.r1" &&
        g.directSearchActionIds.includes(d.actionId!),
    ),
  ).toBe(true);
  expect(
    gaps
      .filter((g) => fromVisibleEvent(input, g.targetRunActionId, 164))
      .every((g) => !g.directSearchActionIds.includes(d.actionId!)),
  ).toBe(true);
});
it("uses the existing terminal run admission after two actual engine draws, without a second generic reserve floor", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r1-g34-engine-two-draws.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(cp.schemaVersion).toBe(
    "netgrid-engine-generated-counterfactual-input-v1",
  );
  expect(cp.engineValidation).toEqual({ ok: true, errors: [] });
  expect(cp.origin.checkedOriginalPrefix).toBe(159);
  expect(
    cp.origin.commands.map((x: { actionId: string }) => x.actionId),
  ).toEqual(["r8", "r8"]);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  resetResidentPlanPortfolioMemory();
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(true);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});
it("keeps a native temporary search with two reserved hand-buffer draws before its run", () => {
  const { input } = original("meta592-r4-g04-d100-planned-draws"),
    before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(true);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("does not buy temporary coverage when its remote information horizon is unfunded (SP-757)", () => {
  const { input } = original("meta592-r6-g27-d681-information-search"),
    before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(fromVisibleEvent(input, d.actionId, 322)).toBe(false);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
  const gaps = residentPlanPortfolioSnapshot(input)!
    .instances.filter((x) => x.moduleId === "runner.rig_and_coverage")
    .map((x) => (x.moduleState as { gap: RunnerCoverageGapSignal }).gap);
  expect(
    gaps.some((g) =>
      g.recoveryEvidenceCodes?.some(
        (code) =>
          code.startsWith("temporary_search_incomplete_horizon:") &&
          code.endsWith(":no_complete_same_turn_funding_route"),
      ),
    ),
  ).toBe(true);
});
