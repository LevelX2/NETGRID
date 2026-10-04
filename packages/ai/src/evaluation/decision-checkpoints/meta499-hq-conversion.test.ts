import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { corpHandDispositionScore } from "../../corp/hand-management/hand-disposition-score";
import { corpTerminalHqAgendaShuffleExposure } from "../../corp/defense/corp-server-protection-reserve";

function checkpoint(name: string) {
  const cp = JSON.parse(
    readFileSync(new URL(`fixtures/${name}.json`, import.meta.url), "utf8"),
  );
  expect(Object.values(cp.validation).every((value) => value === true)).toBe(
    true,
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  return { cp, input };
}

afterEach(resetResidentPlanPortfolioMemory);

describe("native meta499 HQ conversion", () => {
  it("admits the fully funded paid HQ route for its bound success-window payoff", () => {
    const { cp, input } = checkpoint("meta499-g20-d134-paid-hq-window");
    restoreAiRuntimeCheckpoint(
      input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.start_run.hq");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ahq",
    );
    const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
      (p) => p.moduleId === "runner.pressure_central" && p.target?.id === "hq",
    )!;
    expect(owner.moduleState).toMatchObject({
      signal: {
        reachable: true,
        purpose: "access",
        marginalValue: 320,
        evidenceCode: expect.stringContaining("hq_success_window_setup"),
      },
    });
  });

  it("binds the endangered HQ matchpoint shuffle at the original score parent", () => {
    const before = checkpoint("meta499-g35-d195-score-parent");
    const after = checkpoint("meta499-g35-d196-hq-shuffle");
    restoreAiRuntimeCheckpoint(
      before.input,
      before.cp.input.ownDeckSnapshot.deckSnapshotId,
      before.cp.runtime,
    );
    const score = chooseAiAction(before.input);
    expect(score.actionId).toBe(
      "corp.score_agenda.corp_onr_v1_194_corporate-downsizing_1.corp_onr_v1_194_corporate-downsizing_1",
    );
    expect(
      score.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("corp.score_agenda");
    const choice = chooseAiAction(after.input);
    expect(choice.fallbackUsed).toBe(false);
    expect(
      after.input.legalActions.some((a) => a.actionId === choice.actionId),
    ).toBe(true);
    expect(choice.selectedChoices?.selectedOptionIds).toEqual([
      "card_corp_onr_v1_201_executive-extraction_1",
    ]);
    expect(choice.selectedChoices?.choiceId).toBe(
      after.input.playerView.pendingChoice?.choiceId,
    );
    // The resolver consumes the exact recorded parent binding. Restoring the
    // historical parent with its empty selection must still produce no shuffle.
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      after.input,
      after.cp.input.ownDeckSnapshot.deckSnapshotId,
      after.cp.runtime,
    );
    expect(
      chooseAiAction(after.input).selectedChoices?.selectedOptionIds,
    ).toEqual([]);
  });

  it.each([
    "not_terminal",
    "click_remaining",
    "missing_quote",
    "stale_quote",
    "current_plan",
  ] as const)(
    "retains matchpoint protection when the native relocation proof is %s",
    (countercase) => {
      const { input } = checkpoint("meta499-g35-d196-hq-shuffle");
      const card = input.playerView.own.gripOrHq.find(
        (c) => c.type === "agenda",
      )!;
      const proof = corpTerminalHqAgendaShuffleExposure(
        input,
        card.instanceId,
      )!;
      expect(proof).toMatchObject({
        cardId: card.instanceId,
        observedAtStateVersion: input.playerView.stateVersion,
        lowerDestinationExposure: true,
      });
      const unprotected = corpHandDispositionScore({
        input,
        card,
        destination: "rd_shuffle",
        baseKeepScore: { total: 500 },
      });
      expect(unprotected.evidence).toContain(
        "corp_hand_destination_terminal_hq_exposure_lower_after_shuffle",
      );
      expect(unprotected.destinationAdjustment).toBeLessThan(0);
      if (countercase === "not_terminal")
        input.playerView.opponent.agendaPoints = 5;
      if (countercase === "click_remaining") input.playerView.own.clicks = 1;
      if (countercase === "missing_quote")
        delete input.playerView.corpCentralAccessQuotes;
      if (countercase === "stale_quote")
        input.playerView.corpCentralAccessQuotes =
          input.playerView.corpCentralAccessQuotes!.map((q) => ({
            ...q,
            stateVersion: input.playerView.stateVersion - 1,
          }));
      const protectedScore = corpHandDispositionScore({
        input,
        card,
        destination: "rd_shuffle",
        baseKeepScore: {
          total: 500,
          ...(countercase === "current_plan"
            ? { planDisposition: "current_plan_route" as const }
            : {}),
        },
      });
      expect(protectedScore.evidence).toContain(
        countercase === "current_plan"
          ? "corp_hand_destination_current_plan_protected"
          : "corp_hand_destination_matchpoint_protected",
      );
    },
  );
});
