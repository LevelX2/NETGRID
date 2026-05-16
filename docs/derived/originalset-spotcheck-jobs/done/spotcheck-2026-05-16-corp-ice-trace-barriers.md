---
jobId: spotcheck-2026-05-16-corp-ice-trace-barriers
status: done
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:20:42+02:00
completedAt: 2026-05-16T18:36:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_221_asp
    title: Asp
  - cardId: onr_v1_223_banpei
    title: Banpei
  - cardId: onr_v1_231_cortical-scrub
    title: Cortical Scrub
  - cardId: onr_v1_232_crystal-wall
    title: Crystal Wall
  - cardId: onr_v1_245_fire-wall
    title: Fire Wall
  - cardId: onr_v1_249_hunter
    title: Hunter
  - cardId: onr_v1_252_keeper
    title: Keeper
  - cardId: onr_v1_256_mazer
    title: Mazer
  - cardId: onr_v1_261_quandary
    title: Quandary
  - cardId: onr_v1_266_scramble
    title: Scramble
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-corp-ice-trace-barriers

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_221_asp - Asp

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_223_banpei - Banpei

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_231_cortical-scrub - Cortical Scrub

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_232_crystal-wall - Crystal Wall

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_245_fire-wall - Fire Wall

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_249_hunter - Hunter

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_252_keeper - Keeper

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_256_mazer - Mazer

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_261_quandary - Quandary

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_266_scramble - Scramble

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

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

## Umsetzung 2026-05-16

Status: `done`.

Umgesetzt:

- `Asp` und `Hunter` wurden als Trace-5-ICE mit Source-/Trace-Bid-/Tag-/Replay-Pruefung nachgetestet.
- `Banpei` veroeffentlicht beim Programm-Trash keine Karteninstanz-ID mehr, sondern Definition, Typ und Count.
- `Cortical Scrub` wurde fuer Core-Damage plus End-the-run mit PublicPayload-Leakscan und Replay/StateHash nachgetestet.
- `Crystal Wall`, `Fire Wall`, `Keeper`, `Mazer`, `Quandary` und `Scramble` wurden als einfache ETR-ICE gegen Hidden-until-rez, Wrong-Side/Stale, PublicPayload-Leakscan und Replay/StateHash geprueft.

Checks:

- `corepack pnpm --filter @netgrid/engine test` gruen
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen
- `corepack pnpm --filter @netgrid/catalog test` gruen
- `corepack pnpm typecheck` gruen

Commitstatus: Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
