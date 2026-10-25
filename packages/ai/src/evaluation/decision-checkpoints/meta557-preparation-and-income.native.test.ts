import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { persistentIncomeInstallRecovery } from "../../runner/hand-development/runner-persistent-install-evaluation";
function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 557 current preparation and post-install income", () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    "executes the current HQ preparation without stale funding, DTO=%s resident=%s",
    (dto, resident) => {
      const cp = fixture("cp-meta557-unowned-funded-liquidity");
      expect(Object.values(cp.validation).every(Boolean)).toBe(true);
      if (dto) cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      if (resident)
        restoreAiRuntimeCheckpoint(
          cp.input,
          cp.input.ownDeckSnapshot.deckSnapshotId,
          cp.runtime,
        );
      const before = JSON.stringify(cp.input),
        result = chooseAiAction(cp.input),
        pf = result.decisionDebug?.planFirstDecision;
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      expect(
        cp.input.legalActions.find((a: any) => a.actionId === result.actionId)
          ?.source,
      ).toContain("forged-activation-orders");
      expect(pf?.selectedPlan?.moduleId).toBe("runner.pressure_central");
      expect(pf?.rootPlanInstanceId).toBe(
        "plan:runner.pressure_central:central%3Ahq",
      );
      expect(pf?.leafExecutorInstanceId).toBe(pf?.rootPlanInstanceId);
      expect(pf?.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: 319,
        planInstanceId: pf?.rootPlanInstanceId,
      });
      expect(pf?.turnPlanning?.coverage).toMatchObject({
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      });
      const portfolio = residentPlanPortfolioSnapshot(cp.input);
      const root = portfolio?.instances.find(
        (i) => i.instanceId === pf?.rootPlanInstanceId,
      );
      expect((root?.moduleState as any)?.signal?.supportNeedId).toBeUndefined();
      expect(
        portfolio?.instances.some(
          (i) => i.parentNeedId === "run-support:central:hq",
        ),
      ).toBe(false);
      expect(JSON.stringify(cp.input)).toBe(before);
    },
  );
  it.each([
    "cp-meta557-install-income-order",
    "cp-meta557-install-income-order-tight",
  ])(
    "installs the income before a dominated basic-credit prefix: %s",
    (name) => {
      const cp = fixture(name);
      expect(Object.values(cp.validation).every(Boolean)).toBe(true);
      restoreAiRuntimeCheckpoint(
        cp.input,
        cp.input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
      const before = JSON.stringify(cp.input),
        result = chooseAiAction(cp.input),
        pf = result.decisionDebug?.planFirstDecision;
      // The existing bank owner may prefer an equally profitable STC-first sequence,
      // or the independently valued longer investment. No Gain1 prefix is forced by a false floor.
      expect(
        cp.input.legalActions.find((a: any) => a.actionId === result.actionId)
          ?.type,
      ).toBe("install_card");
      const development = pf?.portfolio.find(
        (p) =>
          p.moduleId === "runner.develop_board_and_hand" &&
          p.target?.id === "onr_v1_045_newsgroup-filter",
      );
      expect(development).toMatchObject({
        viability: "ready",
        phase: "execute",
        openNeedIds: [],
      });
      const card = cp.input.playerView.own.gripOrHq.find(
        (c: any) => c.definitionId === "onr_v1_045_newsgroup-filter",
      );
      const action = cp.input.legalActions.find(
        (a: any) =>
          a.source === card.instanceId &&
          !a.payload?.runnerProgramTrashBeforeInstall,
      );
      expect(
        persistentIncomeInstallRecovery(
          cp.input,
          card,
          action,
          5,
          cp.input.playerView.own.credits - 5,
        ),
      ).toMatchObject({ incomePerClick: 2, recoveryClicks: 2, creditGain: 4 });
      expect(["runner.develop_board_and_hand", "runner.credit_bank"]).toContain(
        pf?.selectedPlan?.moduleId,
      );
      expect(pf?.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: cp.input.playerView.stateVersion,
      });
      expect(pf?.turnPlanning?.coverage).toMatchObject({
        status: "pass",
        coveragePercent: 100,
      });
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      expect(JSON.stringify(cp.input)).toBe(before);
    },
  );
  describe("countermodels: the conditional income never becomes current cash", () => {
    const setup = () => {
      const cp = fixture("cp-meta557-install-income-order");
      const card = cp.input.playerView.own.gripOrHq.find(
        (c: any) => c.definitionId === "onr_v1_045_newsgroup-filter",
      );
      const action = cp.input.legalActions.find(
        (a: any) =>
          a.source === card.instanceId &&
          !a.payload?.runnerProgramTrashBeforeInstall,
      );
      return { input: cp.input, card, action };
    };
    it.each([
      "last_click",
      "insufficient_mu",
      "stale_action",
      "missing_action",
      "tagged",
      "matchpoint",
      "already_has_income",
      "finite_bank",
    ])("retains the reserve when recovery is not certified: %s", (kind) => {
      const { input, card, action } = setup();
      if (kind === "last_click") input.playerView.own.clicks = 1;
      if (kind === "insufficient_mu")
        input.playerView.own.memoryUsed = input.playerView.own.memoryLimit;
      if (kind === "stale_action") action.expiresAtStateVersion--;
      if (kind === "missing_action")
        input.legalActions = input.legalActions.filter(
          (a: any) => a.actionId !== action.actionId,
        );
      if (kind === "tagged") input.playerView.own.tags = 1;
      if (kind === "matchpoint")
        input.playerView.own.agendaPoints =
          input.playerView.agendaPointsToWin - 1;
      if (kind === "already_has_income")
        input.playerView.own.rig.push({
          ...card,
          instanceId: "countermodel_installed_income",
        });
      if (kind === "finite_bank")
        card.definitionId = "onr_v1_178_short-term-contract";
      expect(
        persistentIncomeInstallRecovery(input, card, action, 5, 1),
      ).toBeUndefined();
    });
  });
});
