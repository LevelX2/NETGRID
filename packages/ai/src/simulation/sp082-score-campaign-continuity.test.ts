import {
  applyAction,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { AiDecision } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-01-game36-score-parent-funding-gap.json";
import type { AiDecisionCheckpointV1 } from "../evaluation/decision-checkpoints/checkpoint-types";
import { validateAiDecisionCheckpoint } from "../evaluation/decision-checkpoints/checkpoint-validation";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { chooseAiAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";

const SCORE_ROOT =
  "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";
const SCORE_SUPPORT =
  "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";

describe("SP-082 score campaign multi-step regression", () => {
  it.each([0, 1])(
    "preserves funding across the opponent turn from %i credits and releases the closed need",
    (initialCredits) => {
      const fixture = validateAiDecisionCheckpoint(
        structuredClone(checkpointJson) as AiDecisionCheckpointV1,
      );
      let state = structuredClone(fixture.engine.testOnlyGameState);
      // Reproduce the funding boundary itself. An independently chosen Runner
      // policy must not decide whether this regression reaches a turn boundary.
      state.corp.credits = initialCredits;
      state.corp.clicks = 3 - initialCredits;
      const initial = structuredClone(state);
      const input = () =>
        buildAiDecisionInput(state, "corp", {
          difficulty: fixture.difficulty,
          profileId: fixture.profileId,
          ownDeckSnapshot: fixture.deckSnapshot,
          decisionId: `${fixture.source.decisionScopeId}:${state.stateVersion}:corp`,
        });
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        input(),
        fixture.deckSnapshot.deckSnapshotId,
        fixture.runtime,
      );
      const fundingTurns = new Set<number>();
      let runnerActed = false;
      let fundingCount = 0;
      let released = false;
      // This checkpoint's score-horizon obligation is exactly four credits.
      // Exact arithmetic is intentional; surrounding game action counts are not.
      const fundingTarget = 4;
      for (let step = 0; step < 20 && !released; step++) {
        const side = state.pendingChoice?.side ?? state.activeSide;
        const actions = getLegalActions(state, side);
        let decision: AiDecision | undefined;
        let actionId: string;
        if (side === "runner") {
          runnerActed = true;
          const action =
            actions.find((candidate) => candidate.type === "gain_credit") ??
            actions.find((candidate) => candidate.type === "end_turn");
          if (!action)
            throw new Error(
              "Unexpected action in scripted, non-interfering opponent turn",
            );
          actionId = action.actionId;
        } else {
          decision = chooseAiAction(input());
          actionId = decision.actionId!;
          expect(decision.fallbackUsed).toBe(false);
          if (
            decision.evidence?.includes(`plan_first_executor:${SCORE_SUPPORT}`)
          ) {
            expect(state.corp.credits).toBeLessThan(fundingTarget);
            expect(
              actions.find((action) => action.actionId === actionId)?.type,
            ).toBe("gain_credit");
            expect(decision.evidence).toEqual(
              expect.arrayContaining([
                `plan_first_root:${SCORE_ROOT}`,
                `plan_first_executor:${SCORE_SUPPORT}`,
              ]),
            );
            expect(state.turnSerial).toBeDefined();
            fundingTurns.add(state.turnSerial!);
            fundingCount++;
          } else if (
            state.corp.credits >= fundingTarget &&
            state.corp.clicks > 0 &&
            state.timingPoint === "corp_action.main"
          ) {
            expect(decision.evidence).not.toContain(
              `plan_priority_delegated_from:${SCORE_ROOT}`,
            );
            released = true;
          }
        }
        const result = applyAction(state, {
          matchId: state.matchId,
          side,
          actionId,
          ...(decision?.selectedChoices
            ? { selectedChoices: decision.selectedChoices }
            : {}),
          clientKnownStateVersion: state.stateVersion,
          idempotencyKey: `sp082:${step}`,
        });
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      }
      expect(runnerActed).toBe(true);
      expect(fundingTurns.size).toBeGreaterThanOrEqual(2);
      expect(fundingCount).toBe(fundingTarget - initialCredits);
      expect(released).toBe(true);
      const replay = replayEvents(
        initial,
        state.eventLog.slice(initial.eventLog.length),
      );
      expect(replay.ok).toBe(true);
      expect(replay.errors).toEqual([]);
      expect(hashState(replay.state)).toBe(hashState(state));
      // Protection handoff and agenda materialization have explicit prerequisites
      // in corp-agenda-turn-planning / corp-defense-turn-planning tests.
    },
  );
});
