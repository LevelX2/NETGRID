import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manual-20261113-runner-next-corp-turn.json";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerNextCorpTurnThreat } from "../../runner/defense-recovery/next-corp-turn-punish";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const AUDIT = "onr_v1_283_audit-of-call-records";
const CHANCE = "onr_v1_284_chance-observation";
const FALL_GUY = "onr_v1_161_fall-guy";
const HUNTER = "onr_v1_249_hunter";
const URBAN = "onr_v1_307_urban-renewal";
const SCORCHED = "onr_v1_302_scorched-earth";
const PUNITIVE = "onr_v1_301_punitive-counterstrike";

afterEach(resetResidentPlanPortfolioMemory);

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
        eventId: "observed-audit-played",
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
                  effectId: "synthetic-event-run",
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
      definitionId: "onr_v1_125_dermatech-bodyplating",
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
        event.eventId === "synthetic-hq-observation-0"
          ? {
              ...event,
              eventId: "evt_22_urban_access",
              stateVersionBefore: 20,
              stateVersionAfter: 21,
            }
          : event,
      )
      .concat({
        ...events.at(-1)!,
        eventId: "observed-urban-played",
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
  definitionId?: string,
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

function capture() {
  return structuredClone(fixture) as unknown as {
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

function withKnownDamage(definitions: readonly string[], keepFallGuy = false) {
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
        eventId: `synthetic-hq-observation-${index}`,
        publicPayload: { ...access.publicPayload, cardDefinitionId: id },
      })),
    ];
  });
  return input;
}
