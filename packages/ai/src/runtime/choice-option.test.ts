import { describe, expect, it } from "vitest";
import { selectedPlayfulAiChoiceOptionId } from "./playful-ai-choice-option";

describe("selectedPlayfulAiChoiceOptionId", () => {
  it("ranks the explicit gain with opaque option IDs", () => {
    expect(
      selectedPlayfulAiChoiceOptionId([
        { id: "17", label: "Aufteilung A", value: 3 },
        { id: "18", label: "Aufteilung B", value: 2 },
      ]),
    ).toBe("17");
  });

  it("rejects an offer with a missing gain despite a descriptive ID", () => {
    expect(
      selectedPlayfulAiChoiceOptionId([
        { id: "gain_2_set_aside_1", label: "2 Credits nehmen" },
        { id: "gain_1_set_aside_2", label: "1 Credit nehmen", value: 1 },
      ]),
    ).toBeUndefined();
  });
});
