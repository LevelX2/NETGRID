# V1.1.0 Requirements - Setup/Game-End M2 und NETGRID-Statusklarheit

Stand: 2026-05-07
Status: implemented

## Scope

V1.1.0 setzt den M2-Setup-/Game-End-Vertrag aus `docs/derived/SETUP_GAME_END_0.93_SPEC.md` produktiv um und integriert die NETGRID-Statusklarheit aus `docs/releases/v1/v1-1-0-setup-game-end-m2/plan.md`.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V110-MUST-001 | Neue Produktspiele starten in einem expliziten Setup-Abschnitt. |
| V110-MUST-002 | Runner erhält zuerst eine private Mulligan-Choice, danach Korp. |
| V110-MUST-003 | Mulligan-Choices laufen ausschließlich über `LegalActions`/`PlayerActions` mit `resolve_choice`. |
| V110-MUST-004 | `applyAction` revalidiert Seite, Choice, StateVersion und Auswahl. |
| V110-MUST-005 | Mulligans mischen und ziehen deterministisch über Seed, RandomCounter und RandomDrawRecords. |
| V110-MUST-006 | Setup-/Mulligan-Events leaken keine Karten aus Grip/HQ/Stack/R&D. |
| V110-MUST-007 | Replays und StateHash bleiben nach Keep und Mulligan deterministisch. |
| V110-MUST-008 | Produktstandard für `agendaPointsToWin` ist 7. |
| V110-MUST-009 | PlayerViews enthalten aktuellen Agenda-Wert und Zielwert. |
| V110-MUST-010 | Game-End-Gründe für Agenda-Sieg, Korp-Deckout und Flatline sind konsolidiert. |
| V110-MUST-011 | Korp-Deckout im mandatory draw beendet das Spiel als Runner-Sieg ohne Phase-Überschreibung. |
| V110-MUST-012 | Flatline bleibt side-sicher und verwendet den vorhandenen Damage-Vertrag. |
| V110-MUST-013 | Runner-Deckout wird nur vorbereitet, nicht als neue Siegbedingung aktiviert. |
| V110-MUST-014 | Identity-Karten sind als offene Startkarten in PlayerViews formalisiert. |
| V110-MUST-015 | Archives-facedown-Grundlage bleibt side-safe und erweitert keinen Full-Archives-Access. |
| V110-MUST-016 | Multiplayer, Reconnect und KI-Flows liefern Setup-Choices side-safe aus. |
| V110-MUST-017 | Korp-KI kann Setup-Mulligan automatisch über denselben Action-Pfad auflösen. |
| V110-MUST-018 | Web-UI zeigt sichtbar `Korp` statt `Corp`. |
| V110-MUST-019 | Web-UI nutzt Lucide-Rollenicons für Runner/Korp, Agenda-Dossier-Icon in Agenda-Blau und Tag-Icon. |
| V110-MUST-020 | Run-Start-Buttons auf Außenservern verwenden kein Schild-/Defense-Icon. |
| V110-MUST-021 | Setup-/Mulligan-UI ist side-safe und zeigt wartenden Seiten keine private Entscheidung. |

## Nicht-Ziele

- Keine Prevention/Replacement-, Discard/Handlimit-, Core-Damage- oder Full-Archives-Access-Erweiterung.
- Keine Runner-Deckout-Siegbedingung ohne separates Regelgate.
- Keine neuen Karten, offiziellen Assets, Card Backs, Public-Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turnierfunktionen.
- Keine neue Regelautorität in UI, Server, KI oder Browser.

## Gate-Ergebnis

Die Requirements sind durch Implementierung, Tests, Browser-E2E und Final Review erfüllt.

`V1_1_0_requirements_implemented: true`
