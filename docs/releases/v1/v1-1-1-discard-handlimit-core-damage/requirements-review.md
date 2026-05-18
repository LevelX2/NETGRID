# V1.1.1 Requirements Review

Stand: 2026-05-07
Status: ready

## Review-Ergebnis

`V1_1_1_requirements_freeze_done: true`

`ready_for_implementation: true`

## Geprüfte Artefakte

- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/requirements.md`
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/spec.md`
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/test-matrix.md`
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/plan.md`
- `docs/releases/v1/v1-1-0-setup-game-end-m2/final-review.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/damage-flatline-spec.md`
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`

## Befund

Die Requirements sind eng genug für eine direkte Umsetzung. Der Slice erweitert bestehende Engine-Bausteine additiv: `PendingChoice`, `resolve_choice`, V0.94-Damage-Randomness, Hidden-Info-Barrieren, Undo-Sperren, PlayerViews, Multiplayer-Reconnect und AI-LegalActions.

## Annahmen

- Das Runner-Handlimit wird in V1.1.1 ausschließlich durch Core Damage verändert.
- Das Korp-Handlimit bleibt in V1.1.1 bei 5.
- Discard-Paid-Ability-Fenster werden dokumentiert, aber nicht als neue Priority-Engine umgesetzt.
- Discard ist eine Hidden-Info-Barriere, auch wenn Runner-Discard-Karten danach im Heap sichtbar sind.

## Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
| --- | --- |
| Korp-Discard leakt HQ-Karten an Runner. | Side-private Choice, facedown Archives, negative Payload-/Reconnect-/Visibility-Tests. |
| Discard wird versehentlich als Trash behandelt. | Eigene Payload-Felder und Chroniklabel, Test gegen Trash-Kontext. |
| Core Damage flatlined zum falschen Zeitpunkt. | Getrennte Tests für Damage-Menge-Flatline und negative-Handlimit-Discard-Step-Flatline. |
| KI hängt an Discard-Choice. | AI-Test und Server-AI-Smoke für PendingChoice-Auflösung. |
| UI bleibt bei statischem `x/5`. | PlayerView-Felder und Web-Test auf dynamische Anzeige. |

## Scope-Entscheidung

Nicht freigegeben bleiben: Damage Prevention, Avoid, Interrupts, Replacement Effects, Full Archives Access, Runner-Deckout-Siegbedingung, öffentliche Plattformfunktionen und breite Kartenfreigabe.

