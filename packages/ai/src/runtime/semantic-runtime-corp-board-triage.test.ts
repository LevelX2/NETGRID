import { describe, expect, it } from "vitest";
import { normalizedCorpBoardTriageValue } from "./semantic-runtime-corp-board-triage";

describe("semantic runtime corp board triage", () => {
  it("normalizes boardstate triage values into the AI-COMPLETE-17 consumer scale", () => {
    expect(normalizedCorpBoardTriageValue(0)).toBe(0);
    expect(normalizedCorpBoardTriageValue(850)).toBe(17);
    expect(normalizedCorpBoardTriageValue(1200)).toBe(24);
    expect(normalizedCorpBoardTriageValue(-2200)).toBe(-44);
    expect(normalizedCorpBoardTriageValue(-4200)).toBe(-84);
    expect(normalizedCorpBoardTriageValue(7000)).toBe(100);
  });
});
