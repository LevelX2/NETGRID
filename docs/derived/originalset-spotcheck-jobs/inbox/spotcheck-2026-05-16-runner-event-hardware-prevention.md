---
jobId: spotcheck-2026-05-16-runner-event-hardware-prevention
status: committed
createdAt: 2026-05-16T11:08:00+01:00
startedAt: 2026-05-16T13:46:00+02:00
completedAt: 2026-05-16T13:51:05+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_101_mit-west-tier
    title: MIT West Tier
  - cardId: onr_v1_102_open-ended-mileage-program
    title: Open-Ended Mileage Program
  - cardId: onr_v1_108_score
    title: Score!
  - cardId: onr_v1_111_social-engineering
    title: Social Engineering
  - cardId: onr_v1_114_temple-microcode-outlet
    title: Temple Microcode Outlet
  - cardId: onr_v1_115_terrorist-reprisal
    title: Terrorist Reprisal
  - cardId: onr_v1_116_total-genetic-retrofit
    title: Total Genetic Retrofit
  - cardId: onr_v1_120_armadillo-armored-road-home
    title: Armadillo Armored Road Home
  - cardId: onr_v1_125_dermatech-bodyplating
    title: Dermatech Bodyplating
  - cardId: onr_v1_126_drifter-mobile-environment
    title: Drifter Mobile Environment
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-event-hardware-prevention

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_101_mit-west-tier - MIT West Tier

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_102_open-ended-mileage-program - Open-Ended Mileage Program

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_108_score - Score!

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_111_social-engineering - Social Engineering

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_114_temple-microcode-outlet - Temple Microcode Outlet

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_115_terrorist-reprisal - Terrorist Reprisal

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_116_total-genetic-retrofit - Total Genetic Retrofit

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_120_armadillo-armored-road-home - Armadillo Armored Road Home

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_125_dermatech-bodyplating - Dermatech Bodyplating

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_126_drifter-mobile-environment - Drifter Mobile Environment

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Hardware-Install, Memory-/Link-/Prevention-/Recurring-Zustand und Deck-/Unique-Regeln muessen stabil an die installierte Quelle gebunden sein. Chronik braucht Install, Counter/Recurring-Refresh, Prevention oder Link-Beitrag mit sichtbarer Quelle. Mindestens Install, Mehrkopien/Unique, Refresh oder Prevention, Source-Removal, stale und Replay/StateHash pruefen. Installierte Hardware ist oeffentlich; private Kosten- oder Prevention-Choices duerfen keine Grip-/Stack-Inhalte offenlegen. Haerte Source-Bindung, Turnlimit, Counterverbrauch, Refresh, Trash-Cleanup und PublicPayload.

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

Status: `committed`.

Umgesetzt:

- `Score!` schreibt seinen Brutto-Creditgewinn und den Runner-Creditstand in den PublicPayload-Kontext.
- `Total Genetic Retrofit` schreibt entfernte Tags und den Runner-Tagstand nach Resolve payloadfähig.
- `Social Engineering` nennt den öffentlichen Runmarker im Eventpayload, ohne interne Server-IDs zu veröffentlichen.
- `Terrorist Reprisal` veröffentlicht nur die Anzahl der zufällig abgelegten HQ-Karten, keine Kartendefinitionen oder Instanz-IDs.
- `MIT West Tier` wurde gegen entfernte Quelle, Special-Zone-Bewegung, Hidden-Zone-Payload und Replay/StateHash nachgetestet.
- `Open-Ended Mileage Program` wurde gegen entfernte Quelle, Tag-Removal, öffentliche Return-Choice und Replay/StateHash geprüft.
- `Temple Microcode Outlet` wurde als private Stack-Suche mit Hidden-Zone-Barriere und Replay/StateHash geprüft.
- `Armadillo Armored Road Home` und `Drifter Mobile Environment` wurden als öffentliche Hardware-Installationen ohne private Payload-Leaks geprüft.
- `Dermatech Bodyplating` wurde als source-bound Meat-Damage-Prevention-Choice mit Replay/StateHash geprüft.

Checks:

- `corepack pnpm --filter @netgrid/engine test` grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` grün
- `corepack pnpm --filter @netgrid/catalog test` grün
- `corepack pnpm typecheck` grün

Commitstatus: Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
