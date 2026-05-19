---
activityId: act-2026-05-19-player-clock-grace-period-contract
status: done
kind: concept
area: server
priority: high
primaryAgent: release-planning-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: player clock / time controls
blockedBy: []
resultArtifacts:
  - docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md
  - docs/architecture/live-match/README.md
  - docs/activities/inbox/act-2026-05-19-player-clock-grace-period-implementation.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - Select-String -Path docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md -Pattern "player_clock|time_expired|Grundfrist|StateHash|AIInput|PC-T020"
  - Select-String -Path docs/activities/inbox/act-2026-05-19-player-clock-grace-period-implementation.md -Pattern "blockedBy|player-clock|time_expired|PC-T001|Fake|serverautoritativ"
  - git diff --check
relatedActivities:
  - act-2026-05-17-visible-match-timer-concept
  - act-2026-05-17-timer-ui-only-clock
  - act-2026-05-17-engine-hard-timeout-contract
  - act-2026-05-19-player-clock-grace-period-implementation
---

# Spielerzeit mit Grundfrist konzipieren

## Ziel

NETGRID soll optional ein einfaches Spielerzeitmodell erhalten: Beide Seiten haben ein eigenes Zeitkonto; jede zugewiesene Entscheidung bekommt zunächst eine kostenfreie Grundfrist; erst die Zeit oberhalb dieser Grundfrist wird vom Zeitkonto der aktuell entscheidenden Seite abgezogen. Fällt ein Zeitkonto auf 0, verliert diese Seite die Partie.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-19: Partien sollen optional mit Zeitbegrenzung starten können.
- Nutzeranforderung vom 2026-05-19: Beim Spielstart sollen mehr Auswahlmöglichkeiten für die Gesamtzeit und passende Einstellungsmöglichkeiten für die Grundzeit/Grundfrist angeboten werden.
- Nutzeranforderung vom 2026-05-19: Zeitinformationen können besser in einem Zeitbalken unter der Statusleiste angezeigt werden, statt direkt in Runner-/Korp-Panels.
- Nutzeranforderung vom 2026-05-19: Wenn ohne Zeitbegrenzung gespielt wird, wird keine Spielerzeit abgezogen und es gibt keine Niederlage durch Zeitablauf.
- `act-2026-05-17-visible-match-timer-concept` entschied bisher nur den allgemeinen Timer-Rahmen und hielt harte Folgen zurück.
- `act-2026-05-17-timer-ui-only-clock` setzte eine sichtbare UI-Uhr ohne Regelwirkung um.
- `act-2026-05-17-engine-hard-timeout-contract` schnitt harte Timeout-Auflösungen eng auf Auto-Decline/Auto-Pass und schloss globale Partiezeit mit Spielverlust damals noch aus. Dieses neue Paket ist daher eine neue Produktentscheidung und kein stilles Umdeuten des alten Vertrags.
- Vorhandene UI-Helfer: `apps/web/app/match-timer-ui.ts` formatiert Dauer und erkennt aktuell nur den sichtbaren Entscheidungskontext, nicht autoritative Spielerzeit.

## Scope

- Einen verbindlichen Produkt-/Server-/Engine-Vertrag für optionales Spielerzeitmodell dokumentieren.
- Einstellbare Startoptionen festlegen:
  - ohne Zeitbegrenzung,
  - mit Zeitbegrenzung,
  - Zeitkonto je Spieler,
  - einheitliche Grundfrist je Aktivität/Entscheidung.
- Mehr Auswahl bei der Gesamtzeit definieren, z. B. mehrere sinnvolle Presets statt nur ein einzelner Wert:
  - kurze Testpartie,
  - 10 Minuten,
  - 15 Minuten,
  - 20 Minuten,
  - 30 Minuten,
  - 45 Minuten,
  - optional benutzerdefinierter Wert, falls UI und Validierung klein bleiben.
- Grundfrist-Auswahl definieren, z. B.:
  - 0 Sekunden,
  - 5 Sekunden,
  - 10 Sekunden,
  - 15 Sekunden,
  - 30 Sekunden,
  - optional benutzerdefiniert mit Min-/Max-Grenzen.
- Autoritative Zeitlogik festlegen:
  - Zeit läuft nur für die Seite, der aktuell eine Entscheidung, Auswahl oder Aktivität zugewiesen ist.
  - Maßgeblich ist nicht pauschal die Zugseite, sondern der aktuelle Entscheidungsinhaber.
  - Innerhalb der Grundfrist kein Abzug.
  - Nur Überschreitung der Grundfrist wird sekundenweise vom jeweiligen Spielerzeitkonto abgezogen.
  - Bei Aktivitätswechsel beginnt die Grundfrist neu.
  - Automatische Effekte, Animationen, Kartenanzeigezeiten, Chronikmeldungen und technische Wartezeiten verbrauchen keine Spielerzeit.
- Spielverlust bei Zeitablauf als reguläres Partieende spezifizieren:
  - Zeitablauf darf nur greifen, wenn die Partie nicht bereits anderweitig beendet wurde.
  - Gewinner ist die Gegenseite.
  - Ergebnisgrund, ResultSummary, Chronik und UI müssen side-sicher sein.
- UI-Ort festlegen:
  - bevorzugt ein Zeitbalken unter der Statusleiste,
  - nicht primär direkt in Runner-/Korp-Panels, außer als sekundäre Kurzinfo.
  - Der Balken zeigt beide Zeitkonten und den aktuell belasteten/entscheidenden Spieler.
  - Während der Grundfrist normale Darstellung; nach Ablauf der Grundfrist deutliche Warnung mit rotem Hintergrund/Segment und sekundenweisem sichtbarem Abzug.
- Chronikvertrag festlegen:
  - Start mit Zeitbegrenzung inklusive Spielerzeit und Grundfrist protokollieren.
  - Zeitablauf und Partieende wegen Zeitablauf protokollieren.
  - Normale kurze Entscheidungen nicht einzeln protokollieren.
- Hidden-Info-, Token-, AIInput-, Replay-, StateHash-, Reconnect- und Undo-Grenzen dokumentieren.
- Umsetzungspaket `act-2026-05-19-player-clock-grace-period-implementation` nach Vertragsabschluss präzisieren.

## Nicht im Scope

- Keine direkte Codeumsetzung in diesem Konzeptpaket.
- Kein Schachuhrenmodell ohne Grundfrist.
- Keine Zeitstrafe für Animationen, reine Anzeige, Chronik oder technische Latenz.
- Keine client-only-Autorität für Zeitverlust oder Spielverlust.
- Kein öffentliches Ranked-/Turnier-Zeitregelwerk.
- Keine Änderung an KI-internen Planungs-Timeouts; AI-Benchmark-`timeoutUsed` bleibt getrennt von Spielerzeit.
- Keine Disconnect-/Abwesenheits-Policy außerhalb des Spielerzeitmodells, sofern sie nicht explizit als spätere Folgeactivity geschnitten wird.

## Akzeptanzkriterien

- [ ] Es gibt einen dokumentierten Vertrag für optionales Spielerzeitmodell mit Zeitkonto und Grundfrist.
- [ ] Der Vertrag trennt ausgeschaltete Zeitbegrenzung klar von aktivierter Zeitbegrenzung.
- [ ] Mehrere Gesamtzeit-Presets und Grundfrist-Presets sind festgelegt, inklusive sinnvoller Min-/Max-Grenzen.
- [ ] Es ist definiert, welche Seite Zeit verbraucht: aktuelle Entscheidungs-/Aktivitätszuweisung statt nur Zugseite.
- [ ] Grundfrist-Reset bei jeder neuen Aktivität ist beschrieben.
- [ ] Zeitablauf als reguläres Partieende mit Gewinner, Verlierer, Chronik, ResultSummary und UI ist beschrieben.
- [ ] Der bevorzugte UI-Ort ist als Zeitbalken unter der Statusleiste festgelegt oder begründet verworfen.
- [ ] Warnzustand nach Grundfristablauf ist beschrieben: roter Hintergrund/Segment, sichtbarer sekundenweiser Abzug.
- [ ] Hidden-Info-, Reconnect-, Undo-, Replay- und StateHash-Gates sind explizit benannt.
- [ ] Das Umsetzungspaket ist nach Abschluss ausreichend konkret oder wurde nachgeschärft.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Wahrscheinliche Vertragsartefakte:
  - neues oder ergänztes Artefakt unter `docs/architecture/live-match/`,
  - optional Ergänzung an `docs/releases/special/s01/` oder einem späteren V1.x-Releaseplan, falls die Umsetzung releasegebunden wird.
- Das alte UI-only-Timerverhalten darf als Anzeigegrundlage dienen, aber nicht als Autorität für Zeitverlust.
- Besonders sorgfältig entscheiden, ob Spielerzeit in Engine-State, Server-Match-State oder einem serverautoritativen Zeit-Snapshot lebt. Der Nutzerwunsch sagt "Bestandteil des maßgeblichen Game State"; die Umsetzung muss klären, wie das replay-/StateHash-stabil modelliert wird, ohne instabile Wallclock-Zeit in deterministische Replays einzubauen.

## Ergebnisnotiz

Umgesetzt. Der neue Vertrag `player-clock-grace-period-contract-2026-05-19.md` legt Spielerzeit als optionalen privaten Matchmodus fest: Default ohne Zeitbegrenzung, Presets für Zeitkonto und Grundfrist, Zeitverbrauch durch den aktuellen Entscheidungseigner, Grundfrist-Reset je Aktivitätswechsel, serverautoritativer Zeitablauf mit `time_expired` und klare UI-, Chronik-, ResultSummary-, Hidden-Info-, Reconnect-, Undo-, Replay-, StateHash- und KI-Grenzen. Das Umsetzungspaket wurde entblockt und auf den Vertrag samt Testmatrix `PC-T001` bis `PC-T020` nachgeschärft.
