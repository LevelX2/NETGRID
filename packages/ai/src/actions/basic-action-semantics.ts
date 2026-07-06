import type { LegalAction } from "@netgrid/shared";
import type {
  ActionGateResult,
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticConfidence,
  ActionSemanticSourceKind,
} from "../action-semantic-candidate";
import { knownNonCreditGainActionSemantics } from "./action-effect-classification";

export type BasicActionSemanticClassification = {
  semanticActionType: string;
  tacticSignals?: readonly string[];
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  confidence: Exclude<ActionSemanticConfidence, "none">;
  projectionIssues?: ActionProjectionIssue[];
};

const BASIC_ACTION_SEMANTICS: Record<
  LegalAction["type"],
  BasicActionSemanticClassification
> = {
  mandatory_draw: {
    semanticActionType: "draw.mandatory",
    tacticSignals: ["draw.mandatory", "setup.draw"],
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  gain_credit: {
    semanticActionType: "economy.gain_credit",
    tacticSignals: ["economy.basic", "economy.recover"],
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  draw_card: {
    semanticActionType: "draw.card",
    tacticSignals: ["draw.basic", "setup.draw"],
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  start_run: {
    semanticActionType: "run.start",
    tacticSignals: ["run.start", "access_attempt"],
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  continue_run: {
    semanticActionType: "run.continue",
    tacticSignals: ["run.continue", "access_attempt"],
    primaryProjectionStatus: "projected",
    confidence: "high",
  },
  jack_out: {
    semanticActionType: "run.jack_out",
    tacticSignals: ["run.abort", "risk_control"],
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
    tacticSignals: ["access.steal", "closeout.agenda_points"],
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
    tacticSignals: ["corp.ice_activation", "corp.protection", "rez.reserve_spend"],
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
    tacticSignals: ["survival.tag_clear", "tag.remove"],
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
    tacticSignals: ["install.card", "setup.install"],
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
    tacticSignals: ["corp.score_progress", "advance.card"],
    primaryProjectionStatus: "partial_projected",
    confidence: "medium",
    projectionIssues: ["target_context_unavailable"],
  },
  score_agenda: {
    semanticActionType: "score.agenda",
    tacticSignals: ["corp.score_closeout", "closeout.agenda_score"],
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
  const actionEffectOverride = knownNonCreditGainActionSemantics(action);
  const classification = actionEffectOverride
    ? {
        semanticActionType: actionEffectOverride.semanticActionType,
        tacticSignals: actionEffectOverride.tacticSignals,
        primaryProjectionStatus: "projected" as const,
        confidence: "high" as const,
      }
    : BASIC_ACTION_SEMANTICS[action.type];
  if (!classification) return candidate;

  const sourceKind = basicSourceKindForAction(action);
  const projectionIssues = classification.projectionIssues ?? [];
  const dynamicSignals = dynamicBasicActionSignals(action);

  return {
    ...candidate,
    sourceKind,
    semanticActionType: classification.semanticActionType,
    confidence: classification.confidence,
    primaryProjectionStatus: classification.primaryProjectionStatus,
    actionTacticSignals: [
      ...candidate.actionTacticSignals,
      ...(classification.tacticSignals ?? []),
      ...dynamicSignals,
    ],
    projectionIssues,
    hardGates: updateBasicActionGates(candidate.hardGates, action, sourceKind),
    evidence: [
      ...candidate.evidence,
      `AI037 basic action semantic: ${classification.semanticActionType}`,
      ...dynamicSignals.map((signal) => `AI037 basic action signal: ${signal}`),
    ],
  };
}

function dynamicBasicActionSignals(action: LegalAction): string[] {
  const signals: string[] = [];
  const serverId = stringPayload(action, "serverId");
  const placement = stringPayload(action, "placement");
  const destination = stringPayload(action, "destination");
  if (
    (action.type === "start_run" || action.type === "continue_run") &&
    serverId !== undefined
  ) {
    signals.push(`run.server:${serverId}`);
    if (serverId === "hq" || serverId === "rd" || serverId === "archives") {
      signals.push("run.target:central");
    } else if (serverId.startsWith("remote_")) {
      signals.push("run.target:remote");
    }
  }
  if (action.type === "install_card") {
    if (placement !== undefined) signals.push(`install.placement:${placement}`);
    if (destination !== undefined) signals.push(`install.destination:${destination}`);
    if (placement === "ice") signals.push("install.ice", "corp.protection");
    if (placement === "remote" || serverId === "new_remote") {
      signals.push("install.remote", "corp.remote_build");
    }
    if (placement === "program" || destination === "install_program") {
      signals.push("install.program", "runner.rig_setup");
    }
    if (placement === "resource") signals.push("install.resource", "runner.setup");
    if (placement === "hardware") signals.push("install.hardware", "runner.setup");
  }
  if (
    (action.type === "rez_ice" ||
      action.type === "advance_card" ||
      action.type === "score_agenda") &&
    serverId !== undefined
  ) {
    signals.push(`corp.server:${serverId}`);
  }
  return [...new Set(signals)];
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function basicSourceKindForAction(
  action: LegalAction,
): ActionSemanticSourceKind {
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
        reason:
          "Basic, game-rule and choice actions do not need card ability binding.",
      };
    }
    return gate;
  });
}
