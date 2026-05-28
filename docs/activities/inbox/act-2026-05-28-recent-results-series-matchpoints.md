---
activityId: act-2026-05-28-recent-results-series-matchpoints
status: inbox
kind: fix
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt:
completedAt:
branch:
releaseTarget: Private Result History UX
blockedBy: []
resultArtifacts: []
checks: []
---

# Letzte Ergebnisse: Matchserien aggregieren und Matchpunkte anzeigen

## Ziel

Die Menüleistenansicht für letzte Spiele soll fachlich letzte Ergebnisse zeigen: Ein normales Einzelspiel erscheint als ein Eintrag, eine private Matchserie erscheint genau einmal als Serienergebnis. Matchpunkte müssen sichtbar sein und dieselbe Wertung verwenden wie das Ergebnisfenster nach Spiel- oder Serienende.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-28: Die Menüleistenansicht `Letzte Spiele` zeigt aktuell einzelne beendete Spiele, aber nicht die vergebenen Matchpunkte und nicht die Matchserie als fachliche Einheit.
- `docs/releases/special/s01/match-series-spec.md`: Die private Matchserie ist eine Hülle über Einzelspielen; Einzelspielgewinner erhält 10 Matchpunkte, Verlierer erhält seine erzielten Agenda-Punkte, Draws geben beiden ihre Agenda-Punkte.
- `packages/shared/src/api-contracts.ts`: `ApiRecentGameResult` enthält derzeit nur Einzelspielwerte und minimale `series`-Metadaten.
- `apps/server/src/multiplayer.ts`: `listRecentGameResults` liefert aktuell fertige Einzelspiele, sortiert nach `match.updatedAt`, und `recentGameResultEntryFor` aggregiert keine Serien.
- `apps/web/app/page.tsx`: `RecentGamesPanel` und `RecentGameResultCard` rendern aktuell Einzelspielkarten mit Agenda-Punkten, aber ohne Matchpunkte und ohne Serienkarte.
- Verwandte erledigte Pakete: `docs/activities/done/act-2026-05-19-series-single-game-forfeit-concept.md`, `docs/activities/done/act-2026-05-19-series-single-game-forfeit-implementation.md`, `docs/activities/done/act-2026-05-22-match-series-overall-winner-result.md`.

## Scope

- Recent-Results-API so erweitern oder ersetzen, dass sie Ergebnis-Einträge statt nur Einzelspiel-Einträge liefern kann.
- Serien nach `seriesId` aggregieren und als genau einen Recent-Eintrag zurückgeben.
- Einzelspiele ohne Serienbezug weiterhin als eigene Recent-Einträge zurückgeben.
- Matchpunkte serverseitig berechnen und im API-Viewmodell transportieren.
- Serien-Einträge mit Gesamt-Matchpunkten, Gesamt-Agenda-Punkten, Serienausgang, Serienstatus, Spielanzahl und kompakten Einzelspielzeilen ausstatten.
- Web-UI der Menüleistenansicht von der reinen Einzelspielkarte zu einer Ergebnisliste weiterentwickeln:
  - Einzelspiel: Agenda-Punkte und Matchpunkte anzeigen.
  - Matchserie: Gesamtwertung prominent anzeigen und Einzelspiele kompakt darunter aufführen.
- Anzeige weiterhin als private, read-only Ergebnisübersicht behandeln.
- API- und UI-Tests für Einzelspiel, Zwei-Spiel-Serie und Hidden-Info-Redaction ergänzen.

## Nicht im Scope

- Kein neues Matchserienformat.
- Keine Änderung an Engine, `GameState`, Replay oder StateHash.
- Keine Änderung an LegalActions, PlayerActions oder Wincondition-Regeln.
- Kein öffentlicher Turnier-, Ranking-, Matchmaking- oder Profilverlauf.
- Kein Zugriff auf verdeckte Kartendaten, Decklisten, Session-Tokens, Reconnect-Tokens, Join-Tokens oder private Payloads.
- Kein vollständiger Replay-Viewer und keine neue Replay-Persistenz.
- Kein Serienabbruch- oder Serienaufgabe-Vertrag.

## Akzeptanzkriterien

- [ ] Eine abgeschlossene `two_game_side_swap`-Serie erscheint in der Menüleistenansicht genau einmal, auch wenn zwei Einzelspiele abgeschlossen wurden.
- [ ] Einzelspiele ohne `seriesId` erscheinen weiterhin jeweils als eigener Eintrag.
- [ ] Die Recent-Liste ist nach dem letzten Ergebniszeitpunkt sortiert; bei Serien zählt das späteste beendete Serienspiel.
- [ ] Einzelspiel-Einträge zeigen die vergebenen Matchpunkte: Gewinner 10, Verlierer seine erzielten Agenda-Punkte; bei Draw beide ihre Agenda-Punkte.
- [ ] Serien-Einträge zeigen die Gesamt-Matchpunkte beider Spieler und die Einzelspiel-Aufschlüsselung.
- [ ] Die Serienwertung stimmt mit der bestehenden `GameResultSummary.series`-Wertung überein.
- [ ] Forfeit-Ergebnisse innerhalb einer Serie werden mit der bestehenden Serienwertung abgebildet: Gewinner 10 Matchpunkte, Verlierer tatsächliche Agenda-Punkte, letzter echter Engine-StateHash bleibt nur Nachweisfeld.
- [ ] Die API-Antwort enthält keine Session-Tokens, Reconnect-Tokens, Join-Tokens, Token-Hashes, Decklisten, `cardInstances`, privaten Payloads oder verdeckten Kartendaten.
- [ ] Die Web-UI zeigt bei Serien nicht mehr nur `Spiel 1/2` oder `Spiel 2/2` als Einzelkarten, sondern eine Serienkarte.
- [ ] Der bestehende `limit`-Parameter bleibt sinnvoll begrenzt; die Begrenzung bezieht sich auf Ergebnis-Einträge, nicht auf einzelne Spiele vor Serienaggregation.
- [ ] Server-Tests decken Serienaggregation, Matchpunktberechnung, Sortierung und Redaction ab.
- [ ] Web-Tests decken Einzelspielkarte, Serienkarte mit zwei Spielen und leeren/ladefehlerhaften Zustand ab.

## Umsetzungshinweise

- Bevorzugt ein neues Shared-API-Viewmodell einführen, z. B. `ApiRecentResultEntry`, statt `ApiRecentGameResult` mit optionalen Serienfeldern weiter aufzublähen.
- Die Matchpunktlogik nicht im Client nachbauen. Der Server soll die Recent-Viewdaten aus gespeicherten Serienresultaten oder aus derselben Bewertungslogik ableiten, die `GameResultSummary.series` verwendet.
- Bei Human-vs-Human und Human-vs-KI side-sichere Anzeigenamen verwenden; keine lokalen Sessiondaten für die Ergebnisliste voraussetzen.
- Für Serienkarten Spieler-Slots stabil halten. Da die Seiten zwischen Spiel 1 und Spiel 2 wechseln, darf die Seriengesamtwertung nicht nur als Runner-vs-Korp-Summe verstanden werden.
- UI-Bezeichnung prüfen: `Letzte Spiele` kann weiterhin als Tab-Label bleiben, die Panel-Überschrift sollte aber fachlich `Letzte Ergebnisse` oder `Abgeschlossene Ergebnisse` führen.
- Falls während der Umsetzung sichtbar wird, dass eine eigenständige Ergebnisdetailansicht mehr Scope braucht, zuerst die Listenkarte fertigstellen und für das Detailpanel ein Folgepaket anlegen.

## Ergebnisnotiz

Noch nicht umgesetzt.
