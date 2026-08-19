import {
  SubroutineIcon,
  isSubroutineRuleLine,
  renderRuleTextSegments,
  rulesTextLines,
  shouldAddFallbackSubroutineMarker,
} from "./CardTextRendering";

export type CardTextPreviewDensity = "thumb" | "table" | "preview";

export function CardTextPreview({
  title,
  cardType,
  typeLine,
  metricLine,
  rulesText,
  density,
}: {
  title: string;
  cardType?: string;
  typeLine?: string;
  metricLine?: string;
  rulesText?: string;
  density: CardTextPreviewDensity;
}) {
  const previewRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const scaleRef = useRef(1);
  const [textScale, setTextScale] = useState(1);
  const normalizedType = cardTextPreviewType(cardType);
  const rules = rulesText ?? "";
  const hasSubroutineMarkers = rulesTextLines(rules).some((line) =>
    isSubroutineRuleLine(cardType ?? "", rules, line),
  );

  useEffect(() => {
    const preview = previewRef.current;
    const content = contentRef.current;
    if (!preview || !content) return;

    let cancelled = false;
    let animationFrame: number | null = null;
    scaleRef.current = 1;
    setTextScale(1);

    const fitText = () => {
      if (cancelled || preview.clientHeight === 0 || content.scrollHeight === 0) return;
      const availableHeight = preview.clientHeight - 2;
      const requiredHeight = content.scrollHeight;
      if (requiredHeight <= availableHeight + 1) return;
      const nextScale = Math.max(
        density === "thumb" ? 0.5 : 0.42,
        Math.min(1, scaleRef.current * (availableHeight / requiredHeight) * 0.97),
      );
      if (Math.abs(nextScale - scaleRef.current) < 0.01) return;
      scaleRef.current = nextScale;
      setTextScale(nextScale);
      animationFrame = requestAnimationFrame(fitText);
    };
    const scheduleFit = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(fitText);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleFit);
    observer?.observe(preview);
    scheduleFit();

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [density, metricLine, rules, title, typeLine]);

  return (
    <span
      ref={previewRef}
      className={`cardTextPreview density-${density} type-${normalizedType}`}
      data-card-text-preview-density={density}
      style={{ "--card-text-preview-scale": textScale } as CSSProperties}
    >
      <span className="cardTextPreviewContent" ref={contentRef}>
        <strong className="cardTextPreviewTitle">{title}</strong>
        {typeLine ? <span className="cardTextPreviewType">{typeLine}</span> : null}
        {metricLine ? <span className="cardTextPreviewMetrics">{metricLine}</span> : null}
        {rules ? (
          <span className="cardTextPreviewRules">
            {rulesTextLines(rules).map((line, index) => (
              <span
                key={`${title}-text-preview-rules-${index}`}
                className={hasSubroutineMarkers ? "subroutineLine" : undefined}
              >
                {shouldAddFallbackSubroutineMarker(cardType ?? "", rules, line) ? (
                  <SubroutineIcon />
                ) : null}
                {renderRuleTextSegments(
                  line,
                  `${title}-text-preview-rules-${index}`,
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className="cardTextPreviewRules loading">Kartentext wird geladen.</span>
        )}
      </span>
    </span>
  );
}

export function cardTextPreviewType(cardType: string | undefined): string {
  const normalized = (cardType ?? "unknown").trim().toLowerCase();
  return /^[a-z][a-z0-9_-]*$/.test(normalized) ? normalized : "unknown";
}
"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
