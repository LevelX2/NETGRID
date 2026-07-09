import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

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
import { rolesMatch } from "../runtime/role-match";

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
    const roles = dependencies.rolesForAction(input, action);
    if (rolesMatch(roles, ["tag_punishment"])) return "unknown";
    return undefined;
  }

  function isCorpTagSourceAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
    if (ontology?.isTagSource) return true;
    const roles = dependencies.rolesForAction(input, action);
    return rolesMatch(roles, ["tag_source", "tag_enabler", "trace_tag"]);
  }

  function isCorpTraceTagSourceAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const ontology = corpTagPunishOntologyAssessmentForAction(input, action);
    if (ontology?.isTraceTagSource) return true;
    return rolesMatch(dependencies.rolesForAction(input, action), ["trace"]);
  }

  function corpTagPunishOntologyAssessmentForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): StructuredTagPunishLegalActionAssessment | undefined {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    return classifyTagPunishLegalActionFromOntology(
      action,
      dependencies.sourceDefinitionIdForAction(input, action),
      {
        runnerTagged: input.playerView.opponent.tags > 0,
        legacyRoles: dependencies.rolesForAction(input, action),
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
