import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { classifyCorpScoredAgendaAbility } from "../legacy/legacy-entrypoints";
import {
  classifyTagPunishLegalActionFromOntology,
  type StructuredTagPunishLegalActionAssessment,
} from "../tag-punish-ontology-consumer";
import {
  corpPunishKindFromOntologyPayoff,
} from "../runtime/tag-punish-payoff-mapping";
import type {
  CorpPunishKind,
} from "../runtime/corp-tag-punish-types";

export type CorpTagPunishActionContextDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function createCorpTagPunishActionContext(
  dependencies: CorpTagPunishActionContextDependencies,
): {
  strongestCorpTagSourceOpportunity: (
    input: AiDecisionInput,
  ) => { action: LegalAction; traceTag: boolean } | undefined;
  corpPunishKindForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpPunishKind | undefined;
  isCorpTagSourceAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isCorpTraceTagSourceAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpTagPunishOntologyAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => StructuredTagPunishLegalActionAssessment | undefined;
} {
  function strongestCorpTagSourceOpportunity(
    input: AiDecisionInput,
  ): { action: LegalAction; traceTag: boolean } | undefined {
    if (input.side !== "corp") return undefined;
    const opportunity = input.legalActions.find((action) =>
      isCorpTagSourceAction(input, action),
    );
    if (!opportunity) return undefined;
    return {
      action: opportunity,
      traceTag: isCorpTraceTagSourceAction(input, opportunity),
    };
  }

  function corpPunishKindForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpPunishKind | undefined {
    if (input.side !== "corp") return undefined;
    const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
    if (ontology?.isPunishPayoff)
      return corpPunishKindFromOntologyPayoff(ontology.payoffKind);
    if (action.type === "trash_resource") return "resource_trash_like";
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    if (scoredAgenda?.kind === "scored_agenda_damage_punish")
      return "scored_agenda_damage_like";
    if (scoredAgenda?.kind === "scored_agenda_trace_tag")
      return "scored_agenda_trace_tag_like";
    const roles = dependencies.rolesForAction(input, action);
    if (roles.includes("tag_punishment")) return "unknown";
    return undefined;
  }

  function isCorpTagSourceAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
    if (ontology?.isTagSource) return true;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    if (scoredAgenda?.kind === "scored_agenda_trace_tag") return true;
    const roles = dependencies.rolesForAction(input, action);
    return roles.some(
      (role) =>
        role.includes("tag_source") ||
        role.includes("tag_enabler") ||
        role.includes("trace_tag"),
    );
  }

  function isCorpTraceTagSourceAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
    if (ontology?.isTraceTagSource) return true;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    if (scoredAgenda?.kind === "scored_agenda_trace_tag") return true;
    return dependencies
      .rolesForAction(input, action)
      .some((role) => role.includes("trace"));
  }

  function corpTagPunishOntologyAssessmentForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): StructuredTagPunishLegalActionAssessment | undefined {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return classifyTagPunishLegalActionFromOntology(
      action,
      dependencies.sourceDefinitionIdForAction(input, action),
      {
        runnerTagged: input.playerView.opponent.tags > 0,
        legacyRoles: dependencies.rolesForAction(input, action),
        scoredAgendaKind:
          scoredAgenda?.kind === "scored_agenda_trace_tag"
            ? "trace_tag"
            : scoredAgenda?.kind === "scored_agenda_damage_punish"
              ? "damage_punish"
              : undefined,
      },
    );
  }

  return {
    strongestCorpTagSourceOpportunity,
    corpPunishKindForAction,
    isCorpTagSourceAction,
    isCorpTraceTagSourceAction,
    corpTagPunishOntologyAssessmentForAction,
  };
}
