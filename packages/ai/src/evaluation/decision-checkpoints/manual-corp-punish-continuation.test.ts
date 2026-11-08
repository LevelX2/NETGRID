import { readFileSync } from "node:fs";
import type { CorpPunishRouteQuoteSet } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
  stateVersion: number;
  stateHash: string;
  decisionLocalEngineQuotes?: {
    availability: string;
    stateVersion: number;
    stateHash: string;
    corpPunishRouteQuoteSet?: CorpPunishRouteQuoteSet;
  };
};
function capture(name: string): Capture {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261108-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function decide(name: string) {
  const replay = capture(name);
  expect(Object.values(replay.validation).every(Boolean)).toBe(true);
  expect(replay.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  restoreAiRuntimeCheckpoint(
    replay.input,
    replay.input.ownDeckSnapshot!.deckSnapshotId,
    replay.runtime,
  );
  const engineQuotes = replay.decisionLocalEngineQuotes;
  if (engineQuotes?.availability === "available") {
    expect(engineQuotes.stateVersion).toBe(replay.stateVersion);
    expect(engineQuotes.stateHash).toBe(replay.stateHash);
    expect(engineQuotes.corpPunishRouteQuoteSet?.stateVersion).toBe(
      replay.stateVersion,
    );
  }
  const decision = chooseAiAction(replay.input, {
    ...(engineQuotes?.corpPunishRouteQuoteSet
      ? {
          quoteCorpPunishRoute: (request) => {
            const quote = engineQuotes.corpPunishRouteQuoteSet!.routes.find(
              (q) => JSON.stringify(q.requestEcho) === JSON.stringify(request),
            );
            if (!quote)
              throw new Error("Historical API quote missing for exact request");
            return { ok: true as const, quote: structuredClone(quote) };
          },
        }
      : {}),
  });
  expect(
    replay.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  expect(decision.fallbackUsed).toBe(false);
  return { input: replay.input, decision };
}
beforeEach(() => resetResidentPlanPortfolioMemory());
describe("manual match 20701d82 Punish continuation", () => {
  it("converts the current tag instead of funding a blocked score project at Corp D24", () => {
    const { input, decision } = decide("corp-punish-continuation");
    const selected = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(
      selected.type === "trash_resource" ||
        selected.source?.includes("scorched-earth"),
    ).toBe(true);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("corp.punish_campaign");
  });
});
