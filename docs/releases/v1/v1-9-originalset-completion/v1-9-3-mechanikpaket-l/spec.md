# Mechanikpaket L 1.9.3 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

1. `L2_Trace_Link_Bidding_und_BaseLink_Windowing`
2. `L2_Tag_Bedingungen_Remove_Avoid`
3. `L2_Resource_Tag_Interactions`
4. `L2_Handsize_und_ActionEconomy_Modifier`

## Nicht-Scope

1. Keine Damage-/Prevention-/Core-Erweiterungen aus V1.9.4.
2. Keine Counter-Lifecycle-Schliessung aus V1.9.6.
3. Keine V2.x-Features.

## Kartenvertrag V1.9.3

- Kernkorb wird im V1.9.3-Preflight final eingefroren.
- Erwartete Grobmenge: 24 Kandidatenkarten.
- Pflichtpruefpunkt: `TKO 2.0` (`freigabefaehig` oder `deferred` vor Code).

## Engine-Vertrag

### 1) Trace-/Bid-Fenster

- Trace/Bid-Reihenfolge und Kostenvalidierung sind deterministisch.
- BaseLink-Windowing bleibt strikt legal-action-gesteuert.

### 2) Tag-/Resource-Interaktionen

- Tag-Zustaende, Remove/Avoid und Resource-Trash sind side-sicher und regelkonform.
- Keine impliziten Counter-Lifecycle-Abkuerzungen.

### 3) Action-Economy-/Handsize-Modifier

- Modifier wirken deterministisch auf den legalen Aktionsrahmen.
- Undo/Reconnect/Replay behalten konsistente Aktions- und Handlimit-Staende.

## Visibility-/Replay-Vertrag

1. Keine Leaks in Trace-/Tag-Choices.
2. Replay bildet gleiche Bid-/Tag-Pfade mit identischem StateHash ab.
3. DecisionDebug enthaelt keine privaten Gegnerinfos.

## Deferred-Hinweis

- Counter-gebundene Karten, die V1.9.6 voraussetzen, bleiben deferred.
