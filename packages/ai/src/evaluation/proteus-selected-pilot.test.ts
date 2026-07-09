import pilotData from "../../../../data/ai/proteus-ai-selected-pilot-v1.json";
import { describe, expect, it } from "vitest";

describe("Proteus selected-deck pilot", () => {
  it("qualifies all four selected deck snapshots over the fixed seed matrix", () => {
    expect(pilotData.status).toBe("qualified");
    expect(pilotData.gatePassed).toBe(true);
    expect(pilotData.config.selectedDeckIds).toHaveLength(4);
    expect(pilotData.config.pairCount).toBe(4);
    expect(pilotData.totals.games).toBe(16);
    expect(pilotData.pairs.every((pair) => pair.games.length === 4)).toBe(true);
  });

  it("holds the legality, replay, redaction and Originalset regression gates", () => {
    expect(pilotData.gateChecks).toEqual({
      illegalActions: true,
      replay: true,
      redaction: true,
      actionLimit: true,
      noProgress: true,
      fallback: true,
      originalsetControl: true,
    });
    expect(pilotData.totals).toMatchObject({
      illegalActions: 0,
      replayFailures: 0,
      redactionFailures: 0,
    });
    expect(pilotData.originalsetControl.failures).toBe(0);
  });

  it("retains completion, action-limit, fallback and no-progress metrics", () => {
    expect(pilotData.thresholds).toMatchObject({
      actionLimitRateMax: expect.any(Number),
      noProgressRateMax: expect.any(Number),
      weightedFallbackRateMax: expect.any(Number),
    });
    expect(pilotData.rates).toMatchObject({
      completionRate: expect.any(Number),
      actionLimitRate: expect.any(Number),
      noProgressRate: expect.any(Number),
      weightedFallbackRate: expect.any(Number),
    });
  });

  it("stores replay-stable hashes for every pilot and control game", () => {
    const pilotGames = pilotData.pairs.flatMap((pair) => pair.games);
    expect(pilotGames.every((game) => game.replayOk)).toBe(true);
    expect(
      [...pilotGames, ...pilotData.originalsetControl.games].every((game) =>
        game.finalStateHash.startsWith("fnv1a:"),
      ),
    ).toBe(true);
  });
});
