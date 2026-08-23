"use client";

import {
  createContext,
  createElement,
  useContext,
  type ImgHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import {
  isGeneratedCardImageId,
  isLocalOnrCardId,
  isLocalizedDeCardImageId,
  LOCAL_CARD_IMAGE_VERSION,
  LOCALIZED_DE_CARD_IMAGE_VERSION,
} from "../../app/card-image-manifest";

type CardImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "loading" | "decoding" | "alt"
> & {
  src: string | undefined;
  alt?: string;
  decorative?: boolean;
  fallbackSrc?: string | undefined;
  onUnavailable?: (event: SyntheticEvent<HTMLImageElement>) => void;
  priority?: boolean;
  variant?: "thumb" | "preview" | "full" | "master";
};

const CardImageCollectionRevisionContext = createContext<number | undefined>(
  undefined,
);

export function CardImageCollectionRevisionProvider({
  children,
  revision,
}: {
  children: ReactNode;
  revision: number | undefined;
}) {
  return createElement(
    CardImageCollectionRevisionContext.Provider,
    { value: revision },
    children,
  );
}

export function localCardImageUrl(
  cardId: string | undefined | null,
  options: { preferGerman?: boolean } = {},
): string | undefined {
  if (!cardId) return undefined;
  const encodedCardId = encodeURIComponent(cardId);
  if (options.preferGerman && isLocalizedDeCardImageId(cardId))
    return `/api/card-images/${encodedCardId}?skin=de&v=${LOCALIZED_DE_CARD_IMAGE_VERSION}`;
  if (isGeneratedCardImageId(cardId))
    return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  if (isLocalOnrCardId(cardId))
    return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  return undefined;
}

export function withCardImageVariant(
  src: string | undefined,
  variant: CardImageProps["variant"],
): string | undefined {
  if (!src || !variant || !src.startsWith("/api/card-images/")) return src;
  const url = new URL(src, "http://netgrid.local");
  url.searchParams.set("variant", variant);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function withCardImageCollectionRevision(
  src: string | undefined,
  revision: number | undefined,
): string | undefined {
  if (
    !src ||
    !Number.isSafeInteger(revision) ||
    revision === undefined ||
    revision < 0 ||
    !src.startsWith("/api/card-images/")
  )
    return src;
  const url = new URL(src, "http://netgrid.local");
  url.searchParams.set("collectionRevision", String(revision));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function CardImage({
  src,
  alt = "",
  decorative = false,
  fallbackSrc,
  onUnavailable,
  priority = false,
  variant = "full",
  onError,
  ...props
}: CardImageProps) {
  const collectionRevision = useContext(CardImageCollectionRevisionContext);
  if (!src) return null;
  const variantSrc = withCardImageCollectionRevision(
    withCardImageVariant(src, variant),
    collectionRevision,
  );
  const variantFallbackSrc = withCardImageCollectionRevision(
    withCardImageVariant(fallbackSrc, variant),
    collectionRevision,
  );
  return createElement("img", {
    ...props,
    src: variantSrc,
    alt: decorative ? "" : alt,
    "aria-hidden": decorative ? "true" : props["aria-hidden"],
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : props.fetchPriority,
    decoding: "async",
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      if (variantFallbackSrc && target.dataset.fallbackApplied !== "true") {
        target.dataset.fallbackApplied = "true";
        target.src = variantFallbackSrc;
      } else {
        onUnavailable?.(event);
      }
      onError?.(event);
    },
  });
}

export { isGeneratedCardImageId };
