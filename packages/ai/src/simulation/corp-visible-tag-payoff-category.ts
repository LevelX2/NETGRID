import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { StructuredTagPunishLegalActionAssessment } from "../tag-punish-ontology-consumer";
import type {
  CorpPunishKind,
  CorpVisibleTagPayoffCategory,
} from "../runtime/corp-tag-punish-types";
import { rolesMatch } from "../runtime/role-match";
import {
  corpVisibleTagPayoffCategoryFromOntology,
} from "../runtime/tag-punish-payoff-mapping";

export type CorpVisibleTagPayoffCategoryContextDependencies = {
  tagPunishAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => StructuredTagPunishLegalActionAssessment | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function createCorpVisibleTagPayoffCategoryContext(
  dependencies: CorpVisibleTagPayoffCategoryContextDependencies,
): {
  corpVisibleTagPayoffCategoryForAction: (
    input: AiDecisionInput,
    action: LegalAction,
    kind: CorpPunishKind,
  ) => CorpVisibleTagPayoffCategory;
} {
  function corpVisibleTagPayoffCategoryForAction(
    input: AiDecisionInput,
    action: LegalAction,
    kind: CorpPunishKind,
  ): CorpVisibleTagPayoffCategory {
    const ontology = dependencies.tagPunishAssessmentForAction(input, action);
    if (ontology?.payoffKind)
      return corpVisibleTagPayoffCategoryFromOntology(ontology.payoffKind);
    if (
      kind === "scorched_earth_like" ||
      kind === "urban_renewal_like" ||
      kind === "punitive_counterstrike_like" ||
      kind === "scored_agenda_damage_like"
    )
      return "damage";
    if (kind === "closed_accounts_like" || kind === "datapool_like")
      return "economic";
    if (kind === "resource_trash_like" || kind === "power_grid_overload_like")
      return "trash";
    const roles = dependencies.rolesForAction(input, action);
    if (rolesMatch(roles, ["run_lock"])) return "run_lock";
    if (rolesMatch(roles, ["ambush"])) return "ambush";
    return "unknown";
  }

  return { corpVisibleTagPayoffCategoryForAction };
}
