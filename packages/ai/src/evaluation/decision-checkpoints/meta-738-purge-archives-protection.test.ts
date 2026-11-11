import { afterEach, expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-738-r1-g14-d300.json";
import quoteFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-738-r1-g14-d300-archives-quote.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { VisibleAgendaPurgeArchivesProtectionQuote } from "@netgrid/shared";

const checkpoint = capture as unknown as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
const nativeQuote =
  quoteFixture as unknown as VisibleAgendaPurgeArchivesProtectionQuote;
const split = [
  "agenda_purge_corp_onr_classic_013_puzzle_1_rd_fixed",
  "agenda_purge_corp_onr_classic_013_puzzle_3_archives_fixed",
];
const together = [
  "agenda_purge_corp_onr_classic_013_puzzle_1_archives_fixed",
  "agenda_purge_corp_onr_classic_013_puzzle_3_archives_fixed",
];
const owner = "plan:corp.defend_servers:server-defense-portfolio";
afterEach(resetResidentPlanPortfolioMemory);

function decide(
  adjust?: (input: AiDecisionInputWithDeckCapabilities) => void,
  useQuote = true,
) {
  const input = structuredClone(checkpoint.input);
  input.playerView.pendingChoice!.agendaPurgeArchivesProtectionQuote =
    structuredClone(nativeQuote);
  adjust?.(input);
  if (!useQuote)
    delete input.playerView.pendingChoice!.agendaPurgeArchivesProtectionQuote;
  if (!input.ownDeckSnapshot) throw Error("Deck snapshot missing");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.resolve_choice");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: owner,
    leafExecutorInstanceId: owner,
  });
  expect(decision.selectedChoices?.choiceId).toBe(
    input.playerView.pendingChoice!.choiceId,
  );
  return decision.selectedChoices?.selectedOptionIds;
}

it("puts both legal stops in front of the newly revealed winning Archives agenda", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  expect(decide()).toEqual(together);
});

it("retains the existing allocation without an exact Engine package quote", () => {
  expect(decide(undefined, false)).toEqual(split);
});

it.each([
  [
    "the agenda cannot end the game",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.agendaPoints = 4;
    },
  ],
  [
    "the public runner budget still reaches both layers",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.credits = 40;
    },
  ],
  [
    "the second placement would reduce the Corp reserve",
    (input: AiDecisionInputWithDeckCapabilities) => {
      const alternative =
        input.playerView.pendingChoice!.agendaPurgeArchivesProtectionQuote!.packages.find(
          (entry) => entry.archivesIce.length === 2,
        )!;
      alternative.corpCreditsAfter--;
    },
  ],
  [
    "the revealed agenda is unavailable to this actor",
    (input: AiDecisionInputWithDeckCapabilities) => {
      const choice = input.playerView.pendingChoice!;
      const reveal = choice.options.find(
        (option) => option.card?.instanceId === nativeQuote.revealedAgendaId,
      )!;
      delete reveal.card;
    },
  ],
] as const)("keeps the original legal allocation when %s", (_label, adjust) => {
  const baseline = decide(adjust, false);
  resetResidentPlanPortfolioMemory();
  expect(decide(adjust)).toEqual(baseline);
});
