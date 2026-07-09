import { describe, expect, it } from "vitest";

import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.1.0.json";

describe("AI deck pool qualification", () => {
  it("includes only qualified Proteus snapshots in the promoted pool", () => {
    const proteusEntries = aiDeckPoolData.entries.filter((entry) => entry.tags.includes("proteus"));

    expect(proteusEntries).toHaveLength(4);
    expect(proteusEntries.every((entry) => entry.tags.includes("proteus_ai_qualified"))).toBe(true);
    expect(aiDeckPoolData.qualificationEvidence).toBe("data/ai/proteus-ai-selected-pilot-v1.json");
  });
});
