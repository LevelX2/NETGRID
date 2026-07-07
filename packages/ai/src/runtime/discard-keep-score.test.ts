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
      score(corpCard("role-ice-operation", "operation"), ["remote_ice"])
        .baseValue,
    ).toBeGreaterThan(
      score(corpCard("neutral-operation", "operation")).baseValue,
    );
    expect(
      score(corpCard("role-economy-operation", "operation"), ["economy_asset"])
        .baseValue,
    ).toBeGreaterThan(
      score(corpCard("neutral-operation", "operation")).baseValue,
    );
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
    expect(
      score(corpCard("icecream-role", "operation"), ["nice_noise"]).baseValue,
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
    const supportBreaker = score(
      runnerCard("support-breaker", "program"),
      ["support_breaker_fracter"],
      "runner",
      [],
    ).baseValue;
    const candidateNoise = score(
      runnerCard("candidate-noise", "program"),
      ["breaker_fracterish_noise"],
      "runner",
      [],
    ).baseValue;

    expect(installedSameBreaker).toBeLessThan(freshBreaker);
    expect(installedNoise).toBe(freshBreaker);
    expect(supportBreaker).toBe(freshBreaker);
    expect(candidateNoise).toBeLessThan(freshBreaker);
  });

  it("keeps playable nonduplicate Runner economy well above neutral discard fodder", () => {
    const economy = score(
      runnerCard("runner-broker", "resource"),
      ["economy"],
      "runner",
      [],
      {},
      { credits: 3, legalActionForCard: true },
    ).baseValue;
    const neutral = score(
      runnerCard("runner-neutral", "resource"),
      [],
      "runner",
      [],
      {},
      { credits: 3 },
    ).baseValue;

    expect(economy).toBeGreaterThan(neutral + 300);
  });

  it("devalues non-additive Runner utility duplicates already represented in the rig", () => {
    const freshUtility = score(
      runnerCard("runner-stack-filter", "resource"),
      ["program_search"],
      "runner",
      [],
    ).baseValue;
    const installedDuplicate = score(
      runnerCard("runner-stack-filter", "resource"),
      ["program_search"],
      "runner",
      [runnerCard("runner-stack-filter", "resource")],
    ).baseValue;

    expect(installedDuplicate).toBeLessThan(freshUtility - 100);
  });
});

function score(
  card: VisibleCard,
  roles: readonly string[] = [],
  side: "corp" | "runner" = "corp",
  rig: readonly VisibleCard[] = [],
  rolesByCardId: Record<string, readonly string[]> = {},
  options: {
    credits?: number;
    extraGrip?: readonly VisibleCard[];
    legalActionForCard?: boolean;
  } = {},
) {
  return discardKeepScore(input(card, side, rig, options), card, {
    rolesForCardId: (cardId) =>
      cardId === card.definitionId
        ? roles
        : (rolesByCardId[cardId ?? ""] ?? []),
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
  options: {
    credits?: number;
    extraGrip?: readonly VisibleCard[];
    legalActionForCard?: boolean;
  } = {},
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
        credits: options.credits ?? 5,
        clicks: 0,
        agendaPoints: 0,
        gripOrHq: [card, ...(options.extraGrip ?? [])],
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
      legalActions: options.legalActionForCard
        ? [
            {
              actionId: "use-card",
              side,
              type: side === "runner" ? "install_card" : "play_operation",
              source: card.instanceId,
            },
          ]
        : [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: options.legalActionForCard
      ? [
          {
            actionId: "use-card",
            side,
            type: side === "runner" ? "install_card" : "play_operation",
            source: card.instanceId,
          },
        ]
      : [],
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
