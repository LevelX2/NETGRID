import {
  createRunnerAiDiagnosticsComposition,
  type RunnerAiDiagnosticsCompositionDependencies,
} from "../simulation/runner-ai-diagnostics-composition";
import {
  createAiFacadeFoundationContext,
  type AiFacadeFoundationContextDependencies,
} from "./ai-facade-foundation-context";

export type AiContextDiagnosticsCompositionDependencies =
  AiFacadeFoundationContextDependencies &
    Omit<
      RunnerAiDiagnosticsCompositionDependencies,
      | "rolesForAction"
      | "rolesForCardId"
      | "sourceDefinitionIdForSimulationAction"
      | "definitionForSimulationAction"
    >;

export function createAiContextDiagnosticsComposition(
  dependencies: AiContextDiagnosticsCompositionDependencies,
) {
  const foundation = createAiFacadeFoundationContext(dependencies);

  const diagnostics = createRunnerAiDiagnosticsComposition({
    ...dependencies,
    rolesForAction: foundation.rolesForAction,
    rolesForCardId: foundation.rolesForCardId,
    sourceDefinitionIdForSimulationAction:
      foundation.sourceDefinitionIdForSimulationAction,
    definitionForSimulationAction: foundation.definitionForSimulationAction,
  });

  return {
    ...foundation,
    ...diagnostics,
  };
}
