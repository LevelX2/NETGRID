---
activityId: act-2026-07-19-decktable-corp-cost-sort-clarity
status: done
kind: fix
area: ui
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt: 2026-07-19
completedAt: 2026-07-19
branch: codex/deck-table-numeric-sort-fix
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/features/catalog/catalog-detail-loader.ts
  - apps/web/features/catalog/catalog-detail-loader.test.ts
  - apps/web/features/decks/deck-table-model.test.ts
  - docs/activities/done/process-2026-07-19-deck-table-numeric-sort-fix.md
checks:
  - corepack pnpm --filter @netgrid/web test
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm check:test-discovery
  - browser-repro-rez-strength-global
---

# Corp-/ICE-Kostensortierung im Decktisch korrigieren und eindeutig machen

## Ziel

Die Kostensortierung im Decktisch soll Corp-Karten, insbesondere ICE, zuverlässig nach dem tatsächlich vorhandenen Kostenfeld ordnen und das Ergebnis für Nutzer eindeutig überprüfbar machen.

## Kontext und Quellen

- Nutzerfund vom 2026-07-19: Beim Sortieren von ICE-Karten nach Installkosten wirkt die Reihenfolge falsch.
- Nutzer-Retest vom 2026-07-19: Auch die fachlich passende Sortierung nach Rez-Kosten erzeugt sichtbar keine nachvollziehbare Kostenreihenfolge, sondern wirkt zufällig.
- `apps/web/features/decks/DeckTableBoard.tsx` bietet im Corp-Deck gleichzeitig „Alle Stapel nach Installkosten“ und „Alle Stapel nach Rez-Kosten“ sowie dieselben Sortierfelder pro Stapel an.
- `apps/web/features/decks/deck-table-model.ts` bildet die Sortierung `install` ausschließlich auf `numeric.installCost` ab. Fehlende Werte werden ans Ende gelegt und anschließend nach Kartengruppe und Name sortiert.
- Die aktiven ICE-Karten unter `data/cards/` besitzen `numeric.rezCost`, aber kein `numeric.installCost`. Bei der Installkosten-Sortierung werden ICE daher nicht nach ihrer gedruckten Kostenangabe, sondern im Ergebnis alphabetisch sortiert.
- Der reine `rez`-Comparator in `deck-table-model.ts` ist bei vollständig vorhandenen Kartendetails aufsteigend definiert. Der Retest weist daher zusätzlich auf eine Lücke zwischen Detail-Ladezustand, angewandtem Layout und sichtbarer Stapelreihenfolge hin.
- `deckTableCostDetailsReady` wird derzeit nur für „Nach Kartenkosten auf Stapel verteilen“ ausgewertet. Globale und stapelbezogene Zahlen-Sortierungen wie „Rez-Kosten“ bleiben auch auswählbar, solange einzelne `cardDetailsById` und damit `rezCost` fehlen; solche Karten fallen auf Typ/Name zurück.
- `DeckTableBoard.tsx` übergibt `rezCost` nicht an die sichtbare Kartenminiatur. Der verwendete Wert ist nur über Kartendetail/Tooltip prüfbar, wodurch eine falsche oder nur teilweise sortierte Reihenfolge im überlappenden Stapel schwer erkennbar ist.
- Repräsentative gespeicherte Fixture „Chrome Rush Bureau“ enthält im ICE-Stapel unter anderem `Filter` (0), `Data Wall` (1), `Sleeper` (1), `Data Wall 2.0` (2), `Quandary` (2), `Wall of Static` (3), `Crystal Wall` (4) und `Keeper` (4). Diese Folge eignet sich als konkrete Regressionserwartung.
- Die separate Verteilung „Nach Kartenkosten auf Stapel verteilen“ verwendet bereits einen kartentypübergreifenden Fallback über `installCost`, `rezCost` und `cost`.
- Es existiert keine passende offene Activity und keine gezielte Testabdeckung für die Decktisch-Kostensortierung.

## Scope

- Die globalen und stapelbezogenen Kostensortieroptionen im Decktisch side- und kartentypgerecht gestalten.
- Für Corp-/ICE-Kontext eine klar benannte Sortierung bereitstellen, die ICE aufsteigend nach `rezCost` und bei gleichen Werten deterministisch nach Typ und Name ordnet.
- Den vollständigen UI-Pfad aus Detail-Laden, Sortierauswahl, Layout-Aktualisierung und Renderreihenfolge prüfen und die Ursache des Rez-Kosten-Retests beheben.
- Zahlenbasierte Sortierungen während fehlender erforderlicher Kartendetails entweder eindeutig sperren/als ladend markieren oder nach vollständigem Laden garantiert erneut korrekt anwenden.
- Verhindern, dass eine für Corp-Karten praktisch unbelegte Installkosten-Sortierung wie eine funktionslose oder falsche Sortierung angeboten wird.
- Das Verhalten für gemischte Corp-Stapel sowie Karten ohne den gewählten Zahlenwert bewusst festlegen; fehlende Werte sollen stabil und nachvollziehbar einsortiert werden.
- Die für die aktive Sortierung verwendete Zahl im überlappenden Stapel kompakt sichtbar oder zumindest über einen stabilen zugänglichen/testbaren UI-Vertrag überprüfbar machen.
- Gezielte Unit-/UI-Regressionstests mit dem oben genannten Acht-ICE-Muster sowie für die sichtbaren Corp-Sortieroptionen ergänzen.

## Nicht im Scope

- Keine Änderung der Kartenwerte oder ihrer Feldsemantik in `data/cards/`.
- Keine Änderung an Installations- oder Rez-Regeln der Engine.
- Kein allgemeines Redesign des Deckeditors oder Decktischs.
- Keine Änderung an LegalActions, Hidden-Info-Grenzen, Replay oder StateHash.
- Keine Erweiterung der Sortierlogik außerhalb des Deckeditors ohne separat belegten Bedarf.

## Akzeptanzkriterien

- [x] ICE werden über eine im Corp-Deck eindeutig benannte Option aufsteigend nach `numeric.rezCost` sortiert.
- [x] Das Acht-ICE-Muster ergibt exakt die Kostenfolge `0, 1, 1, 2, 2, 3, 4, 4`; Mehrfachkopien bleiben innerhalb ihres Kosten-/Namensblocks zusammen.
- [x] Die Reihenfolge stimmt sowohl unmittelbar nach Öffnen des Decktischs als auch nach Abschluss eines noch laufenden Detail-Ladevorgangs.
- [x] Eine Zahlen-Sortierung kann bei fehlenden erforderlichen Kartendetails nicht still in eine scheinbar zufällige Namenssortierung fallen.
- [x] Die Corp-Oberfläche bietet keine irreführende Installkosten-Sortierung an, die für ICE nur alphabetisch fällt.
- [x] Gleichstände werden deterministisch nach Kartengruppe und Name aufgelöst; fehlende Zahlenwerte werden stabil ans Ende gesetzt.
- [x] Runner-Karten mit `numeric.installCost` bleiben korrekt nach Installkosten sortierbar.
- [x] Globale Sortierung und Sortierung eines einzelnen Stapels folgen demselben Kostenvertrag.
- [x] Der im Stapel verwendete Kostenwert oder Sortierstatus ist sichtbar beziehungsweise über einen stabilen Accessibility-/Testvertrag überprüfbar.
- [x] Gezielte Tests decken ICE-Rez-Kosten, fehlende/verspätete Details, Runner-Installkosten und die side-gerechten UI-Optionen ab.
- [x] Engine, Kartendaten, LegalActions, Hidden-Info, Replay und StateHash bleiben unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Bevorzugte Anker sind `apps/web/features/decks/deck-table-model.ts`, `apps/web/features/decks/DeckEditorPanel.tsx`, `apps/web/features/decks/DeckTableBoard.tsx` und ein fokussierter Test für die exportierbare Sortier-/Optionslogik.
- Nicht einfach `installCost ?? rezCost` unter dem weiterhin engen Label „Installkosten“ verwenden. Feldsemantik und sichtbare Bezeichnung sollen zusammenpassen.
- Prüfen, ob die Sortieroptionsliste aus einer kleinen side-gerechten Hilfsfunktion kommen sollte, damit globale und stapelbezogene Auswahl nicht auseinanderlaufen.
- Den reinen Comparator zuerst mit vollständig bestücktem `detailsById` absichern; danach einen UI-näheren Test mit anfangs fehlenden und später eintreffenden Details ergänzen.

## Ergebnisnotiz

Der dauerhafte Namens-Fallback entstand nicht im Comparator, sondern im
Detail-Ladepfad: Kartendetails wurden erst nach Abschluss eines gemeinsamen
`Promise.all` veröffentlicht, sodass ein einziger hängender Abruf sämtliche
Rez-/Stärkewerte unbegrenzt zurückhielt. Außerdem forderte der Effekt für das
aktuelle Deck bekannte Nicht-Agenda-Karten nicht direkt an.

Erfolgreiche Details werden nun fortschreitend übernommen, parallele Abrufe
dedupliziert und alle fehlenden Karten des ausgewählten Decks priorisiert.
Numerische Sortierungen sind bis zur benötigten Detailbereitschaft eindeutig
als ladend gesperrt. Korp zeigt keine Installkosten-Sortierung mehr, Runner
behält sie. Der aktive Zahlenwert erscheint pro Karte als zugängliches Badge.

Der Browser-Repro mit zehn ICE ergab für Rez-Kosten
`0, 2, 2, 4, 5, 5, 6, 6, 8, 9` und für Stärke
`0, 1, 2, 2, 4, 4, 5, 5, 5, 6`; die globale Rez-Sortierung war identisch.
57 Web-Testdateien mit 663 Tests, Web-Typecheck und Test-Discovery-Gate sind
grün.
