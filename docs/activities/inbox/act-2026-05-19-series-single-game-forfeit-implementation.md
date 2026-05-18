---
activityId: act-2026-05-19-series-single-game-forfeit-implementation
status: inbox
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
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
  - act-2026-05-19-series-single-game-forfeit-concept
---

# Matchserie: Einzelspiel-Aufgabe umsetzen

## Ziel

Nach abgeschlossenem Konzept soll die App erlauben, ein einzelnes laufendes Spiel innerhalb einer privaten Matchserie aufzugeben, die Serie korrekt fortzuführen und das nächste Serienspiel anzubieten, solange noch geplante Spiele offen sind.

## Kontext und Quellen

- Geblockt durch: `act-2026-05-19-series-single-game-forfeit-concept`.
- Konzept abgeschlossen in `docs/releases/special/s01/match-series-spec.md`, Abschnitt `Einzelspiel-Aufgabe innerhalb einer Serie`.
- Bestehender Vertrag aus S01: Eine Matchserie liegt oberhalb einzelner Spiele; jedes Spiel behält eigenen `GameState`, Replay und finalen StateHash.
- Bestehender Lifecycle-Vertrag aus V1.0.4: Forfeit ist ein Server-/Match-Lifecycle-Ergebnis, kein Engine-Sieg und kein Engine-Event.
- Konzeptentscheidung: `forfeitMatch` beendet in einer privaten Matchserie nur das aktuelle Einzelspiel; die Serie bleibt fortsetzbar, solange geplante Spiele offen sind.
- Konzeptentscheidung: Gewinner erhält 10 Matchpunkte, Verlierer erhält die bis zur Aufgabe erzielten eigenen Agenda-Punkte; `finalEngineStateHash` bleibt der letzte echte Engine-StateHash.
- Bestehende Code-Startpunkte laut Suchlauf:
  - `apps/server/src/multiplayer.ts`: Serienzustand, `series-next`, `forfeitMatch`, Serienresultat-Aggregation.
  - `packages/shared/src/api-contracts.ts`: API-Result-/Series-Summary-Verträge.
  - `apps/web/app/page.tsx`: Aufgabe-UI, Ergebnisfenster, Folgespiel-Aktion.
  - `apps/server/src/multiplayer.test.ts` und Web-/Visibility-Tests.

## Scope

- Server-Lifecycle so anpassen, dass Forfeit eines aktiven Serienspiels ein Serienspiel-Ergebnis erzeugt, nicht automatisch die gesamte Serie terminal beendet.
- `series.results` für Forfeit-Spiele nach dem Konzeptvertrag befüllen.
- `GameResultSummary.series` nach einem Serienspiel-Forfeit side-sicher liefern.
- `series-next` nach einem Serienspiel-Forfeit erlauben, wenn noch Spiele offen sind und kein Folgespiel existiert.
- UI-Text und Bestätigungsdialog so trennen, dass Nutzer verstehen: Diese Aktion gibt nur das aktuelle Spiel auf.
- Ergebnisfenster nach Einzelspiel-Aufgabe in einer Serie mit Serienstand und Folgespiel-Aktion anzeigen.
- Human-vs-KI berücksichtigen: Mensch darf das aktuelle Serienspiel gegen KI aufgeben; KI bleibt ohne aktive Aufgabe.
- Server-, Shared-/API-, Web- und Visibility-Regressionen ergänzen.

## Nicht im Scope

- Kein kompletter Serienabbruch-Button.
- Keine öffentliche Turnier-/Ranking-/Matchmaking-Logik.
- Keine Änderung an Engine-`applyAction`, Replay oder StateHash-Berechnung.
- Keine neuen offiziellen Netrunner-Turnierregeln.
- Keine Änderung an normalen Einzelspiel-Forfeits außerhalb von Serien, außer notwendige Regressionen zeigen bestehenden Drift.
- Keine Speicherung von Decklisten, Tokens, `cardInstances` oder privaten Payloads in öffentlichen Serienzusammenfassungen.

## Akzeptanzkriterien

- [ ] In einer privaten Serie mit mindestens zwei geplanten Spielen beendet "Spiel aufgeben" nur das aktuelle Spiel.
- [ ] Die Gegenseite wird für dieses Einzelspiel als Gewinner geführt; der Abschlussgrund ist side-sicher als `forfeit` erkennbar.
- [ ] Der letzte echte Engine-StateHash bleibt der finale Engine-StateHash des aufgegebenen Spiels.
- [ ] Das aufgegebene Spiel erscheint korrekt in `series.results` und in der Serienwertung nach Konzeptvertrag.
- [ ] Nach Aufgabe von Spiel 1 ist `series-next` verfügbar, sofern Spiel 2 noch offen ist.
- [ ] Nach dem letzten geplanten Spiel wird die Serie korrekt abgeschlossen, auch wenn das letzte Spiel durch Aufgabe endet.
- [ ] Normale Einzelspiel-Aufgabe ohne Serie bleibt unverändert und terminal.
- [ ] Human-vs-KI: Menschliche Aufgabe stoppt KI-Pacing/`advance_ai`; KI gibt weiterhin nicht aktiv auf.
- [ ] UI-Confirm-Text sagt klar, dass nur dieses Spiel aufgegeben wird, nicht die ganze Serie.
- [ ] Result Modal und Serienstand enthalten keine Hidden Cards, Tokens, Decklisten, `cardInstances` oder privaten Payloads.
- [ ] Server-Tests decken Forfeit in Spiel 1 einer Serie, `series-next` danach und Forfeit im letzten Serienspiel ab.
- [ ] Web-/Contract-Tests decken UI-Wording, Folgespiel-Aktion und Payload-Redaction ab.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Konzeptpaket ist abgeschlossen; Umsetzung kann direkt claimen.
- Wahrscheinlich muss die Serienaggregation Forfeit-Ergebnisse genauso wie Engine-Finished-Ergebnisse aufnehmen, aber mit `reason: "forfeit"` und dem letzten echten Engine-StateHash.
- Besonders prüfen, ob bestehende Guards nur `record.match.status === "finished"` für `series-next` akzeptieren und ob `forfeited` als einzelspiel-terminaler Status im Serienkontext ebenfalls zulässig sein muss.
- REST bleibt autoritativer Schreibpfad; WebSocket nur Broadcast.

## Ergebnisnotiz

Noch offen.
