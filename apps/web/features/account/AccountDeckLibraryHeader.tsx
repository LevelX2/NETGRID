"use client";

import { useMemo, useState } from "react";
import type { AccountDeckQuota, StandardDeck } from "./account-deck-client";
import { useTranslations } from "use-intl/react";

export function AccountDeckLibraryHeader({
  standards,
  quota,
  accountMode,
  busy,
  onUseStandard,
}: {
  standards: StandardDeck[];
  quota: AccountDeckQuota | null;
  accountMode: boolean;
  busy: boolean;
  onUseStandard(deck: StandardDeck): void;
}) {
  const t = useTranslations("Account.deckLibrary");
  const [side, setSide] = useState<"runner" | "corp">("runner");
  const filtered = useMemo(
    () => standards.filter((deck) => deck.side === side),
    [side, standards],
  );
  const [selectedId, setSelectedId] = useState("");
  const selected =
    filtered.find((deck) => deck.standardDeckId === selectedId) ?? filtered[0];
  return (
    <section className="accountDeckLibraryHeader">
      <div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2>
          {accountMode
            ? t("accountTitle")
            : t("guestTitle")}
        </h2>
        <p className="muted">
          {t("help")}
        </p>
      </div>
      <div className="accountDeckStandardControls">
        <label>
          {t("side")}
          <select
            value={side}
            onChange={(event) => {
              setSide(event.target.value as "runner" | "corp");
              setSelectedId("");
            }}
          >
            <option value="runner">{t("runner")}</option>
            <option value="corp">{t("corp")}</option>
          </select>
        </label>
        <label>
          {t("standardDeck")}
          <select
            value={selected?.standardDeckId ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {filtered.map((deck) => (
              <option key={deck.standardDeckId} value={deck.standardDeckId}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          disabled={!selected || busy}
          onClick={() => selected && onUseStandard(selected)}
          type="button"
        >
          {t("playDirectly")}
        </button>
      </div>
      {accountMode && quota ? (
        <p className="accountDeckQuota">
          {t("quota", {used: quota.used, limit: quota.limit, remaining: quota.remaining})}
        </p>
      ) : (
        <p className="accountDeckQuota">
          {t("guestStorage")}
        </p>
      )}
    </section>
  );
}
