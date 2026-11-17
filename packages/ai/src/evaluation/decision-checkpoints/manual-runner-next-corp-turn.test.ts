import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261113-runner-next-corp-turn.json";
import preparationFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261114-runner-punish-preparation.json";
import creditBankFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p743-g37-d132.json";
import knownNextDrawFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p747-g9-d211.json";
import observedPayoffFixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p747-g23-d67.json";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
  type PublicGameEvent,
} from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerNextCorpTurnThreat } from "../../runner/defense-recovery/next-corp-turn-punish";
import { currentRemoteReserveFixture } from "./current-remote-reserve.test-support";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import {
  restoreAiRuntimeCheckpoint,
  exportAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const AUDIT = 495;
const CHANCE = 496;
const FALL_GUY = 373;
const HUNTER = 461;
const URBAN = 519;
const SCORCHED = 514;
const PUNITIVE = 513;
const MRAM = 346;
const BODYWEIGHT = 291;
const JETTISON_ICE = 292;

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  ["a known mandatory draw", knownNextDrawFixture, "fnv1a:87d6a59b", 4],
  ["a witnessed second tag source", observedPayoffFixture, "fnv1a:65334106", 5],
] as const)(
  "uses the free Grip buffer for %s before an optional bank deposit",
  (_label, fixture, hash, damage) => {
    const { input, runtime, validation, stateHash } = capture(
      fixture,
    );
    expect(stateHash).toBe(hash);
    expect(Object.values(validation).every(Boolean)).toBe(true);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    expect(input.playerView.own.clicks).toBe(1);
    expect(runnerNextCorpTurnThreat(input)).toMatchObject({
      incomingMeatDamage: 0,
      observedPayoffMeatDamage: damage,
    });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );

    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.actionId).toBe("runner.draw_card");
    expect(decision.evidence).toContain("plan_priority_class:P3");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
      route: {
        actionId: "runner.draw_card",
        stateVersion: input.playerView.stateVersion,
      },
    });
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.costs,
    ).toEqual([{ clicks: 1 }]);
  },
);

it.each(["unknown top", "unfunded follow-up", "no observed payoff"] as const)(
  "leaves the mandatory-draw threat unestablished with %s",
  (condition) => {
    const { input } = capture(
      knownNextDrawFixture,
    );
    if (condition === "unknown top") {
      changeHistory(input, (events) =>
        events.filter((event) => event.eventId !== 210),
      );
    } else if (condition === "unfunded follow-up") {
      input.playerView.opponent.credits = 4;
    } else {
      changeHistory(input, (events) =>
        events.filter(
          (event) => event.publicPayload.cardDefinitionId !== SCORCHED,
        ),
      );
    }
    expect(
      runnerNextCorpTurnThreat(input)?.observedPayoffMeatDamage,
    ).toBeUndefined();
    expect(chooseAiAction(input).evidence).not.toContain(
      "plan_assessment_evidence:runner_next_corp_turn_observed_damage_payoff",
    );
  },
);

it("respects the installed tag shield when the observed backup trace has no trigger", () => {
  const { input } = capture(
    observedPayoffFixture,
  );
  changeHistory(input, (events) =>
    events.filter((event) => event.eventId !== 61),
  );
  expect(
    runnerNextCorpTurnThreat(input)?.observedPayoffMeatDamage,
  ).toBeUndefined();
});

it("prepares the fifth Grip card at manual D61 when the payoff is known but the tag source is concealed", () => {
  const { input, runtime, validation, stateHash } = capture(preparationFixture);
  expect(stateHash).toBe("fnv1a:84ccdf9b");
  expect(Object.values(validation).every(Boolean)).toBe(true);
  expect(input.playerView.own.gripOrHq).toHaveLength(4);
  expect(input.playerView.own.clicks).toBe(2);
  expect(runnerNextCorpTurnThreat(input)).toMatchObject({
    incomingMeatDamage: 0,
    conditionalMeatDamage: 5,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );

  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(decision.evidence).toContain("plan_priority_class:P3");

  // Recheck planning after the basis draw. The captured Grip remains actor-only.
  const afterDraw = structuredClone(input);
  const { playerView: view } = afterDraw;
  const drawnCard =
    cardSpecPlanningCardByDefinitionId(JETTISON_ICE)!.definition;
  if (drawnCard.type !== "event") throw new Error("Expected a Runner event");
  view.own.gripOrHq.push({
    instanceId: "c1sz",
    known: true,
    owner: "runner",
    title: drawnCard.title,
    type: drawnCard.type,
    definitionId: drawnCard.id,
    playCost: drawnCard.playCost,
  });
  view.own.stackOrRdCount -= 1;
  view.own.clicks -= 1;
  view.stateVersion += 1;
  afterDraw.actionNumber += 1;
  afterDraw.decisionId = `${input.matchId}:${view.stateVersion}:runner`;
  const drawEvent: PublicGameEvent = {
    ...afterDraw.eventTail.at(-1)!,
    eventId: view.stateVersion + 1,
    type: "draw_card",
    stateVersionBefore: view.stateVersion - 1,
    stateVersionAfter: view.stateVersion,
    publicPayload: { actor: "runner", actionType: "draw_card", drawnCount: 1 },
  };
  changeHistory(afterDraw, (events) => [...events, drawEvent]);
  afterDraw.legalActions = afterDraw.legalActions.map((action) => ({
    ...action,
    expiresAtStateVersion: view.stateVersion,
  }));
  view.legalActions = afterDraw.legalActions;
  const deckId = input.ownDeckSnapshot!.deckSnapshotId;
  restoreAiRuntimeCheckpoint(
    afterDraw,
    deckId,
    exportAiRuntimeCheckpoint(input, deckId),
  );
  const continuation = chooseAiAction(afterDraw);
  expect(continuation.fallbackUsed).toBe(false);
  expect(continuation.actionId).toBe("runner.start_run.rd");
  expect(
    continuation.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.pressure_central");
});

it.each(["unfunded", "known HQ", "inactive trigger"] as const)(
  "does not prepare for a concealed tag source with %s",
  (variant) => {
    const { input } = capture(preparationFixture);
    if (variant === "unfunded") input.playerView.opponent.credits = 5;
    if (variant === "known HQ") input.playerView.opponent.handCount = 2;
    if (variant === "inactive trigger")
      changeHistory(input, (events) =>
        events.filter(
          (event) => event.turnSerial !== input.playerView.turnSerial,
        ),
      );
    expect(runnerNextCorpTurnThreat(input)?.conditionalMeatDamage ?? 0).toBe(0);
    const decision = chooseAiAction(input);
    expect(decision.evidence).not.toContain(
      "plan_assessment_evidence:runner_next_corp_turn_damage_hand_buffer:5",
    );
  },
);

it("prepares the legal tag protection after the two runs at manual D12", () => {
  const { input, runtime, validation, stateHash } = capture();
  expect(stateHash).toBe("fnv1a:69f025bc");
  expect(Object.values(validation).every(Boolean)).toBe(true);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(runnerNextCorpTurnThreat(input)).toMatchObject({
    tagPreventionNeeded: true,
    incomingMeatDamage: 0,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).toBe(fallGuyInstall(input)?.actionId);
  expect(decision.evidence).toContain("plan_priority_class:P3");
});

it.each([
  "one run",
  "Hunter only",
  "known Audit left HQ",
  "no remaining Corp credits",
] as const)("does not prepare tag protection for %s", (variant) => {
  const { input } = capture();
  if (variant === "one run")
    changeHistory(input, (events) =>
      events.filter((event) => event.stateVersionAfter !== 20),
    );
  if (variant === "Hunter only")
    changeHistory(input, (events) =>
      events.map((event) =>
        event.publicPayload.cardDefinitionId === AUDIT
          ? {
              ...event,
              publicPayload: {
                ...event.publicPayload,
                cardDefinitionId: HUNTER,
                serverId: "rd",
              },
            }
          : event,
      ),
    );
  if (variant === "known Audit left HQ") {
    changeHistory(input, (events) => [
      ...events,
      {
        ...events.at(-1)!,
        eventId: events.at(-1)!.stateVersionAfter + 2,
        type: "play_operation",
        publicPayload: {
          actionType: "play_operation",
          actor: "corp",
          cardDefinitionId: AUDIT,
        },
      },
    ]);
  }
  if (variant === "no remaining Corp credits")
    input.playerView.opponent.credits = 1;
  expect(runnerNextCorpTurnThreat(input)?.tagPreventionNeeded ?? false).toBe(
    false,
  );
  expect(chooseAiAction(input).actionId).not.toBe(
    fallGuyInstall(input)?.actionId,
  );
});

it("draws to the reachable five-card buffer for a known next-turn payoff", () => {
  const input = withKnownDamage([URBAN]);
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(5);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(decision.evidence).toContain("plan_priority_class:P3");
});

it("retains the fifth card with the last click even when the economy install is legal", () => {
  const input = withKnownDamage([URBAN]);
  const { input: before } = capture();
  input.playerView.own.gripOrHq.push({
    ...before.playerView.own.gripOrHq[3]!,
    instanceId: "synthetic-fifth-card",
  });
  input.playerView.own.clicks = 1;
  input.playerView.own.stackOrRdCount = 0;
  input.legalActions = input.legalActions.filter(
    (action) => action.type !== "draw_card",
  );
  input.playerView.legalActions = input.legalActions;
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    input.legalActions.find((action) => action.actionId === decision.actionId)
      ?.type,
  ).not.toBe("install_card");
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions,
  ).toContainEqual(
    expect.objectContaining({
      evidenceCode: "runner_last_action_would_lose_next_corp_turn_hand_buffer",
    }),
  );
});

it("holds a legal credit bank installation that would spend the fifth Grip card at P743 G37 D132", () => {
  const { input, runtime, validation, stateHash } = capture(creditBankFixture);
  expect(stateHash).toBe("fnv1a:16832234");
  expect(Object.values(validation).every(Boolean)).toBe(true);
  expect(input.playerView.own.gripOrHq).toHaveLength(5);
  expect(input.playerView.own.clicks).toBe(1);
  expect(runnerNextCorpTurnThreat(input)?.conditionalMeatDamage).toBe(5);
  const install = input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      input.playerView.own.gripOrHq.some(
        (card) =>
          card.instanceId === action.source &&
          card.definitionId === 390,
      ),
  );
  expect(install).toBeDefined();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );

  const decision = chooseAiAction(input);
  const plan = decision.decisionDebug?.planFirstDecision;
  const load = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  );
  expect(load).toMatchObject({
    type: "activated_card_ability",
    expiresAtStateVersion: input.playerView.stateVersion,
    payload: {
      cardImplementationAbilityKey: "store_credits",
      hostedCreditAddAmount: 3,
    },
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(plan?.selectedPlan?.moduleId).toBe("runner.credit_bank");
  expect(plan?.route).toMatchObject({
    actionId: load?.actionId,
    planInstanceId: plan?.leafExecutorInstanceId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(plan?.dispositions).toContainEqual({
    actionId: install!.actionId,
    disposition: "explicitly_nonproductive",
    ownerModuleId: "runner.credit_bank",
    evidenceCode: "runner_credit_bank_last_action_install_hand_floor",
  });
});

it("detects a second run from an observed event-started attempt, and counts it once", () => {
  const { input } = capture();
  changeHistory(input, (events) =>
    events.map((event) =>
      event.stateVersionAfter === 20
        ? {
            ...event,
            type: "play_event",
            publicPayload: {
              ...event.publicPayload,
              resolvedEffects: [
                {
                  kind: "start_run",
                  effectId: 0,
                  side: "runner",
                  visibility: "public",
                },
              ],
            },
          }
        : event,
    ),
  );
  expect(runnerNextCorpTurnThreat(input)?.tagPreventionNeeded).toBe(true);
});

it("recognizes the optional run that would activate an unaffordable-to-buffer combination", () => {
  const input = withKnownDamage([SCORCHED, PUNITIVE]);
  changeHistory(input, (events) =>
    events.filter((event) => event.stateVersionAfter !== 20),
  );
  expect(runnerNextCorpTurnThreat(input)).toMatchObject({
    additionalRunEnablesPunish: true,
    incomingMeatDamage: 0,
  });
  const decision = chooseAiAction(input);
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions,
  ).toContainEqual(
    expect.objectContaining({
      actionId: "runner.start_run.rd",
      evidenceCode:
        "runner_optional_run_would_enable_known_next_corp_turn_flatline",
    }),
  );
});

it("keeps the survival owner for an optional run on empty Archives", () => {
  const input = withKnownDamage([SCORCHED, PUNITIVE]);
  changeHistory(input, (events) =>
    events.filter((event) => event.stateVersionAfter !== 20),
  );
  input.playerView.opponent.discardCount = 0;
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  )!;
  expect(archives.root).toEqual([]);
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: "runner.start_run.archives",
      expiresAtStateVersion: input.playerView.stateVersion,
    }),
  );
  expect(runnerNextCorpTurnThreat(input)?.additionalRunEnablesPunish).toBe(
    true,
  );

  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions?.filter(
      (entry) => entry.actionId === "runner.start_run.archives",
    ),
  ).toEqual([
    {
      actionId: "runner.start_run.archives",
      disposition: "explicitly_nonproductive",
      ownerModuleId: "runner.defense_and_recovery",
      evidenceCode: "runner_optional_run_would_enable_known_next_corp_turn_flatline",
    },
  ]);
});

it("prefers tag protection to an unreachable six-card grip", () => {
  const input = withKnownDamage([SCORCHED, PUNITIVE], true);
  expect(runnerNextCorpTurnThreat(input)).toMatchObject({
    incomingMeatDamage: 6,
    tagPreventionNeeded: true,
  });
  expect(chooseAiAction(input).actionId).toBe(fallGuyInstall(input)?.actionId);
});

it("prices both known tag sources when one installed avoidance can be exhausted", () => {
  const input = withKnownDamage([URBAN, CHANCE]);
  const fallGuy = capture().input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === FALL_GUY,
  )!;
  input.playerView.own.rig = [
    ...(input.playerView.own.rig ?? []),
    { ...fallGuy, rezzed: true },
  ];
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(5);
  input.playerView.opponent.credits = 7;
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(0);
});

it("uses ready meat prevention and respects a base link above the blind trace limit", () => {
  const input = withKnownDamage([URBAN]);
  input.playerView.own.rig = [
    ...(input.playerView.own.rig ?? []),
    {
      instanceId: "synthetic-installed-dermatech",
      known: true,
      definitionId: 337,
      owner: "runner",
      type: "hardware",
      rezzed: true,
    },
  ];
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(4);
  input.playerView.own.runnerTraceSupportQuote = {
    ...input.playerView.own.runnerTraceSupportQuote!,
    baseLinkOptions: [{ baseLink: 5, activationCost: 0, safeForAccess: true }],
  };
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(0);
});

it("expires the next-turn payoff when the observed finisher is no longer in HQ", () => {
  const input = withKnownDamage([URBAN]);
  changeHistory(input, (events) =>
    events
      .map((event) =>
        event.publicPayload.actionType === "access_card" && event.publicPayload.cardDefinitionId === URBAN
          ? {
              ...event,
              eventId: 22,
              stateVersionBefore: 20,
              stateVersionAfter: 21,
            }
          : event,
      )
      .concat({
        ...events.at(-1)!,
        eventId: events.at(-1)!.stateVersionAfter + 2,
        type: "play_operation",
        publicPayload: {
          actor: "corp",
          actionType: "play_operation",
          cardDefinitionId: URBAN,
        },
      }),
  );
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(0);
});

it.each([
  "four damage",
  "hand limit",
  "taxed draw",
  "unfunded",
  "already protected",
  "six damage",
] as const)("does not open a fifth-card draw requirement for %s", (variant) => {
  const { input: baseline } = capture();
  const input = withKnownDamage(
    variant === "four damage"
      ? [SCORCHED]
      : variant === "six damage"
        ? [SCORCHED, PUNITIVE]
        : [URBAN],
  );
  if (variant === "hand limit") input.playerView.own.maxHandSize = 4;
  if (variant === "unfunded") input.playerView.opponent.credits = 5;
  if (variant === "already protected") {
    const fallGuy = baseline.playerView.own.gripOrHq.find(
      (card) => card.definitionId === FALL_GUY,
    )!;
    input.playerView.own.rig = [
      ...(input.playerView.own.rig ?? []),
      { ...fallGuy, rezzed: true },
    ];
  }
  if (variant === "taxed draw") {
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    )!;
    draw.payload = {
      ...draw.payload,
      drawTaxProjectedCreditsPaid: input.playerView.own.credits,
      drawTaxProjectedTagsAdded: 1,
    };
  }
  const decision = chooseAiAction(input);
  expect(
    decision.evidence?.some((code) =>
      code.includes("runner_next_corp_turn_damage_hand_buffer"),
    ),
  ).toBe(false);
});

it("retains the immediately proven Runner win even with a funded damage threat", () => {
  const input = withKnownDamage([URBAN]);
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(5);
  input.playerView.opponent.deckCount = 0;
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.end_turn");
  expect(decision.evidence).toContain("plan_priority_class:P1");
});

it("keeps an immediately executable terminal remote contest above the concealed-tag buffer", () => {
  const { input, runtime } = currentRemoteReserveFixture(31, false);
  const { input: retaliation } = capture(preparationFixture);
  input.playerView.opponent.credits = 14;
  input.playerView.opponent.handCount = 5;
  input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 4);
  input.playerView.own.runnerTraceSupportQuote =
    retaliation.playerView.own.runnerTraceSupportQuote!;
  input.playerView.traceRulesProfile = "classic_blind";
  const observed = visibleRetaliationEvents(input, [URBAN], true);
  changeHistory(input, (events) => [...events, ...observed]);
  expect(runnerNextCorpTurnThreat(input)?.conditionalMeatDamage).toBe(5);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.r1");
  expect(decision.evidence).toContain("plan_priority_class:P2");
});

it("installs hand capacity, fills it, and survives two real Classic Blind damage operations", () => {
  const { deckSnapshot, state: initial } = capacityFixture();
  const decisionInput = (state: GameState) => {
    const input = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: deckSnapshot,
    });
    changeHistory(input, (events) => [
      ...events,
      ...visibleRetaliationEvents(input, [AUDIT, SCORCHED, PUNITIVE]),
    ]);
    return input;
  };
  let state = initial;
  let input = decisionInput(state);
  expect(input.playerView.own.maxHandSize).toBe(5);
  expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(6);
  const install = legal(state, "runner", "install_card", MRAM);
  let decision = chooseAiAction(input);
  expect(decision.actionId).toBe(install.actionId);
  expect(decision.evidence).toContain(
    "plan_assessment_evidence:runner_next_corp_turn_extend_hand_limit:6",
  );
  state = execute(state, install);
  input = decisionInput(state);
  expect(input.playerView.own.maxHandSize).toBe(7);
  expect(state.runner.grip).toHaveLength(4);
  expect(state.runner.clicks).toBe(1);
  const draw = legal(state, "runner", "play_event", BODYWEIGHT);
  decision = chooseAiAction(input);
  expect(decision.actionId).toBe(draw.actionId);
  expect(decision.evidence).toContain(
    "plan_assessment_evidence:runner_next_corp_turn_damage_hand_buffer:6",
  );
  state = execute(state, draw);
  state = finishTurn(state, "runner");
  expect(state.runner.grip).toHaveLength(7);
  state = execute(state, legal(state, "corp", "mandatory_draw"));
  state = execute(state, legal(state, "corp", "play_operation", AUDIT));
  state = execute(state, legal(state, "corp", "resolve_choice"), ["bid_1"]);
  state = execute(state, legal(state, "runner", "resolve_choice"), ["bid_0"]);
  state = execute(state, legal(state, "corp", "play_operation", SCORCHED));
  state = execute(state, legal(state, "corp", "play_operation", PUNITIVE));
  expect(state.winner).toBeNull();
  expect(state.runner.grip).toHaveLength(1);
});

it("uses the last click to preserve enough Grip already above the current limit", () => {
  const { deckSnapshot, state: initial } = capacityFixture();
  const refill = legal(initial, "runner", "play_event", BODYWEIGHT);
  const state = execute(initial, refill);
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: deckSnapshot,
  });
  changeHistory(input, (events) => [
    ...events,
    ...visibleRetaliationEvents(input, [AUDIT, SCORCHED, PUNITIVE]),
  ]);
  expect(input.playerView.own.maxHandSize).toBe(5);
  expect(state.runner.clicks).toBe(1);
  expect(state.runner.grip).toHaveLength(9);
  const install = legal(state, "runner", "install_card", MRAM);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(install.actionId);
  expect(decision.evidence).toContain(
    "plan_assessment_evidence:runner_next_corp_turn_extend_hand_limit:6",
  );
  expect(finishTurn(execute(state, install), "runner").runner.grip).toHaveLength(7);
});

it.each([
  "no spare click",
  "unfunded refill",
  "clearable tag",
  "buffer already built",
] as const)(
  "does not promote hand-capacity installation with %s",
  (variant) => {
    const { deckSnapshot, state } = capacityFixture();
    if (variant === "no spare click" || variant === "buffer already built")
      state.runner.clicks = 1;
    if (variant === "unfunded refill") state.runner.credits = 2;
    if (variant === "clearable tag") state.runner.tags = 1;
    const input = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: deckSnapshot,
    });
    const observed =
      variant === "clearable tag"
        ? [SCORCHED, PUNITIVE]
        : variant === "buffer already built"
          ? [AUDIT, URBAN]
          : [AUDIT, SCORCHED, PUNITIVE];
    changeHistory(input, (events) => [
      ...events,
      ...visibleRetaliationEvents(input, observed),
    ]);

    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    const install = legal(state, "runner", "install_card", MRAM);
    expect(decision.evidence).not.toContain(
      "plan_assessment_evidence:runner_next_corp_turn_extend_hand_limit:6",
    );
    if (variant === "clearable tag")
      expect(decision.actionId).toBe("runner.remove_tag");
    if (variant === "buffer already built") {
      expect(runnerNextCorpTurnThreat(input)?.incomingMeatDamage).toBe(5);
      expect(decision.actionId).not.toBe(install.actionId);
      expect(
        decision.decisionDebug?.planFirstDecision?.dispositions,
      ).toContainEqual(
        expect.objectContaining({
          actionId: install.actionId,
          evidenceCode:
            "runner_last_action_would_lose_next_corp_turn_hand_buffer",
        }),
      );
    }
  },
);

it.each([
  { protection: true, damage: URBAN, grip: 4, survives: true },
  { protection: false, damage: URBAN, grip: 4, survives: false },
  { protection: false, damage: URBAN, grip: 5, survives: true },
  { protection: false, damage: SCORCHED, grip: 4, survives: true },
])(
  "resolves the actual Classic retaliation with $damage, $grip cards and protection $protection",
  ({ protection, damage, grip, survives }) => {
    const corpDeck = {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (card) => ![AUDIT, URBAN, SCORCHED].includes(card.id),
        ),
        { id: AUDIT, quantity: 1 },
        { id: damage, quantity: 1 },
      ],
    };
    const runnerDeck = {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (card) => card.id !== FALL_GUY,
        ),
        { id: FALL_GUY, quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "classic-runner-next-turn",
      traceRulesProfile: "classic_blind",
      corpDeck,
      runnerDeck,
    });
    state = execute(state, legal(state, "corp", "mandatory_draw"));
    state = finishTurn(state, "corp");
    const builder = RealEngineFixtureBuilder.forState(state)
      .withCorpHqSize(0)
      .withCorpCardInHq(AUDIT)
      .withCorpCardInHq(damage)
      .withCorpCredits(10)
      .withRunnerCredits(4)
      .withRunnerClicks(2)
      .withRunnerGripSize(protection ? grip - 1 : grip);
    if (protection) {
      builder.withRunnerCardInGrip(FALL_GUY);
      const install = getLegalActions(state, "runner").find(
        (action) =>
          action.type === "install_card" &&
          state.cardInstances[action.source]?.definitionId === FALL_GUY,
      )!;
      state = execute(state, install);
      state = execute(state, legal(state, "runner", "draw_card"));
    }
    expect(state.runner.grip).toHaveLength(grip);
    state.runnerTurnFlags!.runAttemptsThisTurn = 2;
    state = finishTurn(state, "runner");
    state = execute(state, legal(state, "corp", "mandatory_draw"));
    state = execute(state, legal(state, "corp", "play_operation", AUDIT));
    state = execute(state, legal(state, "corp", "resolve_choice"), ["bid_1"]);
    state = execute(state, legal(state, "runner", "resolve_choice"), ["bid_0"]);
    if (protection) {
      const reaction = buildAiDecisionInput(state, "runner", {
        ownDeckSnapshot: {
          deckSnapshotId: runnerDeck.id,
          side: "runner",
          cards: runnerDeck.cards.map((card) => ({
            cardId: card.id,
            quantity: card.quantity,
          })),
        },
      });
      const decision = chooseAiAction(reaction);
      expect(decision.fallbackUsed).toBe(false);
      const choices = decision.selectedChoices?.selectedOptionIds as string[];
      state = execute(state, legal(state, "runner", "resolve_choice"), choices);
      expect(state.runner.tags).toBe(0);
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "play_operation" &&
            state.cardInstances[action.source]?.definitionId === damage,
        ),
      ).toBe(false);
    } else {
      expect(state.runner.tags).toBe(1);
      state = execute(state, legal(state, "corp", "play_operation", damage));
      if (survives) expect(state.runner.grip).toHaveLength(0);
    }
    expect(state.winner === null).toBe(survives);
  },
);

function finishTurn(state: GameState, side: "runner" | "corp"): GameState {
  let current = execute(state, legal(state, side, "end_turn"));
  const choice = current.pendingChoice;
  if (choice?.side === side && choice.kind === "select_cards") {
    current = execute(
      current,
      legal(current, side, "resolve_choice"),
      choice.options.slice(0, choice.minSelections).map((option) => option.id),
    );
  }
  return current;
}

function legal(
  state: GameState,
  side: "runner" | "corp",
  type: LegalAction["type"],
  definitionId?: number,
): LegalAction {
  const action = getLegalActions(state, side).find(
    (candidate) =>
      candidate.type === type &&
      (!definitionId ||
        state.cardInstances[candidate.source]?.definitionId === definitionId),
  );
  if (!action)
    throw new Error(
      `Missing ${side} ${type} ${definitionId ?? ""} in ${state.timingPoint}.`,
    );
  return action;
}

function execute(
  state: GameState,
  action: LegalAction,
  selectedOptionIds?: string[],
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedOptionIds
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice!.choiceId,
            selectedOptionIds,
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function capacityFixture() {
  const corpDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.corp,
    cards: [
      ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
        (card) => ![AUDIT, SCORCHED, PUNITIVE, URBAN].includes(card.id),
      ),
      ...[AUDIT, SCORCHED, PUNITIVE, URBAN].map((id) => ({ id, quantity: 1 })),
    ],
  };
  const runnerDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.runner,
    cards: [
      ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
        (card) => ![FALL_GUY, MRAM, BODYWEIGHT].includes(card.id),
      ),
      ...[MRAM, BODYWEIGHT].map((id) => ({ id, quantity: 1 })),
    ],
  };
  let state = createGameAfterSetup({
    seed: "runner-capacity-and-refill",
    traceRulesProfile: "classic_blind",
    corpDeck,
    runnerDeck,
  });
  state = execute(state, legal(state, "corp", "mandatory_draw"));
  state = finishTurn(state, "corp");
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(AUDIT)
    .withCorpCardInHq(SCORCHED)
    .withCorpCardInHq(PUNITIVE)
    .withCorpCardInHq(URBAN)
    .withCorpCredits(10)
    .withRunnerCredits(5)
    .withRunnerClicks(2)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(226)
    .withRunnerCardInGrip(227)
    .withRunnerCardInGrip(233)
    .withRunnerCardInGrip(MRAM)
    .withRunnerCardInGrip(BODYWEIGHT);
  state.runnerTurnFlags!.runAttemptsThisTurn = 2;
  const deckSnapshot = {
    side: "runner" as const,
    deckSnapshotId: runnerDeck.id,
    cards: runnerDeck.cards.map(({ id, quantity }) => ({
      cardId: id,
      quantity,
    })),
  };
  return { deckSnapshot, state };
}

function visibleRetaliationEvents(
  input: AiDecisionInputWithDeckCapabilities,
  definitions: readonly number[],
  stoleAgenda = false,
): PublicGameEvent[] {
  const view = input.playerView;
  const turnSerial = view.turnSerial;
  if (turnSerial === undefined)
    throw new Error("Expected a Runner turn serial");
  const {
    input: { eventTail },
  } = capture();
  const runAttempts = eventTail
    .filter((event) => event.type === "start_run")
    .slice(-2);
  const before = Math.max(0, view.stateVersion - 1);
  const observation = {
    ...eventTail.at(-1)!,
    turnSerial,
    stateVersionBefore: before,
    stateVersionAfter: view.stateVersion,
  };
  return [
    ...runAttempts.map((event, index) => ({
      ...event,
      eventId: view.stateVersion + index + 1,
      turnSerial,
      stateVersionBefore: before,
      stateVersionAfter: view.stateVersion,
    })),
    ...definitions.map<PublicGameEvent>((id, index) => ({
      ...observation,
      type: "access_card",
      eventId: view.stateVersion + index + 101,
      publicPayload: {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: id,
        serverId: "hq",
      },
    })),
    ...(stoleAgenda
      ? [
          {
            ...observation,
            eventId: view.stateVersion + 201,
            type: "steal_agenda",
            publicPayload: {
              actionType: "steal_agenda",
              actor: "runner",
              serverId: "rd",
            },
          } satisfies PublicGameEvent,
        ]
      : []),
  ];
}

function capture(checkpoint: unknown = fixture) {
  return structuredClone(checkpoint) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    stateHash: string;
  };
}

function fallGuyInstall(input: AiDecisionInputWithDeckCapabilities) {
  const id = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === FALL_GUY,
  )?.instanceId;
  return input.legalActions.find(
    (action) => action.type === "install_card" && action.source === id,
  );
}

function changeHistory(
  input: AiDecisionInputWithDeckCapabilities,
  edit: (
    events: AiDecisionInputWithDeckCapabilities["eventTail"],
  ) => AiDecisionInputWithDeckCapabilities["eventTail"],
) {
  input.eventTail = edit(input.eventTail);
  input.playerView.publicEvents = input.eventTail;
}

function withKnownDamage(definitions: readonly number[], keepFallGuy = false) {
  const { input } = capture();
  if (!keepFallGuy) {
    const install = fallGuyInstall(input)!;
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.map((card) =>
      card.instanceId === install.source
        ? { ...input.playerView.own.gripOrHq[1]!, instanceId: card.instanceId }
        : card,
    );
    input.legalActions = input.legalActions.filter(
      (action) => action.actionId !== install.actionId,
    );
    input.playerView.legalActions = input.legalActions;
  }
  changeHistory(input, (events) => {
    const access = events.at(-1)!;
    return [
      ...events,
      ...definitions.map((id, index) => ({
        ...access,
        eventId: access.eventId + index + 1,
        publicPayload: { ...access.publicPayload, cardDefinitionId: id },
      })),
    ];
  });
  return input;
}
