---
activityId: act-2026-05-19-player-clock-grace-period-implementation
status: done
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: player clock / time controls
blockedBy: []
resultArtifacts:
  - packages/shared/src/api-contracts.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/chronicle.ts
  - apps/web/app/match-start-storage.ts
checks:
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "player clock"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts match-start-storage.test.ts
  - git diff --check
relatedActivities:
  - act-2026-05-19-player-clock-grace-period-contract
  - act-2026-05-17-timer-ui-only-clock
  - act-2026-05-17-engine-hard-timeout-contract
---

# Spielerzeit mit Grundfrist umsetzen

## Ziel

Nach abgeschlossenem Vertrag soll NETGRID optionale Spielerzeit mit Grundfrist umsetzen: Startoptionen für Zeitkonto und Grundfrist, serverautoritativer Zeitabzug je aktuell entscheidender Seite, Zeitablauf als Partieende und ein klarer Zeitbalken unter der Statusleiste.

## Kontext und Quellen

- Vertragsgrundlage: `docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md`.
- Vorhandene UI-only-Uhr: `apps/web/app/match-timer-ui.ts`, `apps/web/app/match-timer-ui.test.ts`, `apps/web/app/page.tsx`.
- Nutzeranforderung: Mehr Auswahl bei Gesamtzeit; Grundzeit/Grundfrist einstellbar; Anzeige bevorzugt in einem Zeitbalken unter der Statusleiste.
- Vertragsentscheidung: Spielerzeit ist opt-in; Default `none` bleibt ohne Zeitabzug und ohne Zeitablauf-Niederlage. `player_clock` nutzt gleiche Zeitkonten und gleiche Grundfrist je Side.

## Scope

- Spielstart-/Matchstart-Einstellungen erweitern:
  - ohne Zeitbegrenzung,
  - mit Zeitbegrenzung,
  - Zeitkonto je Spieler aus den Vertragspresets 5/10/15/20/30/45 Minuten,
  - Grundfrist je Entscheidung aus den Vertragspresets 0/5/10/15/30 Sekunden,
  - optionale Custom-Werte nur mit servervalidierten Grenzen 1 bis 120 Minuten und 0 bis 60 Sekunden.
- Settings in Shared/API/Server-Payloads und lokale Matchstart-Speicherung aufnehmen, ohne Tokens/Deckdaten zu leaken.
- Serverautoritative Zeitdaten führen:
  - verbleibende Zeit Runner,
  - verbleibende Zeit Korp,
  - aktuell zeitbelasteter beziehungsweise entscheidender Spieler,
  - Startzeitpunkt der aktuellen Aktivitätszuweisung,
  - bereits abgerechnete belastete Zeit dieser Aktivität,
  - Grundfriststatus,
  - Belastung nur oberhalb der Grundfrist.
- Aktivitätswechsel korrekt erkennen:
  - PendingChoices,
  - LegalAction-Fenster,
  - Rez-/Trace-/Access-/Trash-/Break-/Jack-out-Entscheidungen,
  - Setup-/Mulligan-/Discard-/Handlimit-Fenster nur nach Vertrag.
- Zeitabzug bei Abschluss der Entscheidung stoppen und beim nächsten Entscheidungskontext neu mit Grundfrist starten.
- Zeitablauf serverseitig/regelautoritativ als Partieende behandeln:
  - Gewinner Gegenseite,
  - Ergebnisgrund `time_expired`,
  - ResultSummary und terminaler Status,
  - finaler Engine-StateHash bleibt der letzte echte Engine-StateHash,
  - keine doppelte Beendigung nach bereits regulärem Ende.
- UI-Zeitbalken unter der Statusleiste umsetzen:
  - beide Spielerzeiten sichtbar,
  - aktuelle entscheidende Seite markiert,
  - Grundfrist normal dargestellt,
  - nach Grundfrist roter Warnzustand und sichtbarer sekundenweiser Abzug,
  - responsive ohne Überlappung mit Statusleiste, Aktionen, Board oder Run-Zeitstrahl.
- Chronikmeldungen ergänzen:
  - Partie mit Zeitbegrenzung gestartet,
  - Zeitkonto/Grundfrist,
  - Spielerzeit abgelaufen,
  - Partie durch Zeitablauf beendet,
  - Gewinner/Verlierer.
- Tests für Server, Shared, Web und Visibility ergänzen.
- Tests mit Fake-Timern oder injizierbarer Serverzeit bauen; keine Tests dürfen echte Wallclock-Dauer abwarten.

## Nicht im Scope

- Kein Ranked-/Turnier-Zeitregelwerk.
- Kein Disconnect-/Abwesenheits-Sondermodell außerhalb der im Vertrag festgelegten Spielerzeit.
- Keine clientseitige Alleinautorität für Zeitablauf.
- Keine Änderung an AI-internen Berechnungs-Timeouts.
- Keine Protokollierung jeder kurzen Entscheidung in der Chronik.
- Keine verdeckten Informationen in Timer-Payloads.

## Akzeptanzkriterien

- [ ] Spielstart bietet ohne Zeitbegrenzung und mit Zeitbegrenzung an.
- [ ] Bei aktivierter Zeitbegrenzung gibt es mehrere auswählbare Gesamtzeiten und mehrere auswählbare Grundfristen.
- [ ] Ohne Zeitbegrenzung wird keine Spielerzeit abgezogen und keine Zeitablauf-Niederlage ausgelöst.
- [ ] Bei jeder neuen zugewiesenen Aktivität startet die Grundfrist neu.
- [ ] Entscheidungen innerhalb der Grundfrist belasten das Zeitkonto nicht.
- [ ] Entscheidungen oberhalb der Grundfrist ziehen nur die überschrittene Zeit vom zuständigen Spielerzeitkonto ab.
- [ ] Zeit läuft für die Seite, die gerade entscheiden muss, nicht pauschal für die Zugseite.
- [ ] Automatische Effekte, Animationen, Chronikmeldungen und technische Wartezeiten verbrauchen keine Spielerzeit.
- [ ] Bei Zeitkonto 0 verliert die betroffene Seite, sofern die Partie nicht bereits beendet ist.
- [ ] Zeitablauf erscheint als reguläres Partieende in ResultSummary/UI/Chronik.
- [ ] Zeitdaten sind serverautoritativer Bestandteil des maßgeblichen Spiel-/Matchzustands nach Vertrag.
- [ ] Reconnect zeigt konsistente verbleibende Zeit und aktuellen Grundfrist-/Belastungszustand.
- [ ] Zeitbalken unter der Statusleiste zeigt beide Zeitkonten, aktuelle Entscheidungsseite und Warnzustand verständlich an.
- [ ] Timer-Payloads leaken keine Hidden Cards, Tokens, Decklisten, `AIInput`, `DecisionDebug` oder FullState.
- [ ] Replay-/StateHash-Verhalten entspricht dem Vertrag und ist getestet.
- [ ] Server-, Shared-/API-, Web- und Visibility-Tests decken die Hauptpfade ab.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Der Vertrag ist abgeschlossen: Spielerzeit liegt serverautoritativ im Match-Record und wird als Match-Lifecycle-Ende `time_expired` aufgelöst; Wallclock-Ticks werden nicht in den deterministischen Engine-State geschrieben.
- Wahrscheinliche Startpunkte:
  - `packages/shared/src/api-contracts.ts`
  - `packages/shared/src/index.ts`
  - `apps/server/src/multiplayer.ts`
  - `apps/server/src/http-server.ts`
  - `apps/server/src/multiplayer.test.ts`
  - `apps/web/app/match-start.ts`
  - `apps/web/app/match-start-storage.ts`
  - `apps/web/app/match-timer-ui.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/app/globals.css`
  - passende Web-/Visibility-Tests.
- Tests sollten mindestens die Matrix `PC-T001` bis `PC-T020` aus dem Vertrag abdecken oder gezielt mit bestehenden Contract-/Visibility-Tests zusammenführen.

## Ergebnisnotiz

Umgesetzt: optionale serverautorisierte Spielerzeit mit Grundfrist, Matchstart-Presets, Reconnect-Snapshot, Zeitablauf als Lifecycle-Ende `time_expired`, ResultSummary/Chronik/UI-Texte und Zeitbalken unter der Statusleiste. Der finale Engine-StateHash bleibt beim Zeitablauf der letzte echte Engine-StateHash; Timer-Payloads enthalten nur die Clock-Snapshot-Daten.
