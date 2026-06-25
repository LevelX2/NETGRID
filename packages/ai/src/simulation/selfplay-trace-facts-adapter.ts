import {
  sanitizeAiDecisionDebug,
  type AiDecision,
  type AiDecisionActionAlternative,
} from "@netgrid/shared";
import type { AiSimulationConfig } from "./ai-simulation-config";
import {
  selfplayTraceFactsForSimulationDecision as selfplayTraceFactsForSimulationDecisionRuntime,
} from "./selfplay-trace-facts";
import { safeSelfplayFacts } from "./selfplay-trace-mining";

export function selfplayTraceFactsForSimulationDecision(
  decision: AiDecision,
  config: AiSimulationConfig,
): {
  planKind?: string;
  debugFacts?: string[];
  actionAlternatives?: AiDecisionActionAlternative[];
} {
  return selfplayTraceFactsForSimulationDecisionRuntime(
    decision,
    config.includeActionAlternativesForFindings,
    {
      sanitizeAiDecisionDebug,
      safeSelfplayFacts,
    },
  );
}
