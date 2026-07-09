import { describe, expect, it } from "vitest";
import { aiDeckReadinessLabel, deriveMatchStart, matchCardPoolCardLabel, matchFormatCardLabel, matchStartLobbyBlocksSetup, matchStartPlayerClockLabel, matchStartSummary, parseJoinLinkInput, playModeCardLabel } from "./match-start";

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
    expect(matchCardPoolCardLabel("originalset")).toEqual({ title: "Nur Originalset", description: "Zusatzsets werden nicht zugelassen" });
    expect(matchCardPoolCardLabel("originalset_classic")).toEqual({ title: "Originalset & Classic", description: "Classic wird als Zusatzset zugelassen" });
    expect(matchCardPoolCardLabel("originalset_proteus")).toEqual({ title: "Originalset & Protheus", description: "Protheus wird als Zusatzset zugelassen" });
    expect(matchCardPoolCardLabel("originalset_classic_proteus")).toEqual({ title: "Originalset & Classic & Protheus", description: "Beide Zusatzsets werden zugelassen" });
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
      matchCardPool: "originalset_classic_proteus",
      humanSideSelection: "random",
      humanAiSideSelection: "random"
    });

    expect(summary).toContain("Privates Duell");
    expect(summary).toContain("Seite wird ausgelost");
    expect(summary).toContain("Regelmatch bis 7 Agendapunkte");
    expect(summary).toContain("Kartenpool: Originalset & Classic & Protheus");
    expect(summary.join(" ")).not.toMatch(/token|hash|deck_/i);
  });

  it("summarizes KI deck reuse without exposing deck details", () => {
    const summary = matchStartSummary({
      playMode: "human_vs_ai",
      matchFormat: "rules_match",
      matchCardPool: "originalset",
      humanSideSelection: "random",
      humanAiSideSelection: "runner",
      aiDeckPolicy: "same_as_participant_a"
    });

    expect(summary).toContain("KI-Decks: wie Teilnehmer A");
    expect(summary.join(" ")).not.toMatch(/token|hash|deck_/i);
  });

  it("distinguishes Proteus selected-deck and default-pool readiness", () => {
    expect(aiDeckReadinessLabel("selected", "originalset_proteus")).toEqual({
      title: "Protheus-KI: Selected/Pilot freigegeben",
      detail: "Explizit gewählte KI-Decks · side-sicherer Playtest-Stand",
      ready: true
    });
    expect(aiDeckReadinessLabel("same_as_participant_a", "originalset_classic_proteus").title).toBe("Protheus-KI: Selected/Pilot freigegeben");
    expect(aiDeckReadinessLabel("fixed", "originalset_proteus")).toEqual({
      title: "Protheus-KI: Standardpool freigegeben",
      detail: "Vier qualifizierte Pilotdecks · Fixed und Seeded Random",
      ready: true
    });
    expect(aiDeckReadinessLabel("seeded_random", "originalset_classic_proteus").title).toBe("Protheus-KI: Standardpool freigegeben");
  });

  it("keeps non-Proteus readiness labels pool-generic", () => {
    expect(aiDeckReadinessLabel("selected", "originalset")).toMatchObject({ title: "Auswahlmodus freigegeben", ready: true });
    expect(aiDeckReadinessLabel("fixed", "originalset_classic")).toMatchObject({ title: "Standardpool freigegeben", ready: true });
  });

  it("does not let terminal lobby statuses block the match-start setup", () => {
    expect(matchStartLobbyBlocksSetup("pending")).toBe(true);
    expect(matchStartLobbyBlocksSetup("ready_check")).toBe(true);
    expect(matchStartLobbyBlocksSetup("countdown")).toBe(true);
    expect(matchStartLobbyBlocksSetup("cancelled")).toBe(false);
    expect(matchStartLobbyBlocksSetup("abandoned")).toBe(false);
    expect(matchStartLobbyBlocksSetup("finished")).toBe(false);
    expect(matchStartLobbyBlocksSetup("forfeited")).toBe(false);
  });

  it("labels player-clock settings for the start lobby", () => {
    expect(matchStartPlayerClockLabel(undefined)).toBe("Ohne Spielerzeit");
    expect(matchStartPlayerClockLabel({ schemaVersion: "player-clock-v1", mode: "none", consumedMs: { runner: 0, corp: 0 }, warningLevel: "none" })).toBe("Ohne Spielerzeit");
    expect(
      matchStartPlayerClockLabel({
        schemaVersion: "player-clock-v1",
        mode: "player_clock",
        startingTimeMs: 20 * 60_000,
        gracePeriodMs: 15_000,
        remainingMs: { runner: 20 * 60_000, corp: 20 * 60_000 },
        consumedMs: { runner: 0, corp: 0 },
        warningLevel: "none"
      })
    ).toBe("Spielerzeit 20 Min · 15 s Kulanz");
  });
});
