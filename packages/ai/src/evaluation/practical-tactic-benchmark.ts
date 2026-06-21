import type {
  ActionType,
  AiDecision,
  AiDecisionInput,
  LegalAction,
  Side,
  VisibleCard,
} from "@netgrid/shared";

export type PracticalTacticBenchmarkCategory =
  | "corp_safe_score"
  | "runner_steal_agenda"
  | "runner_trash_value"
  | "runner_install_coverage"
  | "corp_real_punish"
  | "corp_abandon_stale_punish"
  | "runner_continue_reachable_run"
  | "runner_avoid_stale_run";

export type PracticalTacticBenchmarkCase = {
  caseId: string;
  category: PracticalTacticBenchmarkCategory;
  input: AiDecisionInput;
  acceptableActionIds: string[];
  badActionIds: string[];
  frozenLegacyActionId: string;
  rationale: string;
};

export type PracticalTacticBenchmarkResult = {
  caseCount: number;
  hits: number;
  misses: number;
  hitRate: number;
  hitsByCategory: Record<PracticalTacticBenchmarkCategory, number>;
  totalsByCategory: Record<PracticalTacticBenchmarkCategory, number>;
  missesByCase: Array<{
    caseId: string;
    category: PracticalTacticBenchmarkCategory;
    selectedActionId: string;
    acceptableActionIds: string[];
    badActionIds: string[];
  }>;
};

export type PracticalTacticDecisionSelector = (
  input: AiDecisionInput,
) => Pick<AiDecision, "actionId">;

type ActionSpec = {
  actionId: string;
  type: ActionType;
  label: string;
  payload?: Record<string, string | number | boolean>;
  costs?: LegalAction["costs"];
  source?: string;
};

type CaseSpec = {
  caseId: string;
  category: PracticalTacticBenchmarkCategory;
  side: Side;
  frozenLegacyActionId: string;
  acceptableActionIds: string[];
  badActionIds: string[];
  rationale: string;
  actions: ActionSpec[];
  tags?: number;
  credits?: number;
  servers?: AiDecisionInput["playerView"]["servers"];
  run?: AiDecisionInput["playerView"]["run"];
  gripOrHq?: VisibleCard[];
  rig?: VisibleCard[];
};

const CATEGORY_ORDER: PracticalTacticBenchmarkCategory[] = [
  "corp_safe_score",
  "runner_steal_agenda",
  "runner_trash_value",
  "runner_install_coverage",
  "corp_real_punish",
  "corp_abandon_stale_punish",
  "runner_continue_reachable_run",
  "runner_avoid_stale_run",
];

export const PRACTICAL_TACTIC_BENCHMARK_CASES: PracticalTacticBenchmarkCase[] =
  [
    ...safeScoreCases(),
    ...stealAgendaCases(),
    ...trashValueCases(),
    ...coverageInstallCases(),
    ...realPunishCases(),
    ...stalePunishCases(),
    ...continueRunCases(),
    ...avoidStaleRunCases(),
  ].map(buildCase);

export function evaluatePracticalTacticBenchmark(
  selector: PracticalTacticDecisionSelector,
  cases: readonly PracticalTacticBenchmarkCase[] =
    PRACTICAL_TACTIC_BENCHMARK_CASES,
): PracticalTacticBenchmarkResult {
  const totalsByCategory = emptyCategoryCounts();
  const hitsByCategory = emptyCategoryCounts();
  const missesByCase: PracticalTacticBenchmarkResult["missesByCase"] = [];
  for (const benchmarkCase of cases) {
    totalsByCategory[benchmarkCase.category] += 1;
    const selectedActionId = selector(benchmarkCase.input).actionId;
    const hit = benchmarkCase.acceptableActionIds.includes(selectedActionId);
    if (hit) {
      hitsByCategory[benchmarkCase.category] += 1;
    } else {
      missesByCase.push({
        caseId: benchmarkCase.caseId,
        category: benchmarkCase.category,
        selectedActionId,
        acceptableActionIds: benchmarkCase.acceptableActionIds.slice(),
        badActionIds: benchmarkCase.badActionIds.slice(),
      });
    }
  }
  const hits = Object.values(hitsByCategory).reduce((sum, value) => sum + value, 0);
  const caseCount = cases.length;
  return {
    caseCount,
    hits,
    misses: caseCount - hits,
    hitRate: caseCount === 0 ? 0 : round(hits / caseCount),
    hitsByCategory,
    totalsByCategory,
    missesByCase,
  };
}

export function frozenLegacyPracticalTacticSelector(
  input: AiDecisionInput,
): Pick<AiDecision, "actionId"> {
  const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
    (candidate) => candidate.input.decisionId === input.decisionId,
  );
  return { actionId: benchmarkCase?.frozenLegacyActionId ?? input.legalActions[0]?.actionId ?? "" };
}

function buildCase(spec: CaseSpec): PracticalTacticBenchmarkCase {
  const legalActions = spec.actions.map((action) => legalAction(spec.side, action));
  return {
    caseId: spec.caseId,
    category: spec.category,
    input: inputFor(spec, legalActions),
    acceptableActionIds: spec.acceptableActionIds,
    badActionIds: spec.badActionIds,
    frozenLegacyActionId: spec.frozenLegacyActionId,
    rationale: spec.rationale,
  };
}

function inputFor(spec: CaseSpec, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: spec.side,
    playerView: {
      side: spec.side,
      stateVersion: 1,
      timingPoint: spec.side === "runner" ? "runner_action.main" : "corp_action.main",
      activeSide: spec.side,
      phase: spec.side === "runner" ? "runner_action_phase" : "corp_action_phase",
      own: {
        identity: visibleCard(`${spec.side}-identity`, "identity"),
        credits: spec.credits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: spec.gripOrHq ?? [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        ...(spec.rig ? { rig: spec.rig } : {}),
        maxHandSize: 5,
        tags: spec.side === "runner" ? (spec.tags ?? 0) : 0,
      },
      opponent: {
        identity: visibleCard(`${spec.side}-opponent-identity`, "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: spec.side === "corp" ? (spec.tags ?? 0) : 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: spec.servers ?? [],
      ...(spec.run ? { run: spec.run } : {}),
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: spec.caseId,
    decisionId: spec.caseId,
    actionNumber: 1,
    profileId: `${spec.side}:practical-tactic-benchmark`,
  };
}

function legalAction(side: Side, spec: ActionSpec): LegalAction {
  return {
    actionId: spec.actionId,
    side,
    type: spec.type,
    label: spec.label,
    source: spec.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: spec.costs ?? [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...(spec.payload ? { payload: spec.payload } : {}),
  };
}

function safeScoreCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-corp-safe-score-${index}`,
    category: "corp_safe_score",
    side: "corp",
    frozenLegacyActionId: `gain-${index}`,
    acceptableActionIds: [`score-${index}`],
    badActionIds: [`gain-${index}`, `protect-${index}`],
    rationale: "Corp hat ein sicheres Score-Fenster; Scoren ist der konkrete Fortschritt.",
    actions: [
      { actionId: `score-${index}`, type: "score_agenda", label: "Score agenda" },
      { actionId: `gain-${index}`, type: "gain_credit", label: "Gain credit" },
      {
        actionId: `protect-${index}`,
        type: "install_card",
        label: "Install extra ICE",
        payload: { placement: "ice", serverId: "remote_1" },
      },
    ],
  }));
}

function stealAgendaCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-runner-steal-agenda-${index}`,
    category: "runner_steal_agenda",
    side: "runner",
    frozenLegacyActionId: `decline-${index}`,
    acceptableActionIds: [`steal-${index}`],
    badActionIds: [`decline-${index}`],
    rationale: "Runner kann eine Agenda stehlen; Ablehnen ist eindeutig schlecht.",
    actions: [
      { actionId: `steal-${index}`, type: "steal_agenda", label: "Steal agenda" },
      { actionId: `decline-${index}`, type: "decline_trash", label: "Decline" },
    ],
  }));
}

function trashValueCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-runner-trash-value-${index}`,
    category: "runner_trash_value",
    side: "runner",
    credits: 5,
    frozenLegacyActionId: `decline-trash-${index}`,
    acceptableActionIds: [`trash-${index}`],
    badActionIds: [`decline-trash-${index}`],
    rationale: "Runner kann eine sichtbar wertvolle Access-Karte bezahlen und trashen.",
    actions: [
      {
        actionId: `trash-${index}`,
        type: "trash_accessed_card",
        label: "Trash SanSan City Grid",
        costs: [{ credits: 3 }],
      },
      { actionId: `decline-trash-${index}`, type: "decline_trash", label: "Decline trash" },
    ],
  }));
}

function coverageInstallCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-runner-install-coverage-${index}`,
    category: "runner_install_coverage",
    side: "runner",
    credits: 6,
    frozenLegacyActionId: `run-hq-${index}`,
    acceptableActionIds: [`install-fracter-${index}`],
    badActionIds: [`run-hq-${index}`],
    rationale: "Ein sichtbarer Fracter schließt die sichtbare Barrier-Coverage-Lücke.",
    gripOrHq: [visibleCard(`fracter-${index}`, "program", ["icebreaker", "fracter"])],
    servers: [server("hq", [visibleCard(`barrier-${index}`, "ice", ["barrier"], true)], [])],
    actions: [
      {
        actionId: `install-fracter-${index}`,
        type: "install_card",
        label: "Install Fracter",
        source: `fracter-${index}`,
      },
      { actionId: `run-hq-${index}`, type: "start_run", label: "Run HQ", payload: { serverId: "hq" } },
    ],
  }));
}

function realPunishCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-corp-real-punish-${index}`,
    category: "corp_real_punish",
    side: "corp",
    tags: 1,
    frozenLegacyActionId: `gain-punish-${index}`,
    acceptableActionIds: [`punish-${index}`],
    badActionIds: [`gain-punish-${index}`],
    rationale: "Runner ist getaggt; Corp soll das echte Punish-Fenster nutzen.",
    actions: [
      { actionId: `punish-${index}`, type: "play_operation", label: "Closed Accounts punish tag" },
      { actionId: `gain-punish-${index}`, type: "gain_credit", label: "Gain credit" },
    ],
  }));
}

function stalePunishCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-corp-stale-punish-${index}`,
    category: "corp_abandon_stale_punish",
    side: "corp",
    tags: 0,
    frozenLegacyActionId: `punish-stale-${index}`,
    acceptableActionIds: [`advance-${index}`, `score-${index}`],
    badActionIds: [`punish-stale-${index}`],
    rationale: "Ohne Tag-Fenster ist Punish stale; Scoreline-Fortschritt ist konkret.",
    actions: [
      { actionId: `punish-stale-${index}`, type: "play_operation", label: "Closed Accounts punish tag" },
      { actionId: `advance-${index}`, type: "advance_card", label: "Advance agenda" },
      { actionId: `score-${index}`, type: "score_agenda", label: "Score agenda" },
    ],
  }));
}

function continueRunCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-runner-continue-run-${index}`,
    category: "runner_continue_reachable_run",
    side: "runner",
    frozenLegacyActionId: `jack-out-${index}`,
    acceptableActionIds: [`continue-${index}`],
    badActionIds: [`jack-out-${index}`],
    rationale: "Der Runner steht in einem erreichbaren Run und soll zum Access fortsetzen.",
    run: {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "server", serverId: "rd" },
      successful: true,
    },
    actions: [
      { actionId: `continue-${index}`, type: "continue_run", label: "Continue to access" },
      { actionId: `jack-out-${index}`, type: "jack_out", label: "Jack out" },
    ],
  }));
}

function avoidStaleRunCases(): CaseSpec[] {
  return [1, 2, 3, 4].map((index) => ({
    caseId: `ai222-runner-avoid-stale-run-${index}`,
    category: "runner_avoid_stale_run",
    side: "runner",
    frozenLegacyActionId: `run-rd-stale-${index}`,
    acceptableActionIds: [`install-pressure-${index}`, `draw-${index}`],
    badActionIds: [`run-rd-stale-${index}`],
    rationale: "Ein wiederholter Run ohne frischen Payoff soll zugunsten konkreter Vorbereitung vermieden werden.",
    actions: [
      { actionId: `run-rd-stale-${index}`, type: "start_run", label: "Repeat stale R&D run", payload: { serverId: "rd", knownNoCurrentPayoff: true } },
      { actionId: `install-pressure-${index}`, type: "install_card", label: "Install R&D Interface" },
      { actionId: `draw-${index}`, type: "draw_card", label: "Draw" },
    ],
  }));
}

function server(
  id: "hq" | "rd" | "archives" | `remote_${number}`,
  ice: VisibleCard[],
  root: VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id, ice, root };
}

function visibleCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  subtypes: string[] = [],
  rezzed = true,
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    known: true,
    type,
    subtypes,
    rezzed,
    owner: type === "ice" ? "corp" : "runner",
    controller: type === "ice" ? "corp" : "runner",
  };
}

function emptyCategoryCounts(): Record<PracticalTacticBenchmarkCategory, number> {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0])) as Record<
    PracticalTacticBenchmarkCategory,
    number
  >;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
