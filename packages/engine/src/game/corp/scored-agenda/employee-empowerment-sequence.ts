import type {
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type {
  ScoredAgendaFlowHost,
  ScoredAgendaFlowResult,
} from "./scored-agenda-flow-host";

export function isEmployeeEmpowermentStartDrawChoiceSource(
  source: string,
): boolean {
  return source.startsWith("v1912.employee_empowerment_start_draw");
}

export function startEmployeeEmpowermentStartDrawChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  if (host.state.pendingChoice) return { handled: false };
  const sourceCardId = scoredEmployeeEmpowermentSourceIds(host)[0];
  if (!sourceCardId) return { handled: false };
  host.state.pendingChoice = {
    choiceId: `v1912_employee_empowerment_start_draw_${sourceCardId}_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1912.employee_empowerment_start_draw:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Employee Empowerment: zusätzliche Karte ziehen?",
    kind: "select_option",
    options: [
      {
        id: "draw",
        label: "Zusätzliche Karte ziehen",
        publicLabel: "Zusätzliche Karte gezogen",
        value: "draw",
      },
      {
        id: "skip",
        label: "Überspringen",
        publicLabel: "Übersprungen",
        value: "skip",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  return {
    handled: true,
    stateChanged: true,
    pendingChoice: host.state.pendingChoice,
  };
}

export function resolveEmployeeEmpowermentStartDrawChoice(
  host: ScoredAgendaFlowHost,
): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !isEmployeeEmpowermentStartDrawChoiceSource(choice.source))
    throw new Error("Es ist keine Employee-Empowerment-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Employee Empowerment nutzen.");
  if (
    host.state.phase !== "corp_draw_phase" ||
    host.state.timingPoint !== "corp_draw.mandatory_draw"
  )
    throw new Error(
      "Employee Empowerment ist nur am Start des Korp-Zugs nutzbar.",
    );
  const [, sourceCardId] = choice.source.split(":");
  if (
    !sourceCardId ||
    !host.state.corp.scoreArea.includes(sourceCardId as CardInstanceId) ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      host.constants.employeeEmpowermentId
  )
    throw new Error(
      "Employee Empowerment ist nicht mehr in der Korp-ScoreArea.",
    );

  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  const useDraw = selected === "draw";
  host.flags.markEmployeeEmpowermentResolved(sourceCardId as CardInstanceId);
  delete host.state.pendingChoice;

  const rdBefore = host.state.corp.rd.length;
  if (useDraw) host.draw.drawCorpCard();
  const drawnCount = useDraw ? rdBefore - host.state.corp.rd.length : 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "public",
    sourceDefinitionId: host.constants.employeeEmpowermentId,
    cardDefinitionId: host.constants.employeeEmpowermentId,
    employeeEmpowermentStartDrawDecision: useDraw ? "draw" : "skip",
    ...(useDraw ? { drawnCards: drawnCount, drawnCount } : {}),
  };
  if (useDraw) {
    host.effects.appendEmployeeEmpowermentDrawEffect(
      sourceCardId as CardInstanceId,
      drawnCount,
    );
  }
  if (!host.state.winner) startEmployeeEmpowermentStartDrawChoice(host);
}

function scoredEmployeeEmpowermentSourceIds(
  host: ScoredAgendaFlowHost,
): CardInstanceId[] {
  const resolved = new Set(host.flags.employeeEmpowermentResolvedSourceIds());
  return host.state.corp.scoreArea
    .filter(
      (cardId) =>
        host.cards.definitionFor(cardId).id ===
          host.constants.employeeEmpowermentId && !resolved.has(cardId),
    )
    .sort();
}

function requireLegalAction(host: ScoredAgendaFlowHost): LegalAction {
  if (!host.legalAction) throw new Error("Scored-Agenda LegalAction fehlt.");
  return host.legalAction;
}

function requirePlayerAction(host: ScoredAgendaFlowHost): PlayerAction {
  if (!host.playerAction) throw new Error("Scored-Agenda PlayerAction fehlt.");
  return host.playerAction;
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}
