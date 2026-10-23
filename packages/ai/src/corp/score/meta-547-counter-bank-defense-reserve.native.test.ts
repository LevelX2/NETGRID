import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { chooseAiAction } from '../../ai-runtime-public-entrypoints';
import { buildAiDecisionInputDto } from '../../input-dto';
import type { AiDecisionInputWithDeckCapabilities } from '../../runtime/ai-decision-input';
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from '../../evaluation/decision-checkpoints/runtime-checkpoint';
import { resetResidentPlanPortfolioMemory } from '../../plans/resident-plan-portfolio-memory';
function fixture(game: number, decision: number) {
  const saved = JSON.parse(readFileSync(new URL('../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-547-r1-g' + game + '-d' + decision + '.json', import.meta.url), 'utf8')) as {input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1; validation: Record<string,boolean>};
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const input = {...saved.input, ...buildAiDecisionInputDto(saved.input)};
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, saved.runtime);
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
describe('counter-bank preparation preserves current Defense funding', () => {
  it.each([
    [265, 'corp.advance_card.corp_onr_v1_347_vapor-ops_1.corp_onr_v1_347_vapor-ops_1', 'advance_counter_bank'],
    [275, 'corp.install_card.corp_onr_v1_194_corporate-downsizing_1.new_remote.corp_onr_v1_194_corporate-downsizing_1', 'install_agenda_from_counter_bank'],
  ])('preserves the actual funded bank/score head D%s', (decision, expectedAction, phase) => {
    const input=fixture(1, decision), result=chooseAiAction(input);
    expect(result).toMatchObject({actionId:expectedAction,fallbackUsed:false,timeoutUsed:false,decisionDebug:{planFirstDecision:{selectedPlan:{phase},route:{stateVersion:input.playerView.stateVersion,actionId:expectedAction}}}});
  });
  it('keeps the exact immediate payout for the terminal central rez reserve', () => {
    const input = fixture(5, 315), result = chooseAiAction(input);
    expect(result).toMatchObject({fallbackUsed:false, timeoutUsed:false, decisionDebug:{planFirstDecision:{rootPlanInstanceId:'plan:corp.defend_servers:server-defense-portfolio', route:{stateVersion:314, actionId:result.actionId, semanticActionType:'economy.gain_credit'}}}});
    expect(input.legalActions.find(a=>a.actionId===result.actionId)).toMatchObject({type:'activated_card_ability',source:'corp_onr_v1_347_vapor-ops_2',payload:{cardImplementationAdvancementCounterCost:1,gainCreditsAmount:1}});
  });
  it('does not immediately spend the funded fifth credit buying the same counter back', () => {
    const input = fixture(5, 316), result = chooseAiAction(input);
    expect(result).toMatchObject({fallbackUsed:false, timeoutUsed:false, decisionDebug:{planFirstDecision:{route:{stateVersion:315,actionId:result.actionId}}}});
    expect(result.actionId).not.toBe('corp.advance_card.corp_onr_v1_347_vapor-ops_2.corp_onr_v1_347_vapor-ops_2');
    expect(input.legalActions.find(a=>a.actionId===result.actionId)).toMatchObject({type:'install_card', source:'corp_onr_v1_194_corporate-downsizing_1', payload:{serverId:'remote_1'}});
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({rootPlanInstanceId:'plan:corp.score_agenda:agenda%3Acorp_onr_v1_194_corporate-downsizing_1%3Aremote_1',route:{semanticActionType:'install.card'}});
  });
});
