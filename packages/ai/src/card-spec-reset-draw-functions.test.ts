import { readFileSync } from "node:fs";
import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";

const id = "onr_v1_101_mit-west-tier";
const entry = cardSpecPlanningCards().find((c) => c.definition.id === id)!;

it("projects compound pool reset and draw from mechanics without promising additive hand gain", () => {
  const hint = deriveCardSpecAiHint(entry);
  expect(hint.functionSignals).toEqual(
    expect.arrayContaining(["setup.draw", "zone.shuffle"]),
  );
  expect(hint.costProfile).toMatchObject({ clicks: 1, credits: 3 });
  expect(hint.actionCapabilitySemantics).toContainEqual(
    expect.objectContaining({
      capabilityKey: "abilities_on_play_shuffle_grip_trash_and_stack_then_draw",
    }),
  );
  expect(hint.effects?.some((e) => e.kind === "draw")).not.toBe(true);
  expect(hint.functionSignals).not.toContain("setup.recovery");
});

it("counts the generated reset draw source in the actual Redline Riot profile", () => {
  expect(AI_HINTS_BY_CARD.get(id)?.functionSignals).toContain("setup.draw");
  const native = JSON.parse(
    readFileSync(
      new URL(
        "evaluation/decision-checkpoints/fixtures/meta490-r2-g1-d304.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const source = native.input.ownDeckSnapshot;
  const snapshot = {
    ...source,
    cards: source.cards.map(
      (c: { cardId?: string; definitionId?: string; quantity: number }) => ({
        cardId: c.cardId ?? c.definitionId!,
        quantity: c.quantity,
      }),
    ),
  } as AiDeckStrategyDeckSnapshot;
  const profile = buildDeckStrategyProfile(snapshot);
  expect(snapshot.cards.find((card) => card.cardId === id)?.quantity).toBe(2);
  expect(profile.functionSignalCounts["setup.draw"]).toBe(8);
  expect(profile.runnerProfile?.setupProfile.draw).toBe(8);
});

it("recognizes reset mechanics on another supported card without planning annotations", () => {
  const other = cardSpecPlanningCards().find(
    (c) => c.definition.id === "onr_v1_095_jack-n-joe",
  )!;
  const planning = { ...entry.planning };
  delete planning.planningAnnotations;
  const hint = deriveCardSpecAiHint({ ...other, planning } as never);
  expect(hint.functionSignals).toEqual(
    expect.arrayContaining(["setup.draw", "zone.shuffle"]),
  );
});

it("does not add a pool shuffle to a plain draw event", () => {
  const draw = cardSpecPlanningCards().find(
    (c) => c.definition.id === "onr_v1_095_jack-n-joe",
  )!;
  expect(deriveCardSpecAiHint(draw).functionSignals).toContain("setup.draw");
  expect(deriveCardSpecAiHint(draw).functionSignals).not.toContain(
    "zone.shuffle",
  );
});
