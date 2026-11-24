"use client";

import { useState } from "react";
import { useTranslations } from "use-intl/react";
import {
  traceCorpPaymentBalance,
  type TraceCorpPaymentChoice,
} from "@netgrid/shared";
import type { PlayerView, SelectionId } from "../../lib/presented-player-view";

export function TracePaymentChoice({
  choice,
  payment,
  disabled,
  onSubmit,
}: {
  choice: NonNullable<PlayerView["pendingChoice"]>;
  payment: TraceCorpPaymentChoice;
  disabled: boolean;
  onSubmit(ids: SelectionId[], amounts: number[]): void;
}) {
  const t = useTranslations("Actions.tracePayment");
  const [edits, setEdits] = useState<Partial<Record<SelectionId, string>>>({});
  const sources = choice.options.flatMap((option) => {
    const quote = option.metadata?.traceCorpPaymentSource;
    if (!quote) return [];
    const value = edits[option.id] ?? quote.recommendedAmount.toString();
    return [
      {
        option,
        ...quote,
        value,
        amount: /^\d+$/.test(value) ? Number(value) : NaN,
      },
    ];
  });
  if (sources.length === 0 || sources.length !== choice.options.length)
    return <p role="status">{t("unavailable")}</p>;

  const balance = traceCorpPaymentBalance(payment, sources);
  const canSubmit = balance?.canPay === true;
  return (
    <form
      className="tracePaymentChoice"
      data-testid="trace-payment-choice"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || !canSubmit) return;
        const selected = sources.filter(({ amount }) => amount > 0);
        onSubmit(
          selected.map(({ option }) => option.id),
          selected.map(({ amount }) => amount),
        );
      }}
    >
      <p className="meta">{t("bid", { amount: payment.bid })}</p>
      {sources.map(({ option, maxAmount, value }) => (
        <label className="tracePaymentSource" key={option.id}>
          <span>
            {option.label}{" "}
            <small>{t("available", { amount: maxAmount })}</small>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxAmount}
            step={1}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value;
              setEdits((current) => ({ ...current, [option.id]: value }));
            }}
          />
        </label>
      ))}
      <p className="meta" role="status">
        {balance
          ? t("remaining", { amount: balance.otherAmount })
          : t("invalidAmount")}
        {payment.requiredTraceCounters > 0 &&
          ` · ${t("counterMinimum", { amount: payment.requiredTraceCounters })}`}
        {payment.minimumSpecializedAmount > 0 &&
          ` · ${t("specializedMinimum", { amount: payment.minimumSpecializedAmount })}`}
      </p>
      <button
        className="button primary wide"
        type="submit"
        disabled={disabled || !canSubmit}
      >
        {t("confirm")}
      </button>
    </form>
  );
}
