import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, getPlayerView, hashGameState } from "@netgrid/engine";
import type { AiDecisionInput, GameState, PlayerAction } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { runnerDefenseHandBufferFacts } from "../../runner/defense-recovery/defense-signals";
import { buildRunnerEconomyPosture, evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerCreditBankSignals } from "../../runner/credit-bank/credit-bank-signals";

function load(key: string, kind = "native") {
  return JSON.parse(readFileSync(new URL(`./fixtures/meta-514-hand-floor/${key}-${kind}.json`, import.meta.url), "utf8"));
}
function native(key: string) {
  const cp = load(key);
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInput = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, cp.input.ownDeckSnapshot.deckSnapshotId, cp.runtime);
  const state = load(key, "engine-state") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  return { cp, input, state };
}
function decide(input: AiDecisionInput) {
  const d = chooseAiAction(input), pf = d.decisionDebug!.planFirstDecision!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  const legal = input.legalActions.find(a => a.actionId === d.actionId)!;
  expect(legal).toBeDefined();
  expect(legal.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  if (pf.leafExecutorInstanceId !== "rules.window_resolution") expect(pf.route).toMatchObject({ actionId: d.actionId, stateVersion: input.playerView.stateVersion, stepId: pf.selectedStep!.stepId, planInstanceId: pf.leafExecutorInstanceId });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  return { d, pf };
}
function apply(state: GameState, side: "runner" | "corp", actionId: string, selectedChoices?: PlayerAction["selectedChoices"]) {
  const r = applyAction(state, { matchId: state.matchId, side, actionId, clientKnownStateVersion: state.stateVersion, ...(selectedChoices ? { selectedChoices } : {}) });
  expect(r.ok).toBe(true);
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function next(state: GameState, cp: ReturnType<typeof load>) {
  return buildAiDecisionInput(state, "runner", { difficulty: cp.input.difficulty, profileId: cp.input.profileId, decisionId: `${state.matchId}:${state.stateVersion}:runner`, actionNumber: state.stateVersion + 1, ownDeckSnapshot: cp.input.ownDeckSnapshot });
}
function endRunner(state: GameState, cp: ReturnType<typeof load>) {
  for (let i = 0; getLegalActions(state, "runner").length > 0 && i < 4; i++) {
    const { d } = decide(next(state, cp));
    state = apply(state, "runner", d.actionId!, d.selectedChoices);
  }
  expect(getLegalActions(state, "runner")).toHaveLength(0);
  return state;
}
function operation(state: GameState, source: string) {
  const actions = getLegalActions(state, "corp").filter(a => a.type === "play_operation" && a.source === source);
  expect(actions).toHaveLength(1);
  return apply(state, "corp", actions[0]!.actionId);
}
function traceZero(state: GameState) {
  for (const side of ["corp", "runner"] as const) {
    const ch = getPlayerView(state, side).pendingChoice!;
    expect(ch.options.some(o => o.id === "bid_0")).toBe(true);
    const actions = getLegalActions(state, side);
    expect(actions).toHaveLength(1);
    state = apply(state, side, actions[0]!.actionId, { choiceId: ch.choiceId, selectedOptionIds: ["bid_0"] });
  }
  return state;
}
afterEach(resetResidentPlanPortfolioMemory);

it("rejects G9/D18 last-action bank installation at the existing four-card hand floor", () => {
  const { input } = native("g9d18"), { d, pf } = decide(input);
  expect(d.actionId).toBe("runner.draw_card");
  expect(pf.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  expect(pf.dispositions).toEqual(expect.arrayContaining([expect.objectContaining({ ownerModuleId: "runner.credit_bank", evidenceCode: "runner_credit_bank_last_action_install_hand_floor" })]));
});
it("rejects G27/D109 optional installation while retaining the bank's legal build route", () => {
  const { input } = native("g27d109"), { d, pf } = decide(input);
  expect(d.actionId).toContain("runner_main_add_three_hosted_credits");
  expect(pf.selectedPlan?.moduleId).toBe("runner.credit_bank");
  expect(pf.dispositions).toEqual(expect.arrayContaining([expect.objectContaining({ actionId: "runner.install_card.runner_onr_v1_177_the-short-circuit_2.runner_onr_v1_177_the-short-circuit_2", ownerModuleId: "runner.develop_board_and_hand", disposition: "explicitly_nonproductive" })]));
});
it("retains G34/D307 development with a genuine spare hand and followup action", () => {
  const { input } = native("g34d307"), { d, pf } = decide(input);
  expect(d.actionId).toBe("runner.install_card.runner_onr_v1_177_the-short-circuit_1.runner_onr_v1_177_the-short-circuit_1");
  expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
});
it("keeps safe last-action development after an actual native G34 credit action", () => {
  const { cp, state } = native("g34d307"), afterGain = apply(state, "runner", "runner.gain_credit"), input = next(afterGain, cp), { d, pf } = decide(input);
  expect(input.playerView.own.clicks).toBe(1);
  expect(input.playerView.own.gripOrHq).toHaveLength(8);
  expect(d.actionId).toBe("runner.install_card.runner_onr_v1_177_the-short-circuit_1.runner_onr_v1_177_the-short-circuit_1");
  expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
  expect(apply(afterGain, "runner", d.actionId!).runner.grip).toHaveLength(7);
});
it("admits the real G9/D16 bank after Draw when installation preserves the four-card floor", () => {
  const { cp, state } = native("g9d16"), afterDraw = apply(state, "runner", "runner.draw_card"), input = next(afterDraw, cp), targets = evaluateRunnerRunTargets({ input }), facts = runnerDefenseHandBufferFacts(input, targets);
  const candidates = buildActionSemanticCandidates({ legalActions: input.legalActions, observerSide: "runner", stateVersion: input.playerView.stateVersion, projectionMode: "basic_semantics", visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(input.playerView), cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId() });
  const unrelated = () => { throw Error("An in-hand bank installation must not request unrelated funding"); };
  const signals = runnerCreditBankSignals(input, candidates, input.ownDeckCapabilities!, buildRunnerEconomyPosture({ input }), targets, [], facts.minimumHandBuffer, { hasExactRunUrgency: unrelated, requiredPostRunReserve: unrelated, terminalVisibleHazardFundingGap: unrelated, isDirectlyMandatoryRun: unrelated, terminalKnownPathFundingGap: unrelated, quoteRunAfterCashout: unrelated, quoteRunAfterCashoutRoute: unrelated, developmentFundingRoute: unrelated });
  expect(facts.minimumHandBuffer).toBe(4);
  const id = "runner.install_card.runner_onr_proteus_150_streetware-distributor_1.runner_onr_proteus_150_streetware-distributor_1";
  expect(signals).toEqual(expect.arrayContaining([expect.objectContaining({ phase: "install", actionIds: expect.arrayContaining([id]) })]));
  const installed = apply(afterDraw, "runner", id);
  expect(installed.runner.grip).toHaveLength(4);
  expect(installed.runner.clicks).toBe(0);
});
it.each(["g9d18", "g27d109"])("executes %s's actual changed AI route and survives the original legal Manhunt/Scorched continuation", key => {
  const { cp, input, state: original } = native(key), first = decide(input);
  let state = endRunner(apply(original, "runner", first.d.actionId!, first.d.selectedChoices), cp);
  expect(state.runner.grip).toHaveLength(4);
  state = apply(state, "corp", "corp.mandatory_draw");
  if (key === "g9d18") state = apply(state, "corp", "corp.gain_credit");
  else state = operation(state, "corp_onr_v1_290_efficiency-experts_3");
  state = traceZero(operation(state, key === "g9d18" ? "corp_onr_proteus_050_manhunt_1" : "corp_onr_proteus_050_manhunt_2"));
  state = operation(state, key === "g9d18" ? "corp_onr_v1_302_scorched-earth_1" : "corp_onr_v1_302_scorched-earth_3");
  expect(state.runner.grip).toHaveLength(0);
  expect(state.winner).toBeNull();
});
