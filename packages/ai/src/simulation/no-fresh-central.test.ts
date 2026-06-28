import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import {
  noFreshCentralSubstitutionTypeForAction,
  runnerNoFreshCentralContext,
  trueCentralCloseoutProfile,
} from "./no-fresh-central";

describe("no-fresh central diagnostics", () => {
  it("matches central closeout multiaccess roles by bounded role terms", () => {
    expect(closeoutForRoles(["interface_multiaccess"])).toMatchObject({
      opportunity: true,
      reasons: expect.arrayContaining(["multiaccess"]),
    });
    expect(closeoutForRoles(["multiaccessory_noise"])).toMatchObject({
      opportunity: false,
    });
  });

  it("matches setup search substitutions by bounded role terms", () => {
    expect(substitutionForRoles(["program_search"])).toBe("setup_search");
    expect(substitutionForRoles(["research_noise"])).toBeUndefined();
  });

  it("matches rig-unlock breaker substitutions by bounded prefixes", () => {
    expect(substitutionForInstallRoles(["breaker_fracter"])).toBe("rig_unlock");
    expect(substitutionForInstallRoles(["breakerish_fracter"])).toBeUndefined();
    expect(
      substitutionForInstallRoles(["support_breaker_fracter"]),
    ).toBeUndefined();
  });

  it("matches rig-unlock alternatives by bounded breaker prefixes", () => {
    expect(contextForInstallRoles(["breaker_decoder"]).betterAlternatives).toContain(
      "rig_unlock",
    );
    expect(
      contextForInstallRoles(["breakerish_decoder"]).betterAlternatives,
    ).not.toContain("rig_unlock");
    expect(
      contextForInstallRoles(["support_breaker_decoder"]).betterAlternatives,
    ).not.toContain("rig_unlock");
  });
});

function closeoutForRoles(roles: string[]) {
  return trueCentralCloseoutProfile(input(), "rd", {
    assessKnownRezzedIcePath: () =>
      ({ blocked: false, visibleBreakCost: 0 }) as never,
    rolesForCardId: () => roles,
    sourceDefinitionIdForAction: () => undefined,
  });
}

function substitutionForRoles(roles: string[]) {
  return noFreshCentralSubstitutionTypeForAction(input(), playEvent(), {
    isRunnerEconomyAction: () => false,
    rolesForAction: () => roles,
    sourceDefinitionIdForAction: () => undefined,
  });
}

function substitutionForInstallRoles(roles: string[]) {
  return noFreshCentralSubstitutionTypeForAction(input(), installAction(), {
    isRunnerEconomyAction: () => false,
    rolesForAction: () => roles,
    sourceDefinitionIdForAction: () => undefined,
  });
}

function contextForInstallRoles(roles: string[]) {
  return runnerNoFreshCentralContext(
    {
      ...input(),
      legalActions: [startRun("rd"), installAction()],
    } as AiDecisionInput,
    {
      assessKnownRezzedIcePath: () =>
        ({ blocked: false, visibleBreakCost: 0 }) as never,
      centralRunStreakWithoutValueForMetrics: () => 2,
      isRunnerEconomyAction: () => false,
      rolesForAction: () => roles,
      rolesForCardId: () => [],
      runnerCreditReserveTargetForInput: () => 0,
      runnerRemoteThreatProfile: () => ({ contestable: false }),
      sourceDefinitionIdForAction: () => undefined,
    },
  );
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
      agendaPointsToWin: 7,
      own: {
        agendaPoints: 5,
        credits: 5,
        gripOrHq: [card("one"), card("two"), card("three")],
        rig: [card("rig_card")],
      },
      opponent: {
        handCount: 0,
      },
      servers: [
        {
          id: "rd",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function playEvent(): LegalAction {
  return {
    actionId: "play",
    side: "runner",
    type: "play_event",
    label: "Play event",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function installAction(): LegalAction {
  return {
    ...playEvent(),
    actionId: "install",
    type: "install_card",
  };
}

function startRun(serverId: "hq" | "rd" | "archives"): LegalAction {
  return {
    ...playEvent(),
    actionId: `run-${serverId}`,
    type: "start_run",
    payload: { serverId },
  };
}

function card(definitionId: string): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
  } as VisibleCard;
}
