"use client";

import { Check, Layers3, LockKeyhole } from "lucide-react";

export type CardSetKey = "original" | "classic" | "proteus";

export function CardSetPicker({
  original = true,
  originalSelectable = false,
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
  onSetChange,
}: {
  original?: boolean;
  originalSelectable?: boolean;
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
  onSetChange(set: CardSetKey, enabled: boolean): void;
}) {
  const originalDisabled = baseCount === 0;
  return (
    <div
      className={`matchCardPoolPicker cardSetPicker ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {originalSelectable ? (
        <label
          className={`matchCardPoolBase selectable ${original ? "checked" : ""} ${originalDisabled ? "disabled" : ""}`.trim()}
        >
          <input
            type="checkbox"
            checked={original}
            disabled={originalDisabled}
            onChange={(event) =>
              onSetChange("original", event.target.checked)
            }
            data-testid={`${testIdPrefix}-original`}
          />
          <Layers3 size={18} aria-hidden="true" />
          <span>
            <strong>Originalset</strong>
            <small>{withCount(addonDescription, baseCount)}</small>
          </span>
          <span className="matchCardPoolCheck" aria-hidden="true">
            {original ? <Check size={14} /> : null}
          </span>
        </label>
      ) : (
        <div className="matchCardPoolBase">
          <Layers3 size={18} />
          <span>
            <strong>Originalset</strong>
            <small>{withCount(baseDescription, baseCount)}</small>
          </span>
          <LockKeyhole size={14} aria-hidden="true" />
        </div>
      )}
      <div className="matchCardPoolAddons">
        <AddonToggle
          addon="classic"
          checked={classic}
          count={classicCount}
          description={addonDescription}
          label="Classic"
          testIdPrefix={testIdPrefix}
          onChange={onSetChange}
        />
        <AddonToggle
          addon="proteus"
          checked={proteus}
          count={proteusCount}
          description={addonDescription}
          label="Proteus"
          testIdPrefix={testIdPrefix}
          onChange={onSetChange}
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
  addon: Exclude<CardSetKey, "original">;
  checked: boolean;
  count: number | undefined;
  description: string;
  label: string;
  testIdPrefix: string;
  onChange(set: CardSetKey, enabled: boolean): void;
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
