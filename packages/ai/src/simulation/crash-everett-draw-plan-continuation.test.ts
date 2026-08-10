import { getPlayerView } from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";

describe("Crash Everett draw-plan continuation", () => {
  it("resolves the private replacement choice under the exact preceding Runner executor", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const residentSnapshots: Array<
      ReturnType<typeof residentPlanPortfolioSnapshot>
    > = [];
    const summary = simulateAiGame({
      seed: "proteus-pilot-holdout-01",
      maxActions: 24,
      runnerDeck: deck("proteus_runner_rd_bad_publicity_2026_05_25"),
      corpDeck: deck("proteus_corp_region_fast_score_2026_05_25"),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [22, 23],
        capture: (snapshot) => {
          captures.push(snapshot);
          residentSnapshots.push(residentPlanPortfolioSnapshot(snapshot.input));
        },
      },
    });

    const draw = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 22,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 23,
    );
    const drawCapture = captures.find(
      (capture) => capture.state.stateVersion === 22,
    );
    const choiceCapture = captures.find(
      (capture) => capture.state.stateVersion === 23,
    );
    const drawExecutor = draw?.evidence.find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );
    const choiceExecutor = choice?.evidence.find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );

    expect({
      stateContinuation: choiceCapture?.state.pendingChoice?.continuation,
      continuation: choiceCapture?.input.playerView.pendingChoice?.continuation,
      residentAtChoice: residentSnapshots[1],
    }).toMatchObject({
      continuation: {
        family: "runner_hidden_draw_keep_or_top_replacement",
        originActionId: "runner.draw_card",
      },
      stateContinuation: {
        family: "runner_hidden_draw_keep_or_top_replacement",
        originActionId: "runner.draw_card",
      },
      residentAtChoice: {
        side: "runner",
        stateVersion: 22,
        selectedActionOrigin: {
          selectedActionId: "runner.draw_card",
          selectedAtStateVersion: 22,
        },
      },
    });
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(draw).toMatchObject({
      selectedActionId: "runner.draw_card",
      actionType: "draw_card",
      fallbackUsed: false,
    });
    expect(choice).toMatchObject({
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: draw?.planKind,
      reasonCode: draw?.reasonCode,
      fallbackUsed: false,
    });
    expect(drawExecutor).toBeDefined();
    expect(choiceExecutor).toBe(drawExecutor);

    const continuation =
      choiceCapture?.input.playerView.pendingChoice?.continuation;
    expect(continuation).toMatchObject({
      family: "runner_hidden_draw_keep_or_top_replacement",
      originActionId: "runner.draw_card",
      sourceCardDefinitionId: "onr_v1_157_crash-everett-inventive-fixer",
      createdAtStateVersion: 23,
    });
    expect(
      choiceCapture?.input.playerView.pendingChoice?.options.every(
        (option) => option.card?.known && option.card.definitionId,
      ),
    ).toBe(true);
    expect(
      choiceCapture
        ? getPlayerView(choiceCapture.state, "corp").pendingChoice
        : undefined,
    ).toBeUndefined();
    expect(drawCapture?.input.playerView.stateVersion).toBe(22);
  }, 20_000);
});

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return result;
}
