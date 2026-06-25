"use client";

import { CardImage } from "../cards/card-image-service";
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
  installCost?: number;
  cost?: number;
  large?: boolean;
  preview?: boolean;
  table?: boolean;
}) {
  const imageSource = usePreferredCardImageSource(cardId);
  const imageUrl = imageSource.src;
  const hasGeneratedImage = hasGeneratedCardArt(cardId);
  const showHardwareOverlay = Boolean(imageUrl) && isHardwareCardType(cardType) && hasGeneratedImage;
  const showOperationOverlay = Boolean(imageUrl) && isOperationCardType(cardType) && hasGeneratedImage;
  return (
    <span className={`deckCardThumb ${large ? "large" : ""} ${preview ? "preview" : ""} ${table ? "table" : ""} ${imageUrl ? "hasImage" : ""}`} aria-hidden="true">
      {imageUrl ? (
        <>
          <CardImage src={imageUrl} fallbackSrc={imageSource.fallbackSrc} decorative />
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
        <span className="deckCardThumbFallback">{title.slice(0, 1)}</span>
      )}
    </span>
  );
}
