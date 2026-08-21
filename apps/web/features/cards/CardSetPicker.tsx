"use client";

import { Check, Layers3, LockKeyhole } from "lucide-react";

export type CardSetAddonKey = "classic" | "proteus";

export function CardSetPicker({
  classic,
  proteus,
  baseDescription,
  addonDescription,
  baseCount,
  classicCount,
  proteusCount,
  ariaLabel,
  testIdPrefix,
  className = "",
  onAddonChange,
}: {
  classic: boolean;
  proteus: boolean;
  baseDescription: string;
  addonDescription: string;
  baseCount?: number;
  classicCount?: number;
  proteusCount?: number;
  ariaLabel: string;
  testIdPrefix: string;
  className?: string;
  onAddonChange(addon: CardSetAddonKey, enabled: boolean): void;
}) {
  return (
    <div
      className={`matchCardPoolPicker cardSetPicker ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="matchCardPoolBase">
        <Layers3 size={18} />
        <span>
          <strong>Originalset</strong>
          <small>{withCount(baseDescription, baseCount)}</small>
        </span>
        <LockKeyhole size={14} aria-hidden="true" />
      </div>
      <div className="matchCardPoolAddons">
        <AddonToggle
          addon="classic"
          checked={classic}
          count={classicCount}
          description={addonDescription}
          label="Classic"
          testIdPrefix={testIdPrefix}
          onChange={onAddonChange}
        />
        <AddonToggle
          addon="proteus"
          checked={proteus}
          count={proteusCount}
          description={addonDescription}
          label="Proteus"
          testIdPrefix={testIdPrefix}
          onChange={onAddonChange}
        />
      </div>
    </div>
  );
}

function AddonToggle({
  addon,
  checked,
  count,
  description,
  label,
  testIdPrefix,
  onChange,
}: {
  addon: CardSetAddonKey;
  checked: boolean;
  count: number | undefined;
  description: string;
  label: string;
  testIdPrefix: string;
  onChange(addon: CardSetAddonKey, enabled: boolean): void;
}) {
  const disabled = count === 0;
  return (
    <label
      className={`matchCardPoolAddon ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}`.trim()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(addon, event.target.checked)}
        data-testid={`${testIdPrefix}-${addon}`}
      />
      <span className="matchCardPoolCheck" aria-hidden="true">
        {checked ? <Check size={14} /> : null}
      </span>
      <span>
        <strong>{label}</strong>
        <small>{withCount(description, count)}</small>
      </span>
    </label>
  );
}

function withCount(description: string, count: number | undefined): string {
  return count === undefined ? description : `${description} · ${count}`;
}
