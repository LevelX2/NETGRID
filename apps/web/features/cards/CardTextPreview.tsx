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
  const normalizedType = cardTextPreviewType(cardType);
  const rules = rulesText ?? "";
  const hasSubroutineMarkers = rulesTextLines(rules).some((line) =>
    isSubroutineRuleLine(cardType ?? "", rules, line),
  );

  return (
    <span
      className={`cardTextPreview density-${density} type-${normalizedType}`}
      data-card-text-preview-density={density}
    >
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
  );
}

export function cardTextPreviewType(cardType: string | undefined): string {
  const normalized = (cardType ?? "unknown").trim().toLowerCase();
  return /^[a-z][a-z0-9_-]*$/.test(normalized) ? normalized : "unknown";
}
