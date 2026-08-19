"use client";

import { useEffect, useState } from "react";

import { CardImage } from "../cards/card-image-service";
import { CardTextPreview } from "../cards/CardTextPreview";
import type { CardTextPreviewDensity } from "../cards/CardTextPreview";
import {
  HardwareImageOverlay,
  OperationImageOverlay,
  hasGeneratedCardArt,
  isHardwareCardType,
  isOperationCardType,
} from "../cards/CardTextRendering";
import { usePreferredCardImageSource } from "../cards/card-display-settings";

export function DeckCardThumb({
  cardId,
  title,
  cardType,
  rulesText,
  typeLine,
  metricLine,
  textDensity,
  installCost,
  cost,
  large = false,
  preview = false,
  table = false
}: {
  cardId: string;
  title: string;
  cardType?: string;
  rulesText?: string;
  typeLine?: string;
  metricLine?: string;
  textDensity?: CardTextPreviewDensity;
  installCost?: number;
  cost?: number;
  large?: boolean;
  preview?: boolean;
  table?: boolean;
}) {
  const imageSource = usePreferredCardImageSource(cardId);
  const [imageUnavailable, setImageUnavailable] = useState(false);

  useEffect(() => {
    setImageUnavailable(false);
  }, [imageSource.src, imageSource.fallbackSrc]);

  const imageUrl = imageUnavailable ? undefined : imageSource.src;
  const hasGeneratedImage = hasGeneratedCardArt(cardId);
  const showHardwareOverlay = Boolean(imageUrl) && isHardwareCardType(cardType) && hasGeneratedImage;
  const showOperationOverlay = Boolean(imageUrl) && isOperationCardType(cardType) && hasGeneratedImage;
  return (
    <span className={`deckCardThumb ${large ? "large" : ""} ${preview ? "preview" : ""} ${table ? "table" : ""} ${imageUrl ? "hasImage" : ""}`} aria-hidden="true">
      {imageUrl ? (
        <>
          <CardImage
            src={imageUrl}
            fallbackSrc={imageSource.fallbackSrc}
            variant="thumb"
            decorative
            onUnavailable={() => setImageUnavailable(true)}
          />
          {showHardwareOverlay ? (
            <HardwareImageOverlay
              title={title}
              className={preview ? "deckHardwareOverlay preview" : "deckHardwareOverlay"}
              maxLines={preview ? 2 : 1}
              {...(rulesText ? { rulesText } : {})}
              {...(installCost !== undefined ? { installCost } : {})}
            />
          ) : showOperationOverlay ? (
            <OperationImageOverlay
              title={title}
              className={preview ? "deckHardwareOverlay preview" : "deckHardwareOverlay"}
              maxLines={preview ? 2 : 1}
              {...(rulesText ? { rulesText } : {})}
              {...(cost !== undefined ? { cost } : {})}
            />
          ) : null}
        </>
      ) : (
        <CardTextPreview
          title={title}
          density={textDensity ?? (preview ? "preview" : table ? "table" : "thumb")}
          {...(cardType ? { cardType } : {})}
          {...(typeLine ? { typeLine } : {})}
          {...(metricLine ? { metricLine } : {})}
          {...(rulesText ? { rulesText } : {})}
        />
      )}
    </span>
  );
}
