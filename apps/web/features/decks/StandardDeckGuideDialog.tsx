"use client";

import {
  resolveStandardDeckGuideContent,
  type StandardDeckGuideEntry,
} from "@netgrid/decks";
import { BookOpen, Eye, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useLocale, useTranslations } from "use-intl/react";

export function StandardDeckGuideDialog({
  deckName,
  side,
  guide,
  onDismiss,
}: {
  deckName: string;
  side: "runner" | "corp";
  guide: StandardDeckGuideEntry;
  onDismiss(): void;
}) {
  const t = useTranslations("Decks.guide");
  const resolvedGuide = resolveStandardDeckGuideContent(guide, useLocale());
  const content = resolvedGuide.content;
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className={`standardDeckGuideOverlay ${side}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="standard-deck-guide-dialog"
    >
      <button
        className="standardDeckGuideBackdrop"
        type="button"
        aria-label={t("close")}
        onClick={onDismiss}
      />
      <section className="standardDeckGuidePanel" lang={resolvedGuide.locale}>
        <header className="standardDeckGuideHeader">
          <div>
            <span className="eyebrow">
              <BookOpen size={14} aria-hidden="true" />
              {t("eyebrow", {
                side: side === "runner" ? t("runner") : t("corp"),
              })}
            </span>
            <h2 id={titleId}>{deckName}</h2>
            <p>{content.summary}</p>
          </div>
          <button
            ref={closeButtonRef}
            className="button iconOnly"
            type="button"
            aria-label={t("close")}
            title={t("close")}
            onClick={onDismiss}
          >
            <X size={18} />
          </button>
        </header>
        <div className="standardDeckGuideContent">
          {guide.analysis.reviewStatus !== "plausible" ? (
            <p className="standardDeckGuideObservation">
              <Eye size={16} aria-hidden="true" />
              {t("observation")}
            </p>
          ) : null}
          <GuideSection title={t("deckIdea")}>
            <p>{content.deckIdea}</p>
          </GuideSection>
          <GuideSection title={t("howToPlay")}>
            <div className="standardDeckGuidePhases">
              <GuidePhase
                title={t("opening")}
                text={content.gamePlan.opening}
              />
              <GuidePhase
                title={t("midgame")}
                text={content.gamePlan.midgame}
              />
              <GuidePhase
                title={t("endgame")}
                text={content.gamePlan.endgame}
              />
            </div>
          </GuideSection>
          <GuideSection title={t("keyCards")}>
            {content.keyCards.length > 0 ? (
              <div className="standardDeckGuideKeyCards">
                {content.keyCards.map((card) => (
                  <article key={card.cardId}>
                    <strong>{card.title}</strong>
                    <p>{card.role}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p>{content.noDistinctKeyCardsReason}</p>
            )}
          </GuideSection>
          <div className="standardDeckGuideColumns">
            <GuideList title={t("tips")} entries={content.pilotingTips} />
            <GuideList title={t("weaknesses")} entries={content.weaknesses} />
          </div>
        </div>
      </section>
    </div>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="standardDeckGuideSection">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function GuidePhase({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function GuideList({ title, entries }: { title: string; entries: string[] }) {
  return (
    <GuideSection title={title}>
      <ul>
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </GuideSection>
  );
}
