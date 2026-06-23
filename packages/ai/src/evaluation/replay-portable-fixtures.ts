import type { AiDecisionInput, LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";

export const REPLAY_PORTABLE_FIXTURE_SCHEMA_VERSION =
  "replay-portable-fixture-v1" as const;

export type ReplayPortableDecisionFixture = {
  schemaVersion: typeof REPLAY_PORTABLE_FIXTURE_SCHEMA_VERSION;
  fixtureId: string;
  source: {
    kind: "synthetic_near_same_state";
    derivedFrom: string;
    deviationNote: string;
  };
  input: AiDecisionInput;
  expected: {
    actionId: string;
    actionType: LegalAction["type"];
    reason: string;
  };
  noRuntimeEffect: true;
  productiveUseAllowed: false;
};

export function coverageRunGapPortableFixture(): ReplayPortableDecisionFixture {
  const run = legalAction("portable.run.rd", "start_run", "Run R&D", {
    serverId: "rd",
  });
  const draw = legalAction("portable.draw", "draw_card", "Draw 1");
  const gain = legalAction("portable.gain_credit", "gain_credit", "Gain 1");
  const input = aiInput([draw, gain, run]);
  input.playerView.own.credits = 3;
  input.playerView.own.clicks = 2;
  input.playerView.own.gripOrHq = [
    visibleCard("portable.visible.event", "event"),
    visibleCard("portable.visible.program", "program"),
    visibleCard("portable.visible.resource", "resource"),
    visibleCard("portable.visible.hardware", "hardware"),
  ];
  input.playerView.opponent.deckCount = 20;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        visibleCard("portable.visible.remote_ice", "ice", {
          owner: "corp",
          controller: "corp",
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ],
      [
        visibleCard("portable.visible.remote_root", "agenda", {
          owner: "corp",
          controller: "corp",
        }),
      ],
    ),
  ];
  return {
    schemaVersion: REPLAY_PORTABLE_FIXTURE_SCHEMA_VERSION,
    fixtureId: "ai-replay-coverage-run-gap-portable-v1",
    source: {
      kind: "synthetic_near_same_state",
      derivedFrom:
        "docs/reviews/ai/ai-replay-decision-repro-2026-06-23.md#replay-case-509c7f2d5d6a49c2",
      deviationNote:
        "Original local SQLite state is not embedded; fixture keeps only side-safe PlayerView, LegalActions and the visible run/coverage decision shape.",
    },
    input,
    expected: {
      actionId: run.actionId,
      actionType: "start_run",
      reason:
        "A clearly positive visible central run must beat generic draw/credit coverage fallback.",
    },
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
}

export function coverageRunGapNoRunNegativeFixture(): ReplayPortableDecisionFixture {
  const draw = legalAction("portable.no_run.draw", "draw_card", "Draw 1");
  const gain = legalAction("portable.no_run.gain_credit", "gain_credit", "Gain 1");
  const input = aiInput([draw, gain]);
  input.playerView.own.credits = 3;
  input.playerView.own.clicks = 2;
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  return {
    schemaVersion: REPLAY_PORTABLE_FIXTURE_SCHEMA_VERSION,
    fixtureId: "ai-replay-coverage-run-gap-no-run-negative-v1",
    source: {
      kind: "synthetic_near_same_state",
      derivedFrom:
        "docs/reviews/ai/ai-replay-decision-repro-2026-06-23.md#negative-control",
      deviationNote:
        "Negative control removes start_run from LegalActions; the AI must not invent one.",
    },
    input,
    expected: {
      actionId: "not_start_run",
      actionType: "start_run",
      reason: "Without a start_run LegalAction, the portable fixture must not select one.",
    },
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
}

function aiInput(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: playerView(legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "ai-replay-portable-fixture",
    decisionId: "ai-replay-portable-fixture",
    actionNumber: 13,
    profileId: "runner-ai-replay-portable-fixture",
  };
}

function playerView(legalActions: LegalAction[]): PlayerView {
  return {
    stateVersion: 13,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: identityCard("runner"),
      credits: 3,
      clicks: 2,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identityCard("corp"),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function identityCard(side: Side): VisibleCard {
  return {
    instanceId: `portable.${side}.identity`,
    definitionId: `portable.${side}.identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "definitionId" | "type" | "known"
  > = {},
): VisibleCard {
  const owner = overrides.owner ?? "runner";
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner,
    controller: overrides.controller ?? owner,
    type,
    known: true,
    ...overrides,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  label: string,
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ credits: 0 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 14,
    payload,
  };
}
