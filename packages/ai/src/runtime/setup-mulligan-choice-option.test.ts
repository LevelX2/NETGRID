import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedSetupMulliganChoiceOptionId } from "./setup-mulligan-choice-option";

describe("selectedSetupMulliganChoiceOptionId", () => {
  it("fails closed when the decision is not an offered option", () => {
    const choice = {
      options: [{ id: "keep" }, { id: "mulligan" }],
    } as NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

    expect(selectedSetupMulliganChoiceOptionId(choice, "mulligan")).toBe("mulligan");
    expect(selectedSetupMulliganChoiceOptionId(choice, "unknown")).toBeUndefined();
  });
});
