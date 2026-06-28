import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { discardKeepScore } from "./discard-keep-score";

describe("discard keep score", () => {
  it("does not classify Corp discard value from definition id text alone", () => {
    const idOnlyEconomy = corpCard("custom-economy-operation", "operation");
    const idOnlyIce = corpCard("custom_remote_ice_plan", "operation");

    expect(score(idOnlyEconomy).baseValue).toBe(80);
    expect(score(idOnlyIce).baseValue).toBe(80);
  });

  it("keeps Corp discard value from structured type and roles", () => {
    expect(score(corpCard("visible-ice", "ice")).baseValue).toBeGreaterThan(
      score(corpCard("neutral-operation", "operation")).baseValue,
    );
    expect(
      score(corpCard("role-economy-operation", "operation"), ["economy_asset"])
        .baseValue,
    ).toBeGreaterThan(score(corpCard("neutral-operation", "operation")).baseValue);
  });

  it("ignores substring-only Corp discard role noise", () => {
    const benignRole = score(corpCard("benign-role", "operation"), [
      "neutral_support",
    ]).baseValue;

    expect(
      score(corpCard("microeconomy-role", "operation"), ["microeconomy"])
        .baseValue,
    ).toBe(benignRole);
    expect(
      score(corpCard("remotecontrol-role", "operation"), [
        "remotecontrol_noise",
      ]).baseValue,
    ).toBe(benignRole);
  });

  it("matches Runner discard value roles by bounded role terms", () => {
    const neutral = score(
      runnerCard("neutral-runner-card", "program"),
      ["neutral_support"],
      "runner",
    ).baseValue;

    expect(
      score(
        runnerCard("runner-setup-card", "program"),
        ["support_memory", "build_rig", "draw", "run_pressure"],
        "runner",
      ).baseValue,
    ).toBeGreaterThan(neutral);
    expect(
      score(
        runnerCard("runner-noise-card", "program"),
        [
          "memoryish_noise",
          "build_rigish_noise",
          "drawish_noise",
          "run_pressureish_noise",
        ],
        "runner",
      ).baseValue,
    ).toBe(neutral);
  });

  it("matches installed duplicate breaker roles by bounded role terms", () => {
    const freshBreaker = score(
      runnerCard("fresh-breaker", "program"),
      ["breaker_fracter"],
      "runner",
      [],
    ).baseValue;
    const installedSameBreaker = score(
      runnerCard("duplicate-breaker", "program"),
      ["breaker_fracter"],
      "runner",
      [runnerCard("installed-fracter", "program")],
      {
        "installed-fracter": ["support_breaker_fracter"],
      },
    ).baseValue;
    const installedNoise = score(
      runnerCard("noise-breaker", "program"),
      ["breaker_fracter"],
      "runner",
      [runnerCard("installed-noise", "program")],
      {
        "installed-noise": ["breaker_fracterish_noise"],
      },
    ).baseValue;

    expect(installedSameBreaker).toBeLessThan(freshBreaker);
    expect(installedNoise).toBe(freshBreaker);
  });
});

function score(
  card: VisibleCard,
  roles: readonly string[] = [],
  side: "corp" | "runner" = "corp",
  rig: readonly VisibleCard[] = [],
  rolesByCardId: Record<string, readonly string[]> = {},
) {
  return discardKeepScore(input(card, side, rig), card, {
    rolesForCardId: (cardId) =>
      cardId === card.definitionId ? roles : rolesByCardId[cardId ?? ""] ?? [],
    definitionTypeForCardId: () => card.type,
    visibleCardPlayOrInstallCost: () => 0,
    runnerCardAddressesVisibleBreakerNeed: () => false,
    runnerBadPublicityOrTraceTechCard: () => false,
    isRunnerEconomyRole: (role) => role.includes("economy"),
    runnerCardLooksLikeCreditPayout: () => false,
  });
}

function input(
  card: VisibleCard,
  side: "corp" | "runner",
  rig: readonly VisibleCard[] = [],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 1,
      timingPoint: "corp_discard.discard",
      activeSide: "corp",
      phase: "corp_discard_phase",
      own: {
        identity:
          side === "corp"
            ? corpCard("corp-identity", "identity")
            : runnerCard("runner-identity", "identity"),
        credits: 5,
        clicks: 0,
        agendaPoints: 0,
        gripOrHq: [card],
        rig: [...rig],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity:
          side === "corp"
            ? runnerCard("runner-identity", "identity")
            : corpCard("corp-identity", "identity"),
        credits: 5,
        clicks: 0,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "discard-score-test",
    decisionId: "discard-score-test",
    actionNumber: 1,
    profileId: side,
  } as unknown as AiDecisionInput;
}

function corpCard(definitionId: string, type: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    side: "corp",
    type,
    zone: "hq",
    visibility: "private",
    known: true,
  } as VisibleCard;
}

function runnerCard(definitionId: string, type: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    side: "runner",
    type,
    zone: "grip",
    visibility: "private",
    known: true,
  } as VisibleCard;
}
