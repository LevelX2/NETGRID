# Mechanikpaket J 1.9.1 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

V1.9.1 implementiert exakt drei Karten aus dem V1.9.0-Deferred-Überhang:

1. `onr_v1_013_cockroach`
2. `onr_v1_034_incubator`
3. `onr_v1_030_grubb`

## Nicht-Scope

- keine zusätzlichen Kartenfreigaben außerhalb des 3er-Kerns
- keine V2.x-Features
- kein automatischer AI-Support-Upgrade für neue Karten

## Kartenverträge

### `onr_v1_013_cockroach`

- Runner-Program (Virus), installierbar und decklegal im V1.9.1-Scope.
- Trigger: erfolgreicher Run auf HQ erhöht Cockroach-Counter.
- Schwelle: ab mindestens 2 Cockroach-Countern werden HQ-Discards der Korp im Discard-Flow deterministisch randomisiert.
- Purge-Vertrag: Cockroach-Counter sind Virus-Counter und werden durch `purge_virus_counters` entfernt.

### `onr_v1_034_incubator`

- Runner-Program (Virus/Random), installierbar und decklegal im V1.9.1-Scope.
- Trigger: jeder erfolgreiche Run erhöht Incubate-Counter.
- Start-of-turn: pro Incubate-Counter deterministischer Würfelwurf.
- Bei jedem `6`-Wurf: deterministischer, legal-action-gesteuerter Choice auf einen vorhandenen Virus-Counter; der gewählte Counter wird in zwei Counter desselben Typs transformiert (netto +1).
- Purge-Vertrag: Incubate-Counter sind Virus-Counter und werden durch `purge_virus_counters` entfernt.

### `onr_v1_030_grubb`

- Runner-Program (Icebreaker/Worm), installierbar und decklegal im V1.9.1-Scope.
- Fähigkeiten:
  - `1 credit`: break wall subroutine
  - `2 credits`: +1 strength for the remainder of this run
- Strength-Lifecycle bleibt deterministisch und endet regelkonform beim Run-Ende.

## Engine-Vertrag

1. Cockroach-/Incubator-Counter werden als Virus-Counter in bestehende Counter-/Purge-Mechanik integriert.
2. Cockroach-Randomdiscard nutzt deterministic RNG über `nextRandom` mit eigenem purpose-Namespace.
3. Incubator-Start-of-turn-Multiroll nutzt den zentralen deterministic die resolver.
4. Incubator-Counter-Transform erfolgt ausschließlich über PendingChoice/LegalAction und ohne Hidden-Info-Leak.
5. Grubb nutzt bestehenden Breaker-Fähigkeitspfad ohne globale Subtyp-/Breaker-Vertragsänderung außerhalb des Kernscopes.

## Visibility- und Determinismus-Vertrag

- PublicEvents enthalten nur side-sichere Metadaten.
- Kein Leak verdeckter HQ-Inhalte durch Cockroach-Randomdiscard.
- Kein Leak verdeckter Counter-Lagen durch Incubator-Choice.
- Replay bei gleichem Seed führt zu identischem RandomRecord- und StateHash-Verlauf.

## Ergebnis

V1.9.1 schließt den V1.9.0-Deferred-Überhang durch einen klaren, deterministischen 3-Karten-Schnitt ohne Scope-Drift.
