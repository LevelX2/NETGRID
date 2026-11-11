import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { runnerImmediateExposedIceSafetyExit } from "../../runner/run-window/run-window-expose-viewing";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

const hqRun = "runner.start_run.hq";
const rdRun = "runner.start_run.rd";

function replaySelectedExit() {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-736-r3-g03-exposed-ice-reentry.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const validation of fixture.validations) {
    expect(Object.values(validation)).toEqual(Array(9).fill(true));
  }
  const viewing: AiDecisionInputWithDeckCapabilities = {
    ...fixture.viewing,
    ...buildAiDecisionInputDto(fixture.viewing),
  };
  const entry: AiDecisionInputWithDeckCapabilities = {
    ...fixture.entry,
    ...buildAiDecisionInputDto(fixture.entry),
  };
  restoreResidentPlanPortfolioMemorySnapshot(viewing, fixture.previous);
  const selected = chooseAiAction(viewing);
  expect(selected.actionId).toBe(entry.observedTurnPlanAction?.actionId);
  expect(viewing.playerView.run?.approachedIce?.known).toBe(true);
  expect(entry.playerView.servers.find((server) => server.id === "hq")?.ice[0]?.known).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(viewing);
  expect(portfolio).toBeDefined();
  return { entry, portfolio: portfolio! };
}

describe("SP-523: an immediate repeat after a lethal exposed ICE exit", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("keeps the exact earlier safety choice and drops the unchanged HQ retry", () => {
    const { entry, portfolio } = replaySelectedExit();
    expect(runnerImmediateExposedIceSafetyExit(entry, portfolio)).toEqual({
      actionId: hqRun,
      evidenceCode: "runner_repeated_basic_run_after_lethal_expose_exit:hq",
    });
    expect(entry.legalActions.some((action) => action.actionId === rdRun)).toBe(true);
    const selected = chooseAiAction(entry);
    expect(selected.actionId).not.toBe(hqRun);
    expect(selected.decisionDebug?.planFirstDecision?.dispositions).toContainEqual(
      expect.objectContaining({
        actionId: hqRun,
        ownerModuleId: "runner.pressure_central",
      }),
    );
    expect(selected.fallbackUsed).toBe(false);
  });

  it.each(["draw", "rig", "corp funding", "turn", "observed action", "lease", "card route"] as const)(
    "does not retain the old exclusion after changed %s",
    (change) => {
      const { entry, portfolio } = replaySelectedExit();
      if (change === "draw") {
        entry.playerView.own.gripOrHq.push({
          ...entry.playerView.own.gripOrHq[0]!,
          instanceId: "changed-grip",
        });
      }
      if (change === "rig") entry.playerView.own.rig![0]!.strength = 6;
      if (change === "corp funding") entry.playerView.opponent.credits -= 3;
      if (change === "turn") entry.playerView.turnSerial += 1;
      if (change === "observed action") delete entry.observedTurnPlanAction;
      if (change === "lease") delete portfolio.turnPlanExecutionLease;
      if (change === "card route") {
        const basicRun = entry.legalActions.find((action) => action.actionId === hqRun)!;
        basicRun.source = "runner-independent-card-run";
      }
      expect(runnerImmediateExposedIceSafetyExit(entry, portfolio)).toBeUndefined();
    },
  );
});

describe("SP-523: an old unaffordable ICE needs a current viewing", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  function replayPreviouslyUnaffordableViewing() {
    const fixture = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-736-r3-g35-reexpose.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (const validation of fixture.validations) {
      expect(Object.values(validation)).toEqual(Array(9).fill(true));
    }
    const viewing: AiDecisionInputWithDeckCapabilities = {
      ...fixture.viewing,
      ...buildAiDecisionInputDto(fixture.viewing),
    };
    const reentry: AiDecisionInputWithDeckCapabilities = {
      ...fixture.reentry,
      ...buildAiDecisionInputDto(fixture.reentry),
    };
    const portfolio: ResidentPlanPortfolio = fixture.previousReentry;
    const target = viewing.playerView.run?.approachedIce?.instanceId;
    expect(viewing.playerView.opponent.credits).toBe(10);
    expect(viewing.playerView.run?.approachedIce?.effectiveRezCostQuote)
      .toMatchObject({ complete: true, finalCredits: 13 });
    restoreResidentPlanPortfolioMemorySnapshot(viewing, fixture.previousViewing);
    const selected = chooseAiAction(viewing);
    expect(selected.actionId).toBe(
      viewing.legalActions.find((action) => action.payload?.approachIceExposeViewDecision === "finish")?.actionId,
    );
    const remembered = residentPlanPortfolioSnapshot(viewing)?.runnerExposeInformationMemory?.find(
      (record) => record.targetIceInstanceId === target,
    );
    expect(remembered?.previouslyUnfundedRezCredits).toBe(13);
    portfolio.runnerExposeInformationMemory = portfolio.runnerExposeInformationMemory?.map(
      (record) => record.targetIceInstanceId === target ? remembered! : record,
    );
    return { reentry, portfolio, target };
  }

  it.each(["bank", "support"] as const)(
    "reopens the exact legal viewing when %s can make the rez possible",
    (trigger) => {
      const { reentry, portfolio, target } = replayPreviouslyUnaffordableViewing();
      if (trigger === "bank") {
        delete reentry.playerView.servers.find((server) => server.id === "hq")!.statuses;
      } else {
        reentry.playerView.opponent.credits = 10;
      }
      restoreResidentPlanPortfolioMemorySnapshot(reentry, portfolio);
      const selected = chooseAiAction(reentry);
      expect(selected.actionId).toBe(
        reentry.legalActions.find((action) =>
          action.payload?.iceId === target &&
          action.payload?.approachIceExposeDecision === "expose",
        )?.actionId,
      );
      expect(selected.fallbackUsed).toBe(false);
    },
  );

  it.each(["unfunded", "other ICE"] as const)(
    "keeps the exact previous decline when the financing proof is %s",
    (context) => {
      const { reentry, portfolio, target } = replayPreviouslyUnaffordableViewing();
      if (context === "unfunded") {
        reentry.playerView.opponent.credits = 10;
        delete reentry.playerView.servers.find((server) => server.id === "hq")!.statuses;
      } else {
        const old = portfolio.runnerExposeInformationMemory?.find(
          (record) => record.targetIceInstanceId === target,
        )!;
        portfolio.runnerExposeInformationMemory = [
          ...portfolio.runnerExposeInformationMemory!.map((record) =>
            record.targetIceInstanceId === target
              ? {
                  targetIceInstanceId: record.targetIceInstanceId,
                  serverId: record.serverId,
                  sourceCardInstanceId: record.sourceCardInstanceId,
                  selectedAtStateVersion: record.selectedAtStateVersion,
                }
              : record,
          ),
          { ...old, targetIceInstanceId: "different-ice" },
        ];
      }
      restoreResidentPlanPortfolioMemorySnapshot(reentry, portfolio);
      const selected = chooseAiAction(reentry);
      expect(selected.actionId).toBe(
        reentry.legalActions.find((action) =>
          action.payload?.iceId === target &&
          action.payload?.approachIceExposeDecision === "decline",
        )?.actionId,
      );
    },
  );
});
