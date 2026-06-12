import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import snapshotsData08 from "../../../../data/decks/deck-snapshots-0.8.json";
import type {
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { AiDeckDoctrineDeckSnapshot } from "../deck-doctrine";
import { buildDeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import type { RealEngineDecisionCorpusScenario } from "./real-engine-decision-corpus";

export const REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS = [
  "runner_real_low_credits",
  "runner_real_safe_hq_access",
  "runner_real_safe_rd_access",
  "runner_real_remote_score_threat",
  "runner_real_damage_buffer_needed",
  "runner_real_tag_cleanup",
  "runner_real_click_limited_economy",
  "runner_real_remote_probe",
  "runner_real_rnd_pressure_with_buffer",
  "runner_real_high_credits_setup",
  "runner_real_empty_hand_draw",
  "runner_real_tagged_low_credits",
  "runner_real_safe_archives_access",
  "runner_real_remote_with_ice_probe",
  "runner_real_low_click_tag_cleanup",
  "corp_real_score_agenda_window",
  "corp_real_advance_score_window",
  "corp_real_low_rez_reserve",
  "corp_real_rez_value_window",
  "corp_real_do_not_rez_when_broke",
  "corp_real_basic_economy_draw",
  "corp_real_remote_defense_setup",
  "corp_real_install_credit_pressure",
  "corp_real_high_credit_main_window",
  "corp_real_score_low_credits",
  "corp_real_remote_ice_defense",
  "corp_real_low_credit_main_window",
  "corp_real_rez_mid_credits",
  "corp_real_remote_double_asset_setup",
  "corp_real_draw_pressure_window",
] as const;

const LEAGUE_EXPECTATION_BY_SCENARIO_ID = {
  runner_real_low_credits: ["gain_credit", "draw_card"],
  runner_real_safe_hq_access: ["start_run"],
  runner_real_safe_rd_access: ["start_run"],
  runner_real_remote_score_threat: ["start_run"],
  runner_real_damage_buffer_needed: ["draw_card"],
  runner_real_tag_cleanup: ["remove_tag"],
  corp_real_score_agenda_window: ["score_agenda"],
  corp_real_advance_score_window: ["advance_card"],
  corp_real_low_rez_reserve: ["gain_credit", "draw_card"],
  corp_real_rez_value_window: ["rez_ice"],
  corp_real_do_not_rez_when_broke: ["decline_rez"],
  corp_real_basic_economy_draw: ["gain_credit", "draw_card"],
} as const satisfies Partial<
  Record<(typeof REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS)[number], readonly string[]>
>;

export function buildRealEngineDecisionCorpusScenarios(): RealEngineDecisionCorpusScenario[] {
  return [
    runnerScenario(
      "runner_real_low_credits",
      "real-runner-low-credits",
      (state) => {
        state.runner.credits = 0;
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_hq_access",
      "real-runner-safe-hq",
      (state) => {
        state.runner.credits = 7;
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_rd_access",
      "real-runner-safe-rd",
      (state) => {
        state.runner.credits = 7;
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
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
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_damage_buffer_needed",
      "real-runner-damage-buffer",
      (state) => {
        state.runner.credits = 4;
        state.runner.grip = state.runner.grip.slice(0, 1);
      },
      ["fixture:low_hand_buffer"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_tag_cleanup",
      "real-runner-tag-cleanup",
      (state) => {
        state.runner.tags = 1;
        state.runner.credits = 5;
      },
      [],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_click_limited_economy",
      "real-runner-click-limited-economy",
      (state) => {
        state.runner.clicks = 1;
        state.runner.credits = 1;
      },
      ["fixture:runner_click_limited"],
      "demo_runner_008_snapshot_v0_8",
    ),
    runnerScenario(
      "runner_real_remote_probe",
      "real-runner-remote-probe",
      (state) => {
        state.runner.credits = 6;
        ensureServer(state, "remote_2");
      },
      ["fixture:runner_remote_probe"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_rnd_pressure_with_buffer",
      "real-runner-rnd-pressure-buffer",
      (state) => {
        state.runner.credits = 9;
        state.runner.grip = state.runner.grip.slice(0, 4);
      },
      ["fixture:rnd_pressure_with_buffer"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_high_credits_setup",
      "real-runner-high-credits-setup",
      (state) => {
        state.runner.credits = 12;
      },
      ["fixture:runner_high_credits_setup"],
      "demo_runner_008_snapshot_v0_8",
    ),
    runnerScenario(
      "runner_real_empty_hand_draw",
      "real-runner-empty-hand-draw",
      (state) => {
        state.runner.credits = 5;
        state.runner.grip = [];
      },
      ["fixture:runner_empty_hand"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_tagged_low_credits",
      "real-runner-tagged-low-credits",
      (state) => {
        state.runner.tags = 2;
        state.runner.credits = 1;
      },
      ["fixture:runner_tagged_low_credits"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    runnerScenario(
      "runner_real_safe_archives_access",
      "real-runner-safe-archives",
      (state) => {
        state.runner.credits = 7;
      },
      ["fixture:runner_archives_access"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_remote_with_ice_probe",
      "real-runner-remote-ice-probe",
      (state) => {
        state.runner.credits = 9;
        ensureServer(state, "remote_2");
        putCorpIceOnServer(state, "remote_2", "simple_barrier_ice");
      },
      ["fixture:runner_remote_with_ice_probe"],
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    ),
    runnerScenario(
      "runner_real_low_click_tag_cleanup",
      "real-runner-low-click-tag-cleanup",
      (state) => {
        state.runner.clicks = 1;
        state.runner.tags = 1;
        state.runner.credits = 4;
      },
      ["fixture:runner_low_click_tag_cleanup"],
      "onr_origin_runner_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_score_agenda_window",
      "real-corp-score-window",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 3);
      },
      ["fixture:score_agenda_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_advance_score_window",
      "real-corp-advance-window",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 2);
      },
      ["fixture:advance_to_score_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_low_rez_reserve",
      "real-corp-low-rez-reserve",
      (state) => {
        state.corp.credits = 1;
      },
      [],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpRezScenario(
      "corp_real_rez_value_window",
      "real-corp-rez-value",
      8,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpRezScenario(
      "corp_real_do_not_rez_when_broke",
      "real-corp-no-rez",
      0,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_basic_economy_draw",
      "real-corp-economy-draw",
      (state) => {
        state.corp.credits = 0;
      },
      [],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_remote_defense_setup",
      "real-corp-remote-defense-setup",
      (state) => {
        state.corp.credits = 6;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 1);
      },
      ["fixture:corp_remote_defense_setup"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_install_credit_pressure",
      "real-corp-install-credit-pressure",
      (state) => {
        state.corp.credits = 2;
      },
      ["fixture:corp_install_credit_pressure"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpScenario(
      "corp_real_high_credit_main_window",
      "real-corp-high-credit-main-window",
      (state) => {
        state.corp.credits = 12;
      },
      ["fixture:corp_high_credit_main_window"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_score_low_credits",
      "real-corp-score-low-credits",
      (state) => {
        state.corp.credits = 1;
        putCorpRootInServer(state, "remote_1", "simple_agenda", 3);
      },
      ["fixture:corp_score_low_credits"],
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_remote_ice_defense",
      "real-corp-remote-ice-defense",
      (state) => {
        state.corp.credits = 5;
        ensureServer(state, "remote_2");
        putCorpIceOnServer(state, "remote_2", "simple_barrier_ice");
      },
      ["fixture:corp_remote_ice_defense"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_low_credit_main_window",
      "real-corp-low-credit-main-window",
      (state) => {
        state.corp.credits = 1;
      },
      ["fixture:corp_low_credit_main_window"],
      "demo_corp_008_snapshot_v0_8",
    ),
    corpRezScenario(
      "corp_real_rez_mid_credits",
      "real-corp-rez-mid-credits",
      4,
      "onr_origin_corp_ai_snapshot_v1",
    ),
    corpScenario(
      "corp_real_remote_double_asset_setup",
      "real-corp-remote-double-asset-setup",
      (state) => {
        state.corp.credits = 7;
        putCorpRootInServer(state, "remote_1", "simple_economy_asset", 0);
        ensureServer(state, "remote_2");
      },
      ["fixture:corp_remote_double_asset_setup"],
      "proteus_corp_region_fast_score_snapshot_v2026_05_25",
    ),
    corpScenario(
      "corp_real_draw_pressure_window",
      "real-corp-draw-pressure-window",
      (state) => {
        state.corp.credits = 3;
        state.corp.hq = state.corp.hq.slice(0, 1);
      },
      ["fixture:corp_draw_pressure_window"],
      "demo_corp_008_snapshot_v0_8",
    ),
  ];
}

function runnerScenario(
  scenarioId: string,
  seed: string,
  mutate: (state: GameState) => void,
  evidence: readonly string[] = [],
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  return RealEngineDecisionCorpusScenarioBuilder.runnerTurn(scenarioId, seed)
    .mutate(mutate)
    .addEvidence(evidence)
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

function corpScenario(
  scenarioId: string,
  seed: string,
  mutate: (state: GameState) => void,
  evidence: readonly string[] = [],
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  return RealEngineDecisionCorpusScenarioBuilder.corpMain(scenarioId, seed)
    .mutate(mutate)
    .addEvidence(evidence)
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

function corpRezScenario(
  scenarioId: string,
  seed: string,
  corpCredits: number,
  deckSnapshotId?: string,
): RealEngineDecisionCorpusScenario {
  let state = toRunnerTurn(
    createGameAfterSetup({ seed, agendaPointsToWin: 7 }),
  );
  putCorpIceOnServer(state, "hq", "simple_barrier_ice");
  state.runner.credits = 6;
  state.corp.credits = corpCredits;
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  return RealEngineDecisionCorpusScenarioBuilder.fromState(
    scenarioId,
    "corp",
    state,
  )
    .addEvidence([`fixture:corp_rez_window_credits:${corpCredits}`])
    .withDeckDoctrine(deckSnapshotId)
    .build();
}

class RealEngineDecisionCorpusScenarioBuilder {
  private readonly evidence: string[] = [];
  private deckSnapshotId?: string;

  private constructor(
    private readonly scenarioId: string,
    private readonly side: Side,
    private readonly state: GameState,
  ) {}

  static runnerTurn(
    scenarioId: string,
    seed: string,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(
      scenarioId,
      "runner",
      toRunnerTurn(createGameAfterSetup({ seed, agendaPointsToWin: 7 })),
    );
  }

  static corpMain(
    scenarioId: string,
    seed: string,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(
      scenarioId,
      "corp",
      apply(
        createGameAfterSetup({ seed, agendaPointsToWin: 7 }),
        "corp",
        (action) => action.type === "mandatory_draw",
      ),
    );
  }

  static fromState(
    scenarioId: string,
    side: Side,
    state: GameState,
  ): RealEngineDecisionCorpusScenarioBuilder {
    return new RealEngineDecisionCorpusScenarioBuilder(scenarioId, side, state);
  }

  mutate(mutator: (state: GameState) => void): this {
    mutator(this.state);
    return this;
  }

  addEvidence(evidence: readonly string[]): this {
    this.evidence.push(...evidence);
    return this;
  }

  withDeckDoctrine(deckSnapshotId: string | undefined): this {
    if (deckSnapshotId !== undefined) {
      this.deckSnapshotId = deckSnapshotId;
    }
    return this;
  }

  build(): RealEngineDecisionCorpusScenario {
    const input = buildAiDecisionInput(this.state, this.side, {
      decisionId: this.scenarioId,
      profileId: `${this.side}-ai-real-engine-corpus`,
    });
    return {
      scenarioId: this.scenarioId,
      input,
      ...(this.side === "runner"
        ? {
            runner: {
              runTargets: evaluateRunnerRunTargets({ input }),
              economyPosture: buildRunnerEconomyPosture({ input }),
            },
          }
        : {}),
      evidence: [...this.evidence],
      ...(this.deckSnapshotId
        ? { deckDoctrine: deckDoctrineForSnapshot(this.deckSnapshotId) }
        : {}),
      ...leagueExpectationForScenario(this.scenarioId),
    };
  }
}

function leagueExpectationForScenario(
  scenarioId: string,
): Pick<RealEngineDecisionCorpusScenario, "leagueExpectation"> {
  const expectedTopActionTypes =
    LEAGUE_EXPECTATION_BY_SCENARIO_ID[
      scenarioId as keyof typeof LEAGUE_EXPECTATION_BY_SCENARIO_ID
    ];
  return expectedTopActionTypes
    ? {
        leagueExpectation: {
          expectedTopActionTypes,
          evidence: [`league_expectation_source:corpus_metadata:${scenarioId}`],
        },
      }
    : {};
}

function deckDoctrineForSnapshot(snapshotId: string) {
  return buildDeckDoctrineV2Diagnostic(snapshotById(snapshotId));
}

function snapshotById(snapshotId: string): AiDeckDoctrineDeckSnapshot {
  const snapshot = snapshotsData08.snapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing deck snapshot ${snapshotId}`);
  const publicMetadata = snapshot.publicMetadata
    ? {
        ...snapshot.publicMetadata,
        side: parseSnapshotSide(snapshot.publicMetadata.side, snapshotId),
      }
    : undefined;
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: parseSnapshotSide(snapshot.side, snapshotId),
    ...(snapshot.formatProfileId
      ? { formatProfileId: snapshot.formatProfileId }
      : {}),
    ...(publicMetadata ? { publicMetadata } : {}),
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function parseSnapshotSide(side: unknown, snapshotId: string): Side {
  if (side === "runner" || side === "corp") return side;
  throw new Error(`Unsupported deck snapshot side ${side} for ${snapshotId}`);
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
  if (!selected) {
    throw new Error(
      `Missing legal action. Legal: ${legalActions
        .map((action) => `${action.type}:${action.label}`)
        .join(", ")}`,
    );
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(
    (action) => action.type === "resolve_choice",
  );
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
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
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
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
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
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
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
