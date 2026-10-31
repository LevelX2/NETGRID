import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpOrderedRemoteInstallPathAssessment } from "../../corp/defense/corp-defense-domain-signals";
import { corpHostedBankTurnPlanningQuote } from "../../corp/economy/hosted-credit-bank-turn-planning";
import { corpHostedBankCycleDevelopment } from "../../corp/economy/hosted-credit-bank-cycle";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta576-department-new-remote.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("Department rest-turn funding with a new Remote protection need", () => {
  it("takes the actual Engine payout after the quoted native load", () => {
    const f = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta576-department-after-native-load.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as ReturnType<typeof fixture>;
    const input = f.input;
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    expect(input.playerView.own).toMatchObject({ credits: 3, clicks: 1 });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      f.runtime.residentPlanPortfolio!,
    );
    const before = JSON.stringify(input);
    const decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.payload?.hostedCreditTakeAmount).toBe(6);
    expect(action.expiresAtStateVersion).toBe(280);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan?.moduleId).toBe("corp.economy");
    expect(plan?.route?.actionId).toBe(action.actionId);
    expect(plan?.route?.stateVersion).toBe(280);
  });
  it("retains unknown when the current post-install run quote is absent", () => {
    const input = fixture().input;
    const actions = input.legalActions.filter(
      (a) =>
        a.type === "install_card" &&
        a.payload?.placement === "ice" &&
        a.payload.serverId === "new_remote",
    );
    expect(actions).toHaveLength(2);
    for (const action of actions) {
      const source = input.playerView.own.gripOrHq.find(
        (c) => c.instanceId === action.source,
      )!;
      expect(
        corpOrderedRemoteInstallPathAssessment(input, [], source, action),
      ).toMatchObject({ knowledge: "known", improves: false });
      const missing = structuredClone(action);
      delete missing.payload!.postInstallEffectiveRunQuoteJson;
      expect(
        corpOrderedRemoteInstallPathAssessment(input, [], source, missing),
      ).toMatchObject({ knowledge: "unknown" });
    }
  });
  it("binds the whole Engine-quoted cycle and rejects a mismatched admitted milestone", () => {
    const input = fixture().input;
    const stateIdentity = buildPlanningStateIdentity(input);
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const [signal] = corpHostedBankCycleDevelopment(input, candidates);
    if (!signal) throw Error("Current native bank cycle missing");
    const params = {
      input,
      stateIdentity,
      signal,
      actionId: signal.actionIds[0]!,
      planInstanceId: "plan:corp.economy:native-bank-cycle",
    };
    const quote = corpHostedBankTurnPlanningQuote(params)!;
    expect(quote.campaignQuote).toMatchObject({
      remainingValue: 4,
      nextMilestoneId: "quoted_bank_cycle_paid",
      basis: { stateVersion: 279 },
    });
    expect(quote.evidenceCodes).toContain("corp_bank_quoted_liquid_gain:6");
    expect(quote.evidenceCodes).toContain("corp_bank_quoted_total_clicks:2");
    expect(quote.valueClaims[0]).toMatchObject({
      ownerModuleId: "corp.economy",
      aggregationMode: "exclusive",
    });
    const invalid = structuredClone(signal);
    invalid.hostedCreditBankCycle!.cashoutCredits++;
    expect(() =>
      corpHostedBankTurnPlanningQuote({ ...params, signal: invalid }),
    ).toThrow("missing_plan_module_coverage");
  });
  it("admits the profitable native load when neither offered new layer improves the current path", () => {
    const f = fixture(),
      input = f.input;
    expect(Object.keys(f.validation)).toHaveLength(9);
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    expect(input.playerView.own).toMatchObject({ credits: 3, clicks: 2 });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      f.runtime.residentPlanPortfolio!,
    );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(action.payload?.hostedCreditAddAmount).toBe(3);
    const p = decision.decisionDebug?.planFirstDecision;
    expect(p?.selectedPlan?.moduleId).toBe("corp.economy");
    expect(p?.rootPlanInstanceId).toContain("economy-hosted-bank-cycle");
    expect(p?.route?.actionId).toBe(action.actionId);
    expect(p?.route?.stateVersion).toBe(input.playerView.stateVersion);
    expect(
      p?.turnPlanning?.consideredLines?.some((line) =>
        line.evidenceCodes.includes("corp_engine_quoted_bank_milestone"),
      ),
    ).toBe(true);
    expect(p?.selectedStep?.planInstanceId).toBe(p?.leafExecutorInstanceId);
  });
});
