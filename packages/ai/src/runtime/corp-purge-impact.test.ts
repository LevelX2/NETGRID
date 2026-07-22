import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { corpPurgeImpactScoreComponent } from "./corp-purge-impact";

describe("corpPurgeImpactScoreComponent", () => {
  it("strongly rejects spending the turn on one counter during scoreline repair", () => {
    const component = corpPurgeImpactScoreComponent(
      inputWithVirusCounters(1),
      purgeAction(),
      { primary: "protect_score_remote", severity: "high" },
    );

    expect(component?.value).toBeLessThanOrEqual(-4950);
    expect(component?.reason).toContain("purge_visible_counter_total:1");
    expect(component?.reason).toContain("purge_urgent_scoreline:true");
    expect(component?.reason).toContain("purge_click_cost:3");
  });

  it("allows multiple counters on critical ICE to create positive purge value outside an urgent scoreline", () => {
    const component = corpPurgeImpactScoreComponent(
      inputWithVirusCounters(2),
      purgeAction(),
      { primary: "low_value", severity: "low" },
    );

    expect(component?.value).toBeGreaterThan(0);
    expect(component?.reason).toContain("purge_visible_counter_total:2");
    expect(component?.reason).toContain("purge_critical_ice_count:1");
    expect(component?.reason).toContain("purge_urgent_scoreline:false");
  });

  it("rejects purge when no visible virus counter would be removed", () => {
    expect(
      corpPurgeImpactScoreComponent(inputWithVirusCounters(0), purgeAction(), {
        primary: "low_value",
        severity: "low",
      })?.value,
    ).toBe(-6000);
  });

  it("rejects one inactive Highlighter plus one inactive Garbage counter", () => {
    const component = corpPurgeImpactScoreComponent(
      inputWithRunnerVirusCounters({ highlighter: 1, garbage: 1 }),
      runnerVirusPurgeAction(),
      { primary: "protect_rd", severity: "critical" },
    );

    expect(component?.value).toBe(-6000);
    expect(component?.reason).toContain("purge_visible_counter_total:2");
    expect(component?.reason).toContain("purge_active_counter_total:0");
    expect(component?.reason).toContain(
      "purge_active_runner_counter_types:none",
    );
  });

  it("keeps two Highlighter counters as an active R&D multiaccess threat", () => {
    const component = corpPurgeImpactScoreComponent(
      inputWithRunnerVirusCounters({ highlighter: 2 }),
      runnerVirusPurgeAction(),
      { primary: "low_value", severity: "low" },
    );

    expect(component?.value).toBeGreaterThan(4500);
    expect(component?.reason).toContain("purge_active_counter_total:2");
    expect(component?.reason).toContain(
      "purge_active_runner_counter_types:highlighter",
    );
  });

  it("does not let the first Highlighter counter inflate an active Garbage threshold", () => {
    const component = corpPurgeImpactScoreComponent(
      inputWithRunnerVirusCounters({ highlighter: 1, garbage: 2 }),
      runnerVirusPurgeAction(),
      { primary: "protect_rd", severity: "critical" },
    );

    expect(component?.value).toBeLessThan(2500);
    expect(component?.reason).toContain("purge_active_counter_total:2");
    expect(component?.reason).toContain(
      "purge_active_runner_counter_types:garbage",
    );
  });
});

function inputWithVirusCounters(amount: number): AiDecisionInput {
  const bugZapper: VisibleCard = {
    instanceId: "bug-zapper",
    definitionId: "onr_proteus_012_bug-zapper",
    title: "Bug Zapper",
    type: "ice",
    known: true,
    rezzed: true,
    rulesText: "Do 2 net damage. End the run.",
    counters: amount > 0 ? { virus: amount } : {},
  } as VisibleCard;
  return {
    side: "corp",
    legalActions: [purgeAction()],
    eventTail: [],
    playerView: {
      side: "corp",
      own: {
        identity: { instanceId: "corp-id", known: true },
        credits: 8,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "runner-id", known: true },
        credits: 4,
        clicks: 4,
        agendaPoints: 4,
        rig: [],
        scoreArea: [],
        handCount: 4,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        tags: 0,
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [bugZapper], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [purgeAction()],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function purgeAction(): LegalAction {
  return {
    actionId: "corp.purge_virus_counters",
    side: "corp",
    type: "purge_virus_counters",
    source: "game_rule",
    costs: [{ clicks: 3 }],
    payload: {},
  } as LegalAction;
}

function runnerVirusPurgeAction(): LegalAction {
  return {
    ...purgeAction(),
    actionId: "corp.purge_runner_virus_counters",
    type: "purge_runner_virus_counters",
  } as LegalAction;
}

function inputWithRunnerVirusCounters(
  counters: Partial<Record<"highlighter" | "garbage", number>>,
): AiDecisionInput {
  const input = inputWithVirusCounters(0);
  const counterEntries = Object.entries(counters) as Array<
    ["highlighter" | "garbage", number | undefined]
  >;
  input.playerView.own.identity.counterDisplays = counterEntries.map(
    ([counterType, amount]) => ({
      id: `runner-virus-${counterType}`,
      amount: amount ?? 0,
      displayKind: "virus" as const,
      label: `${counterType} counter`,
      ariaLabel: `${amount ?? 0} ${counterType} counter`,
      counterType,
      usageHint: "status_marker" as const,
    }),
  );
  input.legalActions = [runnerVirusPurgeAction()];
  input.playerView.legalActions = [runnerVirusPurgeAction()];
  input.playerView.opponent.credits = 4;
  input.playerView.opponent.rig = Object.keys(counters).map((counterType) =>
    counterType === "highlighter"
      ? ({
          instanceId: "highlighter",
          definitionId: "onr_proteus_090_highlighter",
          title: "Highlighter",
          type: "program",
          known: true,
          rulesText:
            "Each Highlighter counter after the first allows you to access an additional card from R&D.",
        } as VisibleCard)
      : ({
          instanceId: "garbage-in",
          definitionId: "onr_proteus_089_garbage-in",
          title: "Garbage In",
          type: "program",
          known: true,
          rulesText:
            "Two or more Garbage counters allow you to trash at no cost cards accessed from R&D.",
        } as VisibleCard),
  );
  input.playerView.publicEvents = [
    {
      eventId: "rd-run",
      type: "action_resolved",
      stateVersionBefore: 1,
      stateVersionAfter: 2,
      stateHashAfter: "rd-run-state",
      publicPayload: {
        actor: "runner",
        actionType: "start_run",
        serverId: "rd",
      },
    },
  ];
  input.eventTail = input.playerView.publicEvents;
  return input;
}
