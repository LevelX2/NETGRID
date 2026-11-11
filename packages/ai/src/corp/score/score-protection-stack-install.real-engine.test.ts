import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import { assessCorpScoreRushRisk } from "../../runtime/corp-score-rush-risk";
import { assessCorpTerminalAgendaDefense } from "../defense/corp-terminal-agenda-defense";

const sourceId = "onr_v1_059_self-modifying-code";
const breakerId = "onr_v1_030_grubb";
const agendaId = "onr_v1_191_black-ice-quality-assurance";
const iceId = "onr_v1_237_data-wall";
const corpCards = [
  { id: agendaId, quantity: 3 },
  { id: iceId, quantity: 3 },
  { id: "simple_agenda", quantity: 8 },
];

function corpStep(state: GameState, type: LegalAction["type"]): GameState {
  const action = getLegalActions(state, "corp").find(
    (candidate) => candidate.type === type,
  );
  if (!action) throw new Error("missing legal Corp action " + type);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function position({
  source = true,
  breaker = false,
  emptyStack = false,
  readyAgenda = false,
} = {}) {
  const state = corpStep(
    createGameAfterSetup({
      seed: "public-in-run-hidden-install",
      runnerDeck: {
        id: "stack-install-runner",
        name: "Stack install",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          sourceId,
          breakerId,
          "onr_v1_095_jack-n-joe",
          "onr_v1_108_score",
        ].map((id) => ({ id, quantity: 3 })),
      },
      corpDeck: {
        id: "stack-install-corp",
        name: "Stack install",
        side: "corp",
        identity: "corp_identity_001",
        cards: corpCards,
      },
    }),
    "mandatory_draw",
  );
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("remote_1", agendaId, readyAgenda ? 5 : 1)
    .withRezzedCorpIceOnServer("remote_1", iceId)
    .withRunnerCredits(5)
    .withRunnerGripSize(0);
  if (source) fixture.withRunnerProgramInstalled(sourceId);
  if (breaker) fixture.withRunnerProgramInstalled(breakerId);
  if (emptyStack) {
    for (const id of state.runner.stack.splice(0)) {
      state.runner.grip.push(id);
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        zone: { side: "runner", zone: "grip" },
      };
    }
  }
  if (readyAgenda) state.corp.agendaPoints = state.agendaPointsToWin - 2;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "stack-install-corp",
      side: "corp",
      cards: corpCards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
  });
}

function quote(input: ReturnType<typeof position>) {
  const view = input.playerView;
  const remote = view.servers.find((server) => server.id === "remote_1");
  if (!remote) throw new Error("missing remote");
  return assessCorpScoreProtection({
    serverIce: remote.ice,
    runnerRig: view.opponent.rig ?? [],
    runnerCredits: view.opponent.credits,
    runnerDeckCount: view.opponent.deckCount,
    maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  });
}

describe("Corp score protection with a publicly active hidden-install ability", () => {
  it("does not certify a stop based only on the installed breaker lineup", () => {
    const input = position();
    expect(
      input.playerView.opponent.rig?.map((card) => card.definitionId),
    ).toEqual([sourceId]);
    expect(input.playerView.opponent.deckCount).toBeGreaterThan(0);
    expect(input.playerView.opponent).not.toHaveProperty("stack");
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    const remote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("missing test remote");
    expect(
      assessCorpScoreRushRisk({
        input,
        server: remote,
        agendaPoints: 2,
        remainingAdvancementClicks: 4,
      }),
    ).toMatchObject({
      admission: "unknown",
      reason: "unquoted_in_run_program_install",
    });
    expect(quote(input)).toMatchObject({
      knowledge: "unknown",
      protectsScore: false,
      unknownReason: "unsupported_runner_access_effect",
      evidence: expect.arrayContaining([
        "publicRunnerInRunStackInstallUnquoted:true",
      ]),
    });
    expect(
      assessCorpTerminalAgendaDefense(input, "remote_1", "agenda:terminal"),
    ).toBeUndefined();
  });

  it.each([{ source: false }, { emptyStack: true }])(
    "preserves the certified stop when the public facts rule out the install %o",
    (options) => {
      expect(quote(position(options))).toMatchObject({
        knowledge: "known",
        protectsScore: true,
        runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      });
    },
  );

  it("preserves an already open exact route when the installed breaker is sufficient", () => {
    expect(quote(position({ breaker: true }))).toMatchObject({
      knowledge: "known",
      protectsScore: false,
      runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
    });
  });

  it("keeps the existing legal immediately winning score", () => {
    const input = position({ readyAgenda: true });
    const selected = chooseAiAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === selected.actionId)
        ?.type,
    ).toBe("score_agenda");
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });
});
