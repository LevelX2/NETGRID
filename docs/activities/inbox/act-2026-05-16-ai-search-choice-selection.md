---
activityId: act-2026-05-16-ai-search-choice-selection
status: inbox
kind: improvement
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

Noch offen.
