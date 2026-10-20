import { readFileSync } from "node:fs";
import { afterEach, describe, it, expect, vi } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import * as discovery from "../../corp/economy/economy-discovery";
import * as defenseWindow from "../../corp/defense/corp-funded-continuation-window";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
function capture(game: number, d: number): Capture {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-542-before-g${game}-d${d}-department.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function replay(game: number, d: number) {
  const f = capture(game, d),
    viewBefore = structuredClone(f.input.playerView);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const decision = chooseAiAction(f.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(f.input.playerView).toEqual(viewBefore);
  const selected = f.input.legalActions.find(
    (x) => x.actionId === decision.actionId,
  );
  if (!selected) throw new Error("Native current action missing");
  expect(selected.expiresAtStateVersion).toBe(f.input.playerView.stateVersion);
  const plan = decision.decisionDebug?.planFirstDecision;
  expect(plan?.route?.actionId).toBe(selected.actionId);
  expect(plan?.route?.stateVersion).toBe(f.input.playerView.stateVersion);
  expect(plan?.selectedStep?.planInstanceId).toBe(
    plan?.selectedPlan?.instanceId,
  );
  return { f, decision, selected, plan };
}
afterEach(() => vi.restoreAllMocks());
describe("SP-611 native Department rest-turn comparison", () => {
  it("continues the profitable current load with its Economy plan, step and route", () => {
    const { f, selected, plan } = replay(4, 441);
    expect(selected.payload?.hostedCreditAddAmount).toBe(3);
    expect(plan?.selectedPlan?.moduleId).toBe("corp.economy");
    expect(plan?.selectedPlan?.instanceId).toContain(
      "economy-hosted-bank-cycle",
    );
    expect(f.input.playerView.stateVersion).toBe(440);
  });
  it("offers both current payout and the complete Engine-quoted alternative to the existing planner", () => {
    const original = discovery.buildCorpEconomySignals;
    const observed: ReturnType<typeof original>[] = [];
    vi.spyOn(discovery, "buildCorpEconomySignals").mockImplementation(
      (params) => {
        const result = original(params);
        observed.push(result);
        return result;
      },
    );
    replay(4, 441);
    const needs = observed.flat();
    expect(needs.some((n) => n.kind === "convert_visible_card_payout")).toBe(
      true,
    );
    const cycle = needs.find(
      (n) => n.kind === "develop_campaign" && n.hostedCreditBankCycle,
    );
    expect(cycle?.kind).toBe("develop_campaign");
    if (cycle?.kind !== "develop_campaign")
      throw Error("Missing admitted bank route");
    expect(cycle.hostedCreditBankCycle).toMatchObject({
      stateVersion: 440,
      currentClicks: 2,
      currentHostedCredits: 3,
      cashoutCredits: 6,
      extraLiquidCredits: 2,
    });
  });
  it("preserves the Defense-owned installation unlocked by an early payout", () => {
    const original = defenseWindow.corpFundedDefenseContinuationWindow;
    const observed: ReturnType<typeof original>[] = [];
    vi.spyOn(
      defenseWindow,
      "corpFundedDefenseContinuationWindow",
    ).mockImplementation((params) => {
      const result = original(params);
      observed.push(result);
      return result;
    });
    const { selected } = replay(2, 95);
    expect(selected.payload?.hostedCreditTakeAmount).toBe(3);
    expect(
      observed
        .flatMap((x) => x.actionIds)
        .some((x) => x.includes("crystal-wall") && x.includes(".rd.")),
    ).toBe(true);
  });
  it.each([
    [4, 273],
    [15, 314],
    [29, 482],
  ])("keeps the current Score or installation window at G%i D%i", (game, d) => {
    const { selected, plan } = replay(game, d);
    expect(selected.payload?.hostedCreditTakeAmount).toBe(3);
    if (game === 29) {
      expect(plan?.rootPlanInstanceId).toContain("corp.score_agenda");
      expect(plan?.priority?.effectiveClass).toBe("P1");
    }
  });
  it("keeps missing Engine installation quotes explicitly unknown in the payout-window proof", () => {
    const { input } = capture(2, 95);
    for (const action of input.legalActions)
      if (action.type === "install_card" && action.payload?.placement === "ice")
        action.payload.postInstallRezQuoteComplete = false;
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const window = defenseWindow.corpFundedDefenseContinuationWindow({
      input,
      candidates,
      centralAllocation: undefined,
      available: { credits: 8, clicks: 1 },
    });
    expect(window.actionIds).toEqual([]);
    expect(window.unknown.length).toBeGreaterThan(0);
  });
});
