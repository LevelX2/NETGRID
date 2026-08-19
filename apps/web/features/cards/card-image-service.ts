"use client";

import { createElement, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import {
  isGeneratedCardImageId,
  isLocalOnrCardId,
  isLocalizedDeCardImageId,
  LOCAL_CARD_IMAGE_VERSION,
  LOCALIZED_DE_CARD_IMAGE_VERSION,
} from "../../app/card-image-manifest";

type CardImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading" | "decoding" | "alt"> & {
  src: string | undefined;
  alt?: string;
  decorative?: boolean;
  fallbackSrc?: string | undefined;
  priority?: boolean;
  variant?: "thumb" | "preview" | "full" | "master";
};

export function localCardImageUrl(cardId: string | undefined | null, options: { preferGerman?: boolean } = {}): string | undefined {
  if (!cardId) return undefined;
  const encodedCardId = encodeURIComponent(cardId);
  if (options.preferGerman && isLocalizedDeCardImageId(cardId)) return `/api/card-images/${encodedCardId}?skin=de&v=${LOCALIZED_DE_CARD_IMAGE_VERSION}`;
  if (isGeneratedCardImageId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  if (isLocalOnrCardId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  return undefined;
}

export function withCardImageVariant(src: string | undefined, variant: CardImageProps["variant"]): string | undefined {
  if (!src || !variant || !src.startsWith("/api/card-images/")) return src;
  const url = new URL(src, "http://netgrid.local");
  url.searchParams.set("variant", variant);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function CardImage({ src, alt = "", decorative = false, fallbackSrc, priority = false, variant = "full", onError, ...props }: CardImageProps) {
  if (!src) return null;
  const variantSrc = withCardImageVariant(src, variant);
  const variantFallbackSrc = withCardImageVariant(fallbackSrc, variant);
  return createElement("img", {
    ...props,
    src: variantSrc,
    alt: decorative ? "" : alt,
    "aria-hidden": decorative ? "true" : props["aria-hidden"],
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      if (variantFallbackSrc && target.dataset.fallbackApplied !== "true") {
        target.dataset.fallbackApplied = "true";
        target.src = variantFallbackSrc;
      }
      onError?.(event);
    }
  });
}

export { isGeneratedCardImageId };
