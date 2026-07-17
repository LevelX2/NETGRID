import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  runnerInstallScoreComponents,
  type RunnerInstallScoreDependencies,
} from "./runner-install-score";

describe("runnerInstallScoreComponents", () => {
  it("matches breaker install roles by bounded role terms", () => {
    expect(hasBreakerInstallComponent(["breaker_fracter"])).toBe(true);
    expect(hasBreakerInstallComponent(["support_breaker_fracter"])).toBe(true);
    expect(hasBreakerInstallComponent(["breaker_fracterish_noise"])).toBe(
      false,
    );
  });

  it("boosts installing a visible hand breaker that answers current known ICE coverage", () => {
    const action = {
      actionId: "install-pile-driver",
      side: "runner",
      type: "install_card",
      source: "pile-driver",
    } as LegalAction;
    const sourceCard = visibleCard("pile-driver", "runner", "program", {
      definitionId: "onr_v1_141_pile-driver",
      title: "Pile Driver",
      subtypes: ["Icebreaker", "Fracter"],
    });

    const components = runnerInstallScoreComponents(
      runnerInputWithKnownWallNeed(sourceCard),
      action,
      { loanInstallAction: false },
      dependencies(["breaker_fracter"], sourceCard),
    );

    expect(components).toContainEqual(
      expect.objectContaining({
        key: "runner_install_required_coverage_answer",
        value: 1250,
        reason: expect.stringContaining("required:breaker_wall"),
      }),
    );
  });

  it("boosts a program-search install only for a concrete visible coverage gap", () => {
    const action = {
      actionId: "install-search",
      side: "runner",
      type: "install_card",
      source: "search-tool",
    } as LegalAction;
    const sourceCard = visibleCard("search-tool", "runner", "resource");
    const input = runnerInputWithKnownWallNeed(sourceCard);

    const withNeed = runnerInstallScoreComponents(
      input,
      action,
      { loanInstallAction: false },
      dependencies(["program_search"], sourceCard),
    );
    expect(withNeed).toContainEqual(
      expect.objectContaining({
        key: "runner_install_coverage_search",
        value: 1400,
        reason: expect.stringContaining("required:breaker_wall"),
      }),
    );

    input.playerView.servers.forEach((server) => {
      server.ice = [];
    });
    const withoutNeed = runnerInstallScoreComponents(
      input,
      action,
      { loanInstallAction: false },
      dependencies(["program_search"], sourceCard),
    );
    expect(withoutNeed).not.toContainEqual(
      expect.objectContaining({ key: "runner_install_coverage_search" }),
    );
  });

  it("prices a structured mandatory random-action risk on installation", () => {
    const components = runnerInstallScoreComponents(
      runnerInputWithKnownWallNeed(
        visibleCard("random-resource", "runner", "resource"),
      ),
      {
        actionId: "install-random-resource",
        side: "runner",
        type: "install_card",
      } as LegalAction,
      {
        loanInstallAction: false,
        semanticRiskKinds: ["mandatory_action", "random_outcome"],
      },
      dependencies(["resource"]),
    );

    expect(components).toContainEqual({
      key: "runner_install_mandatory_random_action_risk",
      label: "Zufällige Pflichtaktion",
      value: -500,
      reason: "mandatory_action|random_outcome",
    });
  });

  it("prefers a central ICE-tax target over Archives", () => {
    const input = runnerInputWithKnownWallNeed(
      visibleCard("rnz", "runner", "resource"),
    );
    const rd = serverTaxScore(input, "rd");
    const archives = serverTaxScore(input, "archives");

    expect(rd).toBeGreaterThan(archives + 1500);
  });

  it("defers a server ICE tax when an advanced remote needs the final clicks", () => {
    const input = runnerInputWithKnownWallNeed(
      visibleCard("rnz", "runner", "resource"),
    );
    input.playerView.own.clicks = 2;
    input.playerView.servers.find((server) => server.id === "remote_1")!.root =
      [
        visibleCard("advanced-remote-card", "corp", "agenda", {
          known: false,
          advancementCounters: 1,
        }),
      ];
    input.legalActions = [
      {
        actionId: "runner.start_run.remote_1",
        side: "runner",
        type: "start_run",
        payload: { serverId: "remote_1" },
      } as unknown as LegalAction,
    ];

    expect(serverTaxComponents(input, "rd")).toContainEqual(
      expect.objectContaining({
        key: "runner_install_server_ice_tax_too_late",
        value: -1600,
      }),
    );
  });
});

function serverTaxScore(input: AiDecisionInput, serverId: string): number {
  return serverTaxComponents(input, serverId).reduce(
    (total, component) => total + component.value,
    0,
  );
}

function serverTaxComponents(input: AiDecisionInput, serverId: string) {
  return runnerInstallScoreComponents(
    input,
    {
      actionId: `install-rnz:${serverId}`,
      side: "runner",
      type: "install_card",
      source: "rnz",
      payload: { selectedServerId: serverId },
    } as unknown as LegalAction,
    { loanInstallAction: false },
    dependencies(["resource", "server_ice_install"]),
  );
}

function hasBreakerInstallComponent(roles: string[]): boolean {
  return runnerInstallScoreComponents(
    {} as AiDecisionInput,
    { type: "install_card" } as LegalAction,
    { loanInstallAction: false },
    dependencies(roles),
  ).some((component) => component.key === "runner_install_breaker");
}

function dependencies(
  roles: string[],
  sourceCard?: VisibleCard,
): RunnerInstallScoreDependencies {
  return {
    rolesForAction: () => roles,
    sourceCard: () => sourceCard,
    muPressureInstallScoreComponent: () => undefined,
    persistentInstallFitScoreComponent: () => undefined,
    isRunnerEconomyRole: () => false,
    isRunnerPressureRole: () => false,
    badPublicityOrTraceTechCard: () => false,
    programInstallTrashAssessmentForAction: () => undefined,
    programInstallDisplacementPenalty: () => 0,
  };
}

function runnerInputWithKnownWallNeed(
  sourceCard: VisibleCard,
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: visibleCard("runner-id", "runner", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [sourceCard],
        rig: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("corp-id", "corp", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [
            visibleCard("wall-ice", "corp", "ice", {
              title: "Known Wall",
              subtypes: ["Wall"],
              rezzed: true,
              effectiveRunQuote: {
                iceInstanceId: "wall-ice",
                iceDefinitionId: "wall-ice",
                effectiveStrength: 0,
                subroutines: [{ id: "wall-ice-etr", type: "end_the_run" }],
              },
            }),
          ],
          root: [],
        },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-install-score-test",
    decisionId: "runner-install-score-test",
    actionNumber: 1,
    profileId: "runner",
  } as unknown as AiDecisionInput;
}

function visibleCard(
  instanceId: string,
  side: "corp" | "runner",
  type: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    side,
    type,
    zone: side === "runner" ? "grip" : "remote",
    visibility: "private",
    known: true,
    ...overrides,
  } as VisibleCard;
}
