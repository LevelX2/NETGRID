import { Check } from "lucide-react";
import { useTranslations } from "use-intl/react";

import type { DamageImpactCue } from "../../app/action-cues";
import { interactionAmbienceClassName } from "../../app/action-board-ui";
import { WindowEventIcon } from "./WindowEventIcon";

export function DamageImpactOverlay({
  cue,
  queued,
  onDismiss
}: {
  cue: DamageImpactCue | null;
  queued: number;
  onDismiss(): void;
}) {
  const t = useTranslations("Actions.damage");
  if (!cue) return null;
  const preventedDamage = cue.amount === 0 && !cue.flatline;
  const survivableDamage = cue.runnerGripBefore;
  const overkillDamage = cue.flatline && survivableDamage !== undefined ? Math.max(0, cue.amount - survivableDamage) : 0;
  const meterUnits = damageImpactMeterUnits(cue);
  const damageType = t(`type.${cue.damageType}`);
  const title = preventedDamage ? t("preventedTitle", {type: damageType}) : cue.flatline ? t("flatline") : t("impactTitle", {type: damageType});
  const gripLabel = cue.runnerGripBefore !== undefined && cue.runnerGripAfter !== undefined
    ? t("gripTransition", {before: damageImpactGripValue(cue.runnerGripBefore, cue.runnerMaxHandSizeAfter), after: damageImpactGripValue(cue.runnerGripAfter, cue.runnerMaxHandSizeAfter)})
    : cue.runnerGripAfter !== undefined
      ? t("gripNow", {value: damageImpactGripValue(cue.runnerGripAfter, cue.runnerMaxHandSizeAfter)})
      : t("gripPool");
  const summary = preventedDamage
    ? t("preventedSummary", {type: damageType, source: cue.sourceLabel})
    : cue.flatline && cue.runnerGripBefore !== undefined
    ? overkillDamage > 0
      ? t("flatlineOverkillSummary", {amount: cue.amount, type: damageType, source: cue.sourceLabel, overkill: overkillDamage})
      : t("flatlineSummary", {amount: cue.amount, type: damageType, source: cue.sourceLabel})
    : t("damageSummary", {amount: cue.amount, type: damageType, source: cue.sourceLabel});
  const thresholdLabel = !preventedDamage && cue.runnerGripBefore !== undefined
    ? cue.flatline
      ? t("zeroAfter", {amount: cue.runnerGripBefore})
      : t("survives", {amount: cue.runnerGripBefore})
    : null;
  const overkillLabel = overkillDamage > 0 ? t("overkill", {amount: overkillDamage}) : null;
  const coreDetail = cue.damageType === "core"
    ? [
        cue.coreDamageAfter !== undefined ? t("coreDamageValue", {value: cue.coreDamageAfter}) : t("type.core"),
        cue.runnerMaxHandSizeAfter !== undefined ? t("handLimit", {value: cue.runnerMaxHandSizeAfter}) : null
      ].filter(Boolean).join(" · ")
    : null;

  return (
    <aside className={`damageImpactOverlay ${interactionAmbienceClassName("damage")} damage-${cue.damageType} ${cue.flatline ? "is-flatline" : ""} ${preventedDamage ? "is-prevented" : ""}`} aria-live="assertive" data-testid="damage-impact">
      <div className="damageImpactHeader">
        <div>
          <strong>{title}</strong>
          <span>{summary}</span>
        </div>
        <WindowEventIcon kind={`${cue.damageType}-damage`} side="runner" />
      </div>
      {!preventedDamage ? (
        <div className="damageImpactMeter" aria-label={gripLabel}>
          {meterUnits.map((unit, index) =>
            unit.kind === "zero" ? (
              <span key={`zero-${index}`} className="damageImpactZero" aria-label={t("zeroLine")}>
                0
              </span>
            ) : (
              <span key={index} className={`damageImpactSegment ${unit.kind}`} aria-hidden="true" />
            )
          )
          }
        </div>
      ) : null}
      <div className="damageImpactStats">
        {preventedDamage && cue.runnerGripBefore === undefined && cue.runnerGripAfter === undefined ? null : <span>{gripLabel}</span>}
        <span>{preventedDamage ? `0 ${damageType}` : t("damageAmount", {amount: cue.amount})}</span>
        {preventedDamage ? <span>{t("prevented")}</span> : null}
        {thresholdLabel ? <span>{thresholdLabel}</span> : null}
        {overkillLabel ? <span>{overkillLabel}</span> : null}
        {coreDetail ? <span>{coreDetail}</span> : null}
      </div>
      <div className="damageImpactFooter">
        {queued > 0 ? <small>{t("queued", {count: queued})}</small> : <span aria-hidden="true" />}
        <button className="button damageImpactDismiss" onClick={onDismiss} aria-label={t("confirmWindow")} title={t("confirmWindow")} type="button">
          <Check size={14} />
          {t("continue")}
        </button>
      </div>
    </aside>
  );
}

type DamageImpactMeterUnit = {
  kind: "remaining" | "lost" | "overkill" | "unknown" | "zero";
};

function damageImpactMeterUnits(cue: DamageImpactCue): DamageImpactMeterUnit[] {
  const gripBefore = cue.runnerGripBefore;
  if (gripBefore === undefined) {
    const fallbackCount = Math.max(1, Math.min(12, cue.amount));
    return Array.from({ length: fallbackCount }, () => ({ kind: "unknown" }));
  }
  const gripAfter = cue.runnerGripAfter ?? Math.max(0, gripBefore - cue.amount);
  const lost = Math.max(0, Math.min(gripBefore, gripBefore - gripAfter));
  const remaining = Math.max(0, gripBefore - lost);
  const overkill = cue.flatline ? Math.max(0, cue.amount - gripBefore) : 0;
  const counts = damageImpactVisualCounts({ remaining, lost, overkill });
  const units: DamageImpactMeterUnit[] = [
    ...Array.from({ length: counts.remaining }, () => ({ kind: "remaining" as const })),
    ...Array.from({ length: counts.lost }, () => ({ kind: "lost" as const })),
    { kind: "zero" },
    ...Array.from({ length: counts.overkill }, () => ({ kind: "overkill" as const })),
  ];
  return units.length > 1 ? units : [{ kind: "zero" }];
}

function damageImpactVisualCounts(counts: { remaining: number; lost: number; overkill: number }): { remaining: number; lost: number; overkill: number } {
  const maxSegments = 12;
  const total = counts.remaining + counts.lost + counts.overkill;
  if (total <= maxSegments) return counts;
  const entries = (["remaining", "lost", "overkill"] as const).map((key) => ({
    key,
    value: counts[key],
    visual: counts[key] > 0 ? Math.max(1, Math.round((counts[key] / total) * maxSegments)) : 0
  }));
  while (entries.reduce((sum, entry) => sum + entry.visual, 0) > maxSegments) {
    const target = entries.filter((entry) => entry.visual > 1).sort((left, right) => right.visual - left.visual)[0];
    if (!target) break;
    target.visual -= 1;
  }
  while (entries.reduce((sum, entry) => sum + entry.visual, 0) < maxSegments) {
    const target = entries.filter((entry) => entry.value > 0).sort((left, right) => right.value - left.value)[0];
    if (!target) break;
    target.visual += 1;
  }
  return {
    remaining: entries.find((entry) => entry.key === "remaining")?.visual ?? 0,
    lost: entries.find((entry) => entry.key === "lost")?.visual ?? 0,
    overkill: entries.find((entry) => entry.key === "overkill")?.visual ?? 0
  };
}

function damageImpactGripValue(count: number, maxHandSize: number | undefined): string {
  return maxHandSize !== undefined ? `${count}/${maxHandSize}` : `${count}`;
}
