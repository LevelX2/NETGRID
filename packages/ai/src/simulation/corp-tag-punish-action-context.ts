import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { classifyCorpScoredAgendaAbility } from "../legacy/legacy-planner-entrypoints";
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
import {
  CLOSED_ACCOUNTS_LIKE_PUNISH_IDS,
  CORP_TAG_SOURCE_IDS,
  CORP_TRACE_TAG_SOURCE_IDS,
  DATAPOOL_LIKE_PUNISH_IDS,
  POWER_GRID_OVERLOAD_LIKE_PUNISH_IDS,
  PUNITIVE_COUNTERSTRIKE_LIKE_PUNISH_IDS,
  SCORCHED_EARTH_LIKE_PUNISH_IDS,
  URBAN_RENEWAL_LIKE_PUNISH_IDS,
} from "./tag-punish-card-sets";

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
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (SCORCHED_EARTH_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "scorched_earth_like";
    if (URBAN_RENEWAL_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "urban_renewal_like";
    if (PUNITIVE_COUNTERSTRIKE_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "punitive_counterstrike_like";
    if (CLOSED_ACCOUNTS_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "closed_accounts_like";
    if (POWER_GRID_OVERLOAD_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "power_grid_overload_like";
    if (DATAPOOL_LIKE_PUNISH_IDS.has(sourceDefinitionId))
      return "datapool_like";
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
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (CORP_TAG_SOURCE_IDS.has(sourceDefinitionId)) return true;
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
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (CORP_TRACE_TAG_SOURCE_IDS.has(sourceDefinitionId)) return true;
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
