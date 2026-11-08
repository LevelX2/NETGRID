import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
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

describe("native deep672 terminal HQ relocation", () => {
  it("binds a proven lower terminal exposure even when ICE-count heuristics are positive", () => {
    const before = checkpoint("deep672-d152-downsizing-score-parent");
    const after = checkpoint("deep672-d153-hq-shuffle");
    const card = after.input.playerView.own.gripOrHq.find(
      (c) => c.type === "agenda",
    )!;
    expect(
      corpTerminalHqAgendaShuffleExposure(after.input, card.instanceId),
    ).toMatchObject({
      hqExposure: { numerator: 2, denominator: 4 },
      rdAfterShuffleExposure: { numerator: 1, denominator: 23 },
      lowerDestinationExposure: true,
    });
    expect(
      corpHandDispositionScore({
        input: after.input,
        card,
        destination: "rd_shuffle",
        baseKeepScore: { total: 0 },
      }).destinationAdjustment,
    ).toBe(191);
    restoreAiRuntimeCheckpoint(
      before.input,
      before.cp.input.ownDeckSnapshot.deckSnapshotId,
      before.cp.runtime,
    );
    const score = chooseAiAction(before.input);
    expect(score.actionId).toBe(
      "corp.score_agenda.corp_onr_v1_194_corporate-downsizing_3.corp_onr_v1_194_corporate-downsizing_3",
    );
    expect(
      score.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("corp.score_agenda");
    const choice = chooseAiAction(after.input);
    expect(choice.fallbackUsed).toBe(false);
    expect(choice.actionId).toBe("corp.resolve_choice");
    expect(choice.selectedChoices).toEqual({
      choiceId: after.input.playerView.pendingChoice!.choiceId,
      selectedOptionIds: ["card_corp_onr_v1_196_corporate-war_3"],
    });
  });

  it("preserves an already recorded empty choice instead of creating a second chooser", () => {
    const { cp, input } = checkpoint("deep672-d153-hq-shuffle");
    restoreAiRuntimeCheckpoint(
      input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    expect(chooseAiAction(input).selectedChoices?.selectedOptionIds).toEqual(
      [],
    );
  });

  it.each([
    "not_terminal",
    "click_remaining",
    "missing_quote",
    "stale_quote",
  ] as const)(
    "requires the exact zero-click terminal relocation proof: %s",
    (countercase) => {
      const { input } = checkpoint("deep672-d153-hq-shuffle");
      const card = input.playerView.own.gripOrHq.find(
        (c) => c.type === "agenda",
      )!;
      if (countercase === "not_terminal")
        input.playerView.opponent.agendaPoints = 3;
      if (countercase === "click_remaining") input.playerView.own.clicks = 1;
      if (countercase === "missing_quote")
        delete input.playerView.corpCentralAccessQuotes;
      if (countercase === "stale_quote")
        input.playerView.corpCentralAccessQuotes =
          input.playerView.corpCentralAccessQuotes!.map((quote) => ({
            ...quote,
            stateVersion: input.playerView.stateVersion - 1,
          }));
      expect(
        corpHandDispositionScore({
          input,
          card,
          destination: "rd_shuffle",
          baseKeepScore: { total: 0 },
        }).terminalRelocation?.lowerDestinationExposure,
      ).not.toBe(true);
    },
  );

  it("preserves a current plan's protection despite a lower terminal exposure", () => {
    const { input } = checkpoint("deep672-d153-hq-shuffle");
    const card = input.playerView.own.gripOrHq.find(
      (c) => c.type === "agenda",
    )!;
    const disposition = corpHandDispositionScore({
      input,
      card,
      destination: "rd_shuffle",
      baseKeepScore: { total: 0, planDisposition: "current_plan_route" },
    });
    expect(disposition.terminalRelocation?.lowerDestinationExposure).toBe(true);
    expect(disposition.evidence).toContain(
      "corp_hand_destination_current_plan_protected",
    );
  });
});
