---
jobId: spotcheck-2026-05-16-runner-program-prevention-tools
status: ready_for_implementation
createdAt: 2026-05-16T11:08:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_021_dwarf
    title: Dwarf
  - cardId: onr_v1_024_expert-schedule-analyzer
    title: Expert Schedule Analyzer
  - cardId: onr_v1_028_force-shield
    title: Force Shield
  - cardId: onr_v1_033_imp
    title: Imp
  - cardId: onr_v1_036_jackhammer
    title: Jackhammer
  - cardId: onr_v1_038_joan-of-arc
    title: Joan of Arc
  - cardId: onr_v1_039_krash
    title: Krash
  - cardId: onr_v1_040_loony-goon
    title: Loony Goon
  - cardId: onr_v1_042_mouse
    title: Mouse
  - cardId: onr_v1_050_r-and-d-protocol-files
    title: R&D-Protocol Files
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-program-prevention-tools

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_021_dwarf - Dwarf

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_024_expert-schedule-analyzer - Expert Schedule Analyzer

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_028_force-shield - Force Shield

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_033_imp - Imp

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_036_jackhammer - Jackhammer

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_038_joan-of-arc - Joan of Arc

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_039_krash - Krash

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_040_loony-goon - Loony Goon

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_042_mouse - Mouse

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_050_r-and-d-protocol-files - R&D-Protocol Files

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

## Gesamtplan

1. Karten in der Frontmatter-Reihenfolge bearbeiten und nicht mit anderen Queueberichten mischen.
2. Pro Karte zuerst den bestehenden Engine-Vertrag nachtesten, dann nur konkrete Luecken haerten.
3. PublicPayload, PlayerView, Reconnect und Chronik immer zusammen pruefen.
4. Nach Umsetzung Bericht nach `done/` verschieben und Register separat aktualisieren.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- Fokussierte Tests in `packages/engine/src/index.test.ts` fuer die im Block genannten Card IDs.
- Leakscan fuer PublicPayload, PlayerViews, Reconnect-Payloads, Chronik und Replay/StateHash.
