import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  corpMissingConcreteDefenseDrawNeed,
  corpMissingConcreteScoreDefenseDrawNeed,
  corpOptionalDrawCapacity,
  corpOptionalDrawScoreComponents,
  corpQuantitativeDrawScoreComponents,
} from "./corp-defensive-draw";
import type {
  CorpFundedRemoteAccessRiskNeed,
  KnownCorpFundedScoreProtectionAssessment,
} from "../corp-funded-score-protection";
import type { CorpCentralDefenseAllocation } from "../corp-central-defense-allocation";
import {
  corpAction,
  corpCard,
  corpInputWithHqCardsAndServers,
} from "../semantic-runtime-corp-score.test-support";

const draw = corpAction("corp.draw_card", "draw_card", {}, "basic_action");
draw.costs = [{ clicks: 1 }];

describe("Corp defensive draw context", () => {
  it("uses the current maximum hand size for one-card draw capacity", () => {
    const input = drawInput(5, 4);

    const capacity = corpOptionalDrawCapacity(input, draw);
    const components = corpOptionalDrawScoreComponents(input, draw);

    expect(capacity).toMatchObject({
      eligible: true,
      handCount: 4,
      maxHandSize: 5,
      projectedDrawCount: 1,
      freeSlotsAfter: 0,
    });
    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_low_hand",
    );
  });

  it("keeps the stronger low-hand signal when a slot remains after drawing", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 3), draw);

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_safe_draw_capacity", value: 100 }),
        expect.objectContaining({ key: "corp_low_hand", value: 450 }),
      ]),
    );
  });

  it("does not reward optional draw at a full hand or max hand two", () => {
    expect(corpOptionalDrawScoreComponents(drawInput(5, 5), draw)).toEqual([]);
    expect(corpOptionalDrawScoreComponents(drawInput(2, 1), draw)).toEqual([]);
  });

  it("requires room for the complete projected draw amount", () => {
    const drawTwo = corpAction(
      "corp.draw_two",
      "draw_card",
      { drawCardsAmount: 2 },
      "card",
    );

    expect(corpOptionalDrawScoreComponents(drawInput(5, 4), drawTwo)).toEqual(
      [],
    );
    expect(
      corpOptionalDrawScoreComponents(drawInput(5, 3), drawTwo).map(
        (component) => component.key,
      ),
    ).toContain("corp_safe_draw_capacity");
  });

  it("consumes explicit multi-card draw yield from a played operation", () => {
    const annualReviews = corpAction(
      "corp.play.annual-reviews",
      "play_operation",
      { drawCardsAmount: 3 },
      "annual-reviews",
    );

    const components = corpOptionalDrawScoreComponents(
      drawInput(5, 2),
      annualReviews,
    );

    expect(
      corpOptionalDrawCapacity(drawInput(5, 2), annualReviews),
    ).toMatchObject({ eligible: true, projectedDrawCount: 3 });
    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
    expect(
      corpQuantitativeDrawScoreComponents(drawInput(5, 2), annualReviews),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_quantitative_draw_yield",
          value: 1000,
        }),
      ]),
    );
  });

  it("does not reward optional draw while an existing protected score remote is urgent", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 4), draw, {
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "remote_1",
      scoreRemoteServerId: "remote_1",
      evidence: ["test_existing_protected_score_remote"],
    });

    expect(components).toEqual([]);
  });

  it("keeps draw eligible for speculative new-remote protection triage", () => {
    const components = corpOptionalDrawScoreComponents(drawInput(5, 4), draw, {
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "new_remote",
      scoreRemoteServerId: "new_remote",
      evidence: ["test_speculative_new_remote"],
    });

    expect(components.map((component) => component.key)).toContain(
      "corp_safe_draw_capacity",
    );
  });

  it("does not invent a defense draw need when both centrals have ICE", () => {
    const input = drawInput(5, 4, [centralIce("hq-ice"), centralIce("rd-ice")]);

    const components = corpOptionalDrawScoreComponents(input, draw);

    expect(components.map((component) => component.key)).not.toContain(
      "corp_missing_concrete_defense_draw",
    );
  });

  it("does not invent defense pressure from an empty central alone", () => {
    const input = drawInput(5, 3);

    expect(corpMissingConcreteDefenseDrawNeed(input, draw)).toBeUndefined();
  });

  it("binds the generic defense draw only to active visible pressure", () => {
    const input = drawInput(5, 3);
    input.playerView.own.gripOrHq.push(corpCard("hq-agenda", "agenda"));

    expect(
      corpMissingConcreteDefenseDrawNeed(
        input,
        draw,
        undefined,
        knownCentralAllocation("hq"),
      ),
    ).toMatchObject({
      serverId: "hq",
      evidence: expect.arrayContaining([
        "central_defense_allocation_known:true",
        "central_defense_selected_server:hq",
      ]),
    });
  });

  it("never re-ranks the known global central-defense selection for generic draw", () => {
    const input = drawInput(5, 3);
    input.playerView.own.gripOrHq.push(corpCard("hq-agenda", "agenda"));

    expect(
      corpMissingConcreteDefenseDrawNeed(
        input,
        draw,
        undefined,
        knownCentralAllocation("rd"),
      ),
    ).toMatchObject({
      serverId: "rd",
      evidence: expect.arrayContaining(["central_defense_selected_server:rd"]),
    });
  });

  it("admits a targeted score-defense draw only from the exact unprotected effect need", () => {
    const setup = targetedScoreDefenseDrawSetup();

    expect(corpMissingConcreteScoreDefenseDrawNeed(setup.args)).toMatchObject({
      needId: `score-defense-draw:${setup.need.needId}:${draw.actionId}`,
      parentProjectId: setup.need.parentProjectId,
      serverId: "remote_1",
      cleanupReplacementDraw: false,
      evidence: expect.arrayContaining([
        "funded_protection_baseline:known_unprotected",
        "direct_install_route_disposition:effect_missing",
        "remaining_score_defense_effect_suitable_ice_count:2",
      ]),
    });
  });

  it("defers an unknown install branch while keeping the exact current draw head", () => {
    const setup = targetedScoreDefenseDrawSetup();

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        directInstallRouteState: { knowledge: "unknown" },
      }),
    ).toMatchObject({
      parentProjectId: setup.need.parentProjectId,
      evidence: expect.arrayContaining([
        "direct_install_route_disposition:unknown_deferred",
      ]),
    });
  });

  it("fails closed when a productive direct install route is already known", () => {
    const setup = targetedScoreDefenseDrawSetup();

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        directInstallRouteState: {
          knowledge: "known",
          disposition: "productive",
        },
      }),
    ).toBeUndefined();
  });

  it("does not draw for ICE when the protection effect exists and only funding is missing", () => {
    const setup = targetedScoreDefenseDrawSetup();

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        directInstallRouteState: {
          knowledge: "known",
          disposition: "funding_only",
        },
      }),
    ).toBeUndefined();
  });

  it("fails closed unless the current unsatisfied baseline is known or only its later subset route is unknown", () => {
    const setup = targetedScoreDefenseDrawSetup();
    const protectedBaseline: KnownCorpFundedScoreProtectionAssessment = {
      ...setup.need.baseline,
      fundedProtection: true,
      protection: {
        ...setup.need.baseline.protection,
        protectsScore: true,
        runnerAccessSuccessProbability: { numerator: 1, denominator: 4 },
      },
    };

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: {
          ...setup.need,
          baseline: protectedBaseline,
        },
      }),
    ).toBeUndefined();
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: {
          ...setup.need,
          observedAtStateVersion: setup.input.playerView.stateVersion - 1,
        },
      }),
    ).toBeUndefined();
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: {
          ...setup.need,
          baseline: {
            knowledge: "unknown",
            fundedProtection: false,
            unknownReason: "missing_rez_cost_quote",
            availableCorpCredits: 13,
            availableCorpClicks: 2,
            totalScoreReserveCredits: 0,
            hardClickReserve: 0,
            evidence: [],
          },
        },
      }),
    ).toBeUndefined();
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: {
          ...setup.need,
          baseline: {
            knowledge: "unknown",
            fundedProtection: false,
            unknownReason: "subset_assessment_unknown",
            availableCorpCredits: 13,
            availableCorpClicks: 2,
            totalScoreReserveCredits: 0,
            hardClickReserve: 0,
            evidence: [],
          },
        },
      }),
    ).toMatchObject({
      parentProjectId: setup.need.parentProjectId,
      evidence: expect.arrayContaining([
        "funded_protection_baseline:subset_unknown_deferred",
      ]),
    });
  });

  it("requires an identity-bound exact draw projection", () => {
    const setup = targetedScoreDefenseDrawSetup();

    for (const drawActionProjection of [
      { knowledge: "unknown" as const },
      {
        ...setup.args.drawActionProjection,
        actionId: "different-action",
      },
      {
        ...setup.args.drawActionProjection,
        observedAtStateVersion: setup.input.playerView.stateVersion - 1,
      },
      { ...setup.args.drawActionProjection, clickCost: 2 },
      { ...setup.args.drawActionProjection, cardsDrawn: 2 },
      { ...setup.args.drawActionProjection, netHandDelta: 0 },
    ]) {
      expect(
        corpMissingConcreteScoreDefenseDrawNeed({
          ...setup.args,
          drawActionProjection,
        }),
      ).toBeUndefined();
    }
  });

  it("allows a capacity-safe last-click draw as multi-turn progress but not under a hard same-turn reserve", () => {
    const setup = targetedScoreDefenseDrawSetup();
    setup.input.playerView.own.clicks = 1;
    const lastClickNeed: CorpFundedRemoteAccessRiskNeed = {
      ...setup.need,
      baseline: {
        ...setup.need.baseline,
        availableCorpClicks: 1,
      },
    };
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: lastClickNeed,
      }),
    ).toMatchObject({
      cleanupReplacementDraw: false,
      evidence: expect.arrayContaining([
        "score_defense_draw_followup_horizon:multi_turn_progress",
        "projected_hand_after_draw:4",
      ]),
    });

    const reservedNeed: CorpFundedRemoteAccessRiskNeed = {
      ...lastClickNeed,
      scoreReserve: {
        ...lastClickNeed.scoreReserve,
        hardClickReserve: 1,
      },
      baseline: {
        ...lastClickNeed.baseline,
        hardClickReserve: 1,
      },
    };
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: reservedNeed,
      }),
    ).toBeUndefined();

    const fullHandSetup = targetedScoreDefenseDrawSetup(5);
    fullHandSetup.input.playerView.own.clicks = 1;
    const fullHandLastClickNeed: CorpFundedRemoteAccessRiskNeed = {
      ...fullHandSetup.need,
      baseline: {
        ...fullHandSetup.need.baseline,
        availableCorpClicks: 1,
      },
    };
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...fullHandSetup.args,
        protectionNeed: fullHandLastClickNeed,
      }),
    ).toBeUndefined();
  });

  it("preserves the hard-click reserve and permits only capacity-safe draw-plus-install sequences", () => {
    const setup = targetedScoreDefenseDrawSetup(5);
    const reserveNeed: CorpFundedRemoteAccessRiskNeed = {
      ...setup.need,
      scoreReserve: {
        ...setup.need.scoreReserve,
        hardClickReserve: 1,
      },
      baseline: {
        ...setup.need.baseline,
        hardClickReserve: 1,
      },
    };

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: reserveNeed,
      }),
    ).toBeUndefined();

    setup.input.playerView.own.clicks = 3;
    const enoughClicksNeed: CorpFundedRemoteAccessRiskNeed = {
      ...reserveNeed,
      baseline: {
        ...reserveNeed.baseline,
        availableCorpClicks: 3,
      },
    };
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        protectionNeed: enoughClicksNeed,
      }),
    ).toMatchObject({ cleanupReplacementDraw: true });

    const drawTwo = corpAction(
      "corp.draw_two",
      "draw_card",
      { drawCardsAmount: 2 },
      "card",
    );
    drawTwo.costs = [{ clicks: 1 }];
    setup.input.legalActions = [drawTwo];
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        action: drawTwo,
        drawActionProjection: {
          knowledge: "known",
          actionId: drawTwo.actionId,
          observedAtStateVersion: setup.input.playerView.stateVersion,
          clickCost: 1,
          cardsDrawn: 2,
          netHandDelta: 2,
        },
      }),
    ).toBeUndefined();
  });

  it("requires an unused exact attempt state and verifies the event-tail fact", () => {
    const setup = targetedScoreDefenseDrawSetup();

    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        attemptState: {
          residentAttemptedThisTurn: true,
          eventTailAttemptedThisTurn: false,
        },
      }),
    ).toBeUndefined();
    expect(
      corpMissingConcreteScoreDefenseDrawNeed({
        ...setup.args,
        attemptState: {
          residentAttemptedThisTurn: false,
          eventTailAttemptedThisTurn: true,
        },
      }),
    ).toBeUndefined();

    setup.input.eventTail = [
      {
        eventId: "mandatory-draw",
        type: "mandatory_draw",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "hash",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "corp",
          actionType: "mandatory_draw",
          label: "Mandatory draw",
        },
      },
      {
        eventId: "optional-draw",
        type: "draw_card",
        stateVersionBefore: 2,
        stateVersionAfter: 3,
        stateHashAfter: "hash-2",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "corp",
          actionType: "draw_card",
          label: "Draw",
        },
      },
    ];
    expect(corpMissingConcreteScoreDefenseDrawNeed(setup.args)).toBeUndefined();
  });

  it("requires a positive exact target-server ICE density from the deck snapshot", () => {
    const setup = targetedScoreDefenseDrawSetup();
    delete setup.input.ownDeckSnapshot;

    expect(corpMissingConcreteScoreDefenseDrawNeed(setup.args)).toBeUndefined();

    setup.input.ownDeckSnapshot = {
      deckSnapshotId: "only-zero-effect-ice-remains",
      side: "corp",
      cards: [],
    };
    expect(corpMissingConcreteScoreDefenseDrawNeed(setup.args)).toBeUndefined();
  });
});

function targetedScoreDefenseDrawSetup(handCount = 3): {
  input: AiDecisionInput & {
    ownDeckSnapshot?: {
      deckSnapshotId: string;
      side: "corp";
      cards: Array<{ cardId: string; quantity: number }>;
    };
  };
  need: CorpFundedRemoteAccessRiskNeed & {
    baseline: KnownCorpFundedScoreProtectionAssessment;
  };
  args: Parameters<typeof corpMissingConcreteScoreDefenseDrawNeed>[0];
} {
  const exactDraw = {
    ...draw,
    costs: [{ clicks: 1 }],
    expiresAtStateVersion: 13,
  };
  const input = corpInputWithHqCardsAndServers(
    13,
    Array.from({ length: handCount }, (_, index) =>
      corpCard(`operation-${index}`, "operation"),
    ),
    [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [centralIce("remote-existing")],
        root: [corpCard("score-agenda", "agenda")],
      },
    ],
    [exactDraw],
  ) as AiDecisionInput & {
    ownDeckSnapshot?: {
      deckSnapshotId: string;
      side: "corp";
      cards: Array<{ cardId: string; quantity: number }>;
    };
  };
  input.playerView.stateVersion = 13;
  input.playerView.own.maxHandSize = 5;
  input.playerView.own.clicks = 2;
  input.playerView.own.stackOrRdCount = 20;
  input.ownDeckSnapshot = {
    deckSnapshotId: "targeted-score-defense-draw",
    side: "corp",
    cards: [{ cardId: "onr_v1_244_filter", quantity: 2 }],
  };
  const baseline: KnownCorpFundedScoreProtectionAssessment = {
    knowledge: "known",
    availableCorpCredits: 13,
    availableCorpClicks: 2,
    totalScoreReserveCredits: 0,
    hardClickReserve: 0,
    fundedProtection: false,
    scoreReserveFingerprint: "test-score-reserve",
    protection: {
      knowledge: "known",
      maximumRunnerAccessSuccessProbability: {
        numerator: 1,
        denominator: 4,
      },
      runnerAccessSuccessProbability: {
        numerator: 1,
        denominator: 1,
      },
      protectsScore: false,
      requiredRandomBreakSuccesses: 1,
      randomBreaks: [],
      runnerCreditsRemainingOnBestAccessPath: 0,
      evidence: [],
    },
    selectedRezCosts: [],
    totalSelectedRezCost: 0,
    creditsAfterDefense: 13,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: true,
    preservesHardClickReserve: true,
    evidence: [],
  };
  const need = {
    needId: "need:remote_1",
    parentProjectId: "score-project:remote_1",
    targetServerId: "remote_1",
    observedAtStateVersion: 13,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability: {
        numerator: 1,
        denominator: 4,
      },
      policySource: "test",
    },
    scoreReserve: {
      creditBreakdown: [],
      hardClickReserve: 0,
    },
    baseline,
  } satisfies CorpFundedRemoteAccessRiskNeed;
  return {
    input,
    need,
    args: {
      input,
      action: exactDraw,
      protectionNeed: need,
      directInstallRouteState: {
        knowledge: "known",
        disposition: "effect_missing",
      },
      drawActionProjection: {
        knowledge: "known",
        actionId: exactDraw.actionId,
        observedAtStateVersion: 13,
        clickCost: 1,
        cardsDrawn: 1,
        netHandDelta: 1,
      },
      attemptState: {
        residentAttemptedThisTurn: false,
        eventTailAttemptedThisTurn: false,
      },
    },
  };
}

function drawInput(
  maxHandSize: number,
  handCount: number,
  centralIce: VisibleCard[] = [],
): AiDecisionInput {
  const hq = Array.from({ length: handCount }, (_, index) =>
    corpCard(`hq-${index}`, "operation"),
  );
  const input = corpInputWithHqCardsAndServers(
    5,
    hq,
    [
      {
        id: "hq",
        label: "HQ",
        ice: centralIce.filter((card) => card.instanceId.startsWith("hq")),
        root: [],
      },
      {
        id: "rd",
        label: "R&D",
        ice: centralIce.filter((card) => card.instanceId.startsWith("rd")),
        root: [],
      },
    ],
    [draw],
  );
  input.playerView.own.maxHandSize = maxHandSize;
  input.playerView.own.stackOrRdCount = 20;
  Object.assign(input, {
    ownDeckSnapshot: {
      deckSnapshotId: "generic-central-defense-draw",
      side: "corp",
      cards: [
        { cardId: "onr_v1_263_reinforced-wall", quantity: 3 },
        { cardId: "simple_economy_operation", quantity: 37 },
      ],
    },
  });
  return input;
}

function centralIce(instanceId: string): VisibleCard {
  return corpCard(instanceId, "ice", {
    definitionId: "onr_v1_263_reinforced-wall",
    title: "Reinforced Wall",
    subtypes: ["Wall"],
  });
}

function knownCentralAllocation(
  selectedServerId: "hq" | "rd",
): CorpCentralDefenseAllocation {
  const evidence = {
    threat: "material" as const,
    expectedAgendaLoss: { numerator: 1, denominator: 5 },
    expectedTrashableLoss: { numerator: 0, denominator: 1 },
    accessibleCardCount: 1,
    isMultiaccess: false,
    recentRunOrAccessEvents: 0,
    recentSuccessfulAccessRunnerTurns: 0,
    serverBoundEffectIds: [],
  };
  return {
    status: "known",
    selectedServerId,
    evidence: { hq: evidence, rd: evidence },
    canonicalNearTieCandidateServerIds: [],
    hqHold: { status: "ineligible" },
  };
}
