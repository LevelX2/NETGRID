import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import { runnerDefenseSupportSignals } from "../../runner/defense-recovery/defense-signals";
import { currentCorpHostedBankCycleQuotes } from "../../corp/economy/hosted-credit-bank-cycle";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Evidence = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
  stateVersion: number;
};

function native(name: string) {
  const checkpoint = JSON.parse(readFileSync(
    new URL(`./fixtures/${name}.json`, import.meta.url), "utf8",
  )) as Evidence;
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const { input, runtime } = checkpoint;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime, {
    preserveLiveCommitment: true,
  });
  if (runtime.residentPlanPortfolio) {
    restoreResidentPlanPortfolioMemorySnapshot(input, runtime.residentPlanPortfolio);
  }
  return input;
}

function decision(input: AiDecisionInputWithDeckCapabilities) {
  const before = JSON.stringify(input);
  const selected = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(selected.fallbackUsed).toBe(false);
  expect(selected.timeoutUsed).toBe(false);
  const action = input.legalActions.find(a => a.actionId === selected.actionId)!;
  expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  return { action, plan: selected.decisionDebug!.planFirstDecision! };
}

function runnerSupport(input: AiDecisionInputWithDeckCapabilities) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions, observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(input.playerView),
    cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
  });
  const hand = evaluateRunnerHandDevelopment({
    input,
    actionCandidates: candidates,
    ...(input.ownDeckCapabilities && { deckCapabilities: input.ownDeckCapabilities }),
    ...(input.ownRunnerStrategicIntent && { strategicIntent: input.ownRunnerStrategicIntent }),
  });
  return runnerDefenseSupportSignals(input, candidates, hand);
}

beforeEach(resetResidentPlanPortfolioMemory);

it("preserves the mandatory draw horizon while funding a winning agenda for the next Corp turn", () => {
  const input = native("meta860-next-turn-score-draw-horizon");
  expect(input.playerView.own).toMatchObject({ credits: 0, clicks: 2, agendaPoints: 6, stackOrRdCount: 3 });
  const nightShift = input.legalActions.find(a => a.payload?.drawCardsAmount === 1 && a.payload?.gainCreditsAmount === 2)!;
  const { action, plan } = decision(input);
  expect(action.actionId).not.toBe(nightShift.actionId);
  expect(plan.dispositions).toContainEqual(expect.objectContaining({
    actionId: nightShift.actionId,
    evidenceCode: "corp_voluntary_draw_blocked_deckout_horizon:remaining_after:2",
  }));
});

it("revalidates the profitable bank cycle that fully funds the HQ ICE installation", () => {
  const input = native("meta863-bank-cycle-full-install-reserve");
  expect(input.playerView.own).toMatchObject({ credits: 8, clicks: 3 });
  expect(currentCorpHostedBankCycleQuotes(input)).toContainEqual(
    expect.objectContaining({ currentCredits: 8, netLiquidCreditGain: 6, totalClickCost: 3 }),
  );
  const { action, plan } = decision(input);
  const defense = plan.portfolio?.find(p => p.moduleId === "corp.defend_servers");
  expect(defense).toBeDefined();
  expect(plan.portfolio).toContainEqual(expect.objectContaining({
    moduleId: "corp.economy",
    parentInstanceId: defense!.instanceId,
    parentNeedId: "install:hq:cc.c2vq.hq.c2vq.0",
    viability: "ready",
    milestone: "admitted",
  }));
  expect(plan.route).toMatchObject({ actionId: action.actionId, stateVersion: 129 });
});

it("clears the only tag before a last-click install that only increases the hand limit", () => {
  const input = native("meta862-last-click-capacity-or-tag");
  expect(input.playerView.own).toMatchObject({ tags: 1, clicks: 1, credits: 5, maxHandSize: 5 });
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  const { action, plan } = decision(input);
  expect(action.type).toBe("remove_tag");
  expect(plan.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
});

it("retains proactive hand capacity when there is time to refill or the basic action cannot clear all tags", () => {
  const input = native("meta862-last-click-capacity-or-tag");
  const chip = input.legalActions.find(a => a.source === input.playerView.own.gripOrHq.find(c => c.title === "Militech MRAM Chip")!.instanceId)!;
  input.playerView.own.clicks = 2;
  expect(runnerSupport(input).defenseSupportInstallActionIds).toContain(chip.actionId);
  input.playerView.own.clicks = 1;
  input.playerView.own.tags = 2;
  expect(runnerSupport(input).defenseSupportInstallActionIds).toContain(chip.actionId);
});
