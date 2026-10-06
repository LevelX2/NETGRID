import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, getPlayerView, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function load(key: string) {
  return JSON.parse(readFileSync(new URL(`./fixtures/meta-ten-repairs/510-${key}.json`, import.meta.url), "utf8"));
}
function native(key: string) {
  const cp = load(key);
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot.deckSnapshotId, cp.runtime);
  return { cp, input };
}
function assertOwnedDecision(key: string, owner: string) {
  const { cp, input } = native(key);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.selectedPlan?.moduleId).toBe(owner);
  expect(pf.lane).toBe("plan");
  expect(pf.stateVersion).toBe(cp.stateVersion);
  expect(pf.rootPlanInstanceId).toBe(pf.leafExecutorInstanceId);
  expect(pf.selectedStep?.planInstanceId).toBe(pf.leafExecutorInstanceId);
  expect(pf.route).toMatchObject({ actionId: decision.actionId, stateVersion: cp.stateVersion, stepId: pf.selectedStep!.stepId, planInstanceId: pf.leafExecutorInstanceId });
  expect(input.legalActions.find((a: { actionId: string }) => a.actionId === decision.actionId)?.expiresAtStateVersion).toBe(cp.stateVersion);
  return { cp, input, decision };
}
afterEach(resetResidentPlanPortfolioMemory);

it.each(["g13d70", "g22d65", "g29d120", "g38d80"])("binds the actual still-rezzed Trace continuation at %s", (key) => {
  const { cp, input, decision } = assertOwnedDecision(key, "corp.defend_servers");
  expect(input.playerView.run).toBeUndefined();
  const source = input.playerView.servers.flatMap((s: { ice: any[] }) => s.ice).find((c: { instanceId: string; effectiveRunQuote?: unknown }) => c.effectiveRunQuote && input.playerView.pendingChoice.source.includes(c.instanceId))!;
  expect(source.rezzed).toBe(true);
  expect(source.effectivePostRezRunQuote).toBeUndefined();
  expect(decision.actionId).toBe("corp.resolve_choice");
  expect(decision.selectedChoices).toEqual({ choiceId: input.playerView.pendingChoice.choiceId, selectedOptionIds: input.playerView.pendingChoice.options.map((o: { id: string }) => o.id) });
  expect(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe("plan:corp.defend_servers:server-defense-portfolio");
  const before = load(key + "-engine") as GameState;
  expect(hashGameState(before)).toBe(cp.stateHash);
  const run = () => {
    expect(decision.selectedChoices).toBeDefined();
    const result = applyAction(structuredClone(before), { matchId: before.matchId, side: "corp", actionId: decision.actionId!, clientKnownStateVersion: before.stateVersion, selectedChoices: decision.selectedChoices! });
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("Bound Engine choice rejected");
    expect(result.state.pendingChoice).toBeUndefined();
    expect(result.state.run).toBeUndefined();
    expect(result.state.runner.grip.length).toBe(before.runner.grip.length - 2);
    const hardware = input.playerView.pendingChoice.options[0].value;
    expect(result.state.runner.rig.hardware).not.toContain(hardware);
    expect(result.state.runner.heap).toContain(hardware);
    return hashGameState(result.state);
  };
  expect(run()).toBe(run());
});

it.each(["missing", "source", "definition", "effect", "amount", "subroutine", "unknown_rez", "event", "choice_state", "action_state", "option_binding", "cost"])("rejects corrupt current rezzed-source facts without quote substitution: %s", (kind) => {
  const { input } = native("g13d70");
  const choice = input.playerView.pendingChoice;
  const source = input.playerView.servers.flatMap((s: { ice: any[] }) => s.ice).find((c: { instanceId: string }) => choice.source.includes(c.instanceId))!;
  const current = source.effectiveRunQuote;
  // Even a complete hypothetical quote is not authority for an actually rezzed source.
  const derezzed = load("temporary-derez").input.playerView.servers.flatMap((s: { ice: any[] }) => s.ice).find((c: { instanceId: string }) => c.instanceId === "corp_onr_v1_228_cinderella_1");
  const hypothetical = structuredClone(derezzed.effectivePostRezRunQuote);
  hypothetical.cardId = source.instanceId;
  hypothetical.targetServerId = "rd";
  hypothetical.projectedServerId = "rd";
  hypothetical.expiresAtStateVersion = input.playerView.stateVersion;
  hypothetical.effectiveRunQuote = structuredClone(current);
  source.effectivePostRezRunQuote = hypothetical;
  if (kind === "missing") delete source.effectiveRunQuote;
  if (kind === "source") current.iceInstanceId = "absent-source";
  if (kind === "definition") current.iceDefinitionId = "absent-definition";
  if (kind === "effect") current.subroutines[0].traceSuccessEffect = { type: "none" };
  if (kind === "amount") current.subroutines[0].traceSuccessEffect.amount = 0;
  if (kind === "subroutine") choice.source = choice.source.replace(".0.trace", ".9.trace");
  if (kind === "unknown_rez") delete source.rezzed;
  if (kind === "event") input.eventTail.at(-1).publicPayload.traceStep = "corp_bid";
  if (kind === "choice_state") choice.stateVersion--;
  if (kind === "action_state") input.legalActions[0].expiresAtStateVersion--;
  if (kind === "option_binding") input.legalActions[0].choiceRequirements[0].optionIds[0] = "absent-option";
  if (kind === "cost") delete input.playerView.opponent.rig.find((c: { type: string }) => c.type === "hardware").installCost;
  expect(() => chooseAiAction(input)).toThrow(PlanResolutionFailure);
});

it("removes imaginary protection and selects the existing funded advance at g7d343", () => {
  const key = "g7d343";
  const { cp, decision } = assertOwnedDecision(key, "corp.score_agenda");
  const before = load(key + "-before").decision;
  expect(before.decisionDebug.planFirstDecision.selectedPlan.moduleId).toBe("corp.score_agenda");
  expect(decision.actionId).not.toBe(before.actionId);
  expect(decision.actionId).toMatch(/^corp\.advance_card\./);
  const state = load(key + "-engine") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  expect(getLegalActions(state, "corp").some(a => a.actionId === decision.actionId)).toBe(true);
  const applied = applyAction(state, { matchId: state.matchId, side: "corp", actionId: decision.actionId!, clientKnownStateVersion: state.stateVersion });
  expect(applied.ok).toBe(true);
});

it("preserves the separately owned deckout-flood action at g11d307", () => {
  const { decision } = assertOwnedDecision("g11d307", "corp.score_agenda");
  expect(decision.actionId).toBe(load("g11d307-before").decision.actionId);
  expect(decision.evidence).toContain("plan_assessment_evidence:corp_deckout_agenda_flood_score_install:new_remote");
  expect(decision.decisionDebug!.planFirstDecision!.turnPlanning!.agendaComparison!.lines).toEqual([
    expect.objectContaining({ family: "pure_rush", defense: 0, expectedValue: 35 }),
  ]);
});

it("keeps a genuinely funded same-turn advancement and score project", () => {
  const { decision } = assertOwnedDecision("g30d334", "corp.score_agenda");
  expect(decision.actionId).toBe(load("g30d334-before").decision.actionId);
  expect(decision.actionId).toMatch(/^corp\.advance_card\./);
  let state = load("g30d334-engine") as GameState;
  for (const row of load("funded-score-finite-control").rows) {
    expect(hashGameState(state)).toBe(row.beforeHash);
    expect(row.targets).toBeUndefined();
    const result = applyAction(state, { matchId: state.matchId, side: row.side, actionId: row.actionId, clientKnownStateVersion: state.stateVersion, ...(row.selectedChoices ? { selectedChoices: row.selectedChoices } : {}) });
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("Funded score continuation rejected");
    state = result.state;
    expect(hashGameState(state)).toBe(row.afterHash);
  }
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(6);
  expect(state.corp.credits).toBe(0);
  expect(state.winner).toBeNull();
});

it.each(["flood-second-agenda-finite-control", "flood-second-agenda-advance-control"])("replays the finite legal held-agenda control %s without inventing a whole winner", (key) => {
  let state = load("g7d343-engine") as GameState;
  for (const row of load(key).steps) {
    expect(hashGameState(state)).toBe(row.before.hash);
    expect(row.targets).toBeUndefined();
    const result = applyAction(state, { matchId: state.matchId, side: row.side, actionId: row.actionId, clientKnownStateVersion: state.stateVersion, ...(row.selectedChoices ? { selectedChoices: row.selectedChoices } : {}) });
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error("Finite original control rejected");
    state = result.state;
    expect(hashGameState(state)).toBe(row.after.hash);
  }
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(6);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(0);
  expect(state.corp.hq).toContain("corp_onr_v1_191_black-ice-quality-assurance_2");
  expect(state.corp.servers.some(s => s.id === "remote_2")).toBe(false);
  expect(state.winner).toBeNull();
});
