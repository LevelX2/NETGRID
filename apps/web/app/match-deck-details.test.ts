import { describe, expect, it } from "vitest";
import { isHumanVsAiMatchMode } from "./match-deck-details";

describe("isHumanVsAiMatchMode", () => {
  it("recognizes both human-versus-AI side assignments", () => {
    expect(isHumanVsAiMatchMode("human_runner_vs_corp_ai")).toBe(true);
    expect(isHumanVsAiMatchMode("human_corp_vs_runner_ai")).toBe(true);
  });

  it("does not expose an opponent deck name in human or observer matches", () => {
    expect(isHumanVsAiMatchMode("human_vs_human")).toBe(false);
    expect(isHumanVsAiMatchMode("ai_vs_ai")).toBe(false);
    expect(isHumanVsAiMatchMode(undefined)).toBe(false);
  });
});
