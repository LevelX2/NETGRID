import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildDeckStrategyProfile } from "../../deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("preserves the actual cheaper breaker search under the canonical deck profile before a full-hand reset", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL("fixtures/meta490-mit-selection.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.keys(fixture.validation)).toHaveLength(9);
  expect(Object.values(fixture.validation).every((v) => v === true)).toBe(true);
  const input = {
    ...fixture.input,
    ...buildAiDecisionInputDto(fixture.input),
  } as AiDecisionInput;
  const source = fixture.input.ownDeckSnapshot;
  const snapshot = {
    ...source,
    cards: source.cards.map(
      (c: { cardId?: string; definitionId?: string; quantity: number }) => ({
        cardId: c.cardId ?? c.definitionId!,
        quantity: c.quantity,
      }),
    ),
  } as AiDeckStrategyDeckSnapshot;
  Object.assign(input, {
    ownDeckStrategyProfile: buildDeckStrategyProfile(snapshot),
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, source.deckSnapshotId, fixture.runtime);
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(fixture.runtime.residentPlanPortfolio),
  );
  const decision = chooseAiAction(input);
  const legal = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(input.playerView.own.gripOrHq).toHaveLength(
    input.playerView.own.maxHandSize,
  );
  expect(legal).toMatchObject({ type: "draw_card", source: "basic_action" });
  expect(decision.decisionDebug?.planKind).toBe("runner.rig_and_coverage");
  expect(
    decision.evidence?.some((e) =>
      e.startsWith("plan_assessment_evidence:cost_ineffective_coverage:hq:"),
    ),
  ).toBe(true);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.route?.stateVersion).toBe(
    input.playerView.stateVersion,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("runner.rig_and_coverage");
});
