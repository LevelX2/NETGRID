import type { LegalAction } from "@netgrid/shared";
import type {
  ActionGateResult,
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticConfidence,
  ActionSemanticSourceKind,
} from "../action-semantic-candidate";

type BasicActionSemanticClassification = {
  semanticActionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  confidence: Exclude<ActionSemanticConfidence, "none">;
  projectionIssues?: ActionProjectionIssue[];
};

const BASIC_ACTION_SEMANTICS: Partial<
  Record<LegalAction["type"], BasicActionSemanticClassification>
> = {
  mandatory_draw: {
    semanticActionType: "draw.mandatory",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  gain_credit: {
    semanticActionType: "economy.gain_credit",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  draw_card: {
    semanticActionType: "draw.card",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  start_run: {
    semanticActionType: "run.start",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  continue_run: {
    semanticActionType: "run.continue",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  jack_out: {
    semanticActionType: "run.jack_out",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  access_card: {
    semanticActionType: "access.resolve_card",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  steal_agenda: {
    semanticActionType: "access.steal_agenda",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  trash_accessed_card: {
    semanticActionType: "access.trash_accessed_card",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  trash_resource: {
    semanticActionType: "tag.trash_runner_resource",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  decline_trash: {
    semanticActionType: "access.decline_trash",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  rez_ice: {
    semanticActionType: "corp_window.rez",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  decline_rez: {
    semanticActionType: "corp_window.decline_rez",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  end_turn: {
    semanticActionType: "turn_flow.end_turn",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  forgo_action: {
    semanticActionType: "turn_flow.forgo_action",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  remove_tag: {
    semanticActionType: "tag.remove",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  purge_virus_counters: {
    semanticActionType: "counter.purge_virus",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  purge_runner_virus_counters: {
    semanticActionType: "counter.purge_runner_virus",
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  resolve_choice: {
    semanticActionType: "choice.resolve",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  install_card: {
    semanticActionType: "install.card",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["target_context_unavailable"],
  },
  play_event: {
    semanticActionType: "play.runner_event",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
  },
  play_operation: {
    semanticActionType: "play.corp_operation",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
  },
  advance_card: {
    semanticActionType: "score.advance_card",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  score_agenda: {
    semanticActionType: "score.agenda",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  pump_breaker: {
    semanticActionType: "breaker.boost_strength",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["ability_unresolved", "target_context_unavailable"],
  },
  break_subroutine: {
    semanticActionType: "breaker.break_subroutine",
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["ability_unresolved", "target_context_unavailable"],
  },
  activated_card_ability: {
    semanticActionType: "card_ability.unknown",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["ability_unresolved"],
  },
  trigger_ability: {
    semanticActionType: "card_ability.trigger",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
    projectionIssues: ["ability_unresolved"],
  },
  move_to_set_aside: {
    semanticActionType: "special_zone.move_to_set_aside",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  move_to_removed_from_game: {
    semanticActionType: "special_zone.move_to_removed_from_game",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  return_from_set_aside: {
    semanticActionType: "special_zone.return_from_set_aside",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
  change_card_control: {
    semanticActionType: "special_zone.change_card_control",
    primaryProjectionStatus: "partial_projected",
    confidence: "low",
  },
};

export function applyBasicActionSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const classification = BASIC_ACTION_SEMANTICS[action.type];
  if (!classification) return candidate;

  const sourceKind = basicSourceKindForAction(action);
  const projectionIssues = classification.projectionIssues ?? [];

  return {
    ...candidate,
    sourceKind,
    semanticActionType: classification.semanticActionType,
    confidence: classification.confidence,
    primaryProjectionStatus: classification.primaryProjectionStatus,
    projectionIssues,
    hardGates: updateBasicActionGates(candidate.hardGates, action, sourceKind),
    evidence: [
      ...candidate.evidence,
      `AI037 basic action semantic: ${classification.semanticActionType}`,
    ],
  };
}

function basicSourceKindForAction(action: LegalAction): ActionSemanticSourceKind {
  if (action.type === "resolve_choice") return "choice";
  if (action.source === "basic_action") return "basic_action";
  if (action.source === "game_rule") return "game_rule";
  return "unknown";
}

function updateBasicActionGates(
  hardGates: ActionGateResult[],
  action: LegalAction,
  sourceKind: ActionSemanticSourceKind,
): ActionGateResult[] {
  const sourceResolved = sourceKind !== "unknown";
  const abilityNotApplicable =
    sourceKind === "basic_action" ||
    sourceKind === "game_rule" ||
    sourceKind === "choice";

  return hardGates.map((gate) => {
    if (gate.gateId === "source_resolution") {
      return {
        ...gate,
        status: sourceResolved ? "pass" : "unknown",
        severity: sourceResolved ? "info" : "warning",
        reason: sourceResolved
          ? `Source kind resolved from LegalAction.source for ${action.type}.`
          : "Card source binding remains deferred to AI038.",
      };
    }
    if (gate.gateId === "ability_resolution" && abilityNotApplicable) {
      return {
        ...gate,
        status: "not_applicable",
        severity: "info",
        reason: "Basic, game-rule and choice actions do not need card ability binding.",
      };
    }
    return gate;
  });
}
