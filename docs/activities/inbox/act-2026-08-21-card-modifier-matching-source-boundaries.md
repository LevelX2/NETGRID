---
activityId: act-2026-08-21-card-modifier-matching-source-boundaries
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Source-, Consumer- und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Matching und Quellensammlung von Karten-Modifiern neu bewerten

## Ziel

Beim nächsten substanziellen Ausbau der Modifier-Infrastruktur prüfen, ob
Definition-/Instanz-Matching und das Einsammeln aktiver Modifier-Quellen in
getrennte Module gehören und ob ähnliche Collector-Pfade sicher vereinheitlicht
werden können.

## Kontext und Quellen

- Regel-Engine-Review Batch 2 vom 2026-08-21.
- `packages/engine/src/ability-engine/card-implementation-modifiers.ts`
- Der konkrete Galatea-/Encoder-Fehler ist bereits durch den Instanz-Matcher
  behoben; die Datei ist aktuell noch beherrschbar und zyklenfrei.
- Aktivierungsauslöser: eine neue Modifier-Quellenfamilie, divergierende
  Quellfilter oder die nächste größere fachliche Änderung dieser Datei.

## Scope

- Verantwortlichkeiten, Importgraph und aktive Verbraucher neu vermessen.
- Einen möglichen Schnitt zwischen `card-modifier-matching` und
  `active-card-modifier-sources` gegen den aktuellen Code bewerten.
- Prüfen, ob ein typisierter Collector Duplikation entfernt, ohne
  Sichtbarkeit, Rez-Zustand, Controller oder Kartenbereich zu vermischen.
- Bei positivem Ergebnis ein kleines Umsetzungs- und Migrationspaket anlegen.

## Nicht im Scope

- Sofortige Dateiaufteilung nur aufgrund von Dateilänge.
- Änderung der effektiven Subtypregel oder der fachlichen Modifier-Wirkung.
- Generischer Collector mit stillen Fallbacks oder abgeschwächten
  Hidden-Info-/Sichtbarkeitsfiltern.

## Akzeptanzkriterien

- [ ] Matching und Quellensammlung sind mit ihren Verbrauchern abgegrenzt.
- [ ] Eine Trennung ist anhand von Kohäsion, Zyklenrisiko und Änderungsnutzen
  begründet angenommen oder verworfen.
- [ ] Ein Collector-Vorschlag erhält alle quellenspezifischen Filter explizit
  und typisiert.
- [ ] Empfohlene Codeänderungen sind als kleine Folge-Activities erfasst.

## Umsetzungshinweise

- `check:engine-source-structure` und die aktuelle Null-Zyklen-Baseline sind
  harte Bewertungskriterien.
- Definition-Matching und Instanz-Matching dürfen nach einer Trennung nicht
  wieder unter einem mehrdeutigen Helpernamen zusammenfallen.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Definition-/Instanz-Matching und die
vier Quellensammler sind als unterschiedliche Verantwortungen erkennbar; die
quellenspezifischen Filter für Rez-Zustand, Controller, Zone und Score Area
bleiben jedoch explizit und typisiert. Seit dem ursächlichen Matcher-Fix in
`a91bf06c9` wurde die Datei nicht erneut geändert, es kam keine neue
Modifier-Quellenfamilie hinzu und es liegt weder Filterdivergenz noch ein
Importzyklus vor (`relativeCycles=0`). Ein Split würde aktuell nur zusätzliche
Modulverträge schaffen. Keine Folge-Activity angelegt. Erneut prüfen bei einer
neuen Quellenfamilie, divergierenden Filtern oder der nächsten
substanziellen Änderung dieser Datei.
