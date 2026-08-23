---
activityId: act-2026-08-23-encounter-action-family-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Encounter-Actions nach Verantwortungen prüfen

## Ziel

Prüfen, ob `encounter-actions.ts` in Breaker-Actions,
Encounter-Continue-Actions und Movement-Actions geteilt werden sollte, ohne
eine zweite Autorität für Subroutinenreihenfolge oder Zahlungen zu erzeugen.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Die sequenzielle Auflösung einzelner Pay-or-Subroutinen ist bereits
  fachlich korrigiert und bleibt verbindlicher Ausgangsvertrag.
- Aktivierungsauslöser: nächste Erweiterung an Encounter-Continue oder eine
  Änderung, die mehrere der drei Action-Familien gleichzeitig berührt.

## Scope

- Aktuelle Builder-, Host- und Helper-Verantwortungen erfassen.
- Einen kleinen Modulschnitt mit genau einem Continue-Owner entwerfen.
- Bei positivem Ergebnis getrennte Folgepakete pro Action-Familie anlegen.

## Nicht im Scope

- Änderung von Subroutinenreihenfolge, Breakkosten oder Movement-Regeln.
- Neuer paralleler Encounter-Controller.

## Akzeptanzkriterien

- [ ] Jede Action-Familie besitzt genau einen Owner.
- [ ] `LegalAction`-Erzeugung und Resolve-Time-Revalidierung bleiben deckungsgleich.
- [ ] Replay, StateHash und sequenzielle Pay-or-Auflösung bleiben unverändert.
- [ ] Eine Umsetzung ist in kollisionsarme Folgepakete geschnitten.

## Umsetzungshinweise

Die bestehenden Helper für die nächste auflösbare Subroutinengruppe dürfen
nicht in mehreren Modulen als voneinander abweichende Regelautorität enden.

## Ergebnisnotiz

Noch offen.
