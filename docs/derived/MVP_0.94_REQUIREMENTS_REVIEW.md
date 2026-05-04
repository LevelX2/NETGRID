# MVP 0.94 Requirements Review

Status: bestanden
Stand: 2026-05-04

## Ergebnis

`requirements_review_passed: true`

`ready_for_MVP_0.94_implementation: true`

Die V0.94-Anforderungen sind aus V0.93, der Mechanik-Coverage, dem V0.94-Detailplan und dem CR-v26.03-Abgleich abgeleitet. Der Scope ist testbar und eng genug für die Implementierung von Damage und Flatline.

## Reviewpunkte

- Alle Must-Anforderungen aus `MVP_0.94_REQUIREMENTS.md` sind in `MVP_0.94_TEST_MATRIX.md` abgedeckt.
- Damage ist auf Net und Meat begrenzt; Core-Damage bleibt nicht spielbar.
- Flatline wird nur als enger Game-End-Grundvertrag eingeführt und aktiviert keinen Mulligan-, Identity-Setup- oder Archives-/Multiaccess-Scope.
- Zufälliges Grip-Trashing ist vollständig an Seed, RandomCounter und RandomDrawRecords gebunden.
- Damage ist immer `hidden_info_barrier`; Undo nach Damage wird blockiert.
- PublicEvents, PlayerViews, WebSocket, Reconnect, Undo, Fehler, Logs, AI-Input und UI-Diagnostics haben explizite negative Leaktests.
- Eine mögliche lokale Damage-Testkarte bleibt manifest- und testgegated und darf keine offizielle Karte oder externe Kartendaten nutzen.
- No-Scope-Guards schließen Trace, Resources, Multiaccess, Identity-Abilities, Hosting, Viren, Prevention, Avoid, Interrupts und Replacement aus.

## Fachliche Entscheidungen

| Thema | Entscheidung |
|---|---|
| Damage-Typen | `net` und `meat` werden spielbar; `core` bleibt höchstens vorbereitet. |
| Simultane Auswahl | Mehrere Damage-Punkte wählen einen Batch ohne Replacement und trashen fachlich gleichzeitig. |
| Flatline bei zu kleiner Grip | Bei `amount > grip.length` endet das Spiel sofort mit `corp`/`flatline`; es wird keine weitere zufällige Auswahl zur Informationsgewinnung durchgeführt. |
| Sichtbarkeit getrashter Karten | Nach überlebtem Damage liegen getrashte Karten im Runner-Heap und folgen dem bestehenden Heap-Sichtbarkeitsvertrag. |
| Game-End-Grund | `gameEndReason` oder ein gleichwertiger enumartiger Grund wird side-sicher bis Result Summary/WebSocket geführt. |

## Offene Punkte für Implementation Review

- Der konkrete Codepfad darf `do_damage` als `EffectCommand` oder als gleichwertigen Engine-Helfer implementieren; die Entscheidung ist im Implementation Review zu dokumentieren.
- Falls eine lokale Damage-Testkarte ergänzt wird, müssen Manifest, Szenario und alle Pflicht-Smokes im selben V0.94-Gate entstehen.
- Falls StateHash sich durch `gameEndReason` oder neue State-Felder ändert, ist die Schemaänderung im Implementation Review zu begründen und Replay muss grün bleiben.

## Gate

V0.94 ist zur Implementierung freigegeben, solange der bestehende Worktree-Altstand beim späteren Commit sauber von V0.94 getrennt bleibt.
