import { getPlayerView } from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

const HIJACK_PLAN_INSTANCE =
  "plan:runner.develop_board_and_hand:card%3Arunner_onr_proteus_110_hijack_1";

describe("Proteus Hijack plan continuation", () => {
  it("keeps the prebound private install choice in the same development executor", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateAiGame({
      seed: "proteus-pilot-holdout-02",
      maxActions: 75,
      runnerDeck: deck("proteus_runner_hq_virus_derez_2026_05_25"),
      corpDeck: deck("proteus_corp_antibody_tax_2026_05_25"),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [68, 69],
        capture: (snapshot) => captures.push(snapshot),
      },
    });

    const play = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 68,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 69,
    );
    const playCapture = captures.find(
      (capture) => capture.state.stateVersion === 68,
    );
    const choiceCapture = captures.find(
      (capture) => capture.state.stateVersion === 69,
    );

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(play).toMatchObject({
      actionType: "play_event",
      planKind: "runner.develop_board_and_hand",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    expect(choice).toMatchObject({
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "runner.develop_board_and_hand",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    expect(play?.evidence).toContain(
      `plan_first_executor:${HIJACK_PLAN_INSTANCE}`,
    );
    expect(choice?.evidence).toContain(
      `plan_first_executor:${HIJACK_PLAN_INSTANCE}`,
    );
    expect(choice?.evidence).toContain(
      "plan_step_capability:resolve_bound_event_install_choice",
    );

    const quote = playCapture?.input.legalActions.find(
      (action) => action.type === "play_event",
    )?.payload;
    const quotedTargetIds = String(
      quote?.runnerEventInstallChoiceQuoteSelectableTargetIds ?? "",
    ).split(",");
    expect(quotedTargetIds.length).toBeGreaterThan(0);
    expect(
      quotedTargetIds.every((targetId) =>
        playCapture?.input.playerView.own.gripOrHq.some(
          (card) => card.instanceId === targetId,
        ),
      ),
    ).toBe(true);
    expect(
      choiceCapture?.input.playerView.pendingChoice?.continuation,
    ).toMatchObject({
      family: "runner_grip_install_with_temporary_credits",
      originActionId:
        "runner.play_event.runner_onr_proteus_110_hijack_1.runner_onr_proteus_110_hijack_1",
      sourceCardDefinitionId: "onr_proteus_110_hijack",
      sourceCapabilityKey: "install_grip_program_or_hardware_with_temp_credits",
      createdAtStateVersion: 69,
    });
    expect(
      choiceCapture
        ? getPlayerView(choiceCapture.state, "corp").pendingChoice
        : undefined,
    ).toBeUndefined();
  }, 15_000);
});

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return result;
}
