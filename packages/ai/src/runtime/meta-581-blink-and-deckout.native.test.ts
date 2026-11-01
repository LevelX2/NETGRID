import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { createRunnerRandomBreakOrDamageEncounterContext } from "./runner-blink-encounter-break-context";
import {
  buildRandomBreakOrDamageRiskAssessment,
  randomBreakOrDamageRiskProfileForDefinitionId,
  randomBreakOrDamageRiskShouldAvoidRun,
} from "../actions/risk-action-projection";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";
import { currentEncounteredIceCard } from "./current-encounter";
import { isImmediateSafetyThreatSubroutine } from "./encounter-subroutine";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(g: number, d: number) {
  const f = JSON.parse(
    readFileSync(
      new URL(`./test-fixtures/meta581-g${g}-d${d}.json`, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.checkpoint.validation)).toEqual(Array(9).fill(true));
  expect(f.provenance.checkedStates).toBe(d);
  expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
  return f;
}
function inputFor(f: ReturnType<typeof fixture>) {
  const cp = f.checkpoint;
  const original = cp.input as AiDecisionInputWithDeckCapabilities;
  const actions = getLegalActions(f.state, cp.actor);
  expect(actions.map((a) => a.actionId).sort()).toEqual(
    original.legalActions.map((a) => a.actionId).sort(),
  );
  for (const action of original.legalActions) {
    const current = actions.find((a) => a.actionId === action.actionId)!;
    expect(current.costs).toEqual(action.costs);
    if (current.payload?.breakSubroutinePurpose)
      action.payload = {
        ...action.payload,
        breakSubroutinePurpose: current.payload.breakSubroutinePurpose,
      };
  }
  return {
    ...original,
    ...buildAiDecisionInputDto(original),
  } as AiDecisionInputWithDeckCapabilities;
}
function restore(
  f: ReturnType<typeof fixture>,
  input: AiDecisionInputWithDeckCapabilities,
) {
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.checkpoint.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    f.checkpoint.runtime.residentPlanPortfolio,
  );
}
function take(
  state: GameState,
  actionId: string | undefined,
  selectedChoices?: Record<string, unknown>,
) {
  if (!actionId) throw Error("Expected a concrete selected LegalAction ID");
  const r = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}
function risk(input: AiDecisionInputWithDeckCapabilities, action: LegalAction) {
  return createRunnerRandomBreakOrDamageEncounterContext({
    sourceDefinitionIdForAction: () => "onr_v1_007_blink",
    randomBreakOrDamageRiskProfileForDefinitionId,
    breakSubroutineIndexesForAction,
    encounteredSubroutines: (i) =>
      currentEncounteredIceCard(i)?.effectiveRunQuote?.subroutines ?? [],
    buildRandomBreakOrDamageRiskAssessment,
    isImmediateSafetyThreatSubroutine,
    isRemoteServerTarget: (s) => s?.startsWith("remote_") ?? false,
    visibleRootIsKnownAgenda: (c) => c.known && c.type === "agenda",
  }).randomBreakOrDamageRiskAssessmentForEncounterBreak(input, action);
}
it("Engine marks the native Blink zero-Core break without removing it or its meaningful ETR alternative", () => {
  const f = fixture(14, 309),
    before = hashGameState(f.state),
    actions = getLegalActions(f.state, "runner");
  const zero = actions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  const stop = actions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
  )!;
  expect(zero.payload?.breakSubroutinePurpose).toBe(
    "zero_damage_no_secondary_effect",
  );
  expect(stop.payload?.breakSubroutinePurpose).toBeUndefined();
  expect(actions.map((a) => a.actionId).sort()).toEqual(
    f.checkpoint.input.legalActions.map((a: LegalAction) => a.actionId).sort(),
  );
  expect(hashGameState(f.state)).toBe(before);
});
it("normal native run executor tries the ETR instead of risking damage on zero Core", () => {
  const f = fixture(14, 309),
    input = inputFor(f);
  restore(f, input);
  const original = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const d = chooseAiAction(input),
    a = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a.type).toBe("break_subroutine");
  expect(a.payload?.subroutineIndex).toBe(1);
  expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.convert_run_window",
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(original);
  expect(hashGameState(take(f.state, d.actionId))).toBe(
    hashGameState(take(f.state, d.actionId)),
  );
});
it("does not inflate explicit zero Core into extra failed-attempt damage", () => {
  const f = fixture(14, 309),
    input = inputFor(f),
    stop = input.legalActions.find(
      (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
    )!;
  expect(risk(input, stop)?.unbrokenEncounterDamageLikely).toBe(0);
});
it("native three-Core rescue is admitted before guaranteed negative hand limit and preserves its exact owner", () => {
  const f = fixture(22, 196),
    input = inputFor(f);
  restore(f, input);
  const d = chooseAiAction(input),
    a = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a.type).toBe("break_subroutine");
  expect(a.payload?.subroutineIndex).toBe(0);
  expect(risk(input, a)?.certainLossRescue).toBe(true);
  expect(risk(input, a)?.unbrokenEncounterDamageLikely).toBe(3);
  expect(risk(input, a)?.riskSeverity).toBe("high");
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.convert_run_window",
  );
  expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  const forced = take(
    f.state,
    input.legalActions.find((a) => a.type === "continue_run")!.actionId,
  );
  expect(getPlayerView(forced, "runner").own.maxHandSize).toBe(-1);
  const attempted = take(f.state, d.actionId);
  expect(hashGameState(attempted)).toBe(
    hashGameState(take(f.state, d.actionId)),
  );
  expect(attempted.randomCounter).toBeGreaterThan(f.state.randomCounter);
  // Outcome countercases deliberately vary only the Engine seed. They prove a
  // possible rescue, not that the original die roll or full match is won.
  let successes = 0,
    failures = 0;
  for (let i = 0; i < 24; i++) {
    const branch = structuredClone(f.state);
    branch.seed = branch.seed + "-rescue-countercase-" + i;
    const tried = take(branch, d.actionId);
    if (tried.run!.brokenSubroutineIndexes.includes(0)) {
      successes++;
      const ended = take(
        tried,
        getLegalActions(tried, "runner").find((a) => a.type === "continue_run")!
          .actionId,
      );
      expect(ended.runner.coreDamage).toBe(3);
      expect(getPlayerView(ended, "runner").own.maxHandSize).toBe(2);
      expect(ended.run).toBeUndefined();
    } else failures++;
  }
  expect(successes).toBeGreaterThan(0);
  expect(failures).toBeGreaterThan(0);
});
it("keeps the ETR break excluded when it cannot prevent the certain Core loss", () => {
  const f = fixture(22, 196),
    input = inputFor(f),
    a = input.legalActions.find(
      (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
    )!;
  expect(risk(input, a)?.certainLossRescue).toBeUndefined();
  expect(randomBreakOrDamageRiskShouldAvoidRun(risk(input, a))).toBe(true);
});
it("does not waive self-damage protection when declining merely inflicts survivable Core", () => {
  const f = fixture(22, 196);
  f.state.runner.coreDamage = 0;
  const input = inputFor(f);
  input.playerView.own.coreDamage = 0;
  input.playerView.own.maxHandSize = 5;
  const a = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  expect(risk(input, a)?.certainLossRescue).toBeUndefined();
  expect(randomBreakOrDamageRiskShouldAvoidRun(risk(input, a))).toBe(true);
});
it("does not use an encounter survival fact to waive pre-run risk", () => {
  const r = buildRandomBreakOrDamageRiskAssessment({
    currentHandCount: 1,
    handAfterActionCost: 1,
    randomBreakUsesLikely: 1,
    visibleSubroutinesLikely: 1,
    payoffOverride: "survival",
    stableCoverageAvailable: false,
    context: "run_path",
    certainLossRescue: true,
    riskProfile:
      randomBreakOrDamageRiskProfileForDefinitionId("onr_v1_007_blink")!,
  });
  expect(r.certainLossRescue).toBeUndefined();
  expect(randomBreakOrDamageRiskShouldAvoidRun(r)).toBe(true);
});
it("binds the native Downsizing rescue at scoring and consumes exactly that continuation choice", () => {
  const f = fixture(37, 314),
    input = inputFor(f);
  restore(f, input);
  expect(input.playerView.own.stackOrRdCount).toBe(0);
  expect(input.playerView.own.clicks).toBe(0);
  const score = chooseAiAction(input);
  expect(score.actionId).toBe(
    "corp.score_agenda.corp_onr_v1_194_corporate-downsizing_2.corp_onr_v1_194_corporate-downsizing_2",
  );
  expect(score.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.score_agenda",
  );
  const scored = take(f.state, score.actionId);
  expect(hashGameState(scored)).toBe(f.nextCheckpoint.stateHash);
  const next = f.nextCheckpoint.input as AiDecisionInputWithDeckCapabilities;
  next.planningStateIdentity = buildPlanningStateIdentity(next);
  const choice = chooseAiAction(next);
  expect(choice.actionId).toBe("corp.resolve_choice");
  expect(choice.selectedChoices).toEqual({
    choiceId: "scored_agenda_hq_agenda_shuffle_credits_314",
    selectedOptionIds: ["card_corp_onr_v1_196_corporate-war_2"],
  });
  expect(choice.fallbackUsed || choice.timeoutUsed).toBe(false);
  const replenished = take(scored, choice.actionId, choice.selectedChoices);
  expect(getPlayerView(replenished, "corp").own.stackOrRdCount).toBe(1);
  expect(replenished.corp.credits).toBe(11);
  expect(hashGameState(replenished)).toBe(
    hashGameState(take(scored, choice.actionId, choice.selectedChoices)),
  );
});

it("retains the ordinary empty selection when a real R&D card prevents the next-draw loss", () => {
  const f = fixture(37, 314);
  const restoredCard = f.state.corp.archives.shift();
  f.state.corp.rd.push(restoredCard);
  f.state.cardInstances[restoredCard].zone = { side: "corp", zone: "rd" };
  const input = inputFor(f);
  input.playerView = getPlayerView(f.state, "corp");
  restore(f, input);
  const score = chooseAiAction(input);
  expect(score.actionId).toBe(
    "corp.score_agenda.corp_onr_v1_194_corporate-downsizing_2.corp_onr_v1_194_corporate-downsizing_2",
  );
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const binding = portfolio.instances.find(
    (i) =>
      i.moduleId === "corp.score_agenda" && i.executionState === "executor",
  )!.moduleState as {
    choiceContinuation: {
      hqAgendaShuffleChoiceBinding: { selectedCardInstanceIds: string[] };
    };
  };
  expect(
    binding.choiceContinuation.hqAgendaShuffleChoiceBinding
      .selectedCardInstanceIds,
  ).toEqual([]);
});
