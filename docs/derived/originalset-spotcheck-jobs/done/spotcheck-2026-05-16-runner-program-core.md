---
jobId: spotcheck-2026-05-16-runner-program-core
status: done
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T14:07:22+02:00
completedAt: 2026-05-16T18:55:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_001_afreet
    title: Afreet
  - cardId: onr_v1_003_baedekers-net-map
    title: Baedeker's Net Map
  - cardId: onr_v1_004_bakdoor
    title: Bakdoor
  - cardId: onr_v1_006_black-dahlia
    title: Black Dahlia
  - cardId: onr_v1_010_cascade
    title: Cascade
  - cardId: onr_v1_012_clown
    title: Clown
  - cardId: onr_v1_015_codeslinger
    title: Codeslinger
  - cardId: onr_v1_016_cyfermaster
    title: Cyfermaster
  - cardId: onr_v1_018_dogcatcher
    title: Dogcatcher
  - cardId: onr_v1_019_dropp
    title: Dropp
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-program-core

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_001_afreet - Afreet

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_003_baedekers-net-map - Baedeker's Net Map

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_004_bakdoor - Bakdoor

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_006_black-dahlia - Black Dahlia

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_010_cascade - Cascade

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_012_clown - Clown

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_015_codeslinger - Codeslinger

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_016_cyfermaster - Cyfermaster

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: ICE-Pfade muessen Install, Rez, Encounter, Subroutinen, Breakbarkeit, Trace/Damage/End-the-run und Modifier-Layer source-bound abbilden. Chronik braucht Rez, Encounter, gebrochene/ungebrochene Subroutinen, Trace-/Damage-Ergebnis und Runende mit Quelle. Mindestens Rez, falsche Seite, stale, Teilbreak, unbroken Effekt, PublicPayload und Replay/StateHash pruefen. Unrezzed ICE-Identitaet bleibt bis zur Rez verborgen; danach sind Subroutinen und oeffentliche Effekte sichtbar. Haerte private Rez-Choice, Subroutine-Indizes, Trace-Bids, Damage-Redaction und Run-Cleanup.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_018_dogcatcher - Dogcatcher

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Install-/Rig-, MU-, Hosting-, Counter- oder Icebreaker-Pfade muessen source-bound und im Run-Timing revalidiert werden. Chronik braucht Quelle, Kosten, Counter-/Strength-Delta und Run-Fenster ohne private Stack-/Grip-Leaks. Mindestens Install, falsche Seite, stale stateVersion, entfernte Quelle, Payment-/Counter-Grenze und Replay/StateHash pruefen. Runner-private Zonen duerfen nur als Counts oder private Choices erscheinen; PublicPayload darf keine verdeckten Karten nennen. Haerte LegalAction/applyAction fuer Timingpunkt, Source-Zone, Side, Kosten, Ziel/Choice und Cleanup nach Runende.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_019_dropp - Dropp

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

## Umsetzungsabschluss 2026-05-16

Status: `done`. Der vorherige lokale Commit-Blocker beim Erstellen von `.git/index.lock` ist in diesem Abschlusslauf nicht mehr aufgetreten.

Umgesetzt:

- Core-Program-Installationen fuer Afreet, Baedeker's Net Map, Bakdoor, Black Dahlia, Cascade, Clown, Codeslinger, Cyfermaster, Dogcatcher und Dropp werden gegen Wrong-Side, stale `stateVersion`, entfernte Source, PublicPayload-Leaks und Replay/StateHash geprueft.
- Afreet hostet Bakdoor source-bound; entfernte Host-Quelle wird revalidiert und der gehostete Programmpfad bleibt replaybar.
- Clown reduziert Encounter-ICE-Staerke im Run-Fenster stabil und replaybar.
- Black Dahlia, Codeslinger, Cyfermaster, Dogcatcher und Dropp bleiben als installierte Breaker-Quellen in Run-Fenstern side-, stateVersion- und source-sicher.

Verifikation:

- `corepack pnpm --filter @netgrid/engine test` gruen mit 455 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` gruen.
- `corepack pnpm --filter @netgrid/catalog test` gruen.
- `corepack pnpm typecheck` gruen.

Commit-Hinweis:

- Die Änderung wird im Abschlusscommit dieses Spotcheck-Pakets lokal festgeschrieben.
