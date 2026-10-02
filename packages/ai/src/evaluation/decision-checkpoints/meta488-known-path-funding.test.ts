import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {beforeEach,expect,it} from "vitest";
import {buildAiDecisionInputDto} from "../../input-dto";
import {buildDeckCapabilityProfileFromInput} from "../../deck-capabilities";
import {buildActionSemanticCandidates} from "../../action-semantic-candidate";
import {evaluateRunnerRunTargets} from "../../runner-run-target-evaluation";
import {buildRunnerEconomyPosture} from "../../runner-economy-posture";
import {runnerRunFundingSupport} from "../../run-analysis/runner-plan-run-funding";
import {chooseAiAction} from "../../ai-runtime-public-entrypoints";
import type {AiDecisionInputWithDeckCapabilities} from "../../runtime/ai-decision-input";
import {resetResidentPlanPortfolioMemory} from "../../plans/resident-plan-portfolio-memory";
import {restoreAiRuntimeCheckpoint,type AiRuntimeCheckpointV1} from "./runtime-checkpoint";

function capture(credits?:number){
  const f=JSON.parse(readFileSync(new URL("../../../../../data/scenarios/ai-decision-checkpoints/cp-meta488-control-g11-known-prefix.json",import.meta.url),"utf8")) as {input:AiDecisionInputWithDeckCapabilities;runtime:AiRuntimeCheckpointV1;validation:Record<string,boolean>};
  const input={...f.input,...buildAiDecisionInputDto(f.input)};
  if(credits!==undefined) input.playerView.own.credits=credits;
  return {...f,input};
}
function facts(input:AiDecisionInputWithDeckCapabilities){
  const deckCapabilities=buildDeckCapabilityProfileFromInput(input);
  const candidates=buildActionSemanticCandidates({legalActions:input.legalActions,observerSide:"runner",stateVersion:input.playerView.stateVersion});
  const targets=evaluateRunnerRunTargets({input,deckCapabilities});
  const target=targets.find(t=>t.actionId==="runner.start_run.remote_1")!;
  const economy=buildRunnerEconomyPosture({input,deckCapabilities});
  return {target,support:runnerRunFundingSupport(input,economy,target,targets,candidates)};
}
function hash(input:AiDecisionInputWithDeckCapabilities){
  return createHash("sha256").update(JSON.stringify({playerView:input.playerView,legalActions:input.legalActions,eventTail:input.eventTail})).digest("hex");
}
beforeEach(resetResidentPlanPortfolioMemory);

it("rejects the native one-credit prefix as a complete terminal funding route",()=>{
  const {input,runtime,validation}=capture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  const before=hash(input),{target,support}=facts(input);
  expect(target.routeQuote).toMatchObject({knownCost:9,fundingGap:1,reachability:"no_access"});
  expect(support?.routeActionIds).toEqual([]);
  expect(support?.routeAssessment.status).toBe("uncovered");
  expect(support!.routeAssessment.evidenceCodes).toContain("runner_funding_complete_known_path_uncovered");
  restoreAiRuntimeCheckpoint(input,input.ownDeckSnapshot!.deckSnapshotId,runtime);
  const result=chooseAiAction(input);
  expect(input.legalActions.some(a=>a.actionId===result.actionId)).toBe(true);
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).not.toBe("plan:runner.contest_remote:remote%3Aremote_1");
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({actionId:result.actionId,stateVersion:input.playerView.stateVersion});
  expect(hash(input)).toBe(before);
});

it.each([12,15])("rejects another affordable prefix with %i starting credits",credits=>{
  const {input}=capture(credits),{support}=facts(input);
  expect(support?.routeActionIds).toEqual([]);
  expect(support?.routeAssessment.status).toBe("uncovered");
});

it("retains the existing terminal parent when three native credits fund the whole nineteen-credit path",()=>{
  const {input,runtime}=capture(16),{target,support}=facts(input);
  expect(target.routeQuote).toMatchObject({knownCost:19,fundingGap:3,reachability:"no_access"});
  expect(support).toMatchObject({parentPlanInstanceId:"plan:runner.contest_remote:remote%3Aremote_1",routeActionIds:["runner.gain_credit"],routeAssessment:{status:"covered_guaranteed",totalClickCost:3}});
  expect(support!.routeAssessment.evidenceCodes).toContain("runner_funding_complete_known_path_required");
  restoreAiRuntimeCheckpoint(input,input.ownDeckSnapshot!.deckSnapshotId,runtime);
  const result=chooseAiAction(input);
  expect(result.actionId).toBe("runner.gain_credit");
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe("plan:runner.contest_remote:remote%3Aremote_1");
});

it("requires the run's current state-version binding even when its full budget fits",()=>{
  const {input}=capture(16);
  input.legalActions.find(a=>a.actionId==="runner.start_run.remote_1")!.expiresAtStateVersion--;
  expect(facts(input).support?.routeActionIds).toEqual([]);
});

it("requires every quoted funding action's current state-version binding",()=>{
  const {input}=capture(16);
  input.legalActions.find(a=>a.actionId==="runner.gain_credit")!.expiresAtStateVersion--;
  expect(facts(input).support?.routeActionIds).toEqual([]);
});
