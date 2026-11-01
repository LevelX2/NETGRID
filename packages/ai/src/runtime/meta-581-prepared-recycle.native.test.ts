import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { applyAction, getLegalActions, getPlayerView, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory, restoreResidentPlanPortfolioMemorySnapshot, residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import type { CorpScoreProjectSignal } from "../plans/corp-score-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
const cases = [[6,382],[18,382],[31,380],[32,297]] as const;
function fixture(g: number, d: number) {
  const f = JSON.parse(readFileSync(new URL("./test-fixtures/meta581-r2-g"+g+"-d"+d+".json",import.meta.url),"utf8"));
  expect(Object.values(f.checkpoint.validation)).toEqual(Array(9).fill(true));
  expect(f.provenance.checkedStates).toBe(d);
  expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
  return f;
}
function decide(f: ReturnType<typeof fixture>) {
  const input = f.checkpoint.input as AiDecisionInputWithDeckCapabilities;
  resetResidentPlanPortfolioMemory();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(input,input.ownDeckSnapshot!.deckSnapshotId,f.checkpoint.runtime);
  restoreResidentPlanPortfolioMemorySnapshot(input,f.checkpoint.runtime.residentPlanPortfolio);
  const before = JSON.stringify([input.playerView,input.legalActions]);
  const result = chooseAiAction(input);
  expect(result.fallbackUsed || result.timeoutUsed).toBe(false);
  expect(input.legalActions.some(a=>a.actionId===result.actionId)).toBe(true);
  expect(JSON.stringify([input.playerView,input.legalActions])).toBe(before);
  return { input, result, projects: residentPlanPortfolioSnapshot(input)!.instances.map(p=>(p.moduleState as {signal?:CorpScoreProjectSignal}).signal).filter((p):p is CorpScoreProjectSignal=>!!p?.projectId) };
}
it.each(cases)("G%i D%i progresses the native certified recycling agenda before a nonwinning sibling",(g,d)=>{
  const f=fixture(g,d), {input,result,projects}=decide(f);
  const target=input.playerView.servers.find(s=>s.id==="remote_1")!.root.find(c=>c.type==="agenda")!;
  const action=input.legalActions.find(a=>a.actionId===result.actionId)!;
  expect(action.type).toBe("advance_card");
  expect(action.source).toBe(target.instanceId);
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe("plan:corp.score_agenda:"+encodeURIComponent("agenda:"+target.instanceId+":remote_1"));
  expect(projects.some(p=>p.routeAssessment==="corp_resident_score_parent_dominates_sibling_route" && !p.feasible)).toBe(true);
  expect(getLegalActions(f.state,"corp").map(a=>a.actionId).sort()).toEqual(input.legalActions.map(a=>a.actionId).sort());
  if(!result.actionId)throw Error("concrete native action required");
  const next=applyAction(f.state as GameState,{matchId:f.state.matchId,side:"corp",actionId:result.actionId,clientKnownStateVersion:f.state.stateVersion});
  if(!next.ok)throw Error(next.error.message);
  const view=getPlayerView(next.state,"corp");
  expect(view.own.clicks).toBe(input.playerView.own.clicks-1);
  expect(view.own.credits).toBe(input.playerView.own.credits-1);
  expect(view.servers.find(s=>s.id==="remote_1")!.root.find(c=>c.instanceId===target.instanceId)!.advancementCounters).toBe(1);
  expect(view.servers.filter(s=>s.id.startsWith("remote_")).length).toBe(input.playerView.servers.filter(s=>s.id.startsWith("remote_")).length);
});
it.each(["stale","incomplete","unfundable","no_recycling_agenda","healthy_deck"] as const)("does not claim prepared recycling dominance with %s evidence", variant=>{
  const f=fixture(6,382),input=f.checkpoint.input as AiDecisionInputWithDeckCapabilities;
  const agenda=input.playerView.servers.find(s=>s.id==="remote_1")!.root.find(c=>c.type==="agenda")!;
  const quote=agenda.scoreContinuationQuote!;
  if(!quote.complete)throw Error("native complete quote required");
  if(variant==="stale")quote.expiresAtStateVersion--;
  if(variant==="incomplete")agenda.scoreContinuationQuote={context:quote.context,agendaCardId:quote.agendaCardId,serverId:quote.serverId,expiresAtStateVersion:quote.expiresAtStateVersion,complete:false,reason:"not_completable_next_corp_turn"};
  if(variant==="unfundable")quote.creditsRequiredBeforeNextCorpTurn=input.playerView.own.credits+input.playerView.own.clicks+1;
  if(variant==="no_recycling_agenda")agenda.definitionId="onr_v1_203_hostile-takeover";
  if(variant==="healthy_deck")input.playerView.own.stackOrRdCount=7;
  const {projects}=decide(f);
  const current=projects.filter(p=>p.agendaInstanceId==="corp_onr_v1_194_corporate-downsizing_3" && p.phase==="install_agenda");
  expect(current.length).toBeGreaterThan(0);
  expect(current.some(p=>p.routeAssessment==="corp_resident_score_parent_dominates_sibling_route")).toBe(false);
});
it("keeps a separately admitted winning new agenda available over a nonterminal recycling continuation",()=>{
  const f=fixture(6,382),input=f.checkpoint.input as AiDecisionInputWithDeckCapabilities;
  input.playerView.own.agendaPoints=4;
  const {projects}=decide(f);
  const war=projects.filter(p=>p.agendaDefinitionId==="onr_v1_196_corporate-war"&&p.phase==="install_agenda");
  expect(war.some(p=>p.terminalScore&&p.feasible)).toBe(true);
  expect(war.some(p=>p.routeAssessment==="corp_resident_score_parent_dominates_sibling_route")).toBe(false);
});
