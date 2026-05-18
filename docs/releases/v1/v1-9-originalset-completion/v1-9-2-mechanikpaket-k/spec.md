# Mechanikpaket K 1.9.2 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

1. `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`
2. `L2_Access_Breach_und_Multiaccess_Erweiterungen`
3. `L2_Ambush_auf_Access_Resolver`
4. `L2_Run_Flow_Erweiterungen_und_RunLocks`
5. `L2_Recurring_Pools_und_StartOfTurn_Resolver`

## Nicht-Scope

1. Keine Trace-/Tag-/Resource-Vertraege aus V1.9.3.
2. Keine Damage-/Prevention-/Core-Vertraege aus V1.9.4.
3. Keine V2.x-Features.

## Kartenvertrag V1.9.2

- Kernkorb wird im V1.9.2-Preflight final eingefroren.
- Erwartete Grobmenge: 36 Kandidatenkarten.
- Pflichtpruefpunkt: `Data Naga` (`freigabefaehig` oder `deferred` vor Code).

## Engine-Vertrag

### 1) Hidden-Zone-Operationen

- Search/Reorder/Shuffle sind deterministisch und side-sicher.
- Oeffentliche Events enthalten nur freigegebene Sichtinformationen.

### 2) Access-/Breach-Erweiterungen

- Access-Queue und Multiaccess-Reihenfolge sind deterministisch.
- Ambush-Einstieg bleibt regelkonform und wiederholbar.

### 3) Run-Locks und Recurring

- Run-Lock-Zustaende haben klaren Start-/End-Lifecycle.
- Start-of-turn-/Recurring-Pfade sind replaybar und stale-action-sicher.

## Visibility-/Replay-Vertrag

1. Hidden-Zone-Daten bleiben in gegnerischen Projektionen redigiert.
2. Undo/Reconnect respektieren Hidden-Info-Barrieren.
3. Replay/StateHash bleiben bei allen Search-/Access-Faellen stabil.

## Deferred-Hinweis

- Nicht freigabefaehige Kandidaten aus dem 36er-Grobkorb bleiben deferred.
- `Data Raven`/`Dupre` bleiben ausserhalb dieses Releases.
