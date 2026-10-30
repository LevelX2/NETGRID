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
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
afterEach(resetResidentPlanPortfolioMemory);
it("scores Priority Requisition and binds its free rez without failing on Early Worm plus Rent-I-Con", () => {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta569-multiple-paid-breakers-score-free-rez.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    state: GameState;
    native: {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      validation: Record<string, boolean>;
    };
    originalPrefixProof: {
      checkedStates: number;
      originalAppliedPrefix: number;
    };
  };
  expect(Object.values(f.native.validation).every(Boolean)).toBe(true);
  expect(f.originalPrefixProof).toMatchObject({
    checkedStates: 155,
    originalAppliedPrefix: 154,
  });
  let current = structuredClone(f.state);
  let origin: string | undefined;
  let binding: { targetCardId: string; selectedOptionId: string } | undefined;
  for (let index = 0; index < 2; index++) {
    const input =
      index === 0
        ? f.native.input
        : buildAiDecisionInput(current, "corp", {
            ownDeckSnapshot: f.native.input.ownDeckSnapshot!,
            difficulty: "hard",
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (index === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        f.native.runtime,
      );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input),
      action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
    expect(JSON.stringify(input)).toBe(before);
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(action.type).toBe(index === 0 ? "score_agenda" : "resolve_choice");
    const p = decision.decisionDebug?.planFirstDecision;
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    if (index === 0) {
      expect(p?.route).toMatchObject({
        actionId: action.actionId,
        stateVersion: current.stateVersion,
      });
      expect(p?.selectedPlan?.moduleId).toBe("corp.score_agenda");
      origin = p?.leafExecutorInstanceId;
      const executor = portfolio.instances.find(
        (i) => i.instanceId === origin,
      )!;
      binding = (
        executor.moduleState as {
          choiceContinuation: {
            freeRezChoiceBinding: {
              targetCardId: string;
              selectedOptionId: string;
            };
          };
        }
      ).choiceContinuation.freeRezChoiceBinding;
      expect(binding.targetCardId).toEqual(expect.any(String));
    } else {
      expect(portfolio.executorInstanceId).toBe(origin);
      expect(decision.selectedChoices?.selectedOptionIds).toEqual([
        binding!.selectedOptionId,
      ]);
    }
    const applied = applyAction(current, {
      matchId: current.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: current.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw Error("Real score/free-rez rejected");
    current = applied.state;
  }
  expect(current.cardInstances[binding!.targetCardId]?.rezzed).toBe(true);
  expect([
    getPlayerView(current, "corp").own.agendaPoints,
    current.corp.credits,
    current.corp.clicks,
  ]).toEqual([3, 4, 0]);
  const replay = replayEvents(
    f.state,
    current.eventLog.slice(f.state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  if (!replay.ok) throw Error("Replay rejected");
  expect(hashState(replay.state)).toBe(hashState(current));
});
