import {
  publicCardViewForDefinitionId,
  publicCardViews,
  publicPrintingViewForId,
  publicPrintingViews,
  publicSetViewForId,
  publicSetViews,
  cardSpecForDefinitionId,
  editorCardViewForDefinitionId,
  setSpecForId,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import { cardSpecDefinitionById, cardSpecSourceRefs } from "../engine";
import { planningCardViewForDefinitionId } from "../registry";
import { deepFreezeSerializable, type DeepReadonly } from "../serializable";

/** Server-only PublicDTO access; no CardSpec or registry handle is exposed. */
export const getPublicCardView = publicCardViewForDefinitionId.bind(
  undefined,
  CARD_REGISTRY,
);
export const getPublicPrintingView = publicPrintingViewForId.bind(
  undefined,
  CARD_REGISTRY,
);
export const getPublicSetView = publicSetViewForId.bind(
  undefined,
  CARD_REGISTRY,
);
export const listPublicCardViews = (): ReturnType<typeof publicCardViews> =>
  publicCardViews(CARD_REGISTRY);
export const listPublicPrintingViews = (): ReturnType<
  typeof publicPrintingViews
> => publicPrintingViews(CARD_REGISTRY);
export const listPublicSetViews = (): ReturnType<typeof publicSetViews> =>
  publicSetViews(CARD_REGISTRY);

export type ServerCardSpecSupportSummary = DeepReadonly<{
  schemaVersion: "card-spec-support-summary-v1";
  cardDefinitionId: string;
  validationStatus: "valid";
  runtimeProjectionStatus: "playable_mvp" | "catalog_only";
  planningProjectionStatus: "available" | "unavailable";
  releaseEligibilityStatus: "active" | "ineligible";
  catalogBlockReason?: string;
  cardRulesFingerprint: string;
}>;

const CARD_SPEC_SUPPORT_SUMMARIES = deepFreezeSerializable(
  cardSpecSourceRefs().map(({ cardDefinitionId }) => {
    const definition = cardSpecDefinitionById(cardDefinitionId);
    const planning = planningCardViewForDefinitionId(
      CARD_REGISTRY,
      cardDefinitionId,
    );
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, cardDefinitionId);
    const editor = editorCardViewForDefinitionId(
      CARD_REGISTRY,
      cardDefinitionId,
    );
    const hasActiveSet =
      spec?.printings.some(
        (printing) =>
          setSpecForId(CARD_REGISTRY, printing.setId)?.publication.status ===
          "active",
      ) === true;
    if (spec === undefined || editor === undefined) {
      throw new Error(
        `card_spec_support_projection_incomplete: ${cardDefinitionId}`,
      );
    }
    const hasRuntimeProjection =
      definition?.implementationStatus === "playable_mvp";
    if (hasRuntimeProjection !== (planning !== undefined))
      throw new Error(
        `card_spec_support_projection_mismatch: ${cardDefinitionId}`,
      );
    return {
      schemaVersion: "card-spec-support-summary-v1" as const,
      cardDefinitionId,
      validationStatus: "valid" as const,
      runtimeProjectionStatus: hasRuntimeProjection
        ? ("playable_mvp" as const)
        : ("catalog_only" as const),
      planningProjectionStatus: planning
        ? ("available" as const)
        : ("unavailable" as const),
      releaseEligibilityStatus:
        spec.publication.status === "active" && hasActiveSet
          ? ("active" as const)
          : ("ineligible" as const),
      cardRulesFingerprint: editor.fingerprints.cardRulesFingerprint,
      ...(spec.publication.catalogBlockReason === undefined
        ? {}
        : { catalogBlockReason: spec.publication.catalogBlockReason }),
    };
  }),
);
const CARD_SPEC_SUPPORT_SUMMARIES_BY_ID = new Map<
  string,
  (typeof CARD_SPEC_SUPPORT_SUMMARIES)[number]
>(
  CARD_SPEC_SUPPORT_SUMMARIES.map((summary) => [
    summary.cardDefinitionId,
    summary,
  ]),
);

/** Sanitized, registry-bound support evidence; no CardSpec or registry handle. */
export const getCardSpecSupportSummary = (definitionId: string) =>
  CARD_SPEC_SUPPORT_SUMMARIES_BY_ID.get(definitionId);
export const listCardSpecSupportSummaries = () => CARD_SPEC_SUPPORT_SUMMARIES;
