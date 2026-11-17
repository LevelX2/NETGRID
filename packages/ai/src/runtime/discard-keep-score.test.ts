import { AI_HINTS_BY_CARD } from "../ai-hints";
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

  it("reuses Corp hand pressure and duplicate facts as discard evidence", () => {
    const card = corpCard("duplicate-operation", "operation");
    const result = score(
      card,
      [],
      "corp",
      [],
      {},
      {
        extraGrip: [{ ...card, instanceId: "duplicate-operation-2" }],
      },
    );

    expect(result.evidence).toContain(
      "discard_score:corp_hand_pressure:under_capacity",
    );
    expect(result.evidence).toContain(
      "discard_score:corp_hand_duplicate_count:2",
    );
  });

  it("never discounts Corp agendas merely because HQ contains a duplicate", () => {
    const tycho = {
      ...corpCard(432, "agenda"),
      agendaPoints: 4,
    };
    const duplicateTycho = {
      ...tycho,
      instanceId: "tycho-duplicate-instance",
    };
    const redundantAtFour = score(
      tycho,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 4,
        extraGrip: [duplicateTycho],
      },
    );
    const neededAtZero = score(
      tycho,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 0,
        extraGrip: [duplicateTycho],
      },
    );

    expect(redundantAtFour.baseValue).toBe(neededAtZero.baseValue);
    expect(redundantAtFour.evidence).not.toContain(
      "discard_score:corp_redundant_winning_agenda_duplicate",
    );
  });

  it("ranks agenda score efficiency and redundancy only under real Corp overflow", () => {
    const tycho = corpCard(432, "agenda");
    const firstCfo = corpCard(
      400,
      "agenda",
    );
    const secondCfo = { ...firstCfo, instanceId: "cfo-duplicate" };
    const ice = corpCard("overflow-ice", "ice");
    const moreIce = [
      ice,
      { ...ice, instanceId: "overflow-ice-2" },
      { ...ice, instanceId: "overflow-ice-3" },
    ];
    const tychoValue = score(
      tycho,
      [],
      "corp",
      [],
      {},
      {
        extraGrip: [firstCfo, secondCfo, ...moreIce],
      },
    );
    const cfoValue = score(
      firstCfo,
      [],
      "corp",
      [],
      {},
      {
        extraGrip: [secondCfo, tycho, ...moreIce],
      },
    );

    expect(tychoValue.total).toBeGreaterThan(cfoValue.total);
    expect(cfoValue.total).toBeLessThan(
      score(
        ice,
        ["ice"],
        "corp",
        [],
        {},
        {
          extraGrip: [
            { ...ice, instanceId: "overflow-ice-2" },
            { ...ice, instanceId: "overflow-ice-3" },
            firstCfo,
            secondCfo,
            tycho,
          ],
        },
      ).total,
    );
    expect(cfoValue.evidence).toContain(
      "discard_score:corp_redundant_agenda_under_overflow",
    );
  });

  it("preserves a reviewed advancement burst while a visible agenda can use it", () => {
    const systematicLayoffs = corpCard(
      516,
      "operation",
    );
    const agenda = corpCard(588, "agenda");
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

  it("does not count counter movement as new advancement without an installed donor", () => {
    const transfer = corpCard(
      503,
      "operation",
    );
    const agenda = corpCard(588, "agenda");
    const donor = {
      ...corpCard(559, "asset"),
      owner: "corp" as const,
      advancementCounters: 1,
    };
    const withDonor = score(
      transfer,
      ["operation"],
      "corp",
      [],
      {},
      {
        extraGrip: [agenda],
        servers: [{ id: "remote_1", label: "Remote", ice: [], root: [donor] }],
      },
    );
    const withoutDonor = score(
      transfer,
      ["operation"],
      "corp",
      [],
      {},
      { extraGrip: [agenda] },
    );
    const emptyDonor = score(
      transfer,
      ["operation"],
      "corp",
      [],
      {},
      {
        extraGrip: [agenda],
        servers: [
          {
            id: "remote_1",
            label: "Remote",
            ice: [],
            root: [{ ...donor, advancementCounters: 0 }],
          },
        ],
      },
    );
    expect(withDonor.baseValue).toBe(withoutDonor.baseValue + 420);
    expect(emptyDonor.baseValue).toBe(withoutDonor.baseValue);
    expect(withoutDonor.evidence).not.toContain(
      "discard_score:corp_visible_agenda_advancement_burst",
    );
    expect(withDonor.evidence).toContain(
      "discard_score:corp_visible_agenda_advancement_burst",
    );
  });

  it("does not retain movement for a sole agenda that would have to donate to itself", () => {
    const transfer = corpCard(
      503,
      "operation",
    );
    const agenda = {
      ...corpCard(588, "agenda"),
      owner: "corp" as const,
      advancementCounters: 1,
    };
    const result = score(
      transfer,
      ["operation"],
      "corp",
      [],
      {},
      {
        servers: [{ id: "remote_1", label: "Remote", ice: [], root: [agenda] }],
      },
    );
    expect(result.evidence).not.toContain(
      "discard_score:corp_visible_agenda_advancement_burst",
    );
  });

  it("preserves a conditional Corp payoff only while a tag source remains reachable", () => {
    const payoff = corpCard(539, "asset");
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
    const tagSource = corpCard(495, "operation");
    const payoff = corpCard(539, "asset");
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

  it("recognizes an access-tag agenda through reviewed action/function signals", () => {
    const markedAccounts = corpCard(
      63,
      "agenda",
    );
    const payoff = corpCard(539, "asset");
    const result = score(
      markedAccounts,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        extraGrip: [payoff],
      },
    );

    expect(result.evidence).toContain("discard_score:corp_tag_source_enabler");
  });

  it("applies diminishing conditional-enabler value to redundant Corp copies", () => {
    const tagSource = corpCard(495, "operation");
    const duplicateTwo = {
      ...tagSource,
      instanceId: "tag-source-2",
    };
    const duplicateThree = {
      ...tagSource,
      instanceId: "tag-source-3",
    };
    const payoff = corpCard(539, "asset");
    const unique = score(
      tagSource,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        extraGrip: [payoff],
      },
    );
    const redundant = score(
      tagSource,
      [],
      "corp",
      [],
      {},
      {
        agendaPoints: 3,
        extraGrip: [duplicateTwo, duplicateThree, payoff],
      },
    );

    expect(unique.baseValue).toBeGreaterThan(redundant.baseValue + 250);
    expect(redundant.evidence).toContain(
      "discard_score:corp_conditional_enabler_duplicate_diminished",
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

  it("preserves immediate Runner liquidity over an unaffordable payout", () => {
    const livewire = score(
      runnerCard(309, "event"),
      ["economy", "tempo"],
      "runner",
      [],
      {},
      { credits: 1, cardCost: 0 },
    );
    const scoreEvent = score(
      runnerCard(320, "event"),
      ["economy"],
      "runner",
      [],
      {},
      { credits: 1, cardCost: 5 },
    );

    expect(livewire.total).toBeGreaterThan(scoreEvent.total);
    expect(livewire.evidence).toContain(
      "discard_score:runner_immediate_liquidity",
    );
    expect(scoreEvent.evidence).not.toContain(
      "discard_score:runner_immediate_liquidity",
    );
  });

  it("devalues a canonical finite burst only after current liquidity is already saturated", () => {
    const scoreEvent = runnerCard(320, "event");
    const saturated = score(
      scoreEvent,
      ["economy", "event"],
      "runner",
      [],
      {},
      { credits: 18, cardCost: 5, legalActionForCard: true },
    );
    const lowLiquidity = score(
      scoreEvent,
      ["economy", "event"],
      "runner",
      [],
      {},
      { credits: 6, cardCost: 5, legalActionForCard: true },
    );

    expect(saturated.total).toBeLessThan(lowLiquidity.total - 200);
    expect(saturated.evidence).toContain(
      "discard_score:runner_saturated_finite_burst_economy",
    );
    expect(lowLiquidity.evidence).not.toContain(
      "discard_score:runner_saturated_finite_burst_economy",
    );
  });

  it("keeps canonical non-noisy breaker credits only when a compatible breaker is installed", () => {
    const cloak = runnerCard(223, "program");
    const compatibleBreaker = runnerCard("compatible-breaker", "program");
    const noisyBreaker = runnerCard("noisy-breaker", "program");
    const rolesByCardId = {
      "compatible-breaker": ["icebreaker"],
      "noisy-breaker": ["icebreaker", "noisy"],
    };
    const usable = score(
      cloak,
      ["economy_recurring", "run_support"],
      "runner",
      [compatibleBreaker],
      rolesByCardId,
      { credits: 18, cardCost: 7 },
    );
    const noisyOnly = score(
      cloak,
      ["economy_recurring", "run_support"],
      "runner",
      [noisyBreaker],
      rolesByCardId,
      { credits: 18, cardCost: 7 },
    );
    const unusable = score(
      cloak,
      ["economy_recurring", "run_support"],
      "runner",
      [],
      rolesByCardId,
      { credits: 18, cardCost: 7 },
    );

    expect(usable.total).toBeGreaterThan(noisyOnly.total + 200);
    expect(usable.total).toBeGreaterThan(unusable.total + 200);
    expect(usable.evidence).toContain(
      "discard_score:runner_usable_non_noisy_breaker_credit_support",
    );
    expect(noisyOnly.evidence).not.toContain(
      "discard_score:runner_usable_non_noisy_breaker_credit_support",
    );
    expect(unusable.evidence).not.toContain(
      "discard_score:runner_usable_non_noisy_breaker_credit_support",
    );
  });

  it("adds unique strategy-aligned multiaccess value only at matchpoint", () => {
    const hqInterface = runnerCard(341, "hardware");
    const matchpoint = score(
      hqInterface,
      ["hardware", "hq_pressure", "multiaccess"],
      "runner",
      [],
      {},
      { agendaPoints: 5, strategyId: "runner.hq_pressure", cardCost: 4 },
    );
    const earlyGame = score(
      hqInterface,
      ["hardware", "hq_pressure", "multiaccess"],
      "runner",
      [],
      {},
      { agendaPoints: 2, strategyId: "runner.hq_pressure", cardCost: 4 },
    );
    const installedDuplicate = score(
      hqInterface,
      ["hardware", "hq_pressure", "multiaccess"],
      "runner",
      [
        {
          ...hqInterface,
          instanceId: "installed-hq-interface",
        },
      ],
      {},
      { agendaPoints: 5, strategyId: "runner.hq_pressure", cardCost: 4 },
    );

    expect(matchpoint.total).toBeGreaterThan(earlyGame.total + 600);
    expect(matchpoint.evidence).toContain(
      "discard_score:runner_matchpoint_closeout",
    );
    expect(earlyGame.evidence).not.toContain(
      "discard_score:runner_matchpoint_closeout",
    );
    expect(installedDuplicate.evidence).not.toContain(
      "discard_score:runner_matchpoint_closeout",
    );
  });

  it("preserves program search while known breaker coverage is only in the stack", () => {
    const search = runnerCard("runner-program-search", "event");
    const unavailableBreaker = score(
      search,
      [],
      "runner",
      [],
      {},
      { breakerCoverage: "stack_only" },
    );
    const installedBreaker = score(
      search,
      [],
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
      corpCard(514, "operation"),
      [],
      "corp",
      [],
      {},
      { corpTagSourceState: "stack" },
    );
    const softCreditPunish = score(
      corpCard(497, "operation"),
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

  it("does not count a discarded tag source surfaced in the Archives server view", () => {
    const damage = score(
      corpCard(514, "operation"),
      [],
      "corp",
      [],
      {},
      {
        corpTagSourceState: "archives",
        servers: [
          {
            id: "archives",
            label: "Archives",
            ice: [],
            root: [corpCard(496, "operation")],
          },
        ],
      },
    );

    expect(damage.evidence).toContain(
      "discard_score:corp_tag_payoff_prerequisite_missing",
    );
  });

  it("devalues non-additive Runner utility duplicates already represented in the rig", () => {
    const freshUtility = score(
      runnerCard(389, "resource"),
      ["program_search"],
      "runner",
      [],
    ).baseValue;
    const installedDuplicate = score(
      runnerCard(389, "resource"),
      ["program_search"],
      "runner",
      [runnerCard(389, "resource")],
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

  it("devalues installed duplicate Runner expose utility", () => {
    const seeYa = runnerCard(270, "program");
    const installedSeeYa = {
      ...runnerCard(270, "program"),
      instanceId: "installed-seeya-instance",
    };
    const roles = [
      "program",
      "hidden_zone_tool",
      "expose_helper",
      "build_rig",
      "contest_remote",
    ];
    const fresh = score(seeYa, roles, "runner");
    const installedDuplicate = score(seeYa, roles, "runner", [installedSeeYa]);

    expect(installedDuplicate.baseValue).toBeLessThan(fresh.baseValue - 100);
  });

  it("protects unique structured path tools only while a visible path has ICE", () => {
    const insideJob = runnerCard(306, "event");
    const forged = runnerCard(298, "event");
    const icedServer = {
      id: "rd",
      label: "R&D",
      ice: [corpCard("visible-path-ice", "ice")],
      root: [],
    } as AiDecisionInput["playerView"]["servers"][number];
    const insideRoles = [
      "event",
      "run_bypass",
      "run_event",
      "contest_remote",
      "pressure_hq",
      "pressure_rnd",
    ];
    const forgedRoles = [
      "event",
      "per_card_longtail",
      "runner",
      "runner_play_event",
      "runner_event_choice",
    ];
    const insideWithPath = score(
      insideJob,
      insideRoles,
      "runner",
      [],
      {},
      { servers: [icedServer] },
    );
    const insideWithoutPath = score(insideJob, insideRoles, "runner");
    const forgedWithPath = score(
      forged,
      forgedRoles,
      "runner",
      [],
      {},
      { servers: [icedServer] },
    );
    const forgedWithoutPath = score(forged, forgedRoles, "runner");

    expect(insideWithPath.baseValue).toBeGreaterThan(
      insideWithoutPath.baseValue + 200,
    );
    expect(forgedWithPath.baseValue).toBeGreaterThan(
      forgedWithoutPath.baseValue + 200,
    );
    expect(insideWithPath.evidence).toContain(
      "discard_score:runner_visible_path_tool",
    );
    expect(forgedWithPath.evidence).toContain(
      "discard_score:runner_visible_path_tool",
    );
    expect(insideWithoutPath.evidence).not.toContain(
      "discard_score:runner_visible_path_tool",
    );
  });

  it("protects a unique HQ-success ICE-trash follow-up while rezzed ICE is visible", () => {
    const jettison = runnerCard(
      292,
      "event",
    );
    const neutral = runnerCard("runner-neutral-event", "event");
    const icedServer = {
      id: "rd",
      label: "R&D",
      ice: [{ ...corpCard("visible-rezzed-ice", "ice"), rezzed: true }],
      root: [],
    } as AiDecisionInput["playerView"]["servers"][number];
    const jettisonScore = score(
      jettison,
      ["event", "per_card_longtail", "runner"],
      "runner",
      [],
      {},
      { servers: [icedServer] },
    );
    const neutralScore = score(
      neutral,
      ["event"],
      "runner",
      [],
      {},
      { servers: [icedServer] },
    );

    expect(jettisonScore.baseValue).toBeGreaterThan(
      neutralScore.baseValue + 400,
    );
    expect(jettisonScore.evidence).toContain(
      "discard_score:runner_conditional_success_window_path_tool",
    );
  });

  it("discards excess copies of an installed breaker before a unique support program", () => {
    const krash = runnerCard(251, "program");
    const secondKrash = {
      ...runnerCard(251, "program"),
      instanceId: "krash-second-instance",
    };
    const installedKrash = {
      ...runnerCard(251, "program"),
      instanceId: "krash-installed-instance",
    };
    const support = runnerCard(224, "program");
    const redundantBreaker = score(
      krash,
      AI_HINTS_BY_CARD.get(251)!.roles!,
      "runner",
      [installedKrash],
      {
        onr_v1_039_krash: AI_HINTS_BY_CARD.get(251)!.roles!,
      },
      { extraGrip: [secondKrash, support] },
    );
    const uniqueSupport = score(
      support,
      AI_HINTS_BY_CARD.get(224)!.roles!,
      "runner",
      [installedKrash],
      {
        onr_v1_039_krash: AI_HINTS_BY_CARD.get(251)!.roles!,
      },
      { extraGrip: [krash, secondKrash] },
    );

    expect(redundantBreaker.baseValue).toBeLessThan(uniqueSupport.baseValue);
  });

  it("keeps Streetware over redundant Krash copies despite persisted breaker-search intent", () => {
    const streetware = runnerCard(
      208,
      "resource",
    );
    const firstKrash = runnerCard(251, "program");
    const secondKrash = {
      ...runnerCard(251, "program"),
      instanceId: "krash-second-instance",
    };
    const pattelsVirus = runnerCard(258, "program");
    const cloak = runnerCard(223, "program");
    const installedKrash = {
      ...runnerCard(251, "program"),
      instanceId: "krash-installed-instance",
    };
    const rolesByCardId = Object.fromEntries(
      [
        251,
        258,
        223,
        208,
      ].map((id) => [id, AI_HINTS_BY_CARD.get(id)!.roles ?? []]),
    );
    const redundantKrash = score(
      firstKrash,
      rolesByCardId[251],
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
      rolesByCardId[208],
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
    servers?: AiDecisionInput["playerView"]["servers"];
    cardCost?: number;
  } = {},
) {
  return discardKeepScore(input(card, side, rig, options), card, {
    rolesForCardId: (cardId) =>
      cardId === card.definitionId
        ? roles
        : (rolesByCardId[cardId ?? ""] ?? []),
    definitionTypeForCardId: () => card.type,
    visibleCardPlayOrInstallCost: () => options.cardCost ?? 0,
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
    servers?: AiDecisionInput["playerView"]["servers"];
    cardCost?: number;
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
            ? [corpCard(496, "operation")]
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
      servers: options.servers ?? [],
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
          { cardId: 496, quantity: 1 },
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
          searchAccess: {
            tools: [
              {
                cardId: card.definitionId,
                canSearchBreakers: true,
                legalNow: false,
                status: "in_hand",
              },
            ],
          },
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

function corpCard(definitionId: number, type: string): VisibleCard {
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

function runnerCard(definitionId: number, type: string): VisibleCard {
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
