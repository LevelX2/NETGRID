import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedShellTradersStartTurnChoiceOptionId } from "./shell-traders-choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

describe("shell traders choice option", () => {
  it("uses structured remaining-counter metadata instead of label suffixes", () => {
    const choice = shellTradersChoice([
      {
        id: "card_decoder",
        label: "Simple Decoder (1)",
        metadata: { shellTradersRemainingCounters: 3 },
      },
      {
        id: "card_fracter",
        label: "Simple Fracter (9)",
        metadata: { shellTradersRemainingCounters: 1 },
      },
    ]);

    expect(selectedShellTradersStartTurnChoiceOptionId(choice)).toBe(
      "card_fracter",
    );
  });

  it("does not infer remaining counters from labels without metadata", () => {
    const choice = shellTradersChoice([
      {
        id: "card_hardware",
        label: "Alpha Hardware (1)",
        card: {
          instanceId: "hardware_1",
          known: true,
          title: "Alpha Hardware",
          type: "hardware",
        },
      },
      {
        id: "card_program",
        label: "Zulu Program (9)",
        card: {
          instanceId: "program_1",
          known: true,
          title: "Zulu Program",
          type: "program",
        },
      },
    ]);

    expect(selectedShellTradersStartTurnChoiceOptionId(choice)).toBe(
      "card_program",
    );
  });
});

function shellTradersChoice(options: PendingChoice["options"]): PendingChoice {
  return {
    choiceId: "choice_shell_traders",
    side: "runner",
    source: "v1912.shell_traders_start_turn:shell_traders_1:1",
    prompt: "The Shell Traders: 1 Shell-Counter entfernen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "public",
  };
}
