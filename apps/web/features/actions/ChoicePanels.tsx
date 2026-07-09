"use client";

import { Check, Clipboard, Crosshair, Trash2, X } from "lucide-react";
import type { LegalAction, PlayerView } from "@netgrid/shared";

import {
  choiceInteractionAmbience,
  fieldCardChoiceInfo,
  interactionAmbienceClassName,
} from "../../app/action-board-ui";

export function FieldCardChoicePanel({
  choice,
  action,
  selected,
  disabled,
  highlighted,
  onClear,
  onChoiceOptions
}: {
  choice: NonNullable<PlayerView["pendingChoice"]>;
  action: LegalAction;
  selected: string[];
  disabled: boolean;
  highlighted: boolean;
  onClear(): void;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
}) {
  const info = fieldCardChoiceInfo(choice, selected);
  const ambienceClass = interactionAmbienceClassName(
    choiceInteractionAmbience(choice, action),
  );
  return (
    <section className={`section setupPanel ${ambienceClass} ${highlighted ? "cueHighlight" : ""}`} data-testid="field-card-choice-panel">
      <h2>
        <Crosshair size={16} />
        {info.title}
      </h2>
      <p className="meta">{info.prompt} · {info.counterLabel}</p>
      <div className="fieldChoiceControls">
        <button
          className="button primary wide"
          onClick={() => onChoiceOptions(action, choice.choiceId, selected)}
          disabled={disabled || !info.canSubmit}
          type="button"
          data-testid="field-card-choice-submit"
        >
          <Check size={15} />
          {info.submitLabel}
        </button>
        <button
          className="button wide"
          onClick={onClear}
          disabled={disabled || !info.canClear}
          type="button"
          data-testid="field-card-choice-clear"
        >
          <X size={15} />
          {info.clearLabel}
        </button>
      </div>
    </section>
  );
}

export function DiscardChoicePanel({
  choice,
  action,
  selected,
  disabled,
  highlighted,
  onToggle,
  onChoiceOptions
}: {
  choice: NonNullable<PlayerView["pendingChoice"]>;
  action: LegalAction;
  selected: string[];
  disabled: boolean;
  highlighted: boolean;
  onToggle(optionId: string): void;
  onChoiceOptions(action: LegalAction, choiceId: string, selectedOptionIds: string[]): void;
}) {
  const required = choice.maxSelections;
  const selectedOptionIds = selected.filter((optionId) => choice.options.some((option) => option.id === optionId));
  return (
    <section className={`section setupPanel ${highlighted ? "cueHighlight" : ""}`} data-testid="discard-choice-panel">
      <h2>
        <Trash2 size={16} />
        Discard
      </h2>
      <p className="meta">{choice.prompt} · {selectedOptionIds.length}/{required}</p>
      <div className="choiceCards">
        {choice.options.map((option) => {
          const active = selectedOptionIds.includes(option.id);
          return (
            <button className={`button actionButton ${active ? "primary" : ""}`} key={option.id} onClick={() => onToggle(option.id)} disabled={disabled} type="button" data-testid="discard-choice-option" aria-pressed={active}>
              {active ? <Check size={15} /> : <Clipboard size={15} />}
              <span className="actionButtonLabel">{option.label}</span>
            </button>
          );
        })}
      </div>
      <button className="button primary wide" onClick={() => onChoiceOptions(action, choice.choiceId, selectedOptionIds)} disabled={disabled || selectedOptionIds.length !== required} type="button" data-testid="discard-choice-submit">
        <Trash2 size={15} />
        Abwerfen
      </button>
    </section>
  );
}
