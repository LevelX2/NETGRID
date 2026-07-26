import { describe, expect, it, vi } from "vitest";
import type {
  AiDecisionInput,
  EngineRandomizedIceInstallSelectionQuoteResult,
  EngineRandomizedIceInstallSelectionRequest,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  attachOwnDeckSnapshot,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

const DATA_WALL_DEFINITION_ID = "onr_v1_237_data-wall";
const CORPORATE_WAR_DEFINITION_ID = "onr_v1_196_corporate-war";
const CORPORATE_DOWNSIZING_DEFINITION_ID = "onr_v1_194_corporate-downsizing";
const TYCHO_EXTENSION_DEFINITION_ID = "onr_v1_220_tycho-extension";
const FILLER_DEFINITION_ID = "onr_v1_284_chance-observation";
const DATA_MASONS_DEFINITION_ID = "onr_v1_317_data-masons";

describe("plan-first live Corp central-defense allocation contract", () => {
  it("selects HQ from complete exact facts when HQ has the material agenda risk", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = centralDefenseInput({
      hqCards: [
        agenda("hq-corporate-war", CORPORATE_WAR_DEFINITION_ID),
        dataWall(),
      ],
      rdDefinitionIds: [FILLER_DEFINITION_ID],
      hqAccessCount: 1,
      rdAccessCount: 1,
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(fixture.input, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: fixture.installHq.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("selects R&D from complete exact facts when R&D has multiaccess agenda density", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = centralDefenseInput({
      hqCards: [dataWall(), filler("hq-filler")],
      rdDefinitionIds: [
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        FILLER_DEFINITION_ID,
      ],
      hqAccessCount: 1,
      rdAccessCount: 2,
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(fixture.input, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: fixture.installRd.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("funds and then installs the exact productive HQ fallback when allocated R&D is already protected", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = centralDefenseInput({
      hqCards: [dataWall()],
      rdDefinitionIds: [
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_WAR_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_WAR_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        FILLER_DEFINITION_ID,
      ],
      hqAccessCount: 1,
      rdAccessCount: 3,
    });
    const protectedRdIce = visibleCard(
      "protected-rd-data-wall",
      "corp",
      "ice",
      {
        definitionId: DATA_WALL_DEFINITION_ID,
        rezzed: true,
        strength: 0,
        subtypes: ["wall"],
      },
    );
    const credit = legalAction(
      "gain-defense-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    credit.expiresAtStateVersion = 1;
    fixture.input.playerView.own.credits = 0;
    fixture.input.playerView.servers = [
      server("hq"),
      server("rd", [protectedRdIce]),
      server("archives"),
    ];
    fixture.input.legalActions = [fixture.installHq, fixture.installRd, credit];
    fixture.input.playerView.legalActions = fixture.input.legalActions;
    attachOwnDeckSnapshot(fixture.input, {
      deckSnapshotId: "central-defense-funded-fallback-contract-deck",
      side: "corp",
      cards: definitionCounts([
        ...fixture.input.playerView.own.gripOrHq.map(
          (card) => card.definitionId!,
        ),
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_WAR_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_WAR_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        FILLER_DEFINITION_ID,
        DATA_WALL_DEFINITION_ID,
      ]),
    });

    const fundingDecision = liveContext().chooseSemanticRuntimeAction(
      fixture.input,
      {},
    );
    expect(fundingDecision).toMatchObject({
      selectionKind: "direct",
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    const fundingPortfolio = residentPlanPortfolioSnapshot(fixture.input);
    const defenseParent = fundingPortfolio?.instances.find(
      (instance) => instance.moduleId === "corp.defend_servers",
    );
    expect(defenseParent?.instanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(defenseParent?.moduleState).toMatchObject({
      kind: "defense",
      centralAllocation: {
        status: "known",
        selectedServerId: "rd",
        canonicalNearTieCandidateServerIds: [],
      },
    });
    const fundingChild = fundingPortfolio?.instances.find(
      (instance) =>
        instance.moduleId === "corp.economy" &&
        instance.parentInstanceId === defenseParent?.instanceId,
    );
    expect(fundingChild).toMatchObject({
      parentInstanceId: defenseParent?.instanceId,
      parentNeedId: `install:hq:${fixture.installHq.actionId}`,
      moduleState: {
        kind: "economy",
        signal: {
          kind: "parent_funding",
          gap: 1,
          parentPlanInstanceId: defenseParent?.instanceId,
          parentPriorityClass: "P2",
          incrementalDefenseReserve: {
            targetCredits: 1,
            serverId: "hq",
            iceInstanceId: "data-wall",
          },
        },
      },
    });

    const fundedInput = structuredClone(fixture.input);
    fundedInput.decisionId = "central-defense-runtime-contract:2:corp";
    fundedInput.playerView.stateVersion = 2;
    fundedInput.playerView.own.credits = 1;
    fundedInput.playerView.own.clicks = 2;
    fundedInput.playerView.corpCentralAccessQuotes =
      fundedInput.playerView.corpCentralAccessQuotes!.map((quote) => ({
        ...quote,
        stateVersion: 2,
      }));
    for (const action of fundedInput.legalActions) {
      action.expiresAtStateVersion = 2;
      if (action.payload?.postInstallRezQuoteCardId) {
        action.payload.postInstallRezQuoteExpiresAtStateVersion = 2;
      }
    }

    expect(
      liveContext().chooseSemanticRuntimeAction(fundedInput, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: fixture.installHq.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("keeps an exact consumed HQ-hold selection through resident refresh and does not reopen it", () => {
    resetResidentPlanPortfolioMemory();
    const dataMasonsOne = visibleCard("data-masons-1", "corp", "asset", {
      definitionId: DATA_MASONS_DEFINITION_ID,
      title: "Data Masons",
      rezzed: false,
    });
    const dataMasonsTwo = visibleCard("data-masons-2", "corp", "asset", {
      definitionId: DATA_MASONS_DEFINITION_ID,
      title: "Data Masons",
      rezzed: false,
    });
    const hqCards = [
      agenda("hq-corporate-downsizing", CORPORATE_DOWNSIZING_DEFINITION_ID),
      dataWall(),
      filler("hq-filler-1"),
      filler("hq-filler-2"),
      filler("hq-filler-3"),
    ];
    const rdDefinitionIds = [
      TYCHO_EXTENSION_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
    ];
    const first = centralDefenseInput({
      hqCards,
      rdDefinitionIds,
      hqAccessCount: 1,
      rdAccessCount: 2,
    });
    first.input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [dataMasonsOne]),
      server("remote_2", [], [dataMasonsTwo]),
    ];
    attachOwnDeckSnapshot(first.input, {
      deckSnapshotId: "central-defense-runtime-contract-deck",
      side: "corp",
      cards: definitionCounts([
        ...hqCards.map((card) => card.definitionId!),
        ...rdDefinitionIds,
        DATA_MASONS_DEFINITION_ID,
        DATA_MASONS_DEFINITION_ID,
      ]),
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(first.input, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: first.installRd.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    const consumedPortfolio = residentPlanPortfolioSnapshot(first.input);
    expect(
      consumedPortfolio?.instances.find(
        (instance) => instance.moduleId === "corp.defend_servers",
      )?.moduleState,
    ).toMatchObject({
      hqHoldCadence: { status: "consumed" },
      hqHoldSelection: {
        selectedActionId: first.installRd.actionId,
        sourceCardInstanceId: "data-wall",
        selectedAtStateVersion: 1,
        targetServerId: "rd",
      },
    });

    const second = structuredClone(first.input);
    second.decisionId = "central-defense-runtime-contract:2:corp";
    second.playerView.stateVersion = 2;
    second.playerView.own.gripOrHq = second.playerView.own.gripOrHq.filter(
      (card) => card.instanceId !== "data-wall",
    );
    second.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("data-wall", "corp", "ice", {
          definitionId: DATA_WALL_DEFINITION_ID,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
      server("archives"),
      server("remote_1", [], [dataMasonsOne]),
      server("remote_2", [], [dataMasonsTwo]),
    ];
    second.playerView.corpCentralAccessQuotes =
      second.playerView.corpCentralAccessQuotes!.map((quote) => ({
        ...quote,
        stateVersion: 2,
      }));
    const rezDataMasonsOne = rezAction(dataMasonsOne, "rez-data-masons-1");
    rezDataMasonsOne.expiresAtStateVersion = 2;
    const secondCredit = legalAction(
      "gain-credit-after-hq-hold",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    secondCredit.expiresAtStateVersion = 2;
    second.legalActions = [rezDataMasonsOne, secondCredit];
    second.playerView.legalActions = second.legalActions;
    expect(liveContext().chooseSemanticRuntimeAction(second, {})).toMatchObject(
      {
        actionId: rezDataMasonsOne.actionId,
        reasonCode: "plan_first.corp.defend_servers",
        fallbackUsed: false,
      },
    );
    expect(
      residentPlanPortfolioSnapshot(second)?.instances.find(
        (instance) => instance.moduleId === "corp.defend_servers",
      )?.moduleState,
    ).toMatchObject({
      hqHoldCadence: { status: "consumed" },
      hqHoldSelection: {
        selectedActionId: first.installRd.actionId,
        sourceCardInstanceId: "data-wall",
        selectedAtStateVersion: 1,
        targetServerId: "rd",
      },
    });

    const third = structuredClone(second);
    third.decisionId = "central-defense-runtime-contract:3:corp";
    third.playerView.stateVersion = 3;
    third.playerView.own.gripOrHq.push(filler("drawn-filler"));
    third.playerView.own.stackOrRdCount -= 1;
    third.playerView.servers = third.playerView.servers.map((currentServer) =>
      currentServer.id === "remote_1"
        ? server("remote_1", [], [{ ...dataMasonsOne, rezzed: true }])
        : currentServer,
    );
    third.playerView.corpCentralAccessQuotes =
      third.playerView.corpCentralAccessQuotes!.map((quote) => ({
        ...quote,
        stateVersion: 3,
      }));
    const rezDataMasonsTwo = rezAction(dataMasonsTwo, "rez-data-masons-2");
    rezDataMasonsTwo.expiresAtStateVersion = 3;
    const thirdCredit = legalAction(
      "gain-credit-after-resident-refresh",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    thirdCredit.expiresAtStateVersion = 3;
    third.legalActions = [rezDataMasonsTwo, thirdCredit];
    third.playerView.legalActions = third.legalActions;
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(third, {}),
    ).not.toThrow();
    expect(
      residentPlanPortfolioSnapshot(third)?.instances.find(
        (instance) => instance.moduleId === "corp.defend_servers",
      )?.moduleState,
    ).toMatchObject({
      hqHoldCadence: { status: "consumed" },
      hqHoldSelection: {
        selectedActionId: first.installRd.actionId,
        sourceCardInstanceId: "data-wall",
        selectedAtStateVersion: 1,
        targetServerId: "rd",
      },
    });

    const missingSelection = structuredClone(consumedPortfolio!);
    const missingSelectionDefense = missingSelection.instances.find(
      (instance) => instance.moduleId === "corp.defend_servers",
    );
    const missingSelectionState = missingSelectionDefense?.moduleState as
      | { hqHoldSelection?: unknown }
      | undefined;
    if (!missingSelectionState) {
      throw new Error("test fixture requires the resident defense state");
    }
    delete missingSelectionState.hqHoldSelection;
    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(second, missingSelection);
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(second, {}),
    ).toThrowError("invalid_plan_identity");

    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(second, consumedPortfolio);
    const selectedCardAbsent = structuredClone(second);
    selectedCardAbsent.playerView.servers =
      selectedCardAbsent.playerView.servers.map((currentServer) =>
        currentServer.id === "rd" ? server("rd") : currentServer,
      );
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(selectedCardAbsent, {}),
    ).toThrowError("invalid_plan_identity");
  });

  it("emits only an Engine randomized command for the canonical HQ/R&D near tie", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = fourPlusOneNearTieInput();
    const seenRequests: EngineRandomizedIceInstallSelectionRequest[] = [];
    const quote = vi.fn(
      (
        request: EngineRandomizedIceInstallSelectionRequest,
      ): EngineRandomizedIceInstallSelectionQuoteResult => {
        seenRequests.push(structuredClone(request));
        return successfulQuote(request, fixture.input.legalActions);
      },
    );

    const decision = liveContext().chooseSemanticRuntimeAction(fixture.input, {
      quoteRandomizedIceInstallSelection: quote,
    });

    expect(quote).toHaveBeenCalledTimes(1);
    expect(seenRequests).toEqual([
      expect.objectContaining({
        schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
        matchId: fixture.input.matchId,
        side: "corp",
        stateVersion: fixture.input.playerView.stateVersion,
        timingPoint: "corp_action.main",
        candidates: [
          {
            actionId: fixture.installHq.actionId,
            targetServerId: "hq",
          },
          {
            actionId: fixture.installRd.actionId,
            targetServerId: "rd",
          },
        ],
      }),
    ]);
    expect(decision).toMatchObject({
      selectionKind: "engine_randomized_ice_install_selection",
      engineCommand: {
        kind: "engine_randomized_ice_install_selection",
        quote: {
          candidates: [
            {
              actionId: fixture.installHq.actionId,
              targetServerId: "hq",
            },
            {
              actionId: fixture.installRd.actionId,
              targetServerId: "rd",
            },
          ],
        },
      },
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision).not.toHaveProperty("actionId");
    expect(decision).not.toHaveProperty("selectedChoices");
  });

  it.each([
    {
      name: "missing",
      options: {},
    },
    {
      name: "rejected",
      options: {
        quoteRandomizedIceInstallSelection: (
          _request: EngineRandomizedIceInstallSelectionRequest,
        ): EngineRandomizedIceInstallSelectionQuoteResult => ({
          ok: false,
          error: {
            code: "ERR_STALE_STATE",
            message: "test quote rejected",
          },
        }),
      },
    },
  ])(
    "fails closed when the Engine quote is $name instead of selecting the technical route head",
    ({ options }) => {
      resetResidentPlanPortfolioMemory();
      const fixture = fourPlusOneNearTieInput();

      expect(() =>
        liveContext().chooseSemanticRuntimeAction(fixture.input, options),
      ).toThrowError("invalid_support_graph");
    },
  );

  it("does not consume the one-use 4+1 HQ hold while a near tie still awaits Engine randomness", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = fourPlusOneNearTieInput();

    liveContext().chooseSemanticRuntimeAction(fixture.input, {
      quoteRandomizedIceInstallSelection: (request) =>
        successfulQuote(request, fixture.input.legalActions),
    });

    const portfolio = residentPlanPortfolioSnapshot(fixture.input);
    const defense = portfolio?.instances.find(
      (instance) => instance.moduleId === "corp.defend_servers",
    );
    expect(defense).toBeDefined();
    expect(defense?.moduleState).toMatchObject({
      kind: "defense",
      centralAllocation: {
        status: "known",
        selectedServerId: "rd",
        canonicalNearTieCandidateServerIds: ["hq", "rd"],
        hqHold: {
          status: "eligible_once",
          receiptId: "corp-central-hq-hold:server-defense-portfolio",
        },
      },
      hqHoldCadence: {
        status: "available",
        receiptId: "corp-central-hq-hold:server-defense-portfolio",
      },
    });
    expect(defense?.moduleState).not.toHaveProperty("hqHoldSelection");
  });

  it("revalidates an unconsumed HQ-hold receipt after the resident portfolio advances", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = fourPlusOneNearTieInput();

    liveContext().chooseSemanticRuntimeAction(fixture.input, {
      quoteRandomizedIceInstallSelection: (request) =>
        successfulQuote(request, fixture.input.legalActions),
    });

    const captured = residentPlanPortfolioSnapshot(fixture.input);
    if (!captured) {
      throw new Error("test fixture requires the resident portfolio");
    }
    const advancedPortfolio = structuredClone(captured);
    advancedPortfolio.stateVersion = 2;

    const next = structuredClone(fixture.input);
    next.decisionId = "central-defense-runtime-contract:3:corp";
    next.playerView.stateVersion = 3;
    next.playerView.corpCentralAccessQuotes =
      next.playerView.corpCentralAccessQuotes!.map((quote) => ({
        ...quote,
        stateVersion: 3,
      }));
    for (const action of next.legalActions) {
      action.expiresAtStateVersion = 3;
      if (action.payload?.postInstallRezQuoteCardId) {
        action.payload.postInstallRezQuoteExpiresAtStateVersion = 3;
      }
    }
    next.playerView.legalActions = next.legalActions;

    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(next, advancedPortfolio);
    expect(
      liveContext().chooseSemanticRuntimeAction(next, {
        quoteRandomizedIceInstallSelection: (request) =>
          successfulQuote(request, next.legalActions),
      }),
    ).toMatchObject({
      selectionKind: "engine_randomized_ice_install_selection",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });

    expect(
      residentPlanPortfolioSnapshot(next)?.instances.find(
        (instance) => instance.moduleId === "corp.defend_servers",
      )?.moduleState,
    ).toMatchObject({
      hqHoldCadence: {
        status: "available",
        factsStateVersion: 3,
      },
    });
  });
});

function fourPlusOneNearTieInput() {
  return centralDefenseInput({
    hqCards: [
      agenda("hq-tycho", TYCHO_EXTENSION_DEFINITION_ID),
      dataWall(),
      filler("hq-filler-1"),
      filler("hq-filler-2"),
      filler("hq-filler-3"),
    ],
    rdDefinitionIds: [
      CORPORATE_DOWNSIZING_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
    ],
    hqAccessCount: 1,
    rdAccessCount: 2,
  });
}

function centralDefenseInput(params: {
  hqCards: VisibleCard[];
  rdDefinitionIds: string[];
  hqAccessCount: number;
  rdAccessCount: number;
}) {
  const source = params.hqCards.find((card) => card.instanceId === "data-wall");
  if (!source) throw new Error("test fixture requires Data Wall in HQ");
  const installHq = iceInstall(source, "hq");
  const installRd = iceInstall(source, "rd");
  const endTurn = legalAction(
    "end-turn",
    "corp",
    "end_turn",
    "End turn",
    { credits: 0, clicks: 0 },
    { source: "game_rule" },
  );
  const actions = [installHq, installRd, endTurn];
  const input = aiInput("corp", actions);
  input.matchId = "central-defense-runtime-contract";
  input.decisionId = "central-defense-runtime-contract:1:corp";
  input.playerView.stateVersion = 1;
  input.playerView.turnSerial = 1;
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 3;
  input.playerView.own.gripOrHq = params.hqCards;
  input.playerView.own.stackOrRdCount = params.rdDefinitionIds.length;
  input.playerView.opponent.rig = [];
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  input.playerView.corpCentralAccessQuotes = [
    centralAccessQuote("hq", params.hqAccessCount),
    centralAccessQuote("rd", params.rdAccessCount),
  ];
  for (const action of actions) action.expiresAtStateVersion = 1;
  input.legalActions = actions;
  input.playerView.legalActions = actions;
  attachOwnDeckSnapshot(input, {
    deckSnapshotId: "central-defense-runtime-contract-deck",
    side: "corp",
    cards: definitionCounts([
      ...params.hqCards.map((card) => card.definitionId!),
      ...params.rdDefinitionIds,
    ]),
  });
  return { input, installHq, installRd };
}

function iceInstall(source: VisibleCard, serverId: "hq" | "rd"): LegalAction {
  return legalAction(
    `install-data-wall-${serverId}`,
    "corp",
    "install_card",
    `Install Data Wall protecting ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: source.instanceId,
      payload: {
        cardId: source.instanceId,
        sourceDefinitionId: DATA_WALL_DEFINITION_ID,
        placement: "ice",
        serverId,
        iceInstallBaseCost: 0,
        iceInstallAdditionalCost: 0,
        iceInstallReduction: 0,
        iceInstallTotalCost: 0,
        postInstallRezQuoteCardId: source.instanceId,
        postInstallRezQuoteTargetServerId: serverId,
        postInstallRezQuoteProjectedServerId: serverId,
        postInstallRezQuoteExpiresAtStateVersion: 1,
        postInstallRezQuoteComplete: true,
        postInstallRezQuoteCostKind: "fixed",
        postInstallRezQuoteBaseCredits: 1,
        postInstallRezQuoteFinalCredits: 1,
        postInstallRezQuoteMandatoryAgendaPointCost: 0,
      },
    },
  );
}

function rezAction(source: VisibleCard, actionId: string): LegalAction {
  return legalAction(
    actionId,
    "corp",
    "rez_card",
    `Rez ${source.title}`,
    { credits: 0 },
    {
      source: source.instanceId,
      payload: { cardId: source.instanceId },
    },
  );
}

function centralAccessQuote(serverId: "hq" | "rd", accessCount: number) {
  return {
    serverId,
    stateVersion: 1,
    complete: true as const,
    effectiveAccessCount: accessCount,
    isMultiaccess: accessCount > 1,
    sourceDefinitionIds: [],
    serverBoundEffects: [],
  };
}

function agenda(instanceId: string, definitionId: string): VisibleCard {
  return visibleCard(instanceId, "corp", "agenda", { definitionId });
}

function dataWall(): VisibleCard {
  return visibleCard("data-wall", "corp", "ice", {
    definitionId: DATA_WALL_DEFINITION_ID,
    subtypes: ["wall"],
    strength: 0,
  });
}

function filler(instanceId: string): VisibleCard {
  return visibleCard(instanceId, "corp", "operation", {
    definitionId: FILLER_DEFINITION_ID,
  });
}

function definitionCounts(definitionIds: string[]) {
  const counts = new Map<string, number>();
  for (const definitionId of definitionIds) {
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return [...counts].map(([cardId, quantity]) => ({ cardId, quantity }));
}

function successfulQuote(
  request: EngineRandomizedIceInstallSelectionRequest,
  legalActions: LegalAction[],
): EngineRandomizedIceInstallSelectionQuoteResult {
  return {
    ok: true,
    quote: {
      ...request,
      visibility: "private_to_actor",
      complete: true,
      candidateFingerprint: "test:canonical-hq-rd-near-tie",
      legalActions: request.candidates.map((candidate) => {
        const action = legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        if (!action) throw new Error("quoted candidate must remain legal");
        return action;
      }),
    },
  };
}

function liveContext() {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
