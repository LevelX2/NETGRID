import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpFreeRezPayoutPreparation } from "./free-rez-payout-preparation";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyParentFundingSignal,
  EconomyState,
} from "./economy-types";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";

afterEach(resetResidentPlanPortfolioMemory);
it("funds the native next-runner HQ reserve through free setup without delaying its two-click deadline", () => {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta570-defense-bbs-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    engineState: GameState;
    validation: Record<string, boolean>;
  };
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  let current = structuredClone(saved.engineState);
  const parent = "plan:corp.defend_servers:server-defense-portfolio";
  for (const [index, type] of [
    "install_card",
    "rez_card",
    "activated_card_ability",
    "activated_card_ability",
  ].entries()) {
    const input =
      index === 0
        ? saved.input
        : buildAiDecisionInput(current, "corp", {
            ownDeckSnapshot: saved.input.ownDeckSnapshot!,
            difficulty: "hard",
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (index === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        saved.runtime,
      );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input),
      action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
    expect(JSON.stringify(input)).toBe(before);
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(action.type).toBe(type);
    expect(action.source).toContain("bbs-whispering-campaign");
    if (index < 3)
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: parent,
        selectedPlan: { moduleId: "corp.economy", parentInstanceId: parent },
        route: {
          actionId: action.actionId,
          stateVersion: current.stateVersion,
        },
      });
    const applied = applyAction(current, {
      matchId: current.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: current.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw Error("Native Engine rejected funding prefix");
    current = applied.state;
    if (index === 2)
      expect([current.corp.credits, current.corp.clicks]).toEqual([6, 1]);
  }
  expect([current.corp.credits, current.corp.clicks]).toEqual([8, 0]);
  expect(getPlayerView(current, "corp").own.agendaPoints).toBe(
    getPlayerView(saved.engineState, "corp").own.agendaPoints,
  );
  const replay = replayEvents(
    saved.engineState,
    current.eventLog.slice(saved.engineState.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  if (!replay.ok) throw Error("Native replay rejected");
  expect(hashState(replay.state)).toBe(hashState(current));
});

it.each([
  "two_clicks",
  "near_target",
  "urgent_parent",
  "stale_target",
  "missing_ice",
  "stale_action",
] as const)(
  "preserves the defense deadline and exact binding with %s",
  (change) => {
    const saved = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta570-defense-bbs-funding.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input: AiDecisionInputWithDeckCapabilities = saved.input;
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      saved.runtime,
    );
    chooseAiAction(input);
    const signals = residentPlanPortfolioSnapshot(input)!
      .instances.filter((i) => i.moduleId === "corp.economy")
      .map((i) => (i.moduleState as EconomyState).signal);
    const signal = structuredClone(
      signals.find(
        (s) => s.kind === "parent_funding" && s.freeRezPayoutPreparation,
      ),
    ) as CorpEconomyParentFundingSignal;
    expect(signal.freeRezPayoutPreparation).toBeDefined();
    const campaigns = signals.filter(
      (s): s is CorpEconomyDevelopmentSignal => s.kind === "develop_campaign",
    );
    const head = signal.freeRezPayoutPreparation!.actionId;
    if (change === "two_clicks") input.playerView.own.clicks = 2;
    if (change === "near_target") {
      signal.gap = 1;
      signal.incrementalDefenseReserve!.targetCredits =
        input.playerView.own.credits + 1;
    }
    if (change === "urgent_parent") signal.parentPriorityClass = "P1";
    if (change === "stale_target")
      signal.incrementalDefenseReserve!.targetCredits++;
    if (change === "missing_ice")
      signal.incrementalDefenseReserve!.iceInstanceId = "departed-ice";
    if (change === "stale_action")
      input.legalActions.find((a) => a.actionId === head)!
        .expiresAtStateVersion--;
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
    });
    expect(
      corpFreeRezPayoutPreparation(
        input,
        candidates,
        signal,
        signal.freeRezPayoutPreparation!.basicFundingActionId,
        campaigns,
      ),
    ).toBeUndefined();
  },
);
