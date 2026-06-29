import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDecisionDebug,
} from "@netgrid/shared";
import {
  buildSemanticRuntimeWhyCoverageReport,
  type SemanticRuntimeWhyCoverageReport,
} from "../diagnostics/semantic-runtime-why-coverage";
import type { AiSimulationSummary } from "./ai-simulation-summary";

const TOP_LEVEL_WHY_NOT_PREFIX = "topLevelWhyNot:";
const RUNTIME_WHY_NOT_SECTION_PREFIX = "runtime_why_not:";

export function buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries(
  summaries: readonly AiSimulationSummary[],
): SemanticRuntimeWhyCoverageReport {
  return buildSemanticRuntimeWhyCoverageReport(
    summaries.flatMap((summary) =>
      summary.actionSequence.map((entry): AiDecisionDebug => {
        const debugFacts = entry.debugFacts ?? [];
        const runtimeWhyNotItems = debugFacts
          .filter((fact) => fact.startsWith(RUNTIME_WHY_NOT_SECTION_PREFIX))
          .map((fact) => fact.slice(RUNTIME_WHY_NOT_SECTION_PREFIX.length));
        return {
          schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
          aiLevel: 2,
          selectedActionType: entry.actionType,
          ...(entry.planKind ? { planKind: entry.planKind } : {}),
          ...(entry.actionAlternatives
            ? { actionAlternatives: entry.actionAlternatives }
            : {}),
          whyNot: debugFacts
            .filter((fact) => fact.startsWith(TOP_LEVEL_WHY_NOT_PREFIX))
            .map((fact) => fact.slice(TOP_LEVEL_WHY_NOT_PREFIX.length)),
          ...(runtimeWhyNotItems.length > 0
            ? {
                detailSections: [
                  {
                    id: "runtime_why_not",
                    title: "Runtime Why Not",
                    items: runtimeWhyNotItems,
                  },
                ],
              }
            : {}),
        };
      }),
    ),
  );
}
