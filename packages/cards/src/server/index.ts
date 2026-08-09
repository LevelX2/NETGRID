import {
  publicCardViewForDefinitionId,
  publicCardViews,
  publicPrintingViewForId,
  publicPrintingViews,
  publicSetViewForId,
  publicSetViews,
  cardSpecForDefinitionId,
  setSpecForId,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import { cs06CardDefinitionById, cs06CardImplementationById } from "../engine";
import { CS06_CARD_DEFINITION_IDS } from "../cs06-slice";
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
  runtimeProjectionStatus: "playable_mvp";
  planningProjectionStatus: "available";
  releaseEligibilityStatus: "active" | "ineligible";
  cardRulesFingerprint: string;
}>;

const CARD_SPEC_SUPPORT_SUMMARIES = deepFreezeSerializable(
  CS06_CARD_DEFINITION_IDS.map((cardDefinitionId) => {
    const definition = cs06CardDefinitionById(cardDefinitionId);
    const implementation = cs06CardImplementationById(cardDefinitionId);
    const planning = planningCardViewForDefinitionId(
      CARD_REGISTRY,
      cardDefinitionId,
    );
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, cardDefinitionId);
    const hasActiveSet =
      spec?.printings.some(
        (printing) =>
          setSpecForId(CARD_REGISTRY, printing.setId)?.publication.status ===
          "active",
      ) === true;
    if (
      definition?.implementationStatus !== "playable_mvp" ||
      implementation === undefined ||
      planning === undefined ||
      spec === undefined
    ) {
      throw new Error(
        `card_spec_support_projection_incomplete: ${cardDefinitionId}`,
      );
    }
    return {
      schemaVersion: "card-spec-support-summary-v1" as const,
      cardDefinitionId,
      validationStatus: "valid" as const,
      runtimeProjectionStatus: "playable_mvp" as const,
      planningProjectionStatus: "available" as const,
      releaseEligibilityStatus:
        spec.publication.status === "active" && hasActiveSet
          ? ("active" as const)
          : ("ineligible" as const),
      cardRulesFingerprint: planning.cardRulesFingerprint,
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
