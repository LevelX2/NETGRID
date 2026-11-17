import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import {
  applyAction,
  createGame,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { instantiatePlanProposal } from "../../plans/plan-instance";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import { createCorpVirusPressureModule } from "./virus-pressure-plan-module";
import { buildCorpVirusPressureSignals } from "./virus-pressure-signals";
import type {
  AiDecisionInput,
  CardInstanceId,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  corpPurgeHasVisibleStrategicPressure,
  corpPurgeImpactScoreComponent,
} from "./corp-purge-impact";

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

  it("admits the generic purge plan only after visible impact becomes positive", () => {
    expect(
      corpPurgeHasVisibleStrategicPressure(
        inputWithRunnerVirusCounters({ tax: 1 }),
        runnerVirusPurgeAction(),
      ),
    ).toBe(false);
    expect(
      corpPurgeHasVisibleStrategicPressure(
        inputWithRunnerVirusCounters({ tax: 2 }),
        runnerVirusPurgeAction(),
      ),
    ).toBe(true);
  });
});

it.each([0, 1, 2])(
  "binds each native purge independently with two ICE counters and %i Tax counters",
  (tax) => {
    const state = createGame({
      seed: "third-source-review-purge",
      setupMode: "completed",
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    const iceId = [...state.corp.hq, ...state.corp.rd].find(
      (id) => state.cardInstances[id]?.definitionId === 449,
    );
    if (!iceId) throw new Error("Native Corp deck lacks Data Wall");
    state.corp.hq = state.corp.hq.filter((id) => id !== iceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== iceId);
    const server = state.corp.servers.find(({ id }) => id === "rd")!;
    server.ice.push(iceId);
    const ice = state.cardInstances[iceId]!;
    ice.zone = { side: "corp", zone: "serverIce", serverId: "rd" };
    ice.rezzed = true;
    ice.faceup = true;
    ice.counters = { ...ice.counters, virus: 2 };
    if (tax > 0) state.purgeableRunnerVirusCounters = { corp: { tax } };
    const legalActions = getLegalActions(state, "corp");
    const input: AiDecisionInput = {
      matchId: state.matchId,
      side: "corp",
      legalActions,
      playerView: getPlayerView(state, "corp"),
      eventTail: [],
      seed: state.seed,
      decisionId: "native-purge-binding",
      actionNumber: state.stateVersion,
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    };
    const signals = buildCorpVirusPressureSignals(input);
    const context: PlanSchedulerContext = {
      input,
      turnKey: "native-purge-binding",
      actionCandidates: buildActionSemanticCandidates({ legalActions }),
      domain: {
        virusPressure: signals,
        handManagement: [],
        ambushes: [],
        punishCampaigns: [],
      },
    };
    const owner = createCorpVirusPressureModule();
    const routes = owner.discover(context).map((proposal) => {
      const instance = instantiatePlanProposal(proposal, state.stateVersion);
      const materialized = owner.materialize(instance, {} as never, context);
      expect(materialized.candidates).toHaveLength(1);
      return materialized.candidates[0]!.candidate;
    });
    expect(routes.map(({ actionType }) => actionType).sort()).toEqual(
      tax >= 2
        ? ["purge_runner_virus_counters", "purge_virus_counters"]
        : ["purge_virus_counters"],
    );
    for (const route of routes) {
      const result = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: route.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.message);
      const basic = route.actionType === "purge_virus_counters";
      expect(result.state.cardInstances[iceId]?.counters?.virus ?? 0).toBe(
        basic ? 0 : 2,
      );
      expect(result.state.purgeableRunnerVirusCounters?.corp?.tax ?? 0).toBe(
        basic ? tax : 0,
      );
    }
  },
);

it("keeps the standard server virus pools separate from Proteus Purge", () => {
  const state = createGame({
    seed: "purge-separate-server-pools",
    setupMode: "completed",
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.poxCountersByServer = { hq: 2 };
  state.serverAgendaCostCountersByServer = { rd: 2 };
  state.purgeableRunnerVirusCounters = { corp: { tax: 2 } };
  const legalActions = getLegalActions(state, "corp");
  const input: AiDecisionInput = {
    matchId: state.matchId,
    side: "corp",
    legalActions,
    playerView: getPlayerView(state, "corp"),
    eventTail: [],
    seed: state.seed,
    decisionId: "separate-purge-pools",
    actionNumber: state.stateVersion,
    difficulty: "normal",
    profileId: "corp-ai-v1.4.2-normal",
  };
  const standard = legalActions.find((action) => action.type === "purge_virus_counters")!;
  const proteus = legalActions.find((action) => action.type === "purge_runner_virus_counters")!;
  const posture = { primary: "low_value", severity: "low" } as const;
  const standardImpact = corpPurgeImpactScoreComponent(input, standard, posture);
  expect(standardImpact?.reason).toContain("purge_visible_counter_total:4");
  expect(standardImpact?.value).toBeGreaterThan(0);
  const proteusImpact = corpPurgeImpactScoreComponent(input, proteus, posture);
  expect(proteusImpact?.reason).toContain("purge_visible_counter_total:2");
  expect(proteusImpact?.reason).toContain("purge_active_runner_counter_types:tax");
  const apply = (action: LegalAction) => {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.state;
  };
  expect(apply(standard)).toMatchObject({
    poxCountersByServer: {},
    serverAgendaCostCountersByServer: {},
    purgeableRunnerVirusCounters: { corp: { tax: 2 } },
  });
  expect(apply(proteus)).toMatchObject({
    poxCountersByServer: { hq: 2 },
    serverAgendaCostCountersByServer: { rd: 2 },
  });
});

it.each([
  { archives: 0, rd: 0, installed: true, active: 0 },
  { archives: 1, rd: 0, installed: true, active: 0 },
  { archives: 1, rd: 1, installed: false, active: 0 },
  { archives: 1, rd: 1, installed: true, active: 3 },
] as const)(
  "uses all central pools and the public source for socket conversion ($archives Archives, $rd R&D, source $installed)",
  ({ archives, rd, installed, active }) => {
    const state = createGame({ seed: "socket-purge", setupMode: "completed" });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    if (installed) {
      const source = "viral_pipeline_1" as CardInstanceId;
      state.runner.rig.programs.push(source);
      state.cardInstances[source] = {
        instanceId: source,
        definitionId: 157,
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: true,
        advancementCounters: 0,
        strengthModifier: 0,
      };
    }
    state.purgeableRunnerVirusCounters = {
      servers: {
        hq: { socket_hq: 2 },
        ...(archives ? { archives: { socket_archives: archives } } : {}),
        ...(rd ? { rd: { socket_rd: rd } } : {}),
      },
    };
    const legalActions = getLegalActions(state, "corp");
    const input: AiDecisionInput = {
      ...inputWithVirusCounters(0),
      matchId: state.matchId,
      seed: state.seed,
      legalActions,
      playerView: getPlayerView(state, "corp"),
    };
    const purge = legalActions.find(
      ({ type }) => type === "purge_runner_virus_counters",
    );
    if (!purge) throw new Error("Missing runner-virus purge LegalAction");
    const [signal] = buildCorpVirusPressureSignals(input);
    expect(signal).toMatchObject({
      actionId: purge.actionId,
      stateVersion: state.stateVersion,
      actionCost: 3,
      virusCounters: active,
      purgeUseful: active > 0,
    });
    const context: PlanSchedulerContext = {
      input,
      turnKey: "socket-purge-binding",
      actionCandidates: buildActionSemanticCandidates({ legalActions }),
      domain: {
        virusPressure: [signal!],
        handManagement: [],
        ambushes: [],
        punishCampaigns: [],
      },
    };
    const owner = createCorpVirusPressureModule();
    const proposals = owner.discover(context);
    expect(proposals).toHaveLength(active > 0 ? 1 : 0);
    if (proposals.length > 0) {
      const plan = instantiatePlanProposal(proposals[0]!, state.stateVersion);
      const route = owner.materialize(plan, {} as never, context);
      expect(route.step.stepId).toBe(`${plan.instanceId}:purge`);
      expect(
        route.candidates.map(({ candidate }) => candidate.actionId),
      ).toEqual([purge.actionId]);
    }
  },
);
function inputWithVirusCounters(amount: number): AiDecisionInput {
  const bugZapper: VisibleCard = {
    instanceId: "bug-zapper",
    definitionId: 70,
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
  counters: Partial<Record<"highlighter" | "garbage" | "tax", number>>,
): AiDecisionInput {
  const input = inputWithVirusCounters(0);
  const counterEntries = Object.entries(counters) as Array<
    ["highlighter" | "garbage" | "tax", number | undefined]
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
          definitionId: 148,
          title: "Highlighter",
          type: "program",
          known: true,
          rulesText:
            "Each Highlighter counter after the first allows you to access an additional card from R&D.",
        } as VisibleCard)
      : counterType === "garbage"
        ? ({
            instanceId: "garbage-in",
            definitionId: 147,
            title: "Garbage In",
            type: "program",
            known: true,
            rulesText:
              "Two or more Garbage counters allow you to trash at no cost cards accessed from R&D.",
          } as VisibleCard)
        : ({
            instanceId: "generic-virus-pressure",
            definitionId: syntheticCardDefinitionId("test_generic_virus_pressure"),
            title: "Generic Virus Pressure",
            type: "program",
            known: true,
            rulesText:
              "Each visible counter creates a recurring Corp-side cost.",
          } as VisibleCard),
  );
  input.playerView.publicEvents = [
    {
      eventId: 3,
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
