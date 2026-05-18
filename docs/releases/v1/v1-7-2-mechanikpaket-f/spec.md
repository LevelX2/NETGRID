# Mechanikpaket F 1.7.2 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.7.2 implementiert einen freigabefähigen Kern mit 5 Karten und vier Blöcken:

1. Trace/Link/Bidding-Fenster aus Corp-Operationen
2. Tag-Bedingungen mit Last-Turn-Run-Attempt-Validierung
3. Resource-Tag-Interaktion (deterministischer Resource-Trash)
4. Runner ActionEconomy-/Tag-Remove-Resource-Aktionen

## Nicht-Scope

- Keine Agenda-/Scored-Static-Breite aus V1.8.0.
- Keine Counter-/Virus-/Purge-Breite aus V1.8.1.
- Kein deterministischer Würfelzufall aus V1.9.0.
- Keine breite Run-Lock-Folgeeffekte (`Fang`/`Rex`/`TKO 2.0` bleiben deferred).

## Kartenvertrag V1.7.2

- `onr_v1_283_audit-of-call-records`
  - Corp Operation.
  - Play-Gate: Runner hat im letzten Runner-Turn mindestens 2 Runs versucht.
  - Effekt: Trace 5; bei Erfolg +1 Tag auf Runner.
- `onr_v1_284_chance-observation`
  - Corp Operation.
  - Play-Gate: Runner hat im letzten Runner-Turn mindestens 1 Run versucht.
  - Effekt: Trace 5; bei Erfolg +1 Tag auf Runner.
- `onr_v1_286_corporate-detective-agency`
  - Corp Operation.
  - Play-Gate: Runner ist getaggt.
  - Effekt: trash bis zu zwei installierte Runner-Resources deterministisch ohne zusätzliche Klick-/Credit-Kosten.
- `onr_v1_158_danshis-second-id`
  - Runner Resource.
  - Installierte Ability-Aktion: 1 Klick, bis zu 3 Tags entfernen, keine Credit-Kosten, Karte wird anschließend getrasht.
- `onr_v1_179_silicon-saloon-franchise`
  - Runner Resource.
  - Installierte Ability-Aktion: 1 Klick -> Runner erhält 1 Credit und zieht 1 Karte.

## Engine-Vertrag

- Runner-Turn-Flags erweitern den deterministischen Last-Turn-Run-Attempt-Status:
  - `runAttemptsThisTurn`
  - `runAttemptsLastTurn`
- Jeder Run-Start inkrementiert `runAttemptsThisTurn` legal-action-only.
- Beim Runner-End-Turn werden Last-Turn-Werte für den Corp-Turn eingefroren.
- Mit Start des nächsten Runner-Turns werden Last-Turn-Werte zurückgesetzt.

## Trace-Vertrag außerhalb des Run-Contexts

- Corp-Operationen dürfen Trace-Fenster eröffnen, auch wenn kein `run` aktiv ist.
- Trace-State trägt Rückkehrkontext (`phase`, `timingPoint`, `activeSide`) für deterministische Fortsetzung nach Runner-Bid.
- Trace-Reihenfolge bleibt:
  - Corp Bid
  - Runner Bid
  - Vergleich `traceStrength > runnerLink + runnerBid`
  - Erfolgseffekt `add_tag +1`

## Visibility-/Replay-Vertrag

- Keine Hidden-Info-Leaks in PlayerView/PublicEvents/WebSocket/Reconnect/Undo.
- Trace-Operationen bleiben über EventLog replaybar.
- StateHash bleibt deterministisch über:
  - Operation-Trace
  - Resource-Action-Abläufe
  - deterministischen Resource-Trash aus Operationseffekten.

## Deferred-Hinweis

Der Planungskorb für V1.7.2 enthält 28 Karten. Der freigabefähige Kernrelease setzt 5 Karten um; 23 Karten bleiben in V1.7.2 deferred dokumentiert, weil zusätzliche Folgeeffekte (Agenda/Counter/Run-Lock-Spezialfälle) oder offene Mechanikhinweise vorliegen.
