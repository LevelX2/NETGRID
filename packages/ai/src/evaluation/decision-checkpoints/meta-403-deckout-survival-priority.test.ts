import { describe, expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-last-window-before-rez-funding-d411.json";
import afterInstall from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-last-window-followup-d412.json";
import afterAdvance from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-last-window-followup-d413.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function decide(change?: (input: AiDecisionInputWithDeckCapabilities) => void, json: unknown = checkpoint) {
  const { input, runtime } = structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  change?.(input);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
  const result = chooseAiAction(input);
  return { input, result, action: input.legalActions.find(a => a.actionId === result.actionId)!, plan: result.decisionDebug?.planFirstDecision };
}

describe("meta 403 last executable deckout score window", () => {
  it.each([afterInstall, afterAdvance])("preserves the real Engine advancement continuation after installation", json => {
    const { input, result, action, plan } = decide(undefined, json);
    expect(action.type).toBe("advance_card");
    expect(action.payload?.cardId).toBe("corp_onr_v1_200_encryption-breakthrough_2");
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
    expect(plan?.rootPlanInstanceId).toBe(plan?.leafExecutorInstanceId);
    expect(result.fallbackUsed).toBe(false);
  });
  it("installs the winning agenda before reserve funding consumes its required advancement clicks", () => {
    const { input, result, action, plan } = decide();
    expect(action.type).toBe("install_card");
    expect(action.payload?.serverId).toBe("remote_1");
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(action.payload?.agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn).toBe(3);
    expect(action.payload?.agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks).toBe(3);
    expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
    expect(plan?.rootPlanInstanceId).toBe(plan?.leafExecutorInstanceId);
    expect(plan?.priority?.effectiveClass).toBe("P2");
    expect(result.fallbackUsed).toBe(false);
  });
  it.each(["open_deadline", "not_winning", "missing_horizon"])("does not promote the install to survival priority when proof is %s", kind => {
    const { action, plan, result } = decide(input => {
      if (kind === "open_deadline") input.playerView.own.stackOrRdCount = 20;
      if (kind === "not_winning") input.playerView.own.agendaPoints = 0;
      if (kind === "missing_horizon") for (const action of input.legalActions) {
        if (action.payload) delete action.payload.agendaInstallScoreHorizonQuoteComplete;
      }
    });
    if (kind === "open_deadline") {
      expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
      expect(["P3", "P4"]).toContain(plan?.priority?.effectiveClass);
    } else {
      expect(action.type).toBe("gain_credit");
      expect(plan?.selectedPlan?.moduleId).toBe("corp.economy");
      expect(plan?.priority?.effectiveClass).toBe("P2");
    }
    expect(result.fallbackUsed).toBe(false);
  });
});
