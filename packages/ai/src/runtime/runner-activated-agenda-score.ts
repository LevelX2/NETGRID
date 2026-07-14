import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

const BASE_ACTIVATED_AGENDA_SCORE_VALUE = 6000;
const ACTIVATED_AGENDA_POINT_VALUE = 1200;
const ACTIVATED_AGENDA_MATCHPOINT_VALUE = 5000;

/**
 * Values an engine-declared action that immediately scores its visible source
 * as an agenda. The engine effect marker establishes the outcome; the source's
 * public agenda value comes only from the actor's PlayerView.
 */
export function runnerActivatedAgendaScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  if (
    input.side !== "runner" ||
    action.type !== "activated_card_ability" ||
    action.payload?.cardImplementationScoresSourceAsAgenda !== true
  ) {
    return [];
  }
  const source = visibleAgendaSource(input, action);
  const agendaPoints = Math.max(0, Math.floor(source?.agendaPoints ?? 0));
  if (!source || agendaPoints <= 0) return [];

  const components: AiDecisionScoreComponent[] = [
    {
      key: "runner_activated_agenda_score",
      label: "Agenda unmittelbar scoren",
      value:
        BASE_ACTIVATED_AGENDA_SCORE_VALUE +
        agendaPoints * ACTIVATED_AGENDA_POINT_VALUE,
      reason: `agenda_points:${agendaPoints}|source_visible:true|engine_effect:true`,
    },
  ];
  if (
    input.playerView.own.agendaPoints + agendaPoints >=
    input.playerView.agendaPointsToWin
  ) {
    components.push({
      key: "runner_activated_agenda_matchpoint",
      label: "Sofortiger Matchpoint",
      value: ACTIVATED_AGENDA_MATCHPOINT_VALUE,
      reason: `current:${input.playerView.own.agendaPoints}|gain:${agendaPoints}|target:${input.playerView.agendaPointsToWin}`,
    });
  }
  return components;
}

function visibleAgendaSource(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const payloadCardId = action.payload?.cardId;
  const sourceCardId =
    action.source !== "basic_action" && action.source !== "game_rule"
      ? action.source
      : typeof payloadCardId === "string"
        ? payloadCardId
        : undefined;
  if (!sourceCardId) return undefined;
  const source = input.playerView.own.rig?.find(
    (card) => card.instanceId === sourceCardId,
  );
  return source?.known === true && source.type === "agenda"
    ? source
    : undefined;
}
