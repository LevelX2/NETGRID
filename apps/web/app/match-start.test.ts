import { describe, expect, it } from "vitest";
import { deriveMatchStart, matchFormatCardLabel, matchStartSummary, parseJoinLinkInput, playModeCardLabel } from "./match-start";

describe("V1.0.4 match start derivation", () => {
  it("keeps Human-vs-Human side assignment server-readable", () => {
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "random", humanAiSideSelection: "random" })).toMatchObject({
      technicalMode: "human_vs_human",
      hostSide: "random",
      createRequest: { mode: "human_vs_human", hostSide: "random" }
    });
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "runner", humanAiSideSelection: "random" }).createRequest).toEqual({
      mode: "human_vs_human",
      hostSide: "runner"
    });
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "corp", humanAiSideSelection: "random" }).createRequest).toEqual({
      mode: "human_vs_human",
      hostSide: "corp"
    });
  });

  it("keeps Human-vs-AI random side assignment on the server", () => {
    expect(deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "runner" })).toMatchObject({
      technicalMode: "human_runner_vs_corp_ai",
      createRequest: { playMode: "human_vs_ai", humanSide: "runner" }
    });
    expect(deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "corp" })).toMatchObject({
      technicalMode: "human_corp_vs_runner_ai",
      createRequest: { playMode: "human_vs_ai", humanSide: "corp" }
    });
    const random = deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "random" });
    expect(random.technicalMode).toBeUndefined();
    expect(random).toMatchObject({
      hostSide: "random",
      createRequest: { playMode: "human_vs_ai", humanSide: "random", hostSide: "random" }
    });
  });

  it("routes AI-vs-AI to the simulation path", () => {
    expect(deriveMatchStart({ playMode: "ai_vs_ai", humanSideSelection: "random", humanAiSideSelection: "random" })).toMatchObject({
      isSimulation: true,
      createRequest: { simulation: "ai_vs_ai" }
    });
  });

  it("labels V1.1.2 play mode and format cards without changing technical modes", () => {
    expect(playModeCardLabel("human_vs_human")).toEqual({ title: "Privates Duell", description: "Zwei Menschen per Link" });
    expect(playModeCardLabel("human_vs_ai")).toEqual({ title: "Gegen KI", description: "Schnelles Spiel gegen eine KI-Seite" });
    expect(playModeCardLabel("ai_vs_ai")).toEqual({ title: "Simulation", description: "KI gegen KI zum Beobachten und Testen" });
    expect(matchFormatCardLabel("rules_match")).toEqual({ title: "Regelmatch", description: "7 Agendapunkte, ein Spiel" });
    expect(matchFormatCardLabel("two_game_side_swap")).toEqual({ title: "Matchserie", description: "Zwei Spiele mit Seitenwechsel" });
  });

  it("parses Join-Links and ignores unknown query parameters", () => {
    expect(parseJoinLinkInput("https://netgrid.local/?matchId=match_123&joinToken=join_456&x=1")).toEqual({
      matchId: "match_123",
      joinToken: "join_456"
    });
    expect(parseJoinLinkInput("/?matchId=local_match&joinToken=local_token")).toEqual({
      matchId: "local_match",
      joinToken: "local_token"
    });
    expect(parseJoinLinkInput("not a join link")).toBeNull();
    expect(parseJoinLinkInput("?matchId=missing-token")).toBeNull();
  });

  it("builds a side-safe match start summary without token or deck details", () => {
    const summary = matchStartSummary({
      playMode: "human_vs_human",
      matchFormat: "rules_match",
      humanSideSelection: "random",
      humanAiSideSelection: "random"
    });

    expect(summary).toContain("Privates Duell");
    expect(summary).toContain("Seite wird ausgelost");
    expect(summary).toContain("Regelmatch bis 7 Agendapunkte");
    expect(summary.join(" ")).not.toMatch(/token|hash|deck_/i);
  });
});
