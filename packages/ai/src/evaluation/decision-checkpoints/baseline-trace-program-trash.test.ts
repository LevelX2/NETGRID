import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { selectedCorpProgramTrashChoiceOptionIds } from "../../runtime/corp-program-trash-choice";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
function native(tail: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/baseline-trace-program-trash/${tail}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { state: GameState; input: AiDecisionInputWithDeckCapabilities };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  return { state: cp.state, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it.each(["05", "07"])(
  "resolves the native completed-run program-trash Trace %s in Defense",
  (tail) => {
    const { state, input } = native(tail);
    expect(input.playerView.run).toBeUndefined();
    expect(input.playerView.trace?.phase).toBe("trace_success_program_trash");
    expect(
      input.legalActions.map(
        ({ actionId, expiresAtStateVersion, choiceRequirements }) => ({
          actionId,
          expiresAtStateVersion,
          choiceRequirements,
        }),
      ),
    ).toEqual(
      getLegalActions(state, "corp").map(
        ({ actionId, expiresAtStateVersion, choiceRequirements }) => ({
          actionId,
          expiresAtStateVersion,
          choiceRequirements,
        }),
      ),
    );
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(decision.actionId).toBe("corp.resolve_choice");
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.lane).toBe("plan");
    expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
    expect(pf.selectedStep?.planInstanceId).toBe(pf.leafExecutorInstanceId);
    expect(pf.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: state.stateVersion,
      planInstanceId: pf.leafExecutorInstanceId,
    });
    const selectedOptionIds = decision.selectedChoices!.selectedOptionIds;
    if (
      !Array.isArray(selectedOptionIds) ||
      selectedOptionIds.length !== 1 ||
      typeof selectedOptionIds[0] !== "string"
    )
      throw Error("Exactly one bound program target required");
    const target = input.playerView.pendingChoice!.options.find(
      (o) => o.id === selectedOptionIds[0],
    )!.value;
    const run = () => {
      const result = applyAction(structuredClone(state), {
        matchId: state.matchId,
        side: "corp",
        actionId: decision.actionId!,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: decision.selectedChoices!,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error("Native trace continuation rejected");
      expect(result.state.run).toBeUndefined();
      expect(result.state.trace).toBeUndefined();
      expect(result.state.pendingChoice).toBeUndefined();
      expect(result.state.runner.heap).toContain(target);
      expect(result.state.runner.rig.programs).not.toContain(target);
      return hashGameState(result.state);
    };
    expect(run()).toBe(run());
  },
);

it.each([
  "missing_trace",
  "trace_phase",
  "trace_id",
  "trace_source",
  "trace_definition",
  "choice_origin",
  "source_quote",
  "subroutine",
  "choice_state",
  "action_state",
  "option_binding",
])("rejects corrupted native Trace facts: %s", (kind) => {
  const { input } = native("05");
  const trace = input.playerView.trace!;
  const choice = input.playerView.pendingChoice!;
  const source = input.playerView.servers
    .flatMap((s) => s.ice)
    .find((c) => c.instanceId === trace.sourceCardInstanceId)!;
  if (kind === "missing_trace") delete input.playerView.trace;
  if (kind === "trace_phase") trace.phase = "runner_bid";
  if (kind === "trace_id") trace.traceId += "_wrong";
  if (kind === "trace_source") trace.sourceCardInstanceId += "_wrong";
  if (kind === "trace_definition") trace.sourceDefinitionId += "_wrong";
  if (kind === "choice_origin")
    choice.source = choice.source.replace(/:trace_success$/, ":encounter");
  if (kind === "source_quote") delete source.effectiveRunQuote;
  if (kind === "subroutine")
    source.effectiveRunQuote!.subroutines[0]!.id += "_wrong";
  if (kind === "choice_state") choice.stateVersion--;
  if (kind === "action_state") input.legalActions[0]!.expiresAtStateVersion--;
  if (kind === "option_binding")
    input.legalActions[0]!.choiceRequirements![0]!.optionIds[0] = "card_wrong";
  expect(() => chooseAiAction(input)).toThrow(PlanResolutionFailure);
});
it.each(["executor", "state", "origin", "target"])(
  "rejects a damaged bound program-trash resolution: %s",
  (kind) => {
    const { input } = native("05");
    const decision = chooseAiAction(input);
    const portfolio = structuredClone(residentPlanPortfolioSnapshot(input)!);
    const executor = portfolio.instances.find(
      (i) => i.instanceId === portfolio.executorInstanceId,
    )!;
    const state = executor.moduleState as {
      signals: CorpGenericDefenseSignal[];
    };
    const resolution = state.signals.find(
      (s) => s.choiceResolution?.kind === "program_trash",
    )!.choiceResolution!;
    if (resolution.kind !== "program_trash")
      throw Error("Defense program target required");
    if (kind === "executor") portfolio.executorInstanceId = "missing_executor";
    if (kind === "state") resolution.sourceStateVersion--;
    if (kind === "origin")
      resolution.origin = { kind: "encounter", runId: "run_92" };
    if (kind === "target") resolution.targetCardInstanceId = "missing_program";
    const choice = input.playerView.pendingChoice!;
    expect(() =>
      selectedCorpProgramTrashChoiceOptionIds(
        input,
        input.legalActions[0]!,
        choice,
        choice.options,
        portfolio,
      ),
    ).toThrow(PlanResolutionFailure);
    expect(decision.selectedChoices!.selectedOptionIds).toHaveLength(1);
  },
);
it("payload resolution preserves the owner-selected program without reranking", () => {
  const { input } = native("05");
  const decision = chooseAiAction(input);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const choice = input.playerView.pendingChoice!;
  input.playerView.opponent.rig!.forEach((card) => {
    card.counters = { power: 999 };
  });
  expect(
    selectedCorpProgramTrashChoiceOptionIds(
      input,
      input.legalActions[0]!,
      choice,
      choice.options,
      portfolio,
    ),
  ).toEqual(decision.selectedChoices!.selectedOptionIds);
});
