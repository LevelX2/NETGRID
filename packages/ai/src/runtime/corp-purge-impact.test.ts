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
