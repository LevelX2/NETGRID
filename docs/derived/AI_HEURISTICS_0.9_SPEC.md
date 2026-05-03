# AI Heuristics 0.9 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Prinzip

V0.9 ersetzt die starre Prioritätsliste durch kleine Scorer, die nur aktuelle `LegalActions` bewerten. Ein Scorer darf keine Action erzeugen, keine Kosten umgehen und keine Regelentscheidung treffen.

## Scorer-Ergebnis

Jeder Scorer liefert:

- `score`: deterministischer Zahlenwert,
- `reasonCode`: stabile Taxonomie,
- `explanation`: kurze sichtbare Begründung,
- `evidence`: erlaubte sichtbare Faktoren,
- `confidence`,
- `fallbackUsed` und optional `warning`.

## Runner-Scorer

| Scorer | Zweck | Sichtbare Faktoren |
|---|---|---|
| `runner.access_resolution` | Steal, Trash oder Decline während Access. | Zugriffskarte, Kosten, Credits, Agenda/Trashbarkeit. |
| `runner.encounter_solution` | Pump, Break, Continue oder Run-Abbruch, soweit legal. | Rezzed ICE, eigene Credits, installierte Breaker, Klicks. |
| `runner.economy` | Credits oder Economy-Events. | Credits, Klicks, Handkartenstatus aus eigener Sicht. |
| `runner.setup` | Programme und Hardware installieren. | eigene Grip/Rig-Sicht, Memory, Rollenlücken. |
| `runner.run_selection` | Serverziel wählen. | Serverstatus, rezzed ICE, eigene Rig-Abdeckung, sichtbarer Nutzen. |
| `runner.tag_management` | Tags entfernen, wenn legal und sichtbar riskant. | Tags, Credits, bekannte Tag-Punishment-Signale. |
| `runner.end_turn` | Zug sauber beenden. | niedriger Nutzen, Actionlimit, Wiederholungsmuster. |

## Corp-Scorer

| Scorer | Zweck | Sichtbare Faktoren |
|---|---|---|
| `corp.mandatory` | Pflichtfenster bedienen. | aktuelle LegalActions. |
| `corp.score_window` | Scorebare Agenda priorisieren. | eigene Board-/HQ-Sicht, Advancement, Credits. |
| `corp.remote_plan` | Scoring-Remote oder Asset-Plan aufbauen. | eigene HQ-Sicht, Serverstruktur, Credits. |
| `corp.ice_plan` | ICE sinnvoll installieren. | eigene HQ-Sicht, Serverdruck, Runner-Rig. |
| `corp.rez_window` | Rez oder Decline im Run-Fenster. | eigene ICE-Sicht, Runner-Credits, Serverziel. |
| `corp.economy` | Operation, Asset oder Credit-Aktion. | Credits, Klicks, eigene HQ-Sicht. |
| `corp.tag_plan` | Tags und Tag-Punishment legal nutzen. | Runner-Tags, eigene sichtbare LegalActions. |
| `corp.end_turn` | Zug sauber beenden. | niedriger Nutzen, Wiederholungsmuster. |

## Safety

- Scorer sortieren LegalActions stabil.
- Tie-Breaking nutzt nur `seed`, `decisionId`, `actionId` und Difficulty.
- Wenn kein Scorer eine legale Action wählt, greift ein markierter Fallback auf die erste stabile LegalAction.
- Explanations und Evidence werden leak-gescannt.
