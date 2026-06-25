import { isGeneratedCardImageId } from "./card-image-service";

export function rulesTextLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type OverlayTextDensityClass = "overlayTextDensityLarge" | "overlayTextDensityMedium" | "overlayTextDensityCompact";

function normalizedOverlayLineLength(line: string): number {
  return line.replace(/\s+/g, " ").trim().length;
}

function overlayTextDensityClass(title: string, rulesLines: string[]): OverlayTextDensityClass {
  const lineCount = rulesLines.length;
  const titleLength = title.trim().length;
  const ruleLength = rulesLines.reduce((sum, line) => sum + normalizedOverlayLineLength(line), 0);
  if (lineCount === 0) return titleLength > 24 ? "overlayTextDensityMedium" : "overlayTextDensityLarge";
  if (lineCount === 1) {
    if (ruleLength <= 28 && titleLength <= 24) return "overlayTextDensityLarge";
    if (ruleLength <= 52) return "overlayTextDensityMedium";
    return "overlayTextDensityCompact";
  }
  if (ruleLength <= 64 && titleLength <= 24) return "overlayTextDensityMedium";
  return "overlayTextDensityCompact";
}

function shouldShowSubroutineMarkers(cardType: string, text: string): boolean {
  return cardType.toLowerCase() === "ice" && rulesTextLines(text).length > 1;
}

export function isSubroutineRuleLine(cardType: string, text: string, line: string): boolean {
  return line.includes("[Subroutine]") || shouldShowSubroutineMarkers(cardType, text);
}

export function shouldAddFallbackSubroutineMarker(cardType: string, text: string, line: string): boolean {
  return !line.includes("[Subroutine]") && shouldShowSubroutineMarkers(cardType, text);
}

export function renderRuleTextSegments(line: string, keyPrefix: string) {
  return line.split(/(\[Subroutine\])/g).map((part, index) => (part === "[Subroutine]" ? <SubroutineIcon key={`${keyPrefix}-subroutine-${index}`} /> : part));
}

export function SubroutineIcon() {
  return (
    <span className="subroutineIcon" role="img" aria-label="Subroutine">
      ↩
    </span>
  );
}

export function isHardwareCardType(type: string | undefined | null): boolean {
  return (type ?? "").toLowerCase() === "hardware";
}

export function isOperationCardType(type: string | undefined | null): boolean {
  return (type ?? "").toLowerCase() === "operation";
}

export function hasGeneratedCardArt(cardId: string | undefined | null): boolean {
  return isGeneratedCardImageId(cardId);
}

function CardImageOverlay({
  title,
  kindLabel,
  rulesText,
  cost,
  setBadgeLabel,
  setBadgeTitle,
  variantClassName,
  className,
  maxLines = 2
}: {
  title: string;
  kindLabel: string;
  rulesText?: string;
  cost?: number;
  setBadgeLabel?: string;
  setBadgeTitle?: string;
  variantClassName?: string;
  className?: string;
  maxLines?: number;
}) {
  const overlayRules = rulesText ? rulesTextLines(rulesText).slice(0, Math.max(0, maxLines)) : [];
  const typographyClassName = overlayTextDensityClass(title, overlayRules);
  const overlayClassName = ["hardwareImageOverlay", variantClassName, className, typographyClassName].filter(Boolean).join(" ");
  return (
    <span className={overlayClassName} aria-hidden="true">
      <span className="hardwareImageOverlayTop">
        <span className="hardwareImageOverlayName">{title}</span>
      </span>
      {setBadgeLabel ? (
        <span className="hardwareImageOverlaySetBadge" title={setBadgeTitle}>
          {setBadgeLabel}
        </span>
      ) : null}
      {cost != null ? <span className="hardwareImageOverlayCost">{cost}</span> : null}
      <span className="hardwareImageOverlayFrame">
        <span className="hardwareImageOverlayKind">{kindLabel}</span>
        {overlayRules.length > 0 ? (
          <span className="hardwareImageOverlayRules">
            {overlayRules.map((line, index) => (
              <span key={`${title}-${kindLabel}-overlay-rule-${index}`}>{renderRuleTextSegments(line, `${title}-${kindLabel}-overlay-rule-${index}`)}</span>
            ))}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function HardwareImageOverlay({
  title,
  rulesText,
  installCost,
  setBadgeLabel,
  setBadgeTitle,
  className,
  maxLines = 2
}: {
  title: string;
  rulesText?: string;
  installCost?: number | null | undefined;
  setBadgeLabel?: string;
  setBadgeTitle?: string;
  className?: string;
  maxLines?: number;
}) {
  return (
    <CardImageOverlay
      title={title}
      kindLabel="Hardware"
      maxLines={maxLines}
      {...(rulesText ? { rulesText } : {})}
      {...(installCost != null ? { cost: installCost } : {})}
      {...(setBadgeLabel ? { setBadgeLabel } : {})}
      {...(setBadgeTitle ? { setBadgeTitle } : {})}
      {...(className ? { className } : {})}
    />
  );
}

export function OperationImageOverlay({
  title,
  rulesText,
  cost,
  setBadgeLabel,
  setBadgeTitle,
  className,
  maxLines = 2
}: {
  title: string;
  rulesText?: string;
  cost?: number | null | undefined;
  setBadgeLabel?: string;
  setBadgeTitle?: string;
  className?: string;
  maxLines?: number;
}) {
  return (
    <CardImageOverlay
      title={title}
      kindLabel="Operation"
      variantClassName="operationImageOverlay"
      maxLines={maxLines}
      {...(rulesText ? { rulesText } : {})}
      {...(cost != null ? { cost } : {})}
      {...(setBadgeLabel ? { setBadgeLabel } : {})}
      {...(setBadgeTitle ? { setBadgeTitle } : {})}
      {...(className ? { className } : {})}
    />
  );
}
