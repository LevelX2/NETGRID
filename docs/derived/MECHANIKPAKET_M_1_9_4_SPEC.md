# Mechanikpaket M 1.9.4 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

1. `L2_Damage_Familien_und_Flatline_Integration`
2. `L3_Prevention_Avoid_Replacement`
3. `L3_Core_Brain_Damage_Erweiterungen`

## Nicht-Scope

1. Keine Board-/Modifier-Familien aus V1.9.5.
2. Keine Agenda-/Counter-Lifecycle-Schliessung aus V1.9.6.
3. Keine V2.x-Features.

## Kartenvertrag V1.9.4

- Kernkorb wird im V1.9.4-Preflight final eingefroren.
- Erwartete Grobmenge: 22 Kandidatenkarten.
- Pflichtpruefpunkt: `Data Darts` (`freigabefaehig` oder `deferred` vor Code).

## Engine-Vertrag

### 1) Damage-Familien

- Damage-Aufloesung bleibt deterministisch, legal-action-validiert und replaybar.
- Flatline- und Handlimit-Interaktionen bleiben konsistent.

### 2) Prevention/Avoid/Replacement

- Fensterreihenfolge und Choice-Validierung sind eindeutig.
- Konfliktfaelle werden deterministisch behandelt oder explizit blockiert.

### 3) Core-/Brain-Damage

- Core-Damage-Effekte sind in Turn-/Discard-/Game-End-Pfaden konsistent integriert.
- Keine verdeckten Informationsabfluesse ueber Damage-Ereignisse.

## Visibility-/Replay-Vertrag

1. Damage-/Discard-nahe private Infos bleiben redigiert.
2. Replay bildet gleiche Prevention-/Replacement-Ketten deterministisch ab.
3. Undo-Barrieren bleiben bei Hidden-Info-Grenzen korrekt.

## Deferred-Hinweis

- Nicht freigabefaehige Kandidaten bleiben deferred und werden fuer V1.9.5+ nachgezogen.
