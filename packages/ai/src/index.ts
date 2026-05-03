import { applyAction, createGame, getLegalActions, getPlayerView, hashState, replayEvents } from "@netrunner/engine";
import type { AiDecision, AiDecisionInput, AiDifficulty, GameState, LegalAction, PublicGameEvent, Side } from "@netrunner/shared";

type RankedChoice = {
  action: LegalAction | undefined;
  reasonCode: string;
  explanation: string;
  confidence?: number;
};

export type AiSimulationConfig = {
  seed?: string;
  maxActions?: number;
  agendaPointsToWin?: number;
  runnerDifficulty?: AiDifficulty;
  corpDifficulty?: AiDifficulty;
  runnerProfileId?: string;
  corpProfileId?: string;
};

export type AiSimulationSummary = {
  seed: string;
  winner: GameState["winner"] | "action_limit_reached";
  actions: number;
  turns: number;
  finalStateHash: string;
  eventLogLength: number;
  replayOk: boolean;
  replayErrors: string[];
  actionSequence: Array<{
    side: Side;
    stateVersionBefore: number;
    actionType: LegalAction["type"];
    reasonCode: string;
    fallbackUsed: boolean;
    stateHashAfter: string;
  }>;
  errors: string[];
};

const FORBIDDEN_AI_INPUT_FIELDS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState"
];

export function buildAiDecisionInput(
  state: GameState,
  side: Side,
  options: {
    difficulty?: AiDifficulty;
    decisionId?: string;
    actionNumber?: number;
    profileId?: string;
    eventTail?: PublicGameEvent[];
  } = {}
): AiDecisionInput {
  const playerView = getPlayerView(state, side);
  return {
    side,
    playerView,
    eventTail: options.eventTail ?? playerView.publicEvents.slice(-20),
    legalActions: getLegalActions(state, side),
    difficulty: options.difficulty ?? "normal",
    seed: state.seed,
    decisionId: options.decisionId ?? `${state.matchId}:${state.stateVersion}:${side}`,
    actionNumber: options.actionNumber ?? state.stateVersion,
    profileId: options.profileId ?? `${side}-ai-v0.3`
  };
}

export function chooseAiAction(input: AiDecisionInput): AiDecision {
  return input.side === "runner" ? chooseRunnerAction(input) : chooseCorpAction(input);
}

export function chooseCorpAction(input: AiDecisionInput): AiDecision {
  const choices: RankedChoice[] = [
    byType(input, "mandatory_draw", "corp.mandatory_draw", "Die Corp zieht ihre Pflichtkarte."),
    byType(input, "score_agenda", "corp.score_available_agenda", "Eine scorebare Agenda ist legal."),
    byType(input, "rez_ice", "corp.rez_defensive_card", "Eine defensive Karte kann legal gerezzt werden."),
    corpEconomy(input),
    corpInstallAgenda(input),
    byType(input, "advance_card", "corp.advance_scoring_remote", "Eine installierte Agenda kann vorangebracht werden."),
    corpInstallIce(input),
    byType(input, "gain_credit", "corp.economy_basic_credit", "Die Corp baut Credits auf."),
    byType(input, "decline_rez", "corp.decline_rez", "Rez wird in diesem Fenster abgelehnt."),
    byType(input, "draw_card", "corp.draw_card", "Die Corp zieht eine Karte."),
    byType(input, "end_turn", "corp.end_turn", "Keine bessere Corp-Aktion ist sichtbar sinnvoll.")
  ];
  return decisionFromChoices(input, choices);
}

export function chooseRunnerAction(input: AiDecisionInput): AiDecision {
  const choices =
    input.difficulty === "easy"
      ? [
          byType(input, "steal_agenda", "runner.steal_agenda", "Eine aktuell zugreifbare Agenda wird gestohlen."),
          byType(input, "access_card", "runner.access_card", "Der Runner greift die aktuell erreichbare Karte zu."),
          byType(input, "trash_accessed_card", "runner.trash_accessed_card", "Eine zugreifbare trashbare Karte kann entfernt werden."),
          byType(input, "break_subroutine", "runner.break_subroutine", "Eine Subroutine kann legal gebrochen werden."),
          byType(input, "pump_breaker", "runner.pump_breaker", "Ein Breaker kann legal gepumpt werden."),
          byType(input, "continue_run", "runner.continue_run", "Der Run wird fortgesetzt."),
          byType(input, "install_card", "runner.install_breaker", "Eine Runner-Karte kann legal installiert werden."),
          byType(input, "gain_credit", "runner.economy_basic_credit", "Der Runner nimmt einen Credit."),
          byType(input, "play_event", "runner.play_simple_event", "Ein Event kann legal gespielt werden."),
          runnerRun(input),
          byType(input, "draw_card", "runner.draw_card", "Der Runner zieht eine Karte."),
          byType(input, "end_turn", "runner.end_turn", "Keine bessere Runner-Aktion ist sichtbar sinnvoll.")
        ]
      : [
          byType(input, "steal_agenda", "runner.steal_agenda", "Eine aktuell zugreifbare Agenda wird gestohlen."),
          byType(input, "access_card", "runner.access_card", "Der Runner greift die aktuell erreichbare Karte zu."),
          byType(input, "trash_accessed_card", "runner.trash_accessed_card", "Eine zugreifbare trashbare Karte kann entfernt werden."),
          byType(input, "break_subroutine", "runner.break_subroutine", "Eine Subroutine kann legal gebrochen werden."),
          byType(input, "pump_breaker", "runner.pump_breaker", "Ein Breaker kann legal gepumpt werden."),
          byType(input, "continue_run", "runner.continue_run", "Der Run wird fortgesetzt."),
          byType(input, "play_event", "runner.play_simple_event", "Ein Event kann legal gespielt werden."),
          byType(input, "install_card", "runner.install_breaker", "Eine Runner-Karte kann legal installiert werden."),
          runnerRun(input),
          byType(input, "gain_credit", "runner.economy_basic_credit", "Der Runner nimmt einen Credit."),
          byType(input, "draw_card", "runner.draw_card", "Der Runner zieht eine Karte."),
          byType(input, "end_turn", "runner.end_turn", "Keine bessere Runner-Aktion ist sichtbar sinnvoll.")
        ];
  return decisionFromChoices(input, choices);
}

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  if (FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle))) return false;
  if (input.side === "runner") {
    return !serialized.includes("corp_simple_agenda") && !serialized.includes("corp_simple_barrier_ice");
  }
  return !serialized.includes("runner_simple_fracter") && !serialized.includes("runner_simple_decoder") && !serialized.includes("runner_simple_killer");
}

export function simulateAiGame(config: AiSimulationConfig = {}): AiSimulationSummary {
  const seed = config.seed ?? "ai-vs-ai-smoke";
  let state = createGame({
    seed,
    agendaPointsToWin: config.agendaPointsToWin ?? 6,
    controllers: {
      runner: {
        controllerId: "runner-ai",
        side: "runner",
        type: "ai",
        displayName: "Runner KI",
        difficulty: config.runnerDifficulty ?? "normal",
        profileId: config.runnerProfileId ?? "runner-ai-v0.3"
      },
      corp: {
        controllerId: "corp-ai",
        side: "corp",
        type: "ai",
        displayName: "Corp KI",
        difficulty: config.corpDifficulty ?? "normal",
        profileId: config.corpProfileId ?? "corp-ai-v0.3"
      }
    }
  });
  const initial = structuredClone(state);
  const actionSequence: AiSimulationSummary["actionSequence"] = [];
  const errors: string[] = [];
  const maxActions = config.maxActions ?? 120;

  for (let index = 0; index < maxActions && !state.winner; index += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: side === "runner" ? config.runnerDifficulty ?? "normal" : config.corpDifficulty ?? "normal",
      actionNumber: index,
      decisionId: `${seed}:${index}:${side}`,
      profileId: side === "runner" ? config.runnerProfileId ?? "runner-ai-v0.3" : config.corpProfileId ?? "corp-ai-v0.3"
    });
    const decision = chooseAiAction(input);
    const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId);
    if (!action) {
      errors.push(`No legal action for ${side} at ${state.stateVersion}.`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: `ai-sim-${index}`
    });
    if (!result.ok) {
      errors.push(`${result.error.code} at stateVersion ${state.stateVersion}.`);
      break;
    }
    actionSequence.push({
      side,
      stateVersionBefore: result.event.stateVersionBefore,
      actionType: action.type,
      reasonCode: decision.reasonCode,
      fallbackUsed: decision.fallbackUsed,
      stateHashAfter: result.stateHash
    });
    state = result.state;
  }

  const replay = replayEvents(initial, state.eventLog);
  return {
    seed,
    winner: state.winner ?? "action_limit_reached",
    actions: actionSequence.length,
    turns: state.eventLog.filter((event) => event.type === "end_turn").length,
    finalStateHash: hashState(state),
    eventLogLength: state.eventLog.length,
    replayOk: replay.ok,
    replayErrors: replay.errors,
    actionSequence,
    errors
  };
}

function decisionFromChoices(input: AiDecisionInput, choices: RankedChoice[]): AiDecision {
  const consideredActionIds = input.legalActions.map((action) => action.actionId).sort();
  for (const choice of choices) {
    if (choice.action) {
      return {
        actionId: choice.action.actionId,
        reasonCode: choice.reasonCode,
        explanation: choice.explanation,
        consideredActionIds,
        fallbackUsed: false,
        ...(choice.confidence !== undefined ? { confidence: choice.confidence } : {}),
        reason: choice.reasonCode
      };
    }
  }
  const fallback = input.legalActions.slice().sort(compareAction)[0];
  if (!fallback) {
    return {
      actionId: "",
      reasonCode: "fallback.no_legal_action",
      explanation: "Es ist keine legale Aktion verfügbar.",
      consideredActionIds,
      fallbackUsed: true,
      confidence: 0,
      reason: "fallback.no_legal_action"
    };
  }
  return {
    actionId: fallback.actionId,
    reasonCode: "fallback.first_legal_action",
    explanation: "Die erste stabile LegalAction wird als Fallback gewählt.",
    consideredActionIds,
    fallbackUsed: true,
    confidence: 0.2,
    reason: "fallback.first_legal_action"
  };
}

function byType(input: AiDecisionInput, type: LegalAction["type"], reasonCode: string, explanation: string): RankedChoice {
  return { action: input.legalActions.filter((action) => action.type === type).sort(compareAction)[0], reasonCode, explanation, confidence: 0.7 };
}

function corpEconomy(input: AiDecisionInput): RankedChoice {
  const operation = input.legalActions
    .filter((action) => action.type === "play_operation")
    .sort((left, right) => {
      const leftTag = String(left.source).includes("tag_punishment") ? 0 : 1;
      const rightTag = String(right.source).includes("tag_punishment") ? 0 : 1;
      return leftTag - rightTag || compareAction(left, right);
    })[0];
  return {
    action: operation,
    reasonCode: operation && String(operation.source).includes("tag_punishment") ? "corp.tag_punishment" : "corp.play_economy_operation",
    explanation: "Eine legale Operation verbessert die Corp-Position.",
    confidence: 0.75
  };
}

function corpInstallAgenda(input: AiDecisionInput): RankedChoice {
  const action = input.legalActions
    .filter((candidate) => candidate.type === "install_card" && candidate.payload?.placement === "root")
    .sort((left, right) => {
      const leftNew = left.payload?.serverId === "new_remote" ? 0 : 1;
      const rightNew = right.payload?.serverId === "new_remote" ? 0 : 1;
      return leftNew - rightNew || compareAction(left, right);
    })[0];
  return {
    action,
    reasonCode: "corp.install_scoring_remote",
    explanation: "Eine Karte kann in einem Remote installiert werden.",
    confidence: 0.65
  };
}

function corpInstallIce(input: AiDecisionInput): RankedChoice {
  const action = input.legalActions
    .filter((candidate) => candidate.type === "install_card" && candidate.payload?.placement === "ice")
    .sort((left, right) => {
      const leftRd = left.payload?.serverId === "rd" ? 0 : 1;
      const rightRd = right.payload?.serverId === "rd" ? 0 : 1;
      return leftRd - rightRd || compareAction(left, right);
    })[0];
  return {
    action,
    reasonCode: "corp.install_defensive_ice",
    explanation: "Eine legale ICE-Installation schützt einen Server.",
    confidence: 0.6
  };
}

function runnerRun(input: AiDecisionInput): RankedChoice {
  const action = input.legalActions
    .filter((candidate) => candidate.type === "start_run")
    .sort((left, right) => {
      const leftRemote = String(left.payload?.serverId ?? "").startsWith("remote_") ? 0 : 1;
      const rightRemote = String(right.payload?.serverId ?? "").startsWith("remote_") ? 0 : 1;
      const leftRd = left.payload?.serverId === "rd" ? 0 : 1;
      const rightRd = right.payload?.serverId === "rd" ? 0 : 1;
      return leftRemote - rightRemote || leftRd - rightRd || compareAction(left, right);
    })[0];
  return {
    action,
    reasonCode: "runner.run_pressure",
    explanation: "Ein Run ist legal und erzeugt Druck auf die Corp.",
    confidence: 0.6
  };
}

function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
