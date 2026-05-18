---
activityId: act-2026-05-19-series-single-game-forfeit-concept
status: inbox
kind: concept
area: server
priority: high
primaryAgent: release-planning-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt:
completedAt:
branch:
releaseTarget: private match series lifecycle
blockedBy: []
resultArtifacts: []
checks: []
relatedActivities:
  - act-2026-05-19-series-single-game-forfeit-implementation
---

# Matchserie: Einzelnes Spiel aufgeben konzipieren

## Ziel

Für private Matchserien mit zwei oder mehr geplanten Spielen soll fachlich sauber festgelegt werden, wie ein Spieler ein einzelnes laufendes Serienspiel aufgibt, ohne dadurch automatisch die komplette Serie abzubrechen.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-19: Bei einer Match-Serie von zwei oder mehr Spielen soll es möglich sein, ein einzelnes Spiel aufzugeben, nicht das ganze Match. Das soll zuerst durchdacht, dann konzipiert und danach sinnvoll umgesetzt werden.
- `docs/releases/special/s01/match-series-spec.md` legt fest: Die private Matchserie ist eine Hülle über einzelnen Spielen. Ein Spiel bleibt Engine-Einheit mit eigenem `GameState`, Replay und finalem StateHash. Die Serie speichert nur Metadaten, Ergebnisse und Referenzen.
- `docs/releases/special/s01/match-series-spec.md` beschreibt `two_game_side_swap` bisher als zwei private Spiele mit Seitenwechsel und eine Serienwertung über Matchpunkte.
- `docs/releases/v1/v1-0-4-private-match-lifecycle/plan.md` definiert Forfeit als Match-Lifecycle-Ergebnis: kein Engine-Sieg, letzter echter Engine-StateHash bleibt final, Replay enthält nur Engine-Ereignisse bis dahin.
- Aktuelles Risiko: Der bestehende Begriff `forfeitMatch` kann im Serienkontext als komplette Serienaufgabe verstanden oder umgesetzt werden, obwohl fachlich nur das aktuelle Einzelspiel beendet werden soll.

## Scope

- Einen kurzen Konzept-/Vertragsabschnitt für "Einzelspiel-Aufgabe innerhalb einer privaten Matchserie" erstellen oder bestehende Serie-/Lifecycle-Dokumentation gezielt ergänzen.
- Festlegen, wie ein aufgegebenes Serienspiel in `series.results` gezählt wird:
  - Gewinner ist die Gegenseite der aufgebenden Seite.
  - Abschlussgrund ist `forfeit`.
  - `finalEngineStateHash` bleibt der letzte echte Engine-StateHash des Einzelspiels.
  - Die Serienwertung nutzt eine definierte Agenda-/Matchpunkt-Regel für den aufgebenden und gewinnenden Spieler.
- Festlegen, ob und wie `series-next` nach Einzelspiel-Aufgabe verfügbar bleibt, solange noch geplante Spiele offen sind.
- Klären, wie UI-Texte unterscheiden:
  - "Spiel aufgeben" beendet nur dieses Serienspiel.
  - "Serie abbrechen" oder "Matchserie abbrechen" wäre ein separater, nicht in diesem Paket enthaltener Vertrag.
- Human-vs-Human und Human-vs-KI betrachten; KI darf weiterhin nicht aktiv aufgeben, sofern kein separater KI-Forfeit-Scope eröffnet wird.
- Anforderungen für Server-, Shared-Contract-, Web- und Visibility-Tests ableiten.
- Folgeumsetzungspaket `act-2026-05-19-series-single-game-forfeit-implementation` nach Konzeptabschluss präzisieren, falls das Konzept neue Details ergibt.

## Nicht im Scope

- Keine direkte Codeumsetzung in diesem Konzeptpaket.
- Kein offizielles Turnier-, Ranking-, Public-Lobby- oder Anti-Abuse-Regelwerk.
- Kein kompletter Serienabbruch-/Serien-Concede-Flow.
- Keine Änderung der Engine-Regelautorität; Aufgabe bleibt Match-/Server-Lifecycle und kein Engine-Event.
- Keine Änderung an einzelnen Kartenregeln, Replayformaten oder StateHash-Berechnung.
- Keine Erweiterung auf öffentliche Matchmaking- oder Ranked-Formate.

## Akzeptanzkriterien

- [ ] Es gibt einen dokumentierten Vertrag für Einzelspiel-Aufgabe innerhalb einer privaten Matchserie.
- [ ] Der Vertrag trennt klar Einzelspiel-Aufgabe von kompletter Serienaufgabe.
- [ ] Serienwertung, Agenda-/Matchpunkt-Folgen und `series-next`-Verfügbarkeit sind festgelegt.
- [ ] Hidden-Info-, Token-, Decklisten-, Replay- und StateHash-Grenzen sind explizit benannt.
- [ ] UI-Wording und Confirm-Text sind konzeptionell festgelegt, damit Nutzer nicht versehentlich die gesamte Serie abbrechen.
- [ ] Das Umsetzungspaket ist nach Konzeptabschluss ausreichend konkret oder wurde entsprechend nachgeschärft.

## Umsetzungshinweise

- Primärer Folgeagent für dieses Konzept: `release-planning-agent`.
- Wahrscheinliche Artefakte:
  - `docs/releases/special/s01/match-series-spec.md`
  - optional ein kleines ergänzendes Decision-/Spec-Artefakt unter `docs/releases/special/s01/`
  - optional `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`, falls das Konzept als dauerhaft relevanter Serienvertrag gilt.
- Bei der Regelentscheidung bevorzugt den bestehenden Modellgedanken: Einzelspiele bleiben eigene Engine-/Replay-/StateHash-Einheiten; die Serie aggregiert nur side-sichere Ergebnisse.

## Ergebnisnotiz

Noch offen.
