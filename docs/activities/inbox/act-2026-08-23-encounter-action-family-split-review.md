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
checks:
  - Action-Familien, Continue-Owner und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
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

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Breaker-, Continue- und
Movement-Actions sind funktional unterscheidbar; LegalAction-Build und die
Ermittlung der nächsten auflösbaren Subroutinengruppe teilen jedoch bewusst
denselben Encounter-Vertrag. `3e8afe801` korrigierte sequenzielle Pay-or-
Auflösung im zentralen Continue-Helper und belegt einen notwendigen
Einzelowner, keine duplizierte Autorität. Die Activity wurde danach angelegt;
seitdem gab es keine Erweiterung. Keine Folge-Activity; beim Trigger nur
Action-Builder verschieben und Continue-/Payment-Regeln zentral lassen.
