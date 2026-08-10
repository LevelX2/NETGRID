import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../card-implementations/registry", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../card-implementations/registry")
    >();
  const mutableImplementations = {
    ...actual.CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  };
  return {
    ...actual,
    CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: mutableImplementations,
    cardImplementationForDefinitionId: (definitionId: string) =>
      mutableImplementations[definitionId],
  };
});
import {
  applyAction,
  createGameAfterSetup,
  DEMO_DECKS,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  moveCorpCardCopyToHq,
  moveCorpCardToArchives,
  moveCorpCardToHq,
  moveRunnerCardToGrip,
  MECHANIC_SMOKE_GAMES,
  ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
  originalsetReorderCounterRunlockGame,
  putCorpIceOnServer,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { passRootRezWindowBeforeAccessIfOpen } from "../../test-fixtures/index-test-helpers";
import { type CardInstanceId } from "@netgrid/shared";
import {
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import {
  overadvanceViewFields,
  visibleFreeNetOrCoreDamagePreventionRemaining,
} from "./card-view";

const TEST_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID =
  CARD_IMPLEMENTATIONS_BY_DEFINITION_ID as Partial<
    Record<
      string,
      NonNullable<ReturnType<typeof cardImplementationForDefinitionId>>
    >
  >;

describe("PlayerView projection", () => {
  it("matches free prevention runtime capacity including use and cancellation", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "free-prevention-view-capacity" }),
    );
    const sourceId = "free-prevention-source" as CardInstanceId;
    state.cardInstances[sourceId] = {
      ...state.cardInstances[state.runner.identity]!,
      definitionId: "onr_classic_047_little-black-box",
      owner: "runner",
      controller: "runner",
    };
    state.runner.rig.hardware.push(sourceId);
    state.cardInstances[sourceId] = {
      ...state.cardInstances[sourceId]!,
      zone: { side: "runner", zone: "rig" },
    };
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: state.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: state.runnerTurnFlags?.stoleAgendaLastTurn ?? false,
      damagePreventionUsage: { [sourceId]: 1 },
    };

    expect(visibleFreeNetOrCoreDamagePreventionRemaining(state)).toBe(0);

    state.runnerTurnFlags = {
      ...state.runnerTurnFlags,
      damagePreventionUsage: {
        ...state.runnerTurnFlags.damagePreventionUsage,
        [sourceId]: 0,
      },
    };
    state.cancelledDamagePreventionSourceIdsUntilEndOfTurn = [sourceId];
    expect(visibleFreeNetOrCoreDamagePreventionRemaining(state)).toBe(0);
  });
  it("projects an authoritative effective run quote for known rezzed ICE", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "known-rezzed-ice-run-quote" }),
    );
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[iceId]!.faceup = true;
    state.cardInstances[iceId]!.rezzed = true;

    const ice = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((card) => card.instanceId === iceId);

    expect(ice?.effectiveRunQuote).toMatchObject({
      iceInstanceId: iceId,
      iceDefinitionId: "simple_barrier_ice",
      effectiveStrength: expect.any(Number),
      subroutines: expect.any(Array),
    });
    expect(ice?.effectiveRunQuote?.subroutines[0]).toMatchObject({
      sourceDefinitionId: "simple_barrier_ice",
      sourceTitle: "Simple Barrier ICE",
    });
    expect(
      getPlayerView(state, "runner").own.runnerTraceSupportQuote,
    ).toMatchObject({
      traceCreditPool: 0,
      baseLinkOptions: expect.arrayContaining([
        expect.objectContaining({ activationCost: 0, safeForAccess: true }),
      ]),
    });
  });

  it("projects a Corp-private state-bound post-rez run quote for fixed ICE", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "fixed-ice-post-rez-run-quote" }),
    );
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    const corpIce = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((card) => card.instanceId === iceId);
    const runnerIce = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((card) => card.instanceId === iceId);

    expect(corpIce?.effectiveRunQuote).toBeUndefined();
    expect(corpIce?.effectivePostRezRunQuote).toMatchObject({
      context: "installed_post_rez",
      cardId: iceId,
      iceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: state.stateVersion,
      complete: true,
      effectiveRunQuote: {
        iceInstanceId: iceId,
        iceDefinitionId: "simple_barrier_ice",
        subroutines: expect.arrayContaining([
          expect.objectContaining({ type: "end_the_run" }),
        ]),
      },
    });
    expect(runnerIce?.effectivePostRezRunQuote).toBeUndefined();
  });

  it("matches a deterministic rez with rezzed-only strength and subroutine modifiers", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "fixed-ice-post-rez-state-parity" }),
    );
    state.corp.credits = 20;
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    const antiquatedId = "post-rez-antiquated" as CardInstanceId;
    const tesseractId = "post-rez-tesseract" as CardInstanceId;
    const identity = state.cardInstances[state.corp.identity]!;
    state.cardInstances[antiquatedId] = {
      ...identity,
      definitionId: "onr_v1_350_antiquated-interface-routines",
      owner: "corp",
      controller: "corp",
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
    };
    state.cardInstances[tesseractId] = {
      ...identity,
      definitionId: "onr_v1_370_tesseract-fort-construction",
      owner: "corp",
      controller: "corp",
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
    };
    state.corp.servers
      .find((server) => server.id === "rd")!
      .root.push(antiquatedId, tesseractId);

    const projectedQuote = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((card) => card.instanceId === iceId)?.effectivePostRezRunQuote;

    expect(state.cardInstances[iceId]?.rezzed).toBe(false);
    expect(projectedQuote).toMatchObject({
      complete: true,
      effectiveRunQuote: {
        subroutines: expect.arrayContaining([
          expect.objectContaining({
            sourceDefinitionId: "onr_v1_370_tesseract-fort-construction",
            type: "end_the_run_unless_runner_pays",
          }),
        ]),
      },
    });

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.payload?.cardId === iceId,
    );
    const actuallyRezzedQuote = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((card) => card.instanceId === iceId)?.effectiveRunQuote;

    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(
      projectedQuote?.complete && projectedQuote.effectiveRunQuote,
    ).toEqual(actuallyRezzedQuote);
  });

  it("fails closed and stays side-safe for ICE with real on-rez lifecycle effects", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "on-rez-lifecycle-post-rez-quote" }),
    );
    state.corp.credits = 10;
    const iceId = "post-rez-snowbank" as CardInstanceId;
    state.cardInstances[iceId] = {
      ...state.cardInstances[state.corp.identity]!,
      instanceId: iceId,
      definitionId: "onr_proteus_038_snowbank",
      owner: "corp",
      controller: "corp",
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    };
    state.corp.servers.find((server) => server.id === "rd")!.ice.push(iceId);
    const stateBeforeProjection = structuredClone(state);

    const corpIce = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === iceId);
    const runnerIce = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === iceId);

    expect(corpIce?.effectivePostRezRunQuote).toMatchObject({
      context: "installed_post_rez",
      cardId: iceId,
      iceDefinitionId: "onr_proteus_038_snowbank",
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: state.stateVersion,
      complete: false,
      reason: "on_rez_lifecycle_projection_required",
    });
    expect(runnerIce?.effectivePostRezRunQuote).toBeUndefined();
    expect(state).toEqual(stateBeforeProjection);

    const corpCreditsBeforeRez = state.corp.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezAction = getLegalActions(state, "corp").find(
      (action) => action.type === "rez_ice" && action.payload?.cardId === iceId,
    );
    if (!rezAction) throw new Error("Expected Snowbank rez action");
    const rezCreditCost = rezAction.costs.reduce(
      (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
      0,
    );
    state = apply(
      state,
      "corp",
      (action) => action.actionId === rezAction.actionId,
    );

    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(corpCreditsBeforeRez - rezCreditCost + 3);
  });

  it("keeps variable and active-run post-rez projections incomplete", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "incomplete-post-rez-run-quotes" }),
    );
    const variableIceId = "variable-post-rez-ice" as CardInstanceId;
    state.cardInstances[variableIceId] = {
      ...state.cardInstances[state.corp.identity]!,
      definitionId: "onr_proteus_025_homing-missile",
      owner: "corp",
      controller: "corp",
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    };
    state.corp.servers
      .find((server) => server.id === "hq")!
      .ice.push(variableIceId);
    const fixedIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    expect(
      getPlayerView(state, "corp")
        .servers.find((server) => server.id === "hq")
        ?.ice.find((card) => card.instanceId === variableIceId)
        ?.effectivePostRezRunQuote,
    ).toMatchObject({
      complete: false,
      reason: "variable_rez_choice_required",
    });

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(
      getPlayerView(state, "corp")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((card) => card.instanceId === fixedIceId)
        ?.effectivePostRezRunQuote,
    ).toMatchObject({ complete: false, reason: "active_run_context" });
  });

  it("projects structured post-bid link and trace-success-cancel support", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "runner-trace-window-support" }),
    );
    const source = state.cardInstances[state.runner.identity]!;
    const postBidSourceId = "trace-post-bid-source" as CardInstanceId;
    const cancelSourceId = "trace-cancel-source" as CardInstanceId;
    state.cardInstances[postBidSourceId] = {
      ...source,
      definitionId: "onr_proteus_154_wired-switchboard",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
    };
    state.cardInstances[cancelSourceId] = {
      ...source,
      definitionId: "onr_proteus_129_back-door-to-netwatch",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
    };
    state.runner.rig.resources.push(postBidSourceId, cancelSourceId);

    const traceSupport = getPlayerView(state, "runner").own
      .runnerTraceSupportQuote;

    expect(traceSupport?.postBidLinkOptions).toContainEqual(
      expect.objectContaining({
        sourceCardInstanceId: postBidSourceId,
        linkDelta: 3,
        activationCost: 0,
        trashSource: true,
        safeForAccess: true,
      }),
    );
    expect(traceSupport?.traceSuccessCancelOptions).toContainEqual(
      expect.objectContaining({
        sourceCardInstanceId: cancelSourceId,
        activationCost: 3,
        trashSource: true,
      }),
    );
  });

  it("projects Hell's Run trace credits from its restricted-credit contract", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "hells-run-structured-trace-credit" }),
    );
    const sourceId = "hells-run-trace-credit" as CardInstanceId;
    state.cardInstances[sourceId] = {
      ...state.cardInstances[state.runner.identity]!,
      definitionId: "onr_v1_164_hells-run",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      counters: { bit: 1 },
    };
    state.runner.rig.resources.push(sourceId);

    expect(
      getPlayerView(state, "runner").own.runnerTraceSupportQuote
        ?.traceCreditSources,
    ).toContainEqual({
      sourceCardInstanceId: sourceId,
      sourceDefinitionId: "onr_v1_164_hells-run",
      amount: 1,
      isStealth: false,
    });
  });

  it("ignores installed non-trace abilities while projecting trace support", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "non-trace-ability-trace-quote" }),
    );
    const sourceId = "crash-space-trace-quote" as CardInstanceId;
    state.cardInstances[sourceId] = {
      ...state.cardInstances[state.runner.identity]!,
      definitionId: "onr_classic_044_crash-space",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
    };
    state.runner.rig.resources.push(sourceId);

    expect(() => getPlayerView(state, "runner")).not.toThrow();
    const traceSupport = getPlayerView(state, "runner").own
      .runnerTraceSupportQuote;
    expect(traceSupport?.postBidLinkOptions).not.toContainEqual(
      expect.objectContaining({ sourceCardInstanceId: sourceId }),
    );
    expect(traceSupport?.traceSuccessCancelOptions).not.toContainEqual(
      expect.objectContaining({ sourceCardInstanceId: sourceId }),
    );
  });

  it("fails loudly for a trace-window ability with an invalid trace cost", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "invalid-trace-window-cost" }),
    );
    const sourceId = "invalid-trace-window-source" as CardInstanceId;
    state.cardInstances[sourceId] = {
      ...state.cardInstances[state.runner.identity]!,
      definitionId: "onr_classic_044_crash-space",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
    };
    state.runner.rig.resources.push(sourceId);

    const definitionId = "onr_classic_044_crash-space";
    const originalImplementation =
      TEST_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
    if (!originalImplementation)
      throw new Error("Missing Crash Space implementation");
    TEST_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId] = {
      ...originalImplementation,
      abilities: [
        {
          kind: "activated",
          timing: "trace_post_bid_link_window",
          costs: [{ kind: "action", amount: 1 }],
          label: "Invalid trace-window cost",
          effects: [
            {
              kind: "increase_trace_link",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
    };
    try {
      expect(() => getPlayerView(state, "runner")).toThrow(
        "Trace CardImplementation ability supports nonnegative credit and optional source costs.",
      );
    } finally {
      TEST_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId] =
        originalImplementation;
    }
  });

  it("projects public during-run ICE rez support as a server status", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "during-run-ice-rez-support-status" }),
    );
    const sourceId = "olivia-salazar" as CardInstanceId;
    const source = state.cardInstances[state.runner.identity]!;
    const rd = state.corp.servers.find((server) => server.id === "rd");
    if (!rd) throw new Error("Missing R&D server");
    state.cardInstances[sourceId] = {
      ...source,
      definitionId: "onr_v1_363_olivia-salazar",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
      faceup: true,
      rezzed: true,
    };
    rd.root.push(sourceId);

    const statuses = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "rd",
    )?.statuses;

    expect(statuses).toContainEqual(
      expect.objectContaining({
        kind: "during_run_ice_rez_support",
        sourceCardInstanceId: sourceId,
        costModel: "half_rez_cost_rounded_down",
        target: "unrezzed_ice_on_this_fort",
      }),
    );
  });

  it("projects an authoritative quote with explicit trace bases for every playable ICE", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "all-playable-ice-run-quotes" }),
    );
    const server = state.corp.servers.find(
      (candidate) => candidate.id === "rd",
    );
    const sourceInstance = Object.values(state.cardInstances)[0];
    if (!server || !sourceInstance)
      throw new Error("Missing audit fixture state");
    const playableIce = Object.values(CARD_DEFINITIONS_BY_ID).filter(
      (definition) =>
        definition.implementationStatus === "playable_mvp" &&
        definition.type === "ice",
    );

    expect(playableIce.length).toBeGreaterThan(0);
    for (const definition of playableIce) {
      const iceId = `authoritative-quote-${definition.id}` as CardInstanceId;
      state.cardInstances[iceId] = {
        ...sourceInstance,
        definitionId: definition.id,
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: true,
        rezzed: true,
      };
      server.ice = [iceId];

      const ice = getPlayerView(state, "runner")
        .servers.find((candidate) => candidate.id === "rd")
        ?.ice.find((card) => card.instanceId === iceId);
      const quote = ice?.effectiveRunQuote;

      expect(
        quote,
        `${definition.title}: fehlender authoritative Quote`,
      ).toBeDefined();
      expect(quote?.effectiveStrength).toBeTypeOf("number");
      for (const subroutine of quote?.subroutines ?? []) {
        expect(
          subroutine.sourceDefinitionId,
          `${definition.title}: fehlende Subroutinenquelle`,
        ).toBeDefined();
        expect(
          subroutine.sourceTitle,
          `${definition.title}: fehlender Subroutinentitel`,
        ).toBeDefined();
        if (subroutine.type === "initiate_trace") {
          expect(
            subroutine.traceLimit,
            `${definition.title}: fehlende explizite Trace-Basis`,
          ).toBeTypeOf("number");
        }
      }
    }
  });

  it("projects Vapor Ops counter-bank evidence only to the Corp", () => {
    const state = originalsetReorderCounterRunlockGame(
      "vapor-counter-bank-projection",
    );
    const vaporId = moveCorpCardToHq(state, "onr_v1_347_vapor-ops");

    const hqVapor = getPlayerView(state, "corp").own.gripOrHq.find(
      (card) => card.instanceId === vaporId,
    );
    expect(hqVapor?.counterBankPreparationQuote).toEqual({
      schemaVersion: "corp-counter-bank-preparation-quote-v1",
      context: "corp_counter_bank_preparation",
      sourceCardId: vaporId,
      expiresAtStateVersion: state.stateVersion,
      location: { kind: "corp_hq" },
      advancementCounters: 0,
      advanceableBeforeRez: true,
      activatedAbilitiesRequireRez: true,
      cashout: {
        advancementCounterCost: 1,
        creditGain: 1,
        actionCost: 0,
      },
      transfer: {
        actionCost: 1,
        minimumSourceCounters: 1,
        source: "source_card",
        target: "chosen_installed_advanceable_card",
        maximum: "all",
      },
    });

    putCorpRootInRemote(state, "onr_v1_347_vapor-ops");
    state.cardInstances[vaporId]!.advancementCounters = 3;
    const rootVapor = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "remote_1")
      ?.root.find((card) => card.instanceId === vaporId);
    expect(rootVapor?.counterBankPreparationQuote).toMatchObject({
      sourceCardId: vaporId,
      location: { kind: "installed_root", serverId: "remote_1" },
      advancementCounters: 3,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "counterBankPreparationQuote",
    );
  });

  it("certifies next-turn agenda cash after using surplus unrestricted Corp clicks", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "corp-score-continuation-quote" }),
    );
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    state.cardInstances[agendaId]!.advancementCounters = 2;

    const corpAgenda = getPlayerView(state, "corp")
      .servers.flatMap((server) => server.root)
      .find((card) => card.instanceId === agendaId);
    const runnerView = getPlayerView(state, "runner");

    expect(corpAgenda?.scoreContinuationQuote).toEqual({
      context: "installed_agenda",
      agendaCardId: agendaId,
      serverId: "remote_1",
      expiresAtStateVersion: state.stateVersion,
      complete: true,
      remainingAdvancementCounters: 1,
      advancementCreditCostPerCounter: 1,
      advancementClickCostPerCounter: 1,
      scoreActionCreditCost: 0,
      scoreActionClickCost: 0,
      nextCorpTurnGuaranteedFlexibleClicks: 3,
      freeCreditClicksAfterAdvancement: 2,
      certifiedCreditGainFromFreeClicks: 2,
      creditsRequiredBeforeNextCorpTurn: 0,
      terminalScore: false,
    });
    expect(JSON.stringify(runnerView)).not.toContain("scoreContinuationQuote");
  });

  it("projects a side-safe temporary return marker only while the program remains installed", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "temporary-return-view-marker" }),
    );
    const programId = moveRunnerCardToGrip(state, "simple_decoder");
    removeEverywhere(state, programId);
    state.runner.rig.programs.push(programId);
    state.cardInstances[programId]!.zone = {
      side: "runner",
      zone: "rig",
    };
    state.temporaryProgramInstallReturns = [
      {
        cardId: programId,
        sourceCardDefinitionId: "onr_v1_110_sneak-preview",
      },
    ];

    const runnerProgram = getPlayerView(state, "runner").own.rig?.find(
      (card) => card.instanceId === programId,
    );
    const corpProgram = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.instanceId === programId,
    );
    expect(runnerProgram?.lifecycleMarkers).toEqual([
      {
        kind: "temporary_return_to_grip",
        label: "Sneak Preview",
        detail: "Am Runner-Zugende zurück in den Grip, falls noch installiert",
      },
    ]);
    expect(corpProgram).not.toHaveProperty("lifecycleMarkers");

    removeEverywhere(state, programId);
    state.runner.heap.push(programId);
    state.cardInstances[programId]!.zone = {
      side: "runner",
      zone: "heap",
    };
    const trashedProgram = getPlayerView(
      state,
      "runner",
    ).own.heapOrArchives.find((card) => card.instanceId === programId);
    expect(trashedProgram).not.toHaveProperty("lifecycleMarkers");

    removeEverywhere(state, programId);
    state.runner.grip.push(programId);
    state.cardInstances[programId]!.zone = {
      side: "runner",
      zone: "grip",
    };
    const returnedProgram = getPlayerView(state, "runner").own.gripOrHq.find(
      (card) => card.instanceId === programId,
    );
    expect(returnedProgram).not.toHaveProperty("lifecycleMarkers");

    removeEverywhere(state, programId);
    state.runner.rig.programs.push(programId);
    state.cardInstances[programId]!.zone = {
      side: "runner",
      zone: "rig",
    };
    state.temporaryProgramInstallReturns = [];
    const clearedProgram = getPlayerView(state, "runner").own.rig?.find(
      (card) => card.instanceId === programId,
    );
    expect(clearedProgram).not.toHaveProperty("lifecycleMarkers");
  });

  it("does not leak hidden Corp card titles into the Runner view or public events", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "visibility" }));
    moveRunnerCardToGrip(state, "simple_run_event");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToArchives(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpRootInRemote(state, "simple_economy_asset");
    const advancedAgendaId = putCorpRootInRemote(state, "simple_agenda");
    if (!state.cardInstances[advancedAgendaId])
      throw new Error("Missing advanced hidden agenda fixture");
    state.cardInstances[advancedAgendaId].advancementCounters = 5;

    const stateHashBeforeViews = hashState(state);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const serialized = JSON.stringify(runnerView);
    const knownRunnerCard = runnerView.own.gripOrHq.find(
      (card) => card.definitionId === "simple_run_event",
    );

    expect(knownRunnerCard?.rulesText).toBe(
      "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.",
    );
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Barrier ICE");
    expect(serialized).not.toContain("Simple Economy Asset");
    expect(serialized).not.toContain("Keine zusätzliche Fähigkeit.");
    expect(serialized).not.toContain("End the run.");
    expect(serialized).not.toContain(
      "Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.",
    );
    const runnerHiddenAdvancedRoot = runnerView.servers
      .flatMap((server) => server.root)
      .find((card) => card.advancementCounters === 5);
    expect(runnerHiddenAdvancedRoot).toMatchObject({
      known: false,
      rezzed: false,
      advancementCounters: 5,
      counterDisplays: [
        {
          id: "advancement",
          amount: 5,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "5 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
      ],
    });
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("title");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("definitionId");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("type");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty(
      "advancementRequirement",
    );
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("agendaPoints");
    const corpAdvancedRoot = corpView.servers
      .flatMap((server) => server.root)
      .find((card) => card.instanceId === advancedAgendaId);
    expect(corpAdvancedRoot).toMatchObject({
      known: true,
      title: "Simple Agenda",
      advancementCounters: 5,
      advancementRequirement: 3,
      agendaPoints: 2,
      counterDisplays: [
        {
          id: "advancement",
          amount: 5,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "5 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
      ],
    });
    expect(hashState(state)).toBe(stateHashBeforeViews);
    expect(runnerView.opponent.handCount).toBe(state.corp.hq.length);
    expect(runnerView.opponent.deckCount).toBe(state.corp.rd.length);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(
      runnerView.servers.some((server) =>
        server.ice.some((card) => !card.known),
      ),
    ).toBe(true);
    expect(JSON.stringify(runnerView.publicEvents)).not.toContain(
      "Simple Agenda",
    );
  });

  it("projects a source-bound run restriction on the affected server", () => {
    const state = createGameAfterSetup({
      seed: "roving-submarine-run-lock-view",
      runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
      corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
    });
    const rovingId = putCorpRootInRemote(state, "onr_v1_368_roving-submarine");
    const roving = state.cardInstances[rovingId]!;
    roving.rezzed = true;
    roving.faceup = true;
    roving.counters = {};

    const lockedRunnerServer = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    const lockedCorpServer = getPlayerView(state, "corp").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(lockedRunnerServer?.statuses).toEqual([
      {
        id: `server_status:remote_1:run_prohibited:${rovingId}:fort_activity_gate`,
        kind: "run_prohibited",
        scope: "target_server",
        reason: "required_corp_activity_during_latest_corp_turn_missing",
        targetServerId: "remote_1",
        sourceCardInstanceId: rovingId,
        sourceAbilityId: "fort_activity_gate",
        sourceTitle: "Roving Submarine",
        sourceSide: "corp",
      },
    ]);
    expect(lockedCorpServer?.statuses).toEqual(lockedRunnerServer?.statuses);

    state.corpTurnFlags = {
      scoredBlackOpsAgendaThisTurn: false,
      scoredBlackOpsAgendaLastTurn: false,
      fortActivityServerIdsSinceCorpTurnStart: ["remote_1"],
    };
    const allowedRunnerServer = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(allowedRunnerServer?.statuses).toBeUndefined();

    roving.rezzed = false;
    roving.faceup = false;
    roving.counters = {};
    const hiddenRunnerCard = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "remote_1")
      ?.root.at(0);
    expect(hiddenRunnerCard).toMatchObject({ known: false, rezzed: false });
    expect(hiddenRunnerCard).not.toHaveProperty("title");
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "remote_1",
      )?.statuses,
    ).toBeUndefined();
  });

  it("projects a server-bound stealth-payment restriction from a rezzed root", () => {
    const state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-stealth-block"),
    );
    const surveillanceId = putCorpRootInRemote(
      state,
      "onr_v1_373_twenty-four-hour-surveillance",
    );
    state.cardInstances[surveillanceId]!.rezzed = true;
    state.cardInstances[surveillanceId]!.faceup = true;

    const server = getPlayerView(state, "runner").servers.find(
      (candidate) => candidate.id === "remote_1",
    );

    expect(server?.statuses).toContainEqual(
      expect.objectContaining({
        kind: "run_payment_restriction",
        restriction: "runner_stealth_bit_payment_sources",
        sourceCardInstanceId: surveillanceId,
      }),
    );
  });

  it.each([
    ["onr_v1_214_project-babylon", 2, "agenda_points"],
    ["onr_proteus_007_project-venice", 3, "start_of_corp_turn_actions"],
    ["onr_proteus_008_project-zurich", 2, "start_of_corp_turn_credits"],
  ] as const)(
    "projects the authoritative overadvance contract for %s",
    (definitionId, threshold, reward) => {
      expect(
        overadvanceViewFields(cardImplementationForDefinitionId(definitionId)),
      ).toEqual({
        overadvanceThreshold: threshold,
        overadvanceReward: reward,
      });
    },
  );

  it("keeps mixed remote root order accessible without leaking hidden root types before access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "remote-root-hidden-order",
        runnerDeck: DEMO_DECKS.demo_runner_004,
        corpDeck: DEMO_DECKS.demo_corp_004,
      }),
    );
    state.runner.credits = 20;
    const firstUpgradeId = moveCorpCardToHq(state, "simple_upgrade");
    const secondUpgradeId = moveCorpCardCopyToHq(state, "simple_upgrade");
    const rezzedNodeId = moveCorpCardToHq(state, "simple_economy_asset");
    let remote = state.corp.servers.find((server) => server.id === "remote_1");
    if (!remote) {
      remote = {
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      };
      state.corp.servers.push(remote);
    }
    const remoteServer = remote;
    const installRoot = (cardId: CardInstanceId, rezzed: boolean) => {
      removeEverywhere(state, cardId);
      remoteServer.root.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
        faceup: rezzed,
        rezzed,
      };
    };
    installRoot(firstUpgradeId, false);
    installRoot(rezzedNodeId, true);
    installRoot(secondUpgradeId, false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    const runnerRemoteBefore = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(runnerRemoteBefore?.root).toHaveLength(3);
    expect(runnerRemoteBefore?.root[0]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(runnerRemoteBefore?.root[0]).not.toHaveProperty("definitionId");
    expect(runnerRemoteBefore?.root[0]).not.toHaveProperty("type");
    expect(runnerRemoteBefore?.root[1]).toMatchObject({
      known: true,
      definitionId: "simple_economy_asset",
      type: "asset",
      rezzed: true,
    });
    expect(runnerRemoteBefore?.root[2]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(runnerRemoteBefore?.root[2]).not.toHaveProperty("definitionId");
    expect(runnerRemoteBefore?.root[2]).not.toHaveProperty("type");
    expect(
      JSON.stringify(getPlayerView(state, "runner").publicEvents),
    ).not.toContain("simple_upgrade");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(getPlayerView(state, "runner").run?.runId).toBe(state.run?.runId);
    expect(getPlayerView(state, "corp").run?.runId).toBe(state.run?.runId);
    state = passRootRezWindowBeforeAccessIfOpen(state);

    expect(
      state.run?.breach?.queue.map((entry) => entry.cardInstanceId),
    ).toEqual([firstUpgradeId, rezzedNodeId, secondUpgradeId]);
    expect(
      JSON.stringify(getPlayerView(state, "runner").publicEvents),
    ).not.toContain("simple_upgrade");

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "remote_1",
      )?.root[0],
    ).toMatchObject({
      instanceId: firstUpgradeId,
      known: true,
      definitionId: "simple_upgrade",
      rezzed: false,
    });
    expect(state.cardInstances[firstUpgradeId]?.faceup).toBe(false);
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    const runnerRemoteBetweenAccesses = getPlayerView(
      state,
      "runner",
    ).servers.find((server) => server.id === "remote_1");
    expect(runnerRemoteBetweenAccesses?.root[0]).toMatchObject({
      instanceId: firstUpgradeId,
      known: true,
      definitionId: "simple_upgrade",
      rezzed: false,
    });
    expect(runnerRemoteBetweenAccesses?.root[2]).toMatchObject({
      known: false,
      rezzed: false,
    });
    const betweenAccessActions = getLegalActions(state, "runner");
    expect(betweenAccessActions.map((action) => action.type)).toEqual([
      "access_card",
    ]);
    expect(getLegalActions(state, "corp")).toEqual([]);
    const staleAccess = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: betweenAccessActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "remote-root-between-access-stale",
    });
    expect(staleAccess.ok).toBe(false);
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");

    expect(state.run).toBeUndefined();
    const runnerRemoteAfter = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(runnerRemoteAfter?.root[0]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(runnerRemoteAfter?.root[2]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(state.cardInstances[firstUpgradeId]?.faceup).toBe(false);
    expect(state.cardInstances[secondUpgradeId]?.faceup).toBe(false);
    const accessEvents = state.eventLog
      .slice(replayStart)
      .filter((event) => event.publicPayload.actionType === "access_card");
    expect(
      accessEvents.map((event) => event.publicPayload.cardDefinitionId),
    ).toEqual(["simple_upgrade", "simple_economy_asset", "simple_upgrade"]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(validateGameState(state).ok).toBe(true);
  });
});
