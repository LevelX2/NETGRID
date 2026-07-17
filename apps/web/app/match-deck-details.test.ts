import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isHumanVsAiMatchMode } from "./match-deck-details";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

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

  it("renders own and conditional AI deck metadata in the existing status strip", () => {
    expect(pageSource).toContain("<strong>Eigenes Deck</strong>");
    expect(pageSource).toContain("activeView.deckMetadata.own.deckName");
    expect(pageSource).toContain(
      "activeView.deckMetadata && humanOpponentIsAi",
    );
    expect(pageSource).toContain("<strong>KI-Deck</strong>");
    expect(pageSource).toContain("activeView.deckMetadata.opponent.deckName");
    expect(pageSource).not.toContain("<OwnDeckStrip");
  });
});
