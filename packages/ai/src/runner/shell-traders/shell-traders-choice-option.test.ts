import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedShellTradersStartTurnChoiceOptionId } from "./shell-traders-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("shell traders choice option", () => {
  it("uses structured remaining-counter metadata instead of label suffixes", () => {
    const choice = shellTradersChoice([
      {
        id: "card_decoder",
        label: "Simple Decoder (1)",
        metadata: { delayedInstallRemainingCounters: 3 },
      },
      {
        id: "card_fracter",
        label: "Simple Fracter (9)",
        metadata: { delayedInstallRemainingCounters: 1 },
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

  it("advances a missing breaker before a merely closer redundant target", () => {
    const choice = shellTradersChoice([
      {
        id: "card_redundant",
        label: "Redundant Decoder (1)",
        value: "redundant",
        metadata: { delayedInstallRemainingCounters: 1 },
      },
      {
        id: "card_missing",
        label: "Missing Fracter (2)",
        value: "missing",
        metadata: { delayedInstallRemainingCounters: 2 },
      },
    ]);
    const input = shellChoiceInput({
      rig: [program("installed-decoder", "decoder", 1)],
      setAside: [
        program("redundant", "decoder", 1),
        program("missing", "fracter", 1),
      ],
      memoryUsed: 1,
      memoryLimit: 4,
    });

    expect(
      selectedShellTradersStartTurnChoiceOptionId(choice, {
        input,
        rolesForCardId: roles,
      }),
    ).toBe("card_missing");
  });

  it("does not complete a target that would sacrifice the only other breaker when a safe target exists", () => {
    const choice = shellTradersChoice([
      {
        id: "card_killer",
        label: "Killer (1)",
        value: "killer",
        metadata: { delayedInstallRemainingCounters: 1 },
      },
      {
        id: "card_memory",
        label: "Memory (2)",
        value: "memory",
        metadata: { delayedInstallRemainingCounters: 2 },
      },
    ]);
    const input = shellChoiceInput({
      rig: [program("installed-fracter", "fracter", 1)],
      setAside: [program("killer", "killer", 1), hardware("memory", "memory")],
      memoryUsed: 1,
      memoryLimit: 1,
    });

    expect(
      selectedShellTradersStartTurnChoiceOptionId(choice, {
        input,
        rolesForCardId: roles,
      }),
    ).toBe("card_memory");
  });
});

function shellTradersChoice(options: PendingChoice["options"]): PendingChoice {
  return {
    choiceId: "choice_shell_traders",
    side: "runner",
    source: "runner_start.delayed_install:shell_traders_1:1",
    prompt: "The Shell Traders: 1 Shell-Counter entfernen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "public",
  };
}

function shellChoiceInput(params: {
  rig: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>;
  setAside: NonNullable<
    AiDecisionInput["playerView"]["specialZones"]
  >["setAside"];
  memoryUsed: number;
  memoryLimit: number;
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        rig: params.rig,
        memoryUsed: params.memoryUsed,
        memoryLimit: params.memoryLimit,
      },
      specialZones: {
        setAside: params.setAside,
        setAsideCount: params.setAside.length,
        removedFromGame: [],
        removedFromGameCount: 0,
      },
    },
  } as unknown as AiDecisionInput;
}

function program(instanceId: string, definitionId: string, memoryCost: number) {
  return {
    instanceId,
    definitionId,
    known: true,
    title: definitionId,
    type: "program" as const,
    memoryCost,
  };
}

function hardware(instanceId: string, definitionId: string) {
  return {
    instanceId,
    definitionId,
    known: true,
    title: definitionId,
    type: "hardware" as const,
  };
}

function roles(definitionId: string | undefined): readonly string[] {
  switch (definitionId) {
    case "decoder":
      return ["breaker_decoder"];
    case "fracter":
      return ["breaker_fracter"];
    case "killer":
      return ["breaker_killer"];
    case "memory":
      return ["memory_support"];
    default:
      return [];
  }
}
