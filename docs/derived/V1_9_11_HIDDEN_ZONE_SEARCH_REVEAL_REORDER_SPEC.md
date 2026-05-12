# Hidden-Zone Search, Reveal, Reorder und Shuffle V1.9.11 Spec

Status: frozen
Stand: 2026-05-12

## Resolverfamilie

Name: `hidden_zone_search_reveal_reorder_resolver`

Die Resolverfamilie bündelt vier Operationen:

| Operation | Zweck | Sichtbarkeit |
| --- | --- | --- |
| `search_hidden_zone` | Berechtigte Side wählt Karten aus eigener oder erlaubter Zone. | Choice privat/hidden-info-barrier |
| `reveal_hidden_card` | Ausgewählte Karte wird absichtlich öffentlich gemacht. | PublicEvent darf Titel/Definition nur bei Reveal enthalten |
| `reorder_hidden_zone` | Berechtigte Side ordnet eine definierte Teilmenge neu. | PublicEvent nur Anzahl und Zone |
| `shuffle_hidden_zone` | Zone wird deterministisch gemischt. | PublicEvent nur Zone und Grund |

## Vertragsregeln

1. Resolver dürfen keine Karte ohne LegalAction oder gültige PendingChoice bewegen, revealn oder neu ordnen.
2. Jede Choice trägt `choiceId`, `source`, `stateVersion`, `side`, `kind`, Optionsgrenzen und `visibility`.
3. Für `hidden_info_barrier` enthalten gegnerische PlayerViews keine Optionstitel, Karten-IDs, CardInstanceIds oder DefinitionIds.
4. PublicEvents für nicht-revealende Search/Reorder/Shuffle-Pfade enthalten nur abstrakte Felder wie `hiddenZoneAction`, `zone`, `count`, `sourceDefinitionId`.
5. Tatsächliche Reveal-/Expose-Pfade dürfen die öffentlich gemachte Definition nennen, müssen aber die übrige Zone redigiert lassen.
6. Shuffle verwendet bestehende deterministische Zufallsinfrastruktur mit stabilem Zwecklabel.
7. Reorder muss Replay- und StateHash-stabil sein: Auswahlreihenfolge aus der Choice ist der einzige Ordnungsinput.
8. Known-Position-Memory wird bei Shuffle gelöscht und bei Reorder nur für die berechtigte Side aktualisiert, soweit die Position rechtmäßig bekannt bleibt.

## Kartenadapter

Kartenadapter sind klein und explizit. Sie deklarieren:

- `cardDefinitionId`
- zulässige Zone(n)
- Auswahlgrenzen
- ob Reveal erforderlich ist
- ob Shuffle danach Pflicht ist
- ob Reorder statt Move erfolgt
- AI-Hint-Rolle

## Deferred-Regel

Wenn eine Zielkarte außer Hidden-Zone-Funktionen noch eine spätere Pflichtmechanik benötigt, darf sie in V1.9.11 nur freigegeben werden, wenn der nicht implementierte Teil keine falsche Spielbarkeit erzeugt. Andernfalls wird sie im V1.9.11-Review mit Removal Condition deferred und bleibt nicht `human_playable`.
