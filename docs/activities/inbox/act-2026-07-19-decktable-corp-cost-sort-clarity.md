---
activityId: act-2026-07-19-decktable-corp-cost-sort-clarity
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Corp-/ICE-Kostensortierung im Decktisch eindeutig machen

## Ziel

Die Kostensortierung im Decktisch soll Corp-Karten, insbesondere ICE, nach dem tatsächlich vorhandenen Kostenfeld ordnen und für Nutzer eindeutig benannt sein.

## Kontext und Quellen

- Nutzerfund vom 2026-07-19: Beim Sortieren von ICE-Karten nach Installkosten wirkt die Reihenfolge falsch.
- `apps/web/features/decks/DeckTableBoard.tsx` bietet im Corp-Deck gleichzeitig „Alle Stapel nach Installkosten“ und „Alle Stapel nach Rez-Kosten“ sowie dieselben Sortierfelder pro Stapel an.
- `apps/web/features/decks/deck-table-model.ts` bildet die Sortierung `install` ausschließlich auf `numeric.installCost` ab. Fehlende Werte werden ans Ende gelegt und anschließend nach Kartengruppe und Name sortiert.
- Die aktiven ICE-Karten unter `data/cards/` besitzen `numeric.rezCost`, aber kein `numeric.installCost`. Bei der Installkosten-Sortierung werden ICE daher nicht nach ihrer gedruckten Kostenangabe, sondern im Ergebnis alphabetisch sortiert.
- Die separate Verteilung „Nach Kartenkosten auf Stapel verteilen“ verwendet bereits einen kartentypübergreifenden Fallback über `installCost`, `rezCost` und `cost`.
- Es existiert keine passende offene Activity und keine gezielte Testabdeckung für die Decktisch-Kostensortierung.

## Scope

- Die globalen und stapelbezogenen Kostensortieroptionen im Decktisch side- und kartentypgerecht gestalten.
- Für Corp-/ICE-Kontext eine klar benannte Sortierung bereitstellen, die ICE aufsteigend nach `rezCost` und bei gleichen Werten deterministisch nach Typ und Name ordnet.
- Verhindern, dass eine für Corp-Karten praktisch unbelegte Installkosten-Sortierung wie eine funktionslose oder falsche Sortierung angeboten wird.
- Das Verhalten für gemischte Corp-Stapel sowie Karten ohne den gewählten Zahlenwert bewusst festlegen; fehlende Werte sollen stabil und nachvollziehbar einsortiert werden.
- Gezielte Unit-/UI-Regressionstests für mindestens drei ICE mit unterschiedlichen `rezCost`-Werten und für die sichtbaren Corp-Sortieroptionen ergänzen.

## Nicht im Scope

- Keine Änderung der Kartenwerte oder ihrer Feldsemantik in `data/cards/`.
- Keine Änderung an Installations- oder Rez-Regeln der Engine.
- Kein allgemeines Redesign des Deckeditors oder Decktischs.
- Keine Änderung an LegalActions, Hidden-Info-Grenzen, Replay oder StateHash.
- Keine Erweiterung der Sortierlogik außerhalb des Deckeditors ohne separat belegten Bedarf.

## Akzeptanzkriterien

- [ ] ICE werden über eine im Corp-Deck eindeutig benannte Option aufsteigend nach `numeric.rezCost` sortiert.
- [ ] Die Corp-Oberfläche bietet keine irreführende Installkosten-Sortierung an, die für ICE nur alphabetisch fällt.
- [ ] Gleichstände werden deterministisch nach Kartengruppe und Name aufgelöst; fehlende Zahlenwerte werden stabil ans Ende gesetzt.
- [ ] Runner-Karten mit `numeric.installCost` bleiben korrekt nach Installkosten sortierbar.
- [ ] Globale Sortierung und Sortierung eines einzelnen Stapels folgen demselben Kostenvertrag.
- [ ] Gezielte Tests decken ICE-Rez-Kosten, Runner-Installkosten und die side-gerechten UI-Optionen ab.
- [ ] Engine, Kartendaten, LegalActions, Hidden-Info, Replay und StateHash bleiben unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Bevorzugte Anker sind `apps/web/features/decks/deck-table-model.ts`, `apps/web/features/decks/DeckTableBoard.tsx` und ein fokussierter Test für die exportierbare Sortier-/Optionslogik.
- Nicht einfach `installCost ?? rezCost` unter dem weiterhin engen Label „Installkosten“ verwenden. Feldsemantik und sichtbare Bezeichnung sollen zusammenpassen.
- Prüfen, ob die Sortieroptionsliste aus einer kleinen side-gerechten Hilfsfunktion kommen sollte, damit globale und stapelbezogene Auswahl nicht auseinanderlaufen.

## Ergebnisnotiz

Noch offen.
