import { applyAction, createGame, createGameAfterSetup, getLegalActions, getPlayerView, hashState, replayEvents } from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction, PlayerAction, PlayerView, Side } from "@netgrid/shared";

export type TutorialMode = "tutorial_local";
export const TUTORIAL_MODE: TutorialMode = "tutorial_local";

export type TutorialStep = {
  stepId: string;
  expectedTimingPoint: string;
  legalActionRefs: string[];
  hintRefs: string[];
  successCondition: string;
};

export type TutorialScenario = {
  scenarioId: string;
  title: string;
  rulesBaseline: string;
  allowedMechanics: string[];
  deckSnapshotRefs: string[];
  steps: TutorialStep[];
};

type TutorialScenarioDefinition = TutorialScenario & {
  learnerSide: Side;
  build(seed: string): { initial: GameState; state: GameState };
};

export type TutorialHint = {
  stepId: string;
  text: string;
  legalActionIds: string[];
  legalActionTypes: string[];
};

export type TutorialReplayCheck = {
  ok: boolean;
  finalStateHash: string;
  replayFinalStateHash: string;
  errors: string[];
};

export type TutorialSession = {
  mode: TutorialMode;
  scenario: TutorialScenario;
  learnerSide: Side;
  state: GameState;
  playerView: PlayerView;
  legalActions: LegalAction[];
  stepIndex: number;
  hint: TutorialHint;
  replayCheck: TutorialReplayCheck;
};

export type TutorialAiSparringSuggestion = {
  side: Side;
  actionId: string;
  label: string;
  explanation: string;
};

export type TutorialGlossaryEntry = {
  term: string;
  definition: string;
};

const RUNNER_TUTORIAL_DECK: DeckDefinition = {
  id: "tutorial_runner_v160",
  name: "Tutorial Runner Deck V1.6.0",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_run_event", quantity: 5 },
    { id: "simple_fracter", quantity: 5 },
    { id: "simple_economy_event", quantity: 5 }
  ]
};

const CORP_TUTORIAL_ICE_DECK: DeckDefinition = {
  id: "tutorial_corp_ice_v160",
  name: "Tutorial Corp ICE Deck V1.6.0",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_barrier_ice", quantity: 6 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 3 }
  ]
};

const CORP_TUTORIAL_AGENDA_DECK: DeckDefinition = {
  id: "tutorial_corp_agenda_v160",
  name: "Tutorial Corp Agenda Deck V1.6.0",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 8 },
    { id: "simple_priority_agenda", quantity: 4 }
  ]
};

const CORP_TUTORIAL_SCORE_DECK: DeckDefinition = {
  id: "tutorial_corp_score_v160",
  name: "Tutorial Corp Score Deck V1.6.0",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_priority_agenda", quantity: 8 },
    { id: "simple_economy_operation", quantity: 4 }
  ]
};

const CORP_TUTORIAL_DAMAGE_DECK: DeckDefinition = {
  id: "tutorial_corp_damage_v160",
  name: "Tutorial Corp Damage Deck V1.6.0",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "v094_neural_sentry_ice", quantity: 6 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 3 }
  ]
};

const TUTORIAL_GLOSSARY: TutorialGlossaryEntry[] = [
  { term: "Korp", definition: "Die verteidigende Seite, die Server aufbaut und Agenden erzielt." },
  { term: "Runner", definition: "Die angreifende Seite, die Runs startet und Agenden stiehlt." },
  { term: "Klick", definition: "Aktionspunkt pro Zug, mit dem Du legale Aktionen ausführst." },
  { term: "Credit", definition: "Ressource zum Bezahlen von Aktionen, Rezzing und Fähigkeiten." },
  { term: "HQ", definition: "Hand der Korp." },
  { term: "R&D", definition: "Nachziehstapel der Korp." },
  { term: "Archive", definition: "Ablagebereich der Korp." },
  { term: "Fort", definition: "Von der Korp erstellter Remote-Server für Assets, Upgrades oder Agenden." },
  { term: "Run", definition: "Angriff des Runners auf einen Server." },
  { term: "Begegnung", definition: "Phase im Run gegen ICE inklusive Rezzen und Subroutinen." },
  { term: "Zugriff", definition: "Access auf Karten nach erfolgreichem Run." },
  { term: "Agenda", definition: "Siegpunktkarte für Korp (Scoring) oder Runner (Steal)." },
  { term: "Tag", definition: "Runner-Marker, der bestimmte Korp-Maßnahmen erlaubt." },
  { term: "Schaden", definition: "Kartenschaden gegen den Runner; bei leerer Hand droht Flatline." },
  { term: "LegalAction", definition: "Von der Engine freigegebene, regelkonforme Aktion." }
];

const HINT_LIBRARY: Record<string, string> = {
  keep_or_mulligan: "Wähle nur die aktuell angebotene Setup-Entscheidung aus den LegalActions.",
  clicks_credits_draw: "Nutze Klicks für Credits oder Kartenziehen nur über aktuelle LegalActions.",
  run_basics: "Ein Run startet immer über eine legale Start-Run-Aktion auf einen sichtbaren Server.",
  encounter_breaker: "Im Encounter-Fenster bleiben nur die aktuell legalen Rez/Continue/Breaker-Aktionen gültig.",
  access_basics: "Beim Zugriff sind nur die aktuell legalen Access-/Steal-/Trash-Optionen erlaubt.",
  score_basics: "Eine Agenda kann nur gescort werden, wenn `score_agenda` als LegalAction vorliegt.",
  steal_game_end: "Wenn `steal_agenda` legal ist, kann der Steal direkt den Spielausgang bestimmen.",
  damage_flatline: "Damage-/Flatline-Erklärungen bleiben beschreibend und nutzen nur aktuelle LegalActions."
};

const TUTORIAL_SCENARIO_DEFINITIONS: TutorialScenarioDefinition[] = [
  {
    scenarioId: "v160_setup_mulligan",
    title: "Setup und Mulligan",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.setup.mulligan"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "setup_keep_or_mulligan",
        expectedTimingPoint: "setup.mulligan.runner",
        legalActionRefs: ["resolve_choice"],
        hintRefs: ["keep_or_mulligan"],
        successCondition: "Runner beantwortet die Setup-Entscheidung über LegalActions."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGame({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_ICE_DECK });
      return { initial, state: initial };
    }
  },
  {
    scenarioId: "v160_clicks_credits_draw",
    title: "Klicks, Credits und Draw",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.turn_structure.basic_actions"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "credits_and_draw_actions",
        expectedTimingPoint: "corp_action",
        legalActionRefs: ["gain_credit", "draw_card"],
        hintRefs: ["clicks_credits_draw"],
        successCondition: "Es werden nur legale Basisaktionen genutzt."
      }
    ],
    learnerSide: "corp",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_ICE_DECK });
      const state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_run_basics",
    title: "Run auf zentralen Server",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.run.start"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "start_run",
        expectedTimingPoint: "runner_action",
        legalActionRefs: ["start_run"],
        hintRefs: ["run_basics"],
        successCondition: "Ein Run wird über eine legale Start-Run-Aktion gestartet."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_ICE_DECK });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_encounter_breaker",
    title: "Encounter und Breaker",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.run.encounter", "mechanic.breaker.pump_and_break", "mechanic.ice.rez"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "encounter_decision",
        expectedTimingPoint: "run.encounter",
        legalActionRefs: ["continue_run", "pump_breaker", "break_subroutine"],
        hintRefs: ["encounter_breaker"],
        successCondition: "Im Encounter werden nur aktuell legale Optionen genutzt."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_ICE_DECK });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "install_card", serverId: "rd" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      state = applyScriptAction(state, { side: "runner", actionType: "install_card", labelIncludes: "Fracter" });
      state = applyScriptAction(state, { side: "runner", actionType: "start_run", serverId: "rd" });
      state = applyIfAvailable(state, { side: "corp", actionType: "rez_ice" });
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_access_basics",
    title: "Access und Agenda Steal",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.run.access", "mechanic.agenda.steal"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "access_decision",
        expectedTimingPoint: "run.access",
        legalActionRefs: ["access_card", "steal_agenda", "decline_trash"],
        hintRefs: ["access_basics"],
        successCondition: "Access-Entscheidungen erfolgen über die aktuellen LegalActions."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_AGENDA_DECK });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      state = applyScriptAction(state, { side: "runner", actionType: "start_run", serverId: "rd" });
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_score_basics",
    title: "Korp Score",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.agenda.score"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "score_agenda",
        expectedTimingPoint: "corp_action",
        legalActionRefs: ["score_agenda"],
        hintRefs: ["score_basics"],
        successCondition: "Korp scored nur über `score_agenda` als LegalAction."
      }
    ],
    learnerSide: "corp",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_SCORE_DECK });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "install_card", serverId: "new_remote" });
      state = applyScriptAction(state, { side: "corp", actionType: "advance_card" });
      state = applyScriptAction(state, { side: "corp", actionType: "advance_card" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      state = applyScriptAction(state, { side: "runner", actionType: "gain_credit" });
      state = applyScriptAction(state, { side: "runner", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "runner");
      state = applyScriptAction(state, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "advance_card" });
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_game_end_basics",
    title: "Game-End-Grundlagen",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.agenda.steal", "mechanic.game_end.agenda_points"],
    deckSnapshotRefs: ["demo_runner_008_snapshot_v0_8", "demo_corp_008_snapshot_v0_8"],
    steps: [
      {
        stepId: "steal_for_win",
        expectedTimingPoint: "run.access",
        legalActionRefs: ["steal_agenda", "access_card"],
        hintRefs: ["steal_game_end"],
        successCondition: "Ein legaler Steal kann den Siegpunkt-Gate auslösen."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGameAfterSetup({
        seed,
        agendaPointsToWin: 1,
        runnerDeck: RUNNER_TUTORIAL_DECK,
        corpDeck: CORP_TUTORIAL_AGENDA_DECK
      });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      state = applyScriptAction(state, { side: "runner", actionType: "start_run", serverId: "rd" });
      return { initial, state };
    }
  },
  {
    scenarioId: "v160_damage_flatline",
    title: "Damage und Flatline",
    rulesBaseline: "0.94.0",
    allowedMechanics: ["mechanic.damage.net", "mechanic.game_end.flatline"],
    deckSnapshotRefs: ["demo_runner_094", "demo_corp_094"],
    steps: [
      {
        stepId: "damage_window",
        expectedTimingPoint: "run.encounter",
        legalActionRefs: ["continue_run", "jack_out"],
        hintRefs: ["damage_flatline"],
        successCondition: "Damage/Flatline wird nur mit bestehenden Mechaniken erklärt."
      }
    ],
    learnerSide: "runner",
    build(seed) {
      const initial = createGameAfterSetup({ seed, runnerDeck: RUNNER_TUTORIAL_DECK, corpDeck: CORP_TUTORIAL_DAMAGE_DECK });
      let state = applyScriptAction(initial, { side: "corp", actionType: "mandatory_draw" });
      state = applyScriptAction(state, { side: "corp", actionType: "install_card", serverId: "rd" });
      state = applyScriptAction(state, { side: "corp", actionType: "end_turn" });
      state = resolvePendingDiscardChoice(state, "corp");
      state = applyScriptAction(state, { side: "runner", actionType: "start_run", serverId: "rd" });
      state = applyIfAvailable(state, { side: "corp", actionType: "rez_ice", labelIncludes: "Neural Sentry" });
      return { initial, state };
    }
  }
];

export function listTutorialScenarios(): TutorialScenario[] {
  return TUTORIAL_SCENARIO_DEFINITIONS.map((entry) => ({
    scenarioId: entry.scenarioId,
    title: entry.title,
    rulesBaseline: entry.rulesBaseline,
    allowedMechanics: [...entry.allowedMechanics],
    deckSnapshotRefs: [...entry.deckSnapshotRefs],
    steps: entry.steps.map((step) => ({ ...step, legalActionRefs: [...step.legalActionRefs], hintRefs: [...step.hintRefs] }))
  }));
}

export function getTutorialGlossary(): TutorialGlossaryEntry[] {
  return TUTORIAL_GLOSSARY.map((entry) => ({ ...entry }));
}

export function createTutorialSession(scenarioId: string, seed: string = `tutorial:${scenarioId}`): TutorialSession {
  const definition = TUTORIAL_SCENARIO_DEFINITIONS.find((entry) => entry.scenarioId === scenarioId);
  if (!definition) throw new Error(`Tutorial-Szenario nicht gefunden: ${scenarioId}`);
  const built = definition.build(seed);
  const scenario = toPublicScenario(definition);
  return sessionForState({
    scenario,
    learnerSide: definition.learnerSide,
    state: built.state,
    stepIndex: 0,
    initialReplayState: built.initial
  });
}

export function applyTutorialAction(session: TutorialSession, actionId: string): TutorialSession {
  const action = session.legalActions.find((candidate) => candidate.actionId === actionId);
  if (!action) throw new Error("Die Aktion ist in diesem Tutorialschritt nicht legal.");
  const selectedChoices = choicePayloadFor(session.state, action);
  const result = applyAction(session.state, {
    matchId: session.state.matchId,
    side: session.learnerSide,
    actionId: action.actionId,
    clientKnownStateVersion: session.state.stateVersion,
    idempotencyKey: `tutorial:${session.scenario.scenarioId}:${session.state.stateVersion}:${action.actionId}`,
    ...(selectedChoices ? { selectedChoices } : {})
  });
  if (!result.ok) throw new Error(result.error.message);
  const currentStep = session.scenario.steps[session.stepIndex];
  const stepAdvanced = currentStep ? currentStep.legalActionRefs.includes(action.type) : false;
  const nextStep = stepAdvanced ? Math.min(session.stepIndex + 1, Math.max(0, session.scenario.steps.length - 1)) : session.stepIndex;
  return sessionForState({
    scenario: session.scenario,
    learnerSide: session.learnerSide,
    state: result.state,
    stepIndex: nextStep,
    initialReplayState: replayInitialStateForScenario(session.scenario.scenarioId)
  });
}

export function tutorialAiSparringSuggestion(session: TutorialSession, side: Side = session.state.activeSide): TutorialAiSparringSuggestion | undefined {
  const legalActions = getLegalActions(session.state, side);
  if (legalActions.length === 0) return undefined;
  const selected = pickTutorialSparringAction(legalActions, side);
  if (!selected) return undefined;
  return {
    side,
    actionId: selected.actionId,
    label: selected.label,
    explanation: "Sparring nutzt eine lokale LegalAction-Heuristik ohne Hidden-Info-Vorteil."
  };
}

function pickTutorialSparringAction(legalActions: LegalAction[], side: Side): LegalAction | undefined {
  return legalActions
    .slice()
    .sort((left, right) => tutorialActionPriority(right, side) - tutorialActionPriority(left, side) || left.actionId.localeCompare(right.actionId))[0];
}

function tutorialActionPriority(action: LegalAction, side: Side): number {
  switch (action.type) {
    case "resolve_choice":
      return 1000;
    case "mandatory_draw":
      return 980;
    case "score_agenda":
      return side === "corp" ? 960 : 160;
    case "steal_agenda":
      return side === "runner" ? 960 : 160;
    case "break_subroutine":
      return 940;
    case "pump_breaker":
      return 930;
    case "rez_ice":
      return side === "corp" ? 910 : 170;
    case "trash_accessed_card":
      return side === "runner" ? 900 : 180;
    case "continue_run":
      return 880;
    case "start_run":
      return side === "runner" ? 860 : 160;
    case "advance_card":
      return side === "corp" ? 840 : 150;
    case "install_card":
      return 820;
    case "play_event":
    case "play_operation":
      return 790;
    case "gain_credit":
      return 730;
    case "draw_card":
      return 720;
    case "end_turn":
      return 40;
    default:
      return 200;
  }
}

function toPublicScenario(definition: TutorialScenarioDefinition): TutorialScenario {
  return {
    scenarioId: definition.scenarioId,
    title: definition.title,
    rulesBaseline: definition.rulesBaseline,
    allowedMechanics: [...definition.allowedMechanics],
    deckSnapshotRefs: [...definition.deckSnapshotRefs],
    steps: definition.steps.map((step) => ({ ...step, legalActionRefs: [...step.legalActionRefs], hintRefs: [...step.hintRefs] }))
  };
}

function replayInitialStateForScenario(scenarioId: string): GameState {
  const definition = TUTORIAL_SCENARIO_DEFINITIONS.find((entry) => entry.scenarioId === scenarioId);
  if (!definition) throw new Error(`Tutorial-Szenario nicht gefunden: ${scenarioId}`);
  return definition.build(`tutorial:${scenarioId}`).initial;
}

function sessionForState(input: {
  scenario: TutorialScenario;
  learnerSide: Side;
  state: GameState;
  stepIndex: number;
  initialReplayState: GameState;
}): TutorialSession {
  const playerView = getPlayerView(input.state, input.learnerSide);
  const legalActions = getLegalActions(input.state, input.learnerSide);
  const step =
    input.scenario.steps[input.stepIndex] ??
    input.scenario.steps[input.scenario.steps.length - 1] ?? {
      stepId: "fallback_step",
      expectedTimingPoint: input.state.timingPoint,
      legalActionRefs: [],
      hintRefs: [],
      successCondition: "Fallback-Schritt"
    };
  const hint = buildHint(step, legalActions);
  const replay = replayEvents(input.initialReplayState, input.state.eventLog);
  const replayCheck: TutorialReplayCheck = {
    ok: replay.ok && replay.actualFinalStateHash === hashState(input.state),
    finalStateHash: hashState(input.state),
    replayFinalStateHash: replay.actualFinalStateHash,
    errors: replay.errors
  };
  return {
    mode: TUTORIAL_MODE,
    scenario: input.scenario,
    learnerSide: input.learnerSide,
    state: input.state,
    playerView,
    legalActions,
    stepIndex: input.stepIndex,
    hint,
    replayCheck
  };
}

function buildHint(step: TutorialStep, legalActions: LegalAction[]): TutorialHint {
  const preferred = legalActions.filter((action) => step.legalActionRefs.includes(action.type));
  const usable = preferred.length > 0 ? preferred : legalActions.slice(0, Math.min(2, legalActions.length));
  const text = step.hintRefs.map((ref) => HINT_LIBRARY[ref]).filter((value): value is string => Boolean(value)).join(" ");
  return {
    stepId: step.stepId,
    text: text || "Nutze die aktuell sichtbaren LegalActions; die Rules Engine bleibt Regelautorität.",
    legalActionIds: usable.map((action) => action.actionId),
    legalActionTypes: usable.map((action) => action.type)
  };
}

function choicePayloadFor(state: GameState, action: LegalAction): PlayerAction["selectedChoices"] | undefined {
  if (action.type !== "resolve_choice" || !state.pendingChoice) return undefined;
  const optionId = state.pendingChoice.options[0]?.id;
  if (!optionId) return undefined;
  return {
    choiceId: state.pendingChoice.choiceId,
    selectedOptionIds: [optionId]
  };
}

type ScriptAction = {
  side: Side;
  actionType: string;
  serverId?: string;
  labelIncludes?: string;
};

function applyScriptAction(state: GameState, instruction: ScriptAction): GameState {
  const legalActions = getLegalActions(state, instruction.side);
  const selected = legalActions.find((action) => {
    if (action.type !== instruction.actionType) return false;
    if (instruction.serverId && action.payload?.serverId !== instruction.serverId) return false;
    if (instruction.labelIncludes && !action.label.includes(instruction.labelIncludes)) return false;
    return true;
  });
  if (!selected) throw new Error(`Tutorial script action not found: ${instruction.side} ${instruction.actionType}`);
  const selectedChoices = choicePayloadFor(state, selected);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: instruction.side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `tutorial-script:${instruction.side}:${instruction.actionType}:${state.stateVersion}`,
    ...(selectedChoices ? { selectedChoices } : {})
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyIfAvailable(state: GameState, instruction: ScriptAction): GameState {
  const legalActions = getLegalActions(state, instruction.side);
  const selected = legalActions.find((action) => {
    if (action.type !== instruction.actionType) return false;
    if (instruction.serverId && action.payload?.serverId !== instruction.serverId) return false;
    if (instruction.labelIncludes && !action.label.includes(instruction.labelIncludes)) return false;
    return true;
  });
  if (!selected) return state;
  return applyScriptAction(state, instruction);
}

function resolvePendingDiscardChoice(state: GameState, side: Side): GameState {
  if (!state.pendingChoice || state.pendingChoice.side !== side || state.pendingChoice.source !== "discard_phase") return state;
  const legalActions = getLegalActions(state, side);
  const resolve = legalActions.find((action) => action.type === "resolve_choice");
  if (!resolve) return state;
  const optionId = state.pendingChoice.options[0]?.id;
  if (!optionId) return state;
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: resolve.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `tutorial-discard:${side}:${state.stateVersion}`,
    selectedChoices: {
      choiceId: state.pendingChoice.choiceId,
      selectedOptionIds: [optionId]
    }
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
