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
});

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
