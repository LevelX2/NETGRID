import {
  cardSpecForDefinitionId,
  editorCardViewForDefinitionId,
  editorCardViews,
  registryEditorSummary,
  printingSpecForId,
  setSpecForId,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";

export { CARD_REGISTRY };
export type { EditorCardView, RegistryEditorSummary } from "../projections";
export type { CardSpec, SetSpec } from "../contracts";
export {
  assertCardSpecContract,
  assertSetSpecContract,
  finalizeCardSpec,
  finalizeSetSpec,
} from "../card-spec-validation";

export const editorCardByDefinitionId = editorCardViewForDefinitionId.bind(
  undefined,
  CARD_REGISTRY,
);
export const authoredCardSpecByDefinitionId = cardSpecForDefinitionId.bind(
  undefined,
  CARD_REGISTRY,
);
export const authoredSetSpecById = setSpecForId.bind(undefined, CARD_REGISTRY);
export const authoredPrintingSpecById = printingSpecForId.bind(
  undefined,
  CARD_REGISTRY,
);
export const editorRegistrySummary = (): ReturnType<
  typeof registryEditorSummary
> => registryEditorSummary(CARD_REGISTRY);
export const editorCards = (): ReturnType<typeof editorCardViews> =>
  editorCardViews(CARD_REGISTRY);
