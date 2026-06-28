import { describe, expect, it } from "vitest";

import { playfulAiGainValue } from "./choice-option";

describe("playfulAiGainValue", () => {
  it("uses structured option values and ignores label-only credit amounts", () => {
    expect(
      playfulAiGainValue({
        id: "take_credits",
        value: 3,
        label: "3 Credits nehmen",
      }),
    ).toBe(3);
    expect(
      playfulAiGainValue({
        id: "take_credits",
        label: "9 Credits nehmen",
      }),
    ).toBe(0);
    expect(
      playfulAiGainValue({
        id: "gain_2_set_aside_1",
        label: "label without amount",
      }),
    ).toBe(2);
    expect(
      playfulAiGainValue({
        id: "gain_2_set_aside_1_noise",
        label: "label without amount",
      }),
    ).toBe(0);
    expect(
      playfulAiGainValue({
        id: "prefix_gain_2_set_aside_1",
        label: "label without amount",
      }),
    ).toBe(0);
  });
});
