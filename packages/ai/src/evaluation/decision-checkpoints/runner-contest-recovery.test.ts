import type { PublicGameEvent, VisibleCard } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";

import multipleAccessReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-prepared-path-hazard-d293.json";
import efficientBreakerReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ce27c6b1-d97-efficient-breaker-replay.json";
import terminalSpendReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ce27c6b1-d112-terminal-spend-replay.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerFinalClickCentralAccessBeforeTerminalScore } from "../../plans/runner-run-purpose";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { runnerDefenseHandBufferFacts } from "../../runner/defense-recovery/defense-signals";
import { runnerCostEffectiveCoverageRecovery } from "../../runner/rig-coverage/coverage-recovery";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capturedInput(fixture: unknown) {
  const { input, runtime, stateVersion, validation } = structuredClone(
    fixture,
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    stateVersion: number;
    validation: Record<string, boolean>;
  };
  const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Expected the captured Runner deck.");
  expect(Object.values(validation).every((value) => value === true)).toBe(true);
  expect(input.playerView.stateVersion).toBe(stateVersion);
  restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
  const projected = buildAiDecisionInputDto(input);
  return { ...input, ...projected };
}

function cheaperBreakerInstall(input: AiDecisionInputWithDeckCapabilities) {
  const answer = input.playerView.own.gripOrHq.find(
    (card) => card.title === "Loony Goon",
  );
  const install = input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      action.source === answer?.instanceId &&
      action.payload?.runnerProgramTrashBeforeInstall !== true,
  );
  if (!install) throw new Error("Expected the captured direct installation.");
  return install;
}

function centralAndRemoteRoutes(input: AiDecisionInputWithDeckCapabilities) {
  const routes = evaluateRunnerRunTargets({
    input,
    ...(input.ownDeckCapabilities
      ? { deckCapabilities: input.ownDeckCapabilities }
      : {}),
  });
  const hq = routes.find((route) => route.actionId === "runner.start_run.hq");
  const remote = routes.find(
    (route) => route.actionId === "runner.start_run.remote_1",
  );
  if (!hq || !remote) throw new Error("Expected both recorded run routes.");
  return { hq, remote, routes };
}

function visibleOpponentAgenda(
  input: AiDecisionInputWithDeckCapabilities,
  points: number,
  serverId: NonNullable<VisibleCard["effectiveStealCostQuote"]>["serverId"],
): VisibleCard {
  const source = input.playerView.opponent.scoreArea?.find(
    (card) => card.type === "agenda" && card.agendaPoints === points,
  );
  if (!source)
    throw new Error("Expected a scored agenda of the requested size.");
  const instanceId = source.instanceId + "_review_" + serverId;
  return {
    ...source,
    instanceId,
    known: true,
    rezzed: false,
    effectiveStealCostQuote: {
      agendaInstanceId: instanceId,
      serverId,
      stateVersion: input.playerView.stateVersion,
      creditCost: 0,
      complete: true,
    },
  };
}

afterEach(resetResidentPlanPortfolioMemory);

describe("Runner contest recovery", () => {
  it("binds a cheaper operating route to an exact installing action at decision 97", () => {
    const input = capturedInput(efficientBreakerReplay);
    const install = cheaperBreakerInstall(input);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(install.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      route: {
        actionId: install.actionId,
        stepId: expect.stringContaining(":install:"),
        stateVersion: input.playerView.stateVersion,
      },
      selectedPlan: { moduleId: "runner.rig_and_coverage" },
    });
  });

  it("restores the D97 hand after installation and requotes the cheaper HQ path", () => {
    const input = capturedInput(efficientBreakerReplay);
    const install = cheaperBreakerInstall(input);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(install.actionId);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.evidenceCodes,
    ).toEqual(
      expect.arrayContaining([
        "coverage_efficiency_hand_recovery_clicks:1",
        "coverage_efficiency_plausible_accesses:2",
        "coverage_efficiency_savings_after_setup_clicks:4",
      ]),
    );

    // Side-safe consequence of the exact current install. The next draw
    // is an observation boundary and supplies no hypothetical card.
    const view = input.playerView;
    const own = view.own;
    const installed = own.gripOrHq.find(
      (card) => card.instanceId === install.source,
    )!;
    own.gripOrHq = own.gripOrHq.filter((card) => card !== installed);
    own.rig!.push(installed);
    own.memoryUsed! += installed.memoryCost!;
    own.credits -= install.costs.reduce(
      (credits, cost) => credits + (cost.credits ?? 0),
      0,
    );
    own.clicks -= install.costs.reduce(
      (clicks, cost) => clicks + (cost.clicks ?? 0),
      0,
    );
    const stateVersionBefore = view.stateVersion++;
    input.legalActions = input.legalActions
      .filter((action) => action.source !== install.source)
      .map((action) => ({
        ...action,
        expiresAtStateVersion: view.stateVersion,
      }));
    for (const server of view.servers) {
      if (server.runnerAgendaStealCostQuote)
        server.runnerAgendaStealCostQuote.stateVersion = view.stateVersion;
    }
    input.observedTurnPlanAction = {
      matchId: input.matchId!,
      side: "runner",
      stateVersionBefore,
      stateVersionAfter: view.stateVersion,
      actionId: install.actionId,
      actionType: install.type,
      source: install.source,
      boundChoices: [],
    };
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    expect(centralAndRemoteRoutes(input).hq).toMatchObject({ pathCost: 7 });
    expect(chooseAiAction(input)).toMatchObject({
      actionId: "runner.draw_card",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: { moduleId: "runner.defense_and_recovery" },
          route: {
            actionId: "runner.draw_card",
            stateVersion: view.stateVersion,
          },
        },
      },
    });
  });

  it.each(["equal installation plus run cost", "no remaining click"] as const)(
    "preserves the old route when the upgrade has %s",
    (reason) => {
      const input = capturedInput(efficientBreakerReplay);
      const install = cheaperBreakerInstall(input);
      const hq = evaluateRunnerRunTargets({ input }).find(
        (route) => route.actionId === "runner.start_run.hq",
      );
      if (!hq) throw new Error("Expected the recorded HQ route.");
      expect(hq).toMatchObject({
        pathCost: 12,
        fundingNeed: { reason: "post_run_floor_gap" },
      });
      const candidates = buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: input.side,
        stateVersion: input.playerView.stateVersion,
        visibleSourceDefinitionsByInstanceId: Object.fromEntries(
          input.playerView.own.gripOrHq.map((card) => [
            card.instanceId,
            card.definitionId!,
          ]),
        ),
      });
      const deck = input.ownDeckCapabilities;
      if (!deck) throw new Error("Expected the captured breaker profiles.");
      const { minimumHandBuffer } = runnerDefenseHandBufferFacts(
        input,
        [hq],
        () => false,
      );
      expect(
        runnerCostEffectiveCoverageRecovery(
          input,
          candidates,
          hq,
          deck,
          minimumHandBuffer,
        ),
      ).toMatchObject({
        installActionId: install.actionId,
        totalRecoveryCost: 11,
      });

      if (reason === "equal installation plus run cost") {
        const cost = install.costs.find((item) => item.credits === 4);
        if (!cost) throw new Error("Expected the recorded install price.");
        cost.credits = 5;
      } else {
        input.playerView.own.clicks = 1;
      }
      expect(
        runnerCostEffectiveCoverageRecovery(
          input,
          candidates,
          hq,
          deck,
          minimumHandBuffer,
        ),
      ).toBeUndefined();
    },
  );

  it("uses the funded central route in the last click at decision 112", () => {
    const input = capturedInput(terminalSpendReplay);
    const { hq, remote } = centralAndRemoteRoutes(input);
    expect(hq).toMatchObject({
      pathCost: 7,
      creditsAfterRun: 9,
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
    });
    expect(remote.prerunReserveQuote).toMatchObject({
      status: "blocked",
      creditGap: 2,
    });
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(hq.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      route: {
        actionId: hq.actionId,
        stepId: expect.stringContaining(":pressure:hq"),
        stateVersion: input.playerView.stateVersion,
      },
    });
  });

  it("takes a known payable winning agenda in unprotected Archives", () => {
    const input = capturedInput(terminalSpendReplay);
    const view = input.playerView;
    const archives = view.servers.find((server) => server.id === "archives")!;
    archives.root.push(visibleOpponentAgenda(input, 3, archives.id));
    view.opponent.discardCount++;

    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: "runner.start_run.archives",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: { moduleId: "runner.pressure_central" },
          route: {
            actionId: "runner.start_run.archives",
            stateVersion: view.stateVersion,
          },
        },
      },
    });
  });

  it("considers an immediately affordable multiple access in the same last-click window", () => {
    const input = capturedInput(terminalSpendReplay);
    const example =
      multipleAccessReplay.input as AiDecisionInputWithDeckCapabilities;
    const event = example.legalActions.find(
      (action) =>
        action.type === "play_event" && action.actionId.includes("all-hands"),
    )!;
    const card = example.playerView.own.gripOrHq.find(
      (card) => card.instanceId === event.source,
    )!;
    input.playerView.own.gripOrHq.push(structuredClone(card));
    input.legalActions.push({
      ...structuredClone(event),
      expiresAtStateVersion: input.playerView.stateVersion,
    });

    expect(chooseAiAction(input)).toMatchObject({
      actionId: event.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: { moduleId: "runner.pressure_central" },
        },
      },
    });
  });

  it("preserves liquidity when the only visible remote agenda cannot give Corp enough points", () => {
    const input = capturedInput(terminalSpendReplay);
    const view = input.playerView;
    view.opponent.agendaPoints = 4;
    const remote = view.servers.find((server) => server.id === "remote_1")!;
    remote.root = [
      { ...visibleOpponentAgenda(input, 1, remote.id), advancementCounters: 1 },
    ];
    // Keep the remote out of current reach even after the unknown-agenda
    // reserve is replaced by the assessment of a visible agenda.
    for (const ice of remote.ice.slice(0, 2)) {
      for (const copy of [1, 2]) {
        const iceId = ice.instanceId + "_review_" + copy;
        remote.ice.unshift({
          ...ice,
          instanceId: iceId,
          effectiveRunQuote: {
            ...ice.effectiveRunQuote!,
            iceInstanceId: iceId,
          },
        });
      }
    }

    expect(chooseAiAction(input)).toMatchObject({
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: { selectedPlan: { moduleId: "runner.economy" } },
      },
    });
  });

  it("keeps the HQ chance when a reachable second remote can only contain an upgrade", () => {
    const input = capturedInput(terminalSpendReplay);
    const view = input.playerView;
    const id = "remote_2";
    const label = "Remote 2";
    const remote = view.servers.find((server) => server.id === "remote_1")!;
    view.servers.push({
      ...remote,
      id,
      label,
      root: [{ instanceId: "hidden_remote2_upgrade", known: false }],
      ice: [],
      runnerAgendaStealCostQuote: {
        ...remote.runnerAgendaStealCostQuote!,
        serverId: id,
      },
    });
    const run = input.legalActions.find(
      (action) => action.actionId === "runner.start_run.remote_1",
    )!;
    input.legalActions.push({
      ...run,
      actionId: "runner.start_run." + id,
      payload: { ...run.payload, serverId: id },
    });
    const events: PublicGameEvent[] = [
      {
        eventId: "evt_review_replacement",
        type: "install_card",
        stateVersionBefore: 177,
        stateVersionAfter: 178,
        turnSerial: 28,
        stateHashAfter: "fnv1a:d0000000",
        visibilityClass: "public",
        publicPayload: {
          actor: "corp",
          actionType: "install_card",
          serverLabel: label,
          installPlacement: "root",
          rootReplacement: "asset_to_agenda",
          replacedRootCardType: "asset",
        },
      },
      {
        eventId: "evt_review_score",
        type: "score_agenda",
        stateVersionBefore: 178,
        stateVersionAfter: 179,
        turnSerial: 28,
        stateHashAfter: "fnv1a:d0000001",
        visibilityClass: "public",
        publicPayload: {
          actor: "corp",
          actionType: "score_agenda",
          targets: { scoredFromServerId: id },
          cardDefinitionId: "onr_v1_193_corporate-coup",
        },
      },
    ];
    view.publicEvents.push(...events);
    input.eventTail.push(...events);

    const { routes } = centralAndRemoteRoutes(input);
    expect(routes.find((route) => route.targetServerId === id)).toMatchObject({
      pathPassability: "reachable",
      accessPayoffContestable: false,
    });
    expect(chooseAiAction(input)).toMatchObject({
      actionId: "runner.start_run.hq",
      fallbackUsed: false,
    });
  });

  it("keeps three hand cards when no draw can restore the shared defense buffer", () => {
    const input = capturedInput(efficientBreakerReplay);
    const nonInstallableCard =
      terminalSpendReplay.input.playerView.own.gripOrHq.find(
        (card) => card.title === "Desperate Competitor",
      )!;
    input.playerView.own.gripOrHq.push(
      structuredClone(nonInstallableCard) as VisibleCard,
    );
    input.playerView.own.stackOrRdCount = 0;
    input.legalActions = input.legalActions.filter(
      (action) => action.type !== "draw_card",
    );

    expect(chooseAiAction(input)).toMatchObject({
      actionId: "runner.gain_credit",
      fallbackUsed: false,
    });
  });

  it.each([16, 18])(
    "prices unknown ICE before admitting a conditional HQ chance at %s credits",
    (credits) => {
      const input = capturedInput(terminalSpendReplay);
      const view = input.playerView;
      view.own.credits = credits;
      const hqServer = view.servers.find((server) => server.id === "hq")!;
      const remoteServer = view.servers.find(
        (server) => server.id === "remote_1",
      )!;
      const hiddenIce = remoteServer.ice.find((card) => !card.known)!;
      hqServer.ice.push({ ...hiddenIce, instanceId: "review_hidden_hq_ice" });
      const additionalDefense = remoteServer.ice.find(
        (card) => card.title === "Cinderella",
      )!;
      for (const copy of [1, 2]) {
        const iceInstanceId = additionalDefense.instanceId + "_review_" + copy;
        remoteServer.ice.unshift({
          ...additionalDefense,
          instanceId: iceInstanceId,
          effectiveRunQuote: {
            ...additionalDefense.effectiveRunQuote!,
            iceInstanceId,
          },
        });
      }

      const { hq, routes } = centralAndRemoteRoutes(input);
      const hasReserve = credits === 18;
      expect(hq.routeQuote).toMatchObject({
        reachability: "conditional_access",
        conditionalReasons: ["unknown_ice_on_route"],
      });
      expect(hq.prerunReserveQuote?.status).toBe(
        hasReserve ? "satisfied" : "blocked",
      );
      expect(
        runnerFinalClickCentralAccessBeforeTerminalScore(input, hq, routes, 3),
      ).toBe(hasReserve);
      const decision = chooseAiAction(input);
      expect(decision.actionId).toBe(
        hasReserve ? hq.actionId : "runner.start_run.rd",
      );
      expect(decision.fallbackUsed).toBe(false);
    },
  );

  it("revalues the same legal accesses when Corp draws the known R&D top", () => {
    function decide(corpAction: "gain_credit" | "mandatory_draw") {
      resetResidentPlanPortfolioMemory();
      const input = capturedInput(terminalSpendReplay);
      const view = input.playerView;
      const before = view.stateVersion;
      const beforeTurn = view.turnSerial!;
      view.stateVersion += 2;
      view.turnSerial = beforeTurn + 2;
      input.legalActions = input.legalActions.map((action) => ({
        ...action,
        expiresAtStateVersion: view.stateVersion,
      }));
      for (const server of view.servers) {
        if (server.runnerAgendaStealCostQuote)
          server.runnerAgendaStealCostQuote.stateVersion = view.stateVersion;
      }
      const agenda = view.opponent.scoreArea!.find(
        (card) => card.agendaPoints === 3,
      )!;
      const events: PublicGameEvent[] = [
        {
          eventId: "evt_observed_rd_top",
          type: "access_card",
          stateVersionBefore: before,
          stateVersionAfter: before + 1,
          turnSerial: beforeTurn,
          stateHashAfter: "fnv1a:ab000001",
          visibilityClass: "hidden_info_barrier",
          publicPayload: {
            actor: "runner",
            actionType: "access_card",
            serverId: "rd",
            serverLabel: "R&D",
            accessIndex: 0,
            baseAccessCount: 1,
            effectiveAccessCount: 1,
            cardDefinitionId: agenda.definitionId!,
          },
        },
        {
          eventId: "evt_corp_after_rd_access",
          type: corpAction,
          stateVersionBefore: before + 1,
          stateVersionAfter: view.stateVersion,
          turnSerial: beforeTurn + 1,
          stateHashAfter: "fnv1a:ab000002",
          visibilityClass: "public",
          publicPayload: {
            actor: "corp",
            actionType: corpAction,
            ...(corpAction === "mandatory_draw" ? { corpRdDrawnToHqCount: 1 } : {}),
          },
        },
      ];
      view.publicEvents.push(...events);
      input.eventTail.push(...events);
      const sideSafe = { ...input, ...buildAiDecisionInputDto(input) };
      const targets = evaluateRunnerRunTargets({ input: sideSafe });
      const decision = chooseAiAction(sideSafe);
      const selected = targets.find(
        (target) => target.actionId === decision.actionId,
      );
      const rd = targets.find(
        (target) => target.actionId === "runner.start_run.rd",
      );
      const rdDebug = decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === rd?.actionId,
      );
      return {
        legalActions: sideSafe.legalActions,
        selected,
        rd,
        rdDebug,
        decision,
      };
    }
    const stillKnown = decide("gain_credit");
    const afterDraw = decide("mandatory_draw");

    expect(stillKnown.legalActions).toEqual(afterDraw.legalActions);
    expect(stillKnown.selected).toMatchObject({
      accessServerId: "rd",
      accessPayoff: "agenda",
    });
    expect(afterDraw.selected).toMatchObject({ accessServerId: "hq" });
    expect(stillKnown.rd?.score).toBeGreaterThan(afterDraw.rd!.score);
    expect(stillKnown.rd?.evidence).toContain(
      "rnd_freshness:stale_known_same_top",
    );
    expect(afterDraw.rd?.evidence).toContain(
      "rd_known_top_drawn_by_corp:evt_corp_after_rd_access",
    );
    expect(afterDraw.rdDebug?.whyNot).toContain(
      "central_memory_payoff:invalidated",
    );
  });

  it("keeps the reserve when the remote can be contested in the last click", () => {
    const input = capturedInput(terminalSpendReplay);
    const blocked = centralAndRemoteRoutes(input);
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(
        input,
        blocked.hq,
        blocked.routes,
        1,
      ),
    ).toBe(true);

    input.playerView.own.credits += 2;
    const { hq, remote, routes } = centralAndRemoteRoutes(input);
    expect(hq.fundingNeed.reason).toBe("post_run_floor_gap");
    expect(remote.prerunReserveQuote?.status).toBe("satisfied");
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(input, hq, routes, 1),
    ).toBe(false);
  });

  it("keeps the reserve when visible steal costs would breach the protected floor", () => {
    const input = capturedInput(terminalSpendReplay);
    const { hq, routes } = centralAndRemoteRoutes(input);
    const stealQuote = input.playerView.servers.find(
      (server) => server.id === hq.accessServerId,
    )?.runnerAgendaStealCostQuote;
    if (!stealQuote) throw new Error("Expected the captured steal-cost quote.");
    stealQuote.minimumCreditCost = hq.creditsAfterRun;
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(input, hq, routes, 1),
    ).toBe(false);
  });
});
