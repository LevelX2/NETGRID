import { Check } from "lucide-react";
import { useTranslations } from "use-intl/react";

import type { DamageImpactCue } from "../../app/action-cues";
import { interactionAmbienceClassName } from "../../app/action-board-ui";
import { DamageImpactMeter } from "./DamageImpactMeter";
import { WindowEventIcon } from "./WindowEventIcon";

export function DamageImpactOverlay({
  cue,
  queued,
  onDismiss,
}: {
  cue: DamageImpactCue | null;
  queued: number;
  onDismiss(): void;
}) {
  const t = useTranslations("Actions.damage");
  if (!cue) return null;
  const preventedDamage = cue.amount === 0 && !cue.flatline;
  const damageType = t(`type.${cue.damageType}`);
  const title = cue.flatline
    ? t("flatline")
    : preventedDamage
      ? t("preventedTitle", { type: damageType })
      : t("impactTitle", { amount: cue.amount, type: damageType });
  const source = cue.flatline
    ? t("damageSummary", {
        amount: cue.amount,
        type: damageType,
        source: cue.sourceLabel,
      })
    : t(preventedDamage ? "preventedSource" : "impactSource", {
        source: cue.sourceLabel,
      });
  const gripLabel =
    cue.runnerGripBefore !== undefined && cue.runnerGripAfter !== undefined
      ? t("gripTransition", {
          before: cue.runnerGripBefore,
          after: cue.runnerGripAfter,
        })
      : cue.runnerGripAfter !== undefined
        ? t("gripNow", { value: cue.runnerGripAfter })
        : null;
  const coreDetail =
    cue.damageType === "core"
      ? [
          cue.coreDamageAfter !== undefined
            ? t("coreDamageValue", { value: cue.coreDamageAfter })
            : null,
          cue.runnerMaxHandSizeAfter !== undefined
            ? t("handLimit", { value: cue.runnerMaxHandSizeAfter })
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <aside
      className={`damageImpactOverlay ${interactionAmbienceClassName("damage")} damage-${cue.damageType} ${cue.flatline ? "is-flatline" : ""} ${preventedDamage ? "is-prevented" : ""}`}
      aria-live="assertive"
      data-testid="damage-impact"
    >
      <div className="damageImpactHeader">
        <div>
          <h2>{title}</h2>
          <p>{source}</p>
        </div>
        <WindowEventIcon kind={`${cue.damageType}-damage`} side="runner" />
      </div>
      {!preventedDamage || gripLabel || coreDetail ? (
        <div className="damageImpactGrip">
          {gripLabel ? <strong>{gripLabel}</strong> : null}
          {!preventedDamage ? <DamageImpactMeter cue={cue} /> : null}
          {coreDetail ? <small>{coreDetail}</small> : null}
        </div>
      ) : null}
      <div className="damageImpactFooter">
        {queued > 0 ? <small>{t("queued", { count: queued })}</small> : null}
        <button
          className="button damageImpactDismiss"
          onClick={onDismiss}
          aria-label={t("confirmWindow")}
          title={t("confirmWindow")}
          type="button"
        >
          <Check size={14} aria-hidden="true" />
          {t("continue")}
        </button>
      </div>
    </aside>
  );
}
