import {
  createCorpTagSourcePayoffContext,
  type CorpTagSourcePayoffContextDependencies,
} from "../runtime/corp-tag-source-payoff-context";
import {
  createTagPunishWindowDiagnosticsContext,
  type TagPunishWindowDiagnosticsContextDependencies,
} from "./tag-punish-window-diagnostics-context";

export type CorpTagPunishWindowCompositionDependencies =
  CorpTagSourcePayoffContextDependencies &
    Omit<
      TagPunishWindowDiagnosticsContextDependencies,
      "corpOntologyPayoffAvailableForTagSource"
    >;

export function createCorpTagPunishWindowComposition(
  dependencies: CorpTagPunishWindowCompositionDependencies,
) {
  const { corpOntologyPayoffAvailableForTagSource } =
    createCorpTagSourcePayoffContext(dependencies);
  return createTagPunishWindowDiagnosticsContext({
    ...dependencies,
    corpOntologyPayoffAvailableForTagSource,
  });
}
