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
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";

export function isScoredAgendaStartDrawChoiceSource(
  source: string,
): boolean {
  return source.startsWith("scored_agenda.start_draw_choice");
}

export function startScoredAgendaStartDrawChoice(
  host: ScoredAgendaFlowHost,
): ScoredAgendaFlowResult {
  if (host.state.pendingChoice) return { handled: false };
  const sourceCardId = scoredAgendaStartDrawSourceIds(host)[0];
  if (!sourceCardId) return { handled: false };
  host.state.pendingChoice = {
    choiceId: `scored_agenda_start_draw_choice_${sourceCardId}_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `scored_agenda.start_draw_choice:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Scored Agenda: zusätzliche Karte ziehen?",
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

export function resolveScoredAgendaStartDrawChoice(
  host: ScoredAgendaFlowHost,
): void {
  const legalAction = requireLegalAction(host);
  const playerAction = requirePlayerAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !isScoredAgendaStartDrawChoiceSource(choice.source))
    throw new Error("Es ist keine scored Agenda-Start-Draw-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf die scored Agenda-Start-Draw-Choice nutzen.");
  if (
    host.state.phase !== "corp_draw_phase" ||
    host.state.timingPoint !== "corp_draw.mandatory_draw"
  )
    throw new Error(
      "Die scored Agenda-Start-Draw-Choice ist nur am Start des Korp-Zugs nutzbar.",
    );
  const [, sourceCardId] = choice.source.split(":");
  const sourceDefinition = sourceCardId
    ? host.cards.definitionFor(sourceCardId as CardInstanceId)
    : undefined;
  const scoredAgenda = sourceDefinition
    ? host.cards.scoredAgendaForDefinition(sourceDefinition)
    : undefined;
  if (
    !sourceCardId ||
    !sourceDefinition ||
    !host.state.corp.scoreArea.includes(sourceCardId as CardInstanceId) ||
    scoredAgenda?.kind !== "corp_start_turn_optional_draw"
  )
    throw new Error(
      "Die Start-Draw-Agenda ist nicht mehr in der Korp-ScoreArea.",
    );

  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  const useDraw = selected === "draw";
  host.flags.markScoredAgendaStartDrawChoiceResolved(sourceCardId as CardInstanceId);
  delete host.state.pendingChoice;

  const rdBefore = host.state.corp.rd.length;
  if (useDraw) host.draw.drawCorpCard();
  const drawnCount = useDraw ? rdBefore - host.state.corp.rd.length : 0;
  applySequencePayloadPatch(legalAction, {
    choiceVisibility: "public",
    sourceDefinitionId: sourceDefinition.id,
    cardDefinitionId: sourceDefinition.id,
    scoredAgendaStartDrawDecision: useDraw ? "draw" : "skip",
    ...(useDraw ? { drawnCards: drawnCount, drawnCount } : {}),
  });
  if (useDraw) {
    host.effects.appendScoredAgendaStartDrawChoiceEffect(
      sourceCardId as CardInstanceId,
      sourceDefinition.id,
      drawnCount,
    );
  }
  if (!host.state.winner) startScoredAgendaStartDrawChoice(host);
}

function scoredAgendaStartDrawSourceIds(
  host: ScoredAgendaFlowHost,
): CardInstanceId[] {
  const resolved = new Set(host.flags.scoredAgendaStartDrawChoiceResolvedSourceIds());
  return host.state.corp.scoreArea
    .filter(
      (cardId) => {
        const definition = host.cards.definitionFor(cardId);
        return (
          host.cards.scoredAgendaForDefinition(definition)?.kind ===
            "corp_start_turn_optional_draw" && !resolved.has(cardId)
        );
      },
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
