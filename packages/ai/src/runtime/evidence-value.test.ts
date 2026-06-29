import { describe, expect, it } from "vitest";

import {
  evidenceNumber,
  evidenceValue,
  hasEvidenceFlag,
  hasEvidencePrefix,
} from "./evidence-value";

describe("evidence value helpers", () => {
  it("matches exact flags and extracts prefixed values", () => {
    const entry = {
      evidence: [
        "structured_breaker_cost_profile:true",
        "structured_breaker_cost:3",
        "structured_breaker_costish:true",
      ],
    };

    expect(hasEvidenceFlag(entry, "structured_breaker_cost_profile:true")).toBe(
      true,
    );
    expect(hasEvidenceFlag(entry, "structured_breaker_cost:true")).toBe(false);
    expect(evidenceValue(entry, "structured_breaker_cost:")).toBe("3");
    expect(evidenceNumber(entry, "structured_breaker_cost:")).toBe(3);
    expect(hasEvidencePrefix(entry, "structured_breaker_cost:")).toBe(true);
  });
});
