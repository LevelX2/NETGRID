---
activityId: act-2026-05-16-ai-search-choice-selection
status: done
kind: improvement
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-16
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
---

# KI-Auswahl bei Search-Choices verbessern

## Ziel

Die KI soll bei Search-Effekten nicht nur die erste auswählbare Karte nehmen, sondern eine fachlich sinnvolle Auswahl treffen.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-16: Bei Search-Effekten soll die Anzeige alle Karten zeigen, aber nur passende Karten auswählbar machen. Als Folgepunkt soll die KI aus den auswählbaren Karten sinnvoll wählen.
- Aktueller Umsetzungskontext: Stack-Search-Choices können Anzeigeoptionen mit `selectable: false` enthalten; Engine und UI trennen dadurch Informationssicht und Auswahllegalität.
- Relevante Dateien:
  - `packages/ai/src/index.ts`
  - `packages/engine/src/index.ts`
  - `packages/engine/src/index.test.ts`
  - `apps/web/app/page.tsx`

## Scope

- KI-Heuristik für `select_cards`-Choices prüfen, insbesondere Stack-/Heap-Suchen nach Programmen.
- Display-only Optionen (`selectable: false`) aus KI-Entscheidungen ausgeschlossen halten.
- Für Programmsuchen eine einfache Bewertungslogik entwickeln, z. B. nach Installierbarkeit, Kosten, MU, Subtype/Rolle und aktueller Spielsituation.
- Bestehende AI-Hints oder Card-Metadaten nur nutzen, wenn sie lokal verfügbar und stabil sind.

## Nicht im Scope

- Keine Änderung an der Legalitätsprüfung der Engine.
- Keine Hidden-Info-Erweiterung für die KI über den bestehenden PlayerView hinaus.
- Keine neue Kartendatenquelle oder externe Recherche.
- Kein vollständiger strategischer KI-Umbau.

## Akzeptanzkriterien

- [ ] Die KI wählt bei Search-Choices nur auswählbare Optionen.
- [ ] Für typische Programmsuchen gibt es eine nachvollziehbare Auswahlreihenfolge statt reiner First-Option-Auswahl.
- [ ] Die Heuristik bleibt deterministisch und replay-/StateHash-neutral.
- [ ] AI-Tests decken mindestens eine Search-Choice mit mehreren auswählbaren Programmen und einer nicht auswählbaren Anzeigeoption ab.

## Umsetzungshinweise

- Startpunkt ist die generische `select_cards`-Behandlung in `selectedChoicesForDecision`.
- Für Search-Choices sollte eine eigene kleine Bewertungsfunktion reichen, bevor die generische Fallback-Auswahl greift.
- Wenn keine klare Bewertung möglich ist, deterministisch nach stabilen Kriterien fallen backen, z. B. Score, Label, ID.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17.

- `select_cards`-Search-Choices nutzen jetzt vor dem generischen Fallback eine deterministische Bewertungsfunktion.
- Display-only Optionen mit `selectable: false` bleiben aus KI-Auswahlen ausgeschlossen.
- Programmsuchen, insbesondere `install_program`-Stack-Suchen, bevorzugen sichtbare Programme nach Installierbarkeit, Kosten, MU, fehlenden Breaker-/Rig-Rollen und stabilen Tie-Breakern.
- Die Heuristik nutzt nur `PlayerView`, LegalActions und sichtbare Choice-/Card-Felder; keine Hidden-Info-, Replay- oder StateHash-Änderung.

Checks:

- `corepack pnpm --filter @netgrid/ai test -- index.test.ts`: grün, 1 Datei / 121 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
