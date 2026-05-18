# MVP 0.95 Detailed Plan - Resources und Tag-Interaktion

Status: detaillierte Planungsfassung, keine Implementierung
Stand: 2026-05-03

## Kurzentscheidung

V0.95 soll Runner-Resources als neuen Kartentyp und Boardbereich einführen und Tags mit Resource-Trash verknüpfen. Der Scope bleibt kontrolliert: Resources werden installierbar, sichtbar und trashbar, aber Trace, Link/Bidding, Prevention, Hosting und komplexe Resource-Abilities bleiben außerhalb dieser Phase.

V0.95 startet regulär nach V0.94-Finalgate. Falls Damage verschoben wird, braucht V0.95 eine eigene Scope-Entscheidung, damit die Reihenfolge bewusst geändert wird.

## Voraussetzungen

- V0.93 M1-Fundament ist vorhanden.
- V0.94 ist abgeschlossen oder ausdrücklich verschoben.
- Tags, `remove_tag` und einfache Tag-Punishment-Regressionen laufen grün.
- Exakte Resource-Trash-Regel aus CR v26.03 ist vor Requirements-Freeze geprüft.
- Keine importierte Resource wird automatisch `playable` oder `deck_legal`.

## Ziele

- `CardType` um `resource` erweitern.
- `RunnerRig.resources` und passende ZoneRefs/PlayerViews planen.
- Resource-Install aus Runner-Grip über LegalActions einführen.
- Corp-Resource-Trash bei getaggtem Runner als LegalAction planen.
- Mindestens eine lokale/fiktive sichere Resource-Karte für Testabdeckung erlauben, aber erst nach Requirements-Freeze.
- AI, Server, WebSocket, Reconnect und Deckvalidierung auf Resource-Felder vorbereiten.

## Nicht-Ziele

- Kein Trace, Link oder Bidding.
- Keine Resource mit Hidden-Info-Choice.
- Keine Prevention/Replacement.
- Kein Hosting oder Hosted Credits.
- Keine Viren, Purge oder neue Counterfamilien.
- Keine offizielle Karte und kein offizielles Asset.
- Keine öffentliche Plattform- oder Deckbuilder-Ausweitung.

## Vorgeschlagene Shared-/Engine-Erweiterungen

| Bereich | Vorgabe |
|---|---|
| `CardType` | `resource` additiv ergänzen. |
| `RunnerRig` | `resources: CardInstanceId[]` ergänzen. |
| `ZoneRef` | Runner-Zone `rigResource` oder bestehende `rig`-Zone mit Resource-Unterliste sauber typisieren. |
| PlayerView | Eigene sichtbare Resource-Liste oder Erweiterung der Rig-Liste mit Type `resource`. |
| LegalAction | `install_card` kann Resource installieren; `trash_resource` oder kompatibler Action Type für Corp-Tag-Trash. |
| TargetRequirements | Resource-Ziel muss öffentlich bekannt, installiert und vom Runner kontrolliert sein. |
| Effects | Trash Resource als deterministischer Move in Runner Heap. |

## Resource- und Tag-Semantik

V0.95 soll folgende Mindestsemantik abbilden:

1. Runner kann eine Resource aus Grip installieren, wenn Kosten, Klick und Timing legal sind.
2. Installierte Resources liegen offen im Runner-Board.
3. Corp erhält Resource-Trash-LegalActions nur, wenn Runner getaggt ist und die Aktion nach CR-v26.03-Kosten legal ist.
4. `applyAction` revalidiert Tagstatus, Side, Timing, Kosten, Ziel und StateVersion.
5. Resource-Trash bewegt die Karte in den Runner Heap und erzeugt ein öffentliches Event ohne Hidden-Info-Leak.
6. AI darf Resource-/Tag-Situationen nur aus PlayerView und LegalActions bewerten.

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V095-T001 | Shared Types | `resource` und Runner-Rig-Erweiterung sind additiv typisiert. |
| V095-T002 | Install | Runner kann eine lokale/fiktive Resource installieren. |
| V095-T003 | Sichtbarkeit | Installierte Resource ist für beide Seiten als öffentliche Boardkarte sichtbar. |
| V095-T004 | Deck/Manifest | Resource wird nur spielbar, wenn Manifest, Resolver, Tests und Decklegalität erfüllt sind. |
| V095-T005 | Tag-Gate | Corp sieht Resource-Trash nur, wenn Runner getaggt ist. |
| V095-T006 | Kosten/Revalidierung | Trash Resource prüft Klick, Credits/Kosten, Side, StateVersion und Ziel erneut. |
| V095-T007 | Illegal Untagged | Resource-Trash ist bei ungetaggtem Runner illegal. |
| V095-T008 | Illegal Target | Nicht installierte, verdeckte oder falsche Resource-Ziele werden abgelehnt. |
| V095-T009 | Replay/StateHash | Install und Trash replayen deterministisch mit gleichem StateHash. |
| V095-T010 | PublicEvents | Events zeigen nur öffentliche Resource-Daten und keine Hand-/Deckinformationen. |
| V095-T011 | WebSocket/Reconnect | Resource-Boardstate und EventTail bleiben side-sicher. |
| V095-T012 | Undo | Undo vor Hidden-Info bleibt möglich; Resource-Trash selbst ist kein Hidden-Info-Leak, sofern keine verdeckte Info genutzt wurde. |
| V095-T013 | AI Contract | AI nutzt LegalActions-only und verfällt nicht in Tag-/Trash-Endlosschleifen. |
| V095-T014 | No Trace | Keine Trace-, Link- oder Bid-Choice wird durch V0.95 spielbar. |
| V095-T015 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.95

Vor Implementierung:

- `docs/releases/mvp/mvp-0-95-resources-tags/requirements.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/resource-tag-interaction-spec.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/test-matrix.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/requirements-review.md`
- optional Resource-Szenario-Fixtures unter `data/scenarios/v095-*.json`

Nach Implementierung:

- `docs/releases/mvp/mvp-0-95-resources-tags/implementation-review.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/final-review.md`
- aktualisierte Mechanik-Coverage
- aktualisierte Card-/Deck-/Manifest-Artefakte, wenn eine lokale Resource-Karte freigegeben wird
- Status- und Wissensbasis-Update

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Resource wird durch Import/Katalog automatisch spielbar. | Manifest- und Matchstart-Gate erzwingen. |
| Corp kann Resource ohne Tags trashen. | Negative LegalAction- und `applyAction`-Tests. |
| UI/PlayerView leakt Runner-Hand beim Installieren. | Install-Events wie bisher redigieren, nur installierte Boardkarte offen zeigen. |
| Trace wird nebenbei eingeführt. | Trace/Link/Bidding ausdrücklich V0.96+. |
| AI erzeugt schlechte Schleifen. | Reason-Code- und Soak-Smokes mit Tags/Resources. |

## Definition of Done

V0.95 ist fertig, wenn Resources als Kartentyp und Boardbereich stabil funktionieren, Tag-basierter Resource-Trash korrekt legalisiert und revalidiert wird, alle Sichtbarkeits-, Replay-, Server-, AI- und Deck-Gates grün sind und keine Trace- oder andere V0.96+-Mechanik spielbar wurde.
