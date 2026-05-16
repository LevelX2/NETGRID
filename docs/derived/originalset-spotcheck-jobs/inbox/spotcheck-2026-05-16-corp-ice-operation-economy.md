---
jobId: spotcheck-2026-05-16-corp-ice-operation-economy
status: in_progress
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:15:29+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_267_sentinels-prime
    title: Sentinels Prime
  - cardId: onr_v1_270_sleeper
    title: Sleeper
  - cardId: onr_v1_279_wall-of-static
    title: Wall of Static
  - cardId: onr_v1_281_accounts-receivable
    title: Accounts Receivable
  - cardId: onr_v1_282_annual-reviews
    title: Annual Reviews
  - cardId: onr_v1_283_audit-of-call-records
    title: Audit of Call Records
  - cardId: onr_v1_284_chance-observation
    title: Chance Observation
  - cardId: onr_v1_286_corporate-detective-agency
    title: Corporate Detective Agency
  - cardId: onr_v1_288_day-shift
    title: Day Shift
  - cardId: onr_v1_291_falsified-transactions-expert
    title: Falsified-Transactions Expert
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-corp-ice-operation-economy

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_267_sentinels-prime - Sentinels Prime

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_270_sleeper - Sleeper

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_279_wall-of-static - Wall of Static

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_281_accounts-receivable - Accounts Receivable

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_282_annual-reviews - Annual Reviews

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_283_audit-of-call-records - Audit of Call Records

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_284_chance-observation - Chance Observation

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_286_corporate-detective-agency - Corporate Detective Agency

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_288_day-shift - Day Shift

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_291_falsified-transactions-expert - Falsified-Transactions Expert

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Operation-Pfade muessen Kosten, Play-Timing, oeffentliche/privat berechtigte Ziele und Archivbewegung erneut validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Archives-Bewegung ohne private HQ-Leaks. Mindestens positiver Pfad, falsche Seite, stale, Ziel-Drift, leere Zielmenge und Replay/StateHash pruefen. Korp-HQ bleibt privat; PublicPayload darf nur erlaubte Ziel- und Ergebnisdaten enthalten. Haerte Play-Resolver gegen wiederholte Nutzung, falsche Zone, falschen Timingpunkt, Zielmanipulation und Payload-Leaks.

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
