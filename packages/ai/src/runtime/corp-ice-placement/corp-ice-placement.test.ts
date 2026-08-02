import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildCorpIceDensityProfile } from "../corp-economy/corp-ice-density";
import {
  buildCorpIceCardFacts,
  corpIcePlacementActionCostAgreementFact,
  corpIcePlacementActionCreditCostFact,
  corpIcePlacementPostInstallRezCostFact,
} from "./corp-ice-placement";
import {
  assessCorpIcePlacementForDiagnostics,
  classifyCorpFutureRunIcePlacementProfile,
} from "../../simulation/corp-future-run-ice-placement-assessment";

describe("corp ICE placement profile", () => {
  it("classifies direct stops and historical future-run ICE", () => {
    const wall = buildCorpIceCardFacts(
      corpIce("wall", {
        definitionId: "simple_barrier_ice",
        rulesText: "*End the run.",
        rezCost: 3,
      }),
    );

    expect(wall).toMatchObject({
      immediateStop: true,
      positionDependent: false,
      requiresOtherIceContext: false,
    });
    expect(wall).not.toHaveProperty("rezCost");
    expect(wall.evidence).toContain("printed_rez_cost_consumed:false");
    expect(
      classifyCorpFutureRunIcePlacementProfile("onr_v1_222_ball-and-chain"),
    ).toBe("ball_and_chain");
  });

  it("keeps position-dependent ICE as profile facts", () => {
    const profile = buildCorpIceCardFacts(
      corpIce("hunting-pack", {
        title: "Hunting Pack",
        rulesText:
          "For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one Trace subroutine.",
        rezCost: 4,
      }),
    );

    expect(profile).toMatchObject({
      outsideIceScaling: true,
      positionDependent: true,
      requiresOtherIceContext: true,
    });
  });

  it("never turns a printed VisibleCard rez cost into a decision cost", () => {
    for (const rezCost of [0, 3, Number.POSITIVE_INFINITY, -1, 1.5]) {
      const profile = buildCorpIceCardFacts(
        corpIce("printed-cost", { rezCost }),
      );
      expect(profile).not.toHaveProperty("rezCost");
      expect(profile).not.toHaveProperty("rezCostFact");
      expect(profile.evidence).toContain("printed_rez_cost_consumed:false");
    }
  });

  it("keeps variable rez ICE unknown even when a printed numeric rez value is visible", () => {
    const profile = buildCorpIceCardFacts(
      corpIce("variable", {
        rulesText: "When rezzed, choose X.",
        rezCost: 3,
      }),
    );

    expect(profile).toMatchObject({
      variableRez: true,
    });
    expect(profile).not.toHaveProperty("rezCost");
  });
});

describe("corp ICE action and Engine quote facts", () => {
  it.each([
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
    ["negative", -1],
    ["fractional", 1.5],
  ])("fails closed for a %s LegalAction install cost", (_label, creditCost) => {
    const wall = corpIce("wall", {
      rulesText: "*End the run.",
      rezCost: 3,
    });
    const action = installIceAction(wall, "hq");
    action.costs = [{ clicks: 1, credits: creditCost }];

    expect(corpIcePlacementActionCreditCostFact(action).status).toBe("unknown");
  });

  it("treats the LegalAction cost as authoritative and exposes projection drift", () => {
    const wall = corpIce("wall");
    const action = installIceAction(wall, "hq");
    expect(corpIcePlacementActionCostAgreementFact(action, 0)).toEqual({
      status: "unknown",
      reason: "projection_drift",
      source: "candidate_projection",
    });
    expect(corpIcePlacementActionCostAgreementFact(action, 1)).toEqual({
      status: "known",
      amount: 1,
      source: "candidate_projection",
    });
  });

  it("reads only a complete, state/source/server-bound post-install Engine quote", () => {
    const wall = corpIce("wall", { rezCost: 99 });
    const input = corpInput({
      credits: 5,
      hq: [wall],
      servers: [server("hq", [])],
    });
    const action = installIceAction(wall, "hq");
    input.legalActions = [action];
    action.payload = {
      ...action.payload,
      position: "outermost",
      postInstallRezQuoteCardId: wall.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 1,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 2,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
      postInstallRezQuoteReductionSourceDefinitionIds: "cost-reducer",
    };

    expect(corpIcePlacementPostInstallRezCostFact(input, action)).toEqual({
      status: "known",
      amount: 2,
      source: "engine_post_install_rez_quote",
    });
  });

  it.each([
    [
      "missing",
      (action: LegalAction) => {
        delete action.payload!.postInstallRezQuoteComplete;
      },
    ],
    [
      "incomplete",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteComplete = false;
      },
    ],
    [
      "stale",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteExpiresAtStateVersion = 2;
      },
    ],
    [
      "wrong card",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteCardId = "other-card";
      },
    ],
    [
      "wrong action card",
      (action: LegalAction) => {
        action.payload!.cardId = "other-card";
      },
    ],
    [
      "wrong source definition",
      (action: LegalAction) => {
        action.payload!.sourceDefinitionId = "other-definition";
      },
    ],
    [
      "wrong server",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteProjectedServerId = "rd";
      },
    ],
    [
      "noncanonical modifiers",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteReductionSourceDefinitionIds = "z,a";
      },
    ],
    [
      "overlapping modifiers",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteReductionSourceDefinitionIds =
          "same";
        action.payload!.postInstallRezQuoteIncreaseSourceDefinitionIds = "same";
      },
    ],
    [
      "unsupported mandatory agenda cost",
      (action: LegalAction) => {
        action.payload!.postInstallRezQuoteMandatoryAgendaPointCost = 1;
        action.payload!.postInstallRezQuoteMandatoryAdditionalCostKind =
          "agenda_point";
      },
    ],
  ])("fails closed for a %s post-install quote", (_label, mutate) => {
    const wall = corpIce("wall");
    const action = installIceAction(wall, "hq");
    const input = corpInput({
      credits: 5,
      hq: [wall],
      servers: [server("hq", [])],
    });
    input.legalActions = [action];
    action.payload = {
      ...action.payload,
      postInstallRezQuoteCardId: wall.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 1,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    };
    mutate(action);

    expect(corpIcePlacementPostInstallRezCostFact(input, action).status).toBe(
      "unknown",
    );
  });

  it.each([
    ["unknown", { known: false }],
    ["wrong type", { type: "asset" as const }],
    ["wrong owner", { owner: "runner" as const }],
    ["wrong controller", { controller: "runner" as const }],
  ])("fails closed for a %s source-card binding", (_label, override) => {
    const wall = corpIce("wall", override);
    const action = installIceAction(wall, "hq");
    const input = corpInput({
      hq: [wall],
      servers: [server("hq", [])],
    });
    input.legalActions = [action];
    action.payload = {
      ...action.payload,
      postInstallRezQuoteCardId: wall.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 1,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    };

    expect(corpIcePlacementPostInstallRezCostFact(input, action)).toMatchObject(
      {
        status: "unknown",
        reason: "binding_drift",
      },
    );
  });

  it("rejects a mutated action clone even when its actionId matches the canonical LegalAction", () => {
    const wall = corpIce("wall");
    const canonical = installIceAction(wall, "hq");
    const input = corpInput({ hq: [wall], servers: [server("hq", [])] });
    input.legalActions = [canonical];
    canonical.payload = {
      ...canonical.payload,
      postInstallRezQuoteCardId: wall.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 1,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    };
    const clone = {
      ...canonical,
      payload: {
        ...canonical.payload,
        postInstallRezQuoteFinalCredits: 0,
      },
    };

    expect(corpIcePlacementPostInstallRezCostFact(input, clone)).toMatchObject({
      status: "unknown",
      reason: "binding_drift",
    });
  });

  it("rejects missing or duplicate canonical LegalAction ids", () => {
    const wall = corpIce("wall");
    const action = installIceAction(wall, "hq");
    const input = corpInput({ hq: [wall], servers: [server("hq", [])] });
    action.payload = {
      ...action.payload,
      postInstallRezQuoteCardId: wall.instanceId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 1,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    };

    expect(corpIcePlacementPostInstallRezCostFact(input, action)).toMatchObject(
      {
        status: "unknown",
        reason: "binding_drift",
      },
    );
    input.legalActions = [action, { ...action }];
    expect(corpIcePlacementPostInstallRezCostFact(input, action)).toMatchObject(
      {
        status: "unknown",
        reason: "binding_drift",
      },
    );
  });
});

describe("corp ICE factual support", () => {
  it("reports deck density independently from placement policy", () => {
    const input = corpInput({
      hq: [corpIce("hq-ice")],
      archives: [corpIce("archives-ice"), card("operation", "operation")],
      stackOrRdCount: 7,
    });

    expect(buildCorpIceDensityProfile(input)).toMatchObject({
      confidence: "unknown",
      knownCardsOutsideDeck: 3,
      knownIceOutsideDeck: 2,
      remainingDeckCount: 7,
      iceDensityClass: "unknown",
    });
    expect(buildCorpIceDensityProfile(input)).not.toHaveProperty(
      "remainingIceCount",
    );
  });

  it("derives remaining ICE from the Corp deck snapshot and outside-R&D cards", () => {
    const input = corpInput({
      hq: [
        corpIce("hq-ice", {
          definitionId: "simple_barrier_ice",
        }),
      ],
      archives: [
        corpIce("archives-ice", {
          definitionId: "simple_barrier_ice",
        }),
      ],
      stackOrRdCount: 7,
    });
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "corp-density-test",
        side: "corp",
        cards: [
          { cardId: "simple_barrier_ice", quantity: 3 },
          { cardId: "simple_economy_operation", quantity: 6 },
        ],
      },
    });

    expect(buildCorpIceDensityProfile(input)).toMatchObject({
      confidence: "deck_snapshot",
      initialDeckCount: 9,
      initialIceCount: 3,
      knownIceOutsideDeck: 2,
      remainingDeckCount: 7,
      remainingIceCount: 1,
    });
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5],
    ["nonfinite", Number.POSITIVE_INFINITY],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1],
  ])("fails closed for a %s remaining R&D count", (_label, stackOrRdCount) => {
    const input = corpInput({ stackOrRdCount });
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "invalid-rd-count",
        side: "corp",
        cards: [{ cardId: "simple_barrier_ice", quantity: 3 }],
      },
    });

    const density = buildCorpIceDensityProfile(input);
    expect(density).toMatchObject({
      confidence: "unknown",
      iceDensityClass: "unknown",
    });
    expect(density).not.toHaveProperty("remainingDeckCount");
    expect(density).not.toHaveProperty("remainingIceCount");
  });

  it.each([
    ["negative quantity", [{ cardId: "simple_barrier_ice", quantity: -1 }]],
    ["fractional quantity", [{ cardId: "simple_barrier_ice", quantity: 1.5 }]],
    [
      "duplicate card id",
      [
        { cardId: "simple_barrier_ice", quantity: 1 },
        { cardId: "simple_barrier_ice", quantity: 1 },
      ],
    ],
    [
      "unknown card definition",
      [{ cardId: "unknown-card-definition", quantity: 1 }],
    ],
  ])("fails closed for a snapshot with %s", (_label, cards) => {
    const input = corpInput({ stackOrRdCount: 3 });
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "invalid-snapshot",
        side: "corp",
        cards,
      },
    });

    const density = buildCorpIceDensityProfile(input);
    expect(density.confidence).toBe("unknown");
    expect(density).not.toHaveProperty("remainingIceCount");
    expect(density.evidence).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^deck_snapshot_unknown_reason:/),
      ]),
    );
  });

  it("fails closed instead of clamping impossible zone accounting", () => {
    const input = corpInput({
      hq: [
        corpIce("ice-a", { definitionId: "simple_barrier_ice" }),
        corpIce("ice-b", { definitionId: "simple_barrier_ice" }),
      ],
      stackOrRdCount: 3,
    });
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "zone-drift",
        side: "corp",
        cards: [{ cardId: "simple_barrier_ice", quantity: 1 }],
      },
    });

    const density = buildCorpIceDensityProfile(input);
    expect(density.confidence).toBe("unknown");
    expect(density).not.toHaveProperty("remainingIceCount");
    expect(density.evidence).toContain(
      "outside_deck_zone_accounting_mismatch:true",
    );
    expect(density.evidence.join("|")).not.toContain("clamped");
  });

  it("retains future-run ICE diagnostics without making a decision", () => {
    const ballAndChain = corpIce("ball-and-chain", {
      definitionId: "onr_v1_222_ball-and-chain",
      title: "Ball and Chain",
      rezCost: 2,
    });
    const input = corpInput({
      hq: [ballAndChain],
      servers: [server("remote_1", [])],
    });
    const action = installIceAction(ballAndChain, "remote_1");
    input.legalActions = [action];

    expect(assessCorpIcePlacementForDiagnostics(input, action)).toMatchObject({
      futureRunIceClass: "ball_and_chain",
      installedOnEmptyServer: true,
      existingIceCount: 0,
      resultingPosition: "unknown",
    });
    expect(
      assessCorpIcePlacementForDiagnostics(input, action),
    ).not.toHaveProperty("deadEffect");
    expect(
      assessCorpIcePlacementForDiagnostics(input, action),
    ).not.toHaveProperty("directImpactAlternativeCount");
  });
});

function corpInput(
  overrides: {
    credits?: number;
    hq?: VisibleCard[];
    archives?: VisibleCard[];
    servers?: AiDecisionInput["playerView"]["servers"];
    stackOrRdCount?: number;
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    eventTail: [],
    difficulty: "normal",
    seed: "corp-ice-fit-test",
    decisionId: "corp-ice-fit-test.1",
    actionNumber: 1,
    profileId: "test-corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action",
      own: {
        identity: card("corp-id", "identity"),
        credits: overrides.credits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        stackOrRdCount: overrides.stackOrRdCount ?? 20,
        heapOrArchives: overrides.archives ?? [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 30,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: overrides.servers ?? [server("hq", []), server("rd", [])],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function server(
  id: "hq" | "rd" | "archives" | `remote_${number}`,
  ice: VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root: [],
  };
}

function installIceAction(ice: VisibleCard, serverId: string): LegalAction {
  return {
    actionId: `install-${ice.instanceId}-${serverId}`,
    side: "corp",
    type: "install_card",
    label: `Install ${ice.title ?? ice.instanceId}`,
    source: ice.instanceId,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      placement: "ice",
      serverId,
      cardId: ice.instanceId,
      ...(ice.definitionId ? { sourceDefinitionId: ice.definitionId } : {}),
    },
  };
}

function corpIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return card(instanceId, "ice", {
    owner: "corp",
    controller: "corp",
    ...overrides,
  });
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    title: instanceId,
    type,
    ...overrides,
  };
}
