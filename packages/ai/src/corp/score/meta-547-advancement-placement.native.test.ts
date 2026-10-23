import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { chooseAiAction } from '../../ai-runtime-public-entrypoints';
import { buildAiDecisionInputDto } from '../../input-dto';
import type { AiDecisionInputWithDeckCapabilities } from '../../runtime/ai-decision-input';
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from '../../evaluation/decision-checkpoints/runtime-checkpoint';
import { resetResidentPlanPortfolioMemory, residentPlanPortfolioSnapshot } from '../../plans/resident-plan-portfolio-memory';
function fixture(decision:number) {
  const saved=JSON.parse(readFileSync(new URL('../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-547-r1-g12-d'+decision+'.json',import.meta.url),'utf8')) as {input:AiDecisionInputWithDeckCapabilities;runtime:AiRuntimeCheckpointV1;validation:Record<string,boolean>};
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  return {input:{...saved.input,...buildAiDecisionInputDto(saved.input)},runtime:saved.runtime};
}
afterEach(resetResidentPlanPortfolioMemory);
describe('exact advancement placement from the chosen score parent',()=>{
  it('binds both counters to the planned Babylon before the distribution choice',()=>{
    const before=fixture(175);
    restoreAiRuntimeCheckpoint(before.input,before.input.ownDeckSnapshot!.deckSnapshotId,before.runtime);
    const first=chooseAiAction(before.input);
    expect(first).toMatchObject({actionId:'corp.play_operation.corp_onr_v1_304_systematic-layoffs_1.corp_onr_v1_304_systematic-layoffs_1',fallbackUsed:false});
    const portfolio=residentPlanPortfolioSnapshot(before.input)!;
    const executor=portfolio.instances.find(i=>i.instanceId===portfolio.executorInstanceId)!;
    expect(executor.moduleState).toMatchObject({choiceContinuation:{targetCardId:'corp_onr_v1_214_project-babylon_2',placements:[{targetCardId:'corp_onr_v1_214_project-babylon_2',amount:2}]}});
    const choice=fixture(176).input;
    const result=chooseAiAction(choice);
    expect(result).toMatchObject({actionId:'corp.resolve_choice',fallbackUsed:false,timeoutUsed:false,selectedChoices:{choiceId:'p3_34_advancement_distribution_175',selectedOptionIds:['placement_corp_onr_v1_214_project-babylon_2_2']}});
  });
  it('fails closed when an otherwise exact choice origin omits its allocation',()=>{
    const saved=fixture(176);
    restoreAiRuntimeCheckpoint(saved.input,saved.input.ownDeckSnapshot!.deckSnapshotId,saved.runtime);
    expect(()=>chooseAiAction(saved.input)).toThrow(/window_origin_missing/);
  });
});
