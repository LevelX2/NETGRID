"use client";

import type { StandardDeckGuideEntry } from "@netgrid/decks";
import { BookOpen, Eye, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

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
        aria-label="Deck-Anleitung schließen"
        onClick={onDismiss}
      />
      <section className="standardDeckGuidePanel">
        <header className="standardDeckGuideHeader">
          <div>
            <span className="eyebrow">
              <BookOpen size={14} aria-hidden="true" />
              {side === "runner" ? "Runner" : "Korp"} · Standard-Deck
            </span>
            <h2 id={titleId}>{deckName}</h2>
            <p>{guide.content.summary}</p>
          </div>
          <button
            ref={closeButtonRef}
            className="button iconOnly"
            type="button"
            aria-label="Deck-Anleitung schließen"
            title="Deck-Anleitung schließen"
            onClick={onDismiss}
          >
            <X size={18} />
          </button>
        </header>
        <div className="standardDeckGuideContent">
          {guide.analysis.reviewStatus !== "plausible" ? (
            <p className="standardDeckGuideObservation">
              <Eye size={16} aria-hidden="true" />
              Diese Deckstrategie bleibt ein Beobachtungsfall. Die Anleitung
              benennt die derzeit erkannten Unsicherheiten ausdrücklich.
            </p>
          ) : null}
          <GuideSection title="Deckidee">
            <p>{guide.content.deckIdea}</p>
          </GuideSection>
          <GuideSection title="So spielst du das Deck">
            <div className="standardDeckGuidePhases">
              <GuidePhase title="Eröffnung" text={guide.content.gamePlan.opening} />
              <GuidePhase title="Mittelspiel" text={guide.content.gamePlan.midgame} />
              <GuidePhase title="Endphase" text={guide.content.gamePlan.endgame} />
            </div>
          </GuideSection>
          <GuideSection title="Schlüsselkarten">
            {guide.content.keyCards.length > 0 ? (
              <div className="standardDeckGuideKeyCards">
                {guide.content.keyCards.map((card) => (
                  <article key={card.cardId}>
                    <strong>{card.title}</strong>
                    <p>{card.role}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p>{guide.content.noDistinctKeyCardsReason}</p>
            )}
          </GuideSection>
          <div className="standardDeckGuideColumns">
            <GuideList title="Spieltipps" entries={guide.content.pilotingTips} />
            <GuideList title="Risiken und Schwächen" entries={guide.content.weaknesses} />
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
