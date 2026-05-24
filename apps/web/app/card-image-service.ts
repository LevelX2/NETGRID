"use client";

import { createElement, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { isGeneratedCardImageId, isLocalOnrCardId, isLocalizedDeCardImageId, LOCAL_CARD_IMAGE_VERSION, LOCALIZED_DE_CARD_IMAGE_VERSION } from "./card-image-manifest";

type CardImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading" | "decoding" | "alt"> & {
  src: string | undefined;
  alt?: string;
  decorative?: boolean;
  fallbackSrc?: string | undefined;
  priority?: boolean;
};

export function localCardImageUrl(cardId: string | undefined | null, options: { preferGerman?: boolean } = {}): string | undefined {
  if (!cardId) return undefined;
  const encodedCardId = encodeURIComponent(cardId);
  if (options.preferGerman && isLocalizedDeCardImageId(cardId)) return `/api/card-images/${encodedCardId}?skin=de&v=${LOCALIZED_DE_CARD_IMAGE_VERSION}`;
  if (isGeneratedCardImageId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  if (isLocalOnrCardId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  return undefined;
}

export function CardImage({ src, alt = "", decorative = false, fallbackSrc, priority = false, onError, ...props }: CardImageProps) {
  if (!src) return null;
  return createElement("img", {
    ...props,
    src,
    alt: decorative ? "" : alt,
    "aria-hidden": decorative ? "true" : props["aria-hidden"],
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      if (fallbackSrc && target.dataset.fallbackApplied !== "true") {
        target.dataset.fallbackApplied = "true";
        target.src = fallbackSrc;
      }
      onError?.(event);
    }
  });
}

export { isGeneratedCardImageId };
