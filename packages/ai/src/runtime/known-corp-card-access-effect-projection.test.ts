import type { AiDecisionInput, PlayerView, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { projectKnownCorpCardAccessEffect } from "./known-corp-card-access-effect-projection";

describe("projectKnownCorpCardAccessEffect", () => {
  it("projects optional Access cost, precise damage and tag semantics", () => {
    expect(
      projectKnownCorpCardAccessEffect({
        input: input("runner", { corpCredits: 4, runnerHandCount: 3 }),
        sourceDefinitionId: "onr_v1_345_trap",
        sourceCard: card("trap", "asset"),
      }),
    ).toMatchObject({
      status: "complete",
      activationCreditCost: 4,
      corpCanPayActivation: true,
      damage: {
        type: "net",
        amount: 3,
        runnerSurvivable: true,
        runnerHandBufferPreserved: false,
      },
      tags: 1,
    });
  });

  it("fails the optional effect closed as inapplicable when Corp cannot pay", () => {
    expect(
      projectKnownCorpCardAccessEffect({
        input: input("runner", { corpCredits: 3, runnerHandCount: 5 }),
        sourceDefinitionId: "onr_v1_345_trap",
        sourceCard: card("trap", "asset"),
      }),
    ).toMatchObject({
      status: "not_applicable",
      activationCreditCost: 4,
      corpCanPayActivation: false,
      threatValue: 0,
    });
  });

  it("scales visible program trash by advancement without inventing targets", () => {
    const source = card("experimental-ai", "asset");
    source.advancementCounters = 3;
    expect(
      projectKnownCorpCardAccessEffect({
        input: input("corp", { runnerRig: [] }),
        sourceDefinitionId: "onr_v1_323_experimental-ai",
        sourceCard: source,
      }),
    ).toMatchObject({
      status: "complete",
      relevantVisibleTargetCount: 0,
      threatValue: 0,
    });
  });

  it("projects only visible hardware targets for hardware-trash Ambushes", () => {
    const source = card("shattered-remains", "asset");
    source.advancementCounters = 2;
    expect(
      projectKnownCorpCardAccessEffect({
        input: input("corp", {
          runnerRig: [card("hardware", "hardware"), card("program", "program")],
        }),
        sourceDefinitionId: "onr_v1_315_corprunners-shattered-remains",
        sourceCard: source,
      }),
    ).toMatchObject({
      status: "complete",
      installedHardwareTrash: 1,
      relevantVisibleTargetCount: 1,
    });
  });
});

function input(
  side: "runner" | "corp",
  options: {
    corpCredits?: number;
    runnerHandCount?: number;
    runnerRig?: VisibleCard[];
  },
): AiDecisionInput {
  const runnerHand = Array.from(
    { length: options.runnerHandCount ?? 5 },
    (_, index) => card(`grip-${index}`, "event"),
  );
  return {
    side,
    playerView: {
      side,
      own:
        side === "corp"
          ? { credits: options.corpCredits ?? 5, gripOrHq: [], tags: 0 }
          : {
              credits: 5,
              gripOrHq: runnerHand,
              tags: 0,
              rig: options.runnerRig ?? [],
            },
      opponent:
        side === "corp"
          ? {
              credits: 5,
              handCount: options.runnerHandCount ?? 5,
              tags: 0,
              rig: options.runnerRig ?? [],
            }
          : {
              credits: options.corpCredits ?? 5,
              handCount: 5,
              tags: 0,
            },
    } as unknown as PlayerView,
  } as AiDecisionInput;
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return { instanceId, known: true, type };
}
