---
jobId: spotcheck-2026-05-16-runner-event-run-access
status: ready_for_implementation
createdAt: 2026-05-16T11:08:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_076_all-nighter
    title: All-Nighter
  - cardId: onr_v1_081_custodial-position
    title: Custodial Position
  - cardId: onr_v1_083_desperate-competitor
    title: Desperate Competitor
  - cardId: onr_v1_085_executive-wiretaps
    title: Executive Wiretaps
  - cardId: onr_v1_089_gideons-pawnshop
    title: Gideon's Pawnshop
  - cardId: onr_v1_090_hot-tip-for-wns
    title: Hot Tip for WNS
  - cardId: onr_v1_094_inside-job
    title: Inside Job
  - cardId: onr_v1_095_jack-n-joe
    title: Jack 'n' Joe
  - cardId: onr_v1_096_kilroy-was-here
    title: Kilroy Was Here
  - cardId: onr_v1_098_lucidrine-booster-drug
    title: Lucidrine Booster Drug
---

# Originalset-Spotcheck Job spotcheck-2026-05-16-runner-event-run-access

## Auswahlprüfung

Dieser Bericht wurde als Restkarten-Queueblock nach vollständiger Deduplizierung gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle vorhandenen Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/` erzeugt. Jede Card ID in diesem Bericht war vor Erstellung in diesen Quellen nicht vorhanden.

Blockgröße: 10 Karten. Auswahlbasis sind die decklegalen Runtime-Releasekarten aus packages/catalog/src/catalog-gates.ts. Fokus: LegalAction/applyAction, Chronik, Hidden-Info, PublicPayload und Replay/StateHash.

## Kartenbefunde

### onr_v1_076_all-nighter - All-Nighter

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_081_custodial-position - Custodial Position

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_083_desperate-competitor - Desperate Competitor

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_085_executive-wiretaps - Executive Wiretaps

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_089_gideons-pawnshop - Gideon's Pawnshop

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_090_hot-tip-for-wns - Hot Tip for WNS

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_094_inside-job - Inside Job

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_095_jack-n-joe - Jack 'n' Joe

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_096_kilroy-was-here - Kilroy Was Here

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

Notwendige Umsetzung
: Erstelle einen fokussierten Nachtest fuer den bestehenden Resolververtrag, ergaenze fehlende Guards nur falls der Nachtest eine Luecke zeigt, und halte die Karte source-, side- und stateVersion-sicher.

Akzeptanzkriterien
: Positivpfad, wrong-side, stale `stateVersion`, entfernte Quelle/Ziel-Drift, PublicPayload-Leakscan, Chroniknachweis und Replay/StateHash sind fuer diese Karte gruen.

### onr_v1_098_lucidrine-booster-drug - Lucidrine Booster Drug

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen
: Play-Event-Pfade muessen Kosten, Timingbedingung, Zielwahl und Folgezustand erneut in applyAction validieren. Chronik braucht Play, Kosten, Ziel/Choice, Ergebnis und Discard/Return-Bewegung als getrennte oeffentliche bzw. private Eintraege. Mindestens positiver Pfad, ungueltiges Timing, falsche Seite, stale stateVersion, Ziel-Drift und Replay/StateHash pruefen. Private Hand-/Stack-/HQ-Ziele nur in der berechtigten PlayerView; PublicPayload bleibt count- und quellenbasiert. Haerte Event-Resolver gegen wiederholtes Ausfuehren, falsche Zone, entfernte Karte, leere Zielmenge und Choice-Manipulation.

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
