import type { StructuredTagPunishLegalActionAssessment } from "../tag-punish-ontology-consumer";
import { sortedUnique } from "../runtime/collection";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function applyTagPunishOntologyDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  assessment: StructuredTagPunishLegalActionAssessment | undefined,
): void {
  if (!assessment) return;
  diagnostics.corpTagPunishOntologyProfilesSeen = true;
  if (assessment.profile.tagSource)
    diagnostics.corpTagSourceOntologyProfilesSeen = true;
  if (assessment.profile.payoff)
    diagnostics.corpTagPunishPayoffOntologyProfilesSeen = true;
  if (assessment.isTagSource) diagnostics.corpTagSourceOntologyUsed = true;
  if (assessment.isPunishPayoff)
    diagnostics.corpTagPunishPayoffOntologyUsed = true;
  if (assessment.conflictWithLegacy)
    diagnostics.corpTagPunishOntologyConflict = true;
  if (assessment.isTagSource)
    diagnostics.corpTagSourceLegalActionClassifiedByOntology = true;
  if (assessment.isPunishPayoff)
    diagnostics.corpPunishLegalActionClassifiedByOntology = true;
  diagnostics.corpTagPunishOntologyKinds = sortedUnique([
    ...(diagnostics.corpTagPunishOntologyKinds ?? []),
    ...assessment.profile.effectKinds,
    ...(assessment.payoffKind === "scored_agenda_damage_like"
      ? ["scored_agenda_damage_like"]
      : []),
    ...(assessment.payoffKind === "scored_agenda_trace_tag_like"
      ? ["scored_agenda_trace_tag_like"]
      : []),
  ]);
  diagnostics.corpTagPunishConditionKinds = sortedUnique([
    ...(diagnostics.corpTagPunishConditionKinds ?? []),
    ...assessment.profile.conditionKinds,
  ]);
}
