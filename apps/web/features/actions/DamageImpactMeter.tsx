import { Skull } from "lucide-react";
import { useTranslations } from "use-intl/react";

import type { DamageImpactCue } from "../../app/action-cues";
import { damageImpactMeterUnits } from "./damage-impact-meter";

export function DamageImpactMeter({
  cue,
  ariaLabel,
  compact = false,
}: {
  cue: DamageImpactCue;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const t = useTranslations("Actions.damage");
  const units = damageImpactMeterUnits(cue);

  return (
    <div
      className={`damageImpactMeter${compact ? " is-compact" : ""}`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      data-testid="damage-impact-meter"
    >
      {units.map((unit, index) =>
        unit.kind === "flatline" ? (
          <span
            key={`flatline-${index}`}
            className="damageImpactFlatline"
            title={t("flatlineBoundary")}
          >
            <Skull size={14} aria-hidden="true" />
            <span aria-hidden="true">{t("flatline")}</span>
          </span>
        ) : (
          <span
            key={`${unit.kind}-${index}`}
            className={`damageImpactSegment ${unit.kind}`}
            aria-hidden="true"
          />
        ),
      )}
    </div>
  );
}
