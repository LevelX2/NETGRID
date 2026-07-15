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

  it("preserves a reviewed advancement burst while a visible agenda can use it", () => {
    const systematicLayoffs = corpCard(
      "onr_v1_304_systematic-layoffs",
      "operation",
    );
    const agenda = corpCard("simple_agenda", "agenda");
    const burst = score(
      systematicLayoffs,
      ["operation"],
      "corp",
      [],
      {},
      {
        extraGrip: [agenda],
      },
    );
    const neutral = score(
      corpCard("neutral-operation", "operation"),
      ["operation"],
      "corp",
      [],
      {},
      { extraGrip: [agenda] },
    );

    expect(burst.baseValue).toBeGreaterThan(neutral.baseValue + 300);
    expect(burst.evidence).toContain(
      "discard_score:corp_visible_agenda_advancement_burst",
    );
  });

  it("preserves a conditional Corp payoff only while a tag source remains reachable", () => {
    const payoff = corpCard("onr_v1_327_i-got-a-rock", "asset");
    const reachable = score(
      payoff,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        corpTagSourceState: "stack",
      },
    );
    const exhausted = score(
      payoff,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        corpTagSourceState: "archives",
      },
    );

    expect(reachable.baseValue).toBeGreaterThan(exhausted.baseValue + 500);
    expect(reachable.evidence).toContain(
      "discard_score:corp_conditional_payoff_reachable",
    );
    expect(exhausted.evidence).toContain(
      "discard_score:corp_conditional_payoff_blocked",
    );
  });

  it("preserves a visible Corp tag source while a coupled payoff remains reachable", () => {
    const tagSource = corpCard("onr_v1_283_audit-of-call-records", "operation");
    const payoff = corpCard("onr_v1_327_i-got-a-rock", "asset");
    const paired = score(
      tagSource,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        extraGrip: [payoff],
        corpTagSourceState: "stack",
      },
    );
    const unpaired = score(tagSource);

    expect(paired.baseValue).toBeGreaterThan(unpaired.baseValue + 300);
    expect(paired.evidence).toContain("discard_score:corp_tag_source_enabler");
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

  it("preserves program search while known breaker coverage is only in the stack", () => {
    const search = runnerCard("runner-program-search", "event");
    const unavailableBreaker = score(
      search,
      ["program_search"],
      "runner",
      [],
      {},
      { breakerCoverage: "stack_only" },
    );
    const installedBreaker = score(
      search,
      ["program_search"],
      "runner",
      [],
      {},
      { breakerCoverage: "installed" },
    );

    expect(unavailableBreaker.baseValue).toBeGreaterThan(
      installedBreaker.baseValue + 300,
    );
    expect(unavailableBreaker.evidence).toContain(
      "discard_score:runner_missing_breaker_search_access",
    );
    expect(installedBreaker.evidence).not.toContain(
      "discard_score:runner_missing_breaker_search_access",
    );
  });

  it("protects a reachable hard damage payoff over an inactive soft tag payoff", () => {
    const hardDamage = score(
      corpCard("onr_v1_302_scorched-earth", "operation"),
      [],
      "corp",
      [],
      {},
      { corpTagSourceState: "stack" },
    );
    const softCreditPunish = score(
      corpCard("onr_v1_285_closed-accounts", "operation"),
      [],
      "corp",
      [],
      {},
      { corpTagSourceState: "stack" },
    );

    expect(hardDamage.baseValue).toBeGreaterThan(
      softCreditPunish.baseValue + 300,
    );
    expect(softCreditPunish.evidence).toContain(
      "discard_score:corp_soft_tag_payoff_not_live",
    );
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

  it("preserves unique Runner memory support over redundant neutral copies", () => {
    const memorySupport = runnerCard("unique-memory-support", "hardware");
    const neutral = runnerCard("neutral-duplicate", "resource");
    const secondNeutral = {
      ...runnerCard("neutral-duplicate", "resource"),
      instanceId: "neutral-duplicate-second-instance",
    };
    const memoryScore = score(
      memorySupport,
      ["memory", "setup", "build_rig"],
      "runner",
      [],
      {},
      { extraGrip: [neutral, secondNeutral] },
    );
    const neutralScore = score(
      neutral,
      [],
      "runner",
      [],
      {},
      { extraGrip: [secondNeutral, memorySupport] },
    );

    expect(memoryScore.baseValue).toBeGreaterThan(neutralScore.baseValue);
  });

  it("discards excess copies of an installed breaker before a unique support program", () => {
    const krash = runnerCard("krash", "program");
    const secondKrash = {
      ...runnerCard("krash", "program"),
      instanceId: "krash-second-instance",
    };
    const installedKrash = {
      ...runnerCard("krash", "program"),
      instanceId: "krash-installed-instance",
    };
    const support = runnerCard("clown", "program");
    const redundantBreaker = score(
      krash,
      ["breaker_fracter", "breaker_decoder", "breaker_killer"],
      "runner",
      [installedKrash],
      {
        krash: ["breaker_fracter", "breaker_decoder", "breaker_killer"],
      },
      { extraGrip: [secondKrash, support] },
    );
    const uniqueSupport = score(
      support,
      ["ice_modifier", "run_support", "build_rig"],
      "runner",
      [installedKrash],
      {
        krash: ["breaker_fracter", "breaker_decoder", "breaker_killer"],
      },
      { extraGrip: [krash, secondKrash] },
    );

    expect(redundantBreaker.baseValue).toBeLessThan(uniqueSupport.baseValue);
  });

  it("keeps Streetware over redundant Krash copies despite persisted breaker-search intent", () => {
    const streetware = runnerCard(
      "onr_proteus_150_streetware-distributor",
      "resource",
    );
    const firstKrash = runnerCard("onr_v1_039_krash", "program");
    const secondKrash = {
      ...runnerCard("onr_v1_039_krash", "program"),
      instanceId: "krash-second-instance",
    };
    const pattelsVirus = runnerCard("onr_v1_046_pattels-virus", "program");
    const cloak = runnerCard("onr_v1_011_cloak", "program");
    const installedKrash = {
      ...runnerCard("onr_v1_039_krash", "program"),
      instanceId: "krash-installed-instance",
    };
    const rolesByCardId: Record<string, readonly string[]> = {
      onr_v1_039_krash: [
        "breaker_fracter",
        "breaker_decoder",
        "breaker_killer",
      ],
      "onr_v1_046_pattels-virus": ["ice_modifier", "run_support"],
      onr_v1_011_cloak: ["economy_recurring", "run_support"],
      "onr_proteus_150_streetware-distributor": [
        "economy",
        "economy_recurring",
      ],
    };
    const redundantKrash = score(
      firstKrash,
      rolesByCardId["onr_v1_039_krash"],
      "runner",
      [installedKrash],
      rolesByCardId,
      {
        credits: 4,
        extraGrip: [secondKrash, pattelsVirus, cloak, streetware],
        strategyId: "runner.search.breaker",
      },
    );
    const persistentEconomy = score(
      streetware,
      rolesByCardId["onr_proteus_150_streetware-distributor"],
      "runner",
      [installedKrash],
      rolesByCardId,
      {
        credits: 4,
        extraGrip: [firstKrash, secondKrash, pattelsVirus, cloak],
        strategyId: "runner.search.breaker",
      },
    );

    expect(persistentEconomy.total).toBeGreaterThan(redundantKrash.total);
    expect(persistentEconomy.baseValue).toBeGreaterThan(
      redundantKrash.baseValue,
    );
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
    strategyId?: string;
    breakerCoverage?: "stack_only" | "installed";
    agendaPoints?: number;
    corpTagSourceState?: "stack" | "archives";
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
    strategyId?: string;
    breakerCoverage?: "stack_only" | "installed";
    agendaPoints?: number;
    corpTagSourceState?: "stack" | "archives";
  } = {},
): AiDecisionInput {
  const decisionInput = {
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
        agendaPoints: options.agendaPoints ?? 0,
        gripOrHq: [card, ...(options.extraGrip ?? [])],
        rig: [...rig],
        stackOrRdCount: 20,
        heapOrArchives:
          side === "corp" && options.corpTagSourceState === "archives"
            ? [corpCard("onr_v1_284_chance-observation", "operation")]
            : [],
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
  if (options.strategyId) {
    Object.assign(decisionInput, {
      ownStrategicIntentState: {
        primaryStrategy: {
          strategyId: options.strategyId,
          family: "runner_setup",
        },
      },
    });
  }
  if (side === "corp" && options.corpTagSourceState) {
    Object.assign(decisionInput, {
      ownDeckSnapshot: {
        cards: [
          { cardId: card.definitionId, quantity: 1 },
          { cardId: "onr_v1_284_chance-observation", quantity: 1 },
        ],
      },
    });
  }
  if (side === "runner" && options.breakerCoverage) {
    const installed = options.breakerCoverage === "installed";
    Object.assign(decisionInput, {
      ownDeckCapabilities: {
        side: "runner",
        runner: {
          breakerCoverageMatrix: {
            wall: {
              inDeckKnown: true,
              inHand: false,
              installed,
            },
            code_gate: {
              inDeckKnown: true,
              inHand: false,
              installed,
            },
            sentry: {
              inDeckKnown: true,
              inHand: false,
              installed,
            },
          },
        },
      },
    });
  }
  return decisionInput;
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
