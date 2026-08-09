import {
  publicCardViewForDefinitionId,
  publicCardViews,
  publicPrintingViewForId,
  publicPrintingViews,
  publicSetViewForId,
  publicSetViews,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";

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
