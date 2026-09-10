import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

it("derives repeatable conditional run credits from the mechanic, including a renamed variant", () => {
  const entry = cardSpecPlanningCards().find(
    (c) =>
      c.planning.engine.uniqueDirectLongtail?.kind ===
      "successful_run_end_credit_resource",
  )!;
  for (const amount of [1, 2]) {
    const mechanic = entry.planning.engine.uniqueDirectLongtail!;
    if (mechanic.kind !== "successful_run_end_credit_resource")
      throw Error("fixture");
    const variant = {
      ...entry,
      definition: {
        ...entry.definition,
        title: "Independent run income fixture",
      },
      planning: {
        ...entry.planning,
        engine: {
          ...entry.planning.engine,
          uniqueDirectLongtail: { ...mechanic, amount },
        },
      },
    };
    const hint = deriveCardSpecAiHint(
      variant as unknown as Parameters<typeof deriveCardSpecAiHint>[0],
    );
    expect(hint.effects).toContainEqual({
      kind: "economy",
      scope: "runner",
      timing: "after_successful_run",
      resource: "credits",
      target: "run.successful_run_credit_gain",
      amount,
      repeatable: true,
    });
    expect(hint.conditions).toContainEqual({ kind: "requires_successful_run" });
    expect(() =>
      deriveCardSpecAiHint({
        ...variant,
        planning: {
          ...variant.planning,
          engine: {
            ...variant.planning.engine,
            uniqueDirectLongtail: { ...mechanic, amount: -1 },
          },
        },
      } as unknown as Parameters<typeof deriveCardSpecAiHint>[0]),
    ).toThrow(/successful_run_credit_shape/);
  }
});
