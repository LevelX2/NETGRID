"use client";

import { createElement, type ImgHTMLAttributes } from "react";
import { isGeneratedCardImageId, isLocalOnrCardId, LOCAL_CARD_IMAGE_VERSION } from "./card-image-manifest";

type CardImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading" | "decoding" | "alt"> & {
  src: string | undefined;
  alt?: string;
  decorative?: boolean;
  priority?: boolean;
};

export function localCardImageUrl(cardId: string | undefined | null): string | undefined {
  if (!cardId) return undefined;
  const encodedCardId = encodeURIComponent(cardId);
  if (isGeneratedCardImageId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  if (isLocalOnrCardId(cardId)) return `/api/card-images/${encodedCardId}?v=${LOCAL_CARD_IMAGE_VERSION}`;
  return undefined;
}

export function CardImage({ src, alt = "", decorative = false, priority = false, ...props }: CardImageProps) {
  if (!src) return null;
  return createElement("img", {
    ...props,
    src,
    alt: decorative ? "" : alt,
    "aria-hidden": decorative ? "true" : props["aria-hidden"],
    loading: priority ? "eager" : "lazy",
    decoding: "async"
  });
}

export { isGeneratedCardImageId };
