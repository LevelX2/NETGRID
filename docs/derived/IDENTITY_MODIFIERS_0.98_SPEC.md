# Identity/Modifier 0.98 Specification

Status: Spezifikation für V0.98a
Stand: 2026-05-04

## Regelbasis

- CR 1.6 erlaubt Identity-Fähigkeiten, die Setup oder Start of Game beeinflussen; Corp löst gleichzeitige Setup-/Startfähigkeiten zuerst.
- CR 9.4 beschreibt Static Abilities als kontinuierlich aktive Effekte ohne eigenes Resolve-Fenster.
- CR 1.20/Link- und Memory-Werte werden durch aktive Werte und Modifikatoren berechnet.

## Datenmodell

Additiv vorzusehen:

- `ModifierDefinition` mit `modifierId`, `kind`, `side`, `amount`, `duration` und `sourceAbilityId`.
- `IdentityAbilityUsage` im `GameState`, mindestens für Setup- und once-per-turn-Marker.
- `CardDefinition.modifiers` für statische, dauerhaft berechnete Identity-/Kartenmodifier.
- Neue Demo-Decks `demo_runner_098` und `demo_corp_098`.

## V0.98a-Piloten

| Karte | Side | Fähigkeit |
|---|---|---|
| `v098_runner_identity` | Runner | Lokale/fiktive Identity mit sichtbarem Setup-/Static-Piloten: +1 Startcredit und/oder +1 Memory/Base Link über zentralen Modifier. |
| `v098_corp_identity` | Corp | Lokale/fiktive Identity mit sichtbarem Setup-Piloten: +1 Startcredit oder eng begrenzter public Setup-Effekt. |

Die konkrete Implementierung darf kleiner sein als diese Tabelle, aber beide Seiten müssen einen sichtbaren Identity-Piloten erhalten.

## Engine-Regeln

- Identity-Setup läuft in `createGame` nach Identity-Instanzierung und vor `game_created`-Hash.
- Setup-Fähigkeiten schreiben einen deterministischen Usage-Marker.
- Static Modifier werden über Engine-Getter berechnet, nicht in UI, AI oder Server.
- LegalActions und `applyAction` nutzen dieselben Getter.
- No-Scope: `future_interrupt` und `future_replacement` bleiben nicht spielbar.

## Visibility

- PublicEvents dürfen Identity-Setup nur als offene, abstrakte Setup-Information berichten.
- PlayerViews zeigen nur offene Werte: Credits, Memory, Link und öffentliche Metadaten.
- Keine Identity-Fähigkeit in V0.98a darf gegnerische Hidden-Zones ansehen oder private Kartentitel auswerten.

## Tests

- V098-T001 Shared Types.
- V098-T002 Runner Identity Setup.
- V098-T003 Corp Identity Setup.
- V098-T004 Static Modifier LegalAction/applyAction.
- V098-T005 Usage Marker.
- V098-T006 Replay/StateHash.
- V098-T017 No Scope.
