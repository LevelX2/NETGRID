import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type {
  AiDecisionInput,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildRealEngineDecisionCorpus,
  type RealEngineDecisionCorpusScenario,
  type RealEngineDecisionCorpusSample,
} from "./real-engine-decision-corpus";

const REAL_ENGINE_SCENARIO_IDS = [
  "runner_real_low_credits",
  "runner_real_safe_hq_access",
  "runner_real_safe_rd_access",
  "runner_real_remote_score_threat",
  "runner_real_damage_buffer_needed",
  "runner_real_tag_cleanup",
  "corp_real_score_agenda_window",
  "corp_real_advance_score_window",
  "corp_real_low_rez_reserve",
  "corp_real_rez_value_window",
  "corp_real_do_not_rez_when_broke",
  "corp_real_basic_economy_draw",
] as const;

describe("RealEngineDecisionCorpus", () => {
  it("builds the activation-track corpus from real Engine LegalActions", () => {
    const scenarios = realEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);

    expect(samples.map((sample) => sample.scenarioId)).toEqual(
      REAL_ENGINE_SCENARIO_IDS,
    );
    expect(samples.filter((sample) => sample.legalActionCount === 0)).toEqual(
      [],
    );
    expect(samples.filter((sample) => sample.candidateCount === 0)).toEqual([]);

    for (const sample of samples) {
      const scenario = scenarioFor(scenarios, sample.scenarioId);
      expect(sample.frame.legalActionIds).toEqual(
        scenario.input.legalActions.map((action) => action.actionId),
      );
      expect(sample.candidateCount).toBe(sample.legalActionCount);
      expect(traceActionIds(sample).every((id) => sample.frame.legalActionIds.includes(id))).toBe(
        true,
      );
      expect(containsForbiddenSemanticMarker(sample)).toBe(false);
      expect(sample.trace.noRuntimeEffect).toBe(true);
    }

    expect(actionTypesFor(scenarios, "runner_real_tag_cleanup")).toContain(
      "remove_tag",
    );
    expect(actionTypesFor(scenarios, "corp_real_score_agenda_window")).toContain(
      "score_agenda",
    );
    expect(actionTypesFor(scenarios, "corp_real_advance_score_window")).toContain(
      "advance_card",
    );
    expect(actionTypesFor(scenarios, "corp_real_rez_value_window")).toContain(
      "rez_ice",
    );
    expect(actionTypesFor(scenarios, "corp_real_do_not_rez_when_broke")).toContain(
      "decline_rez",
    );
  });

  it("keeps real run target payloads side-safe and target-alignable", () => {
    const scenarios = realEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);
    const hqSample = sampleFor(samples, "runner_real_safe_hq_access");
    const rdSample = sampleFor(samples, "runner_real_safe_rd_access");
    const remoteSample = sampleFor(samples, "runner_real_remote_score_threat");

    expect(hasServerTargetContext(hqSample, "hq")).toBe(true);
    expect(hasServerTargetContext(rdSample, "rd")).toBe(true);
    expect(hasServerTargetContext(remoteSample, "remote_1")).toBe(true);
  });
});

function realEngineDecisionCorpusScenarios(): RealEngineDecisionCorpusScenario[] {
  return [
    runnerScenario("runner_real_low_credits", "real-runner-low-credits", (state) => {
      state.runner.credits = 0;
    }),
    runnerScenario("runner_real_safe_hq_access", "real-runner-safe-hq", (state) => {
      state.runner.credits = 7;
    }),
    runnerScenario("runner_real_safe_rd_access", "real-runner-safe-rd", (state) => {
      state.runner.credits = 7;
    }),
    runnerScenario(
      "runner_real_remote_score_threat",
      "real-runner-remote-threat",
      (state) => {
        state.runner.credits = 8;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 2, {
          faceup: true,
          rezzed: false,
        });
      },
      ["fixture:remote_score_threat"],
    ),
    runnerScenario(
      "runner_real_damage_buffer_needed",
      "real-runner-damage-buffer",
      (state) => {
        state.runner.credits = 4;
        state.runner.grip = state.runner.grip.slice(0, 1);
      },
      ["fixture:low_hand_buffer"],
    ),
    runnerScenario("runner_real_tag_cleanup", "real-runner-tag-cleanup", (state) => {
      state.runner.tags = 1;
      state.runner.credits = 5;
    }),
    corpScenario(
      "corp_real_score_agenda_window",
      "real-corp-score-window",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 3);
      },
      ["fixture:score_agenda_window"],
    ),
    corpScenario(
      "corp_real_advance_score_window",
      "real-corp-advance-window",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 2);
      },
      ["fixture:advance_to_score_window"],
    ),
    corpScenario("corp_real_low_rez_reserve", "real-corp-low-rez-reserve", (state) => {
      state.corp.credits = 1;
    }),
    corpRezScenario("corp_real_rez_value_window", "real-corp-rez-value", 8),
    corpRezScenario("corp_real_do_not_rez_when_broke", "real-corp-no-rez", 0),
    corpScenario("corp_real_basic_economy_draw", "real-corp-economy-draw", (state) => {
      state.corp.credits = 0;
    }),
  ];
}

function runnerScenario(
  scenarioId: string,
  seed: string,
  mutate: (state: GameState) => void,
  evidence: readonly string[] = [],
): RealEngineDecisionCorpusScenario {
  const state = toRunnerTurn(createGameAfterSetup({ seed, agendaPointsToWin: 7 }));
  mutate(state);
  const input = buildAiDecisionInput(state, "runner", {
    decisionId: scenarioId,
    profileId: "runner-ai-real-engine-corpus",
  });
  return {
    scenarioId,
    input,
    runner: {
      runTargets: evaluateRunnerRunTargets({ input }),
      economyPosture: buildRunnerEconomyPosture({ input }),
    },
    evidence,
  };
}

function corpScenario(
  scenarioId: string,
  seed: string,
  mutate: (state: GameState) => void,
  evidence: readonly string[] = [],
): RealEngineDecisionCorpusScenario {
  let state = createGameAfterSetup({ seed, agendaPointsToWin: 7 });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  return {
    scenarioId,
    input: buildAiDecisionInput(state, "corp", {
      decisionId: scenarioId,
      profileId: "corp-ai-real-engine-corpus",
    }),
    evidence,
  };
}

function corpRezScenario(
  scenarioId: string,
  seed: string,
  corpCredits: number,
): RealEngineDecisionCorpusScenario {
  let state = toRunnerTurn(createGameAfterSetup({ seed, agendaPointsToWin: 7 }));
  putCorpIceOnServer(state, "hq", "simple_barrier_ice");
  state.runner.credits = 6;
  state.corp.credits = corpCredits;
  state = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === "hq",
  );
  return {
    scenarioId,
    input: buildAiDecisionInput(state, "corp", {
      decisionId: scenarioId,
      profileId: "corp-ai-real-engine-corpus",
    }),
    evidence: [`fixture:corp_rez_window_credits:${corpCredits}`],
  };
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", [
      String(next.pendingChoice.options[0]?.id),
    ]);
  }
  return next;
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  expect(
    selected,
    `Legal: ${legalActions
      .map((action) => `${action.type}:${action.label}`)
      .join(", ")}`,
  ).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find((action) => action.type === "resolve_choice");
  if (!selected) throw new Error("Missing resolve_choice action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function putCorpRootInServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: string,
  advancementCounters: number,
  options: { faceup?: boolean; rezzed?: boolean } = {},
): CardInstanceId {
  ensureServer(state, serverId);
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new Error(`Missing server ${serverId}`);
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters,
  };
  return id;
}

function putCorpIceOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: string,
): CardInstanceId {
  ensureServer(state, serverId);
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new Error(`Missing server ${serverId}`);
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function ensureServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  if (state.corp.servers.some((server) => server.id === serverId)) return;
  if (!serverId.startsWith("remote_")) {
    throw new Error(`Missing central server ${serverId}`);
  }
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: `Remote ${serverId.slice("remote_".length)}`,
    ice: [],
    root: [],
  });
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0] as CardInstanceId;
}

function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter((cardId) => cardId !== id);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
}

function scenarioFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  scenarioId: string,
): RealEngineDecisionCorpusScenario {
  const scenario = scenarios.find((candidate) => candidate.scenarioId === scenarioId);
  if (!scenario) throw new Error(`Missing scenario ${scenarioId}`);
  return scenario;
}

function sampleFor(
  samples: readonly RealEngineDecisionCorpusSample[],
  scenarioId: string,
): RealEngineDecisionCorpusSample {
  const sample = samples.find((candidate) => candidate.scenarioId === scenarioId);
  if (!sample) throw new Error(`Missing sample ${scenarioId}`);
  return sample;
}

function actionTypesFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  scenarioId: string,
): LegalAction["type"][] {
  return scenarioFor(scenarios, scenarioId).input.legalActions.map(
    (action) => action.type,
  );
}

function traceActionIds(sample: RealEngineDecisionCorpusSample): string[] {
  return [
    ...sample.trace.rankedActions.map((action) => action.actionId),
    ...sample.trace.rejectedActions.map((action) => action.actionId),
    ...(sample.trace.selectedActionId ? [sample.trace.selectedActionId] : []),
  ];
}

function hasServerTargetContext(
  sample: RealEngineDecisionCorpusSample,
  serverId: string,
): boolean {
  return sample.frame.actionCandidates.some(
    (candidate) =>
      candidate.semanticActionType === "run.start" &&
      candidate.targetContext?.availableTargets?.some(
        (target) =>
          target.targetKind === "server" && target.targetId === serverId,
      ) === true,
  );
}
