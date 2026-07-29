# Corp-TurnPlanner – Shadow-Kalibrierung

Stand: 2026-07-30

Paket: ZK10
Status: **Cutover-Gate fachlich erfüllt; ZK10a bleibt vorgeschaltet**

## Ergebnis

Der Corp-TurnPlanner läuft lesend im Shadow hinter der weiterhin
autoritativen Plan-first-Auswahl. Er erhält denselben privaten KI-Input,
klassifiziert die vollständige aktuelle Corp-LegalAction-Menge und erzeugt
eine deterministisch begrenzte Restzuglinie. Weder sein Gewinner noch seine
Choices können die produktive Aktion verändern.

Die historischen D4-/D5-Checkpoints und der Opening-Rush-Fall erreichen:

- 100 Prozent klassifizierte LegalActions;
- null fehlende und null konkurrierend besessene Aktionen;
- konkrete aktuelle Karten-, Server-, Target- und Choice-Bindungen;
- eine Zwei-Schritt-Linie bei D4 und mindestens eine vollständige
  Ein-Schritt-Baseline bei D5;
- identische Live-Aktion, Choices und vollständige Shadow-Diagnose bei
  Wiederholung;
- Abbruch an privater Beobachtung beziehungsweise öffentlichem Zufall;
- keine doppelte Wertung konfliktierender Exclusive Claims.

Eine allgemeine Beam Search ist für den ersten Corp-Cutover nicht
erforderlich. Die kleinen geschützten Fronten werden mit einer
deterministischen Zwei-Schritt-Suche vollständig genug verglichen. Ein
Regressionstest beweist, dass der zweite Schritt den Head nur dann ändert,
wenn der zusätzliche bekannte Restwert die Ein-Schritt-Baseline materiell
übertrifft.

## Suchbudget

Das Budget ist ausschließlich fachlich und replaystabil:

- maximale Tiefe: 2;
- deterministische Knoten-, Partitions-, Verzweigungs- und
  Pareto-Frontgrenzen;
- mindestens eine konservative Linie je geschützter
  `Pflichtsignatur × Root × Meilenstein`-Partition;
- kein zeitabhängiger Abbruch und kein `Math.random`.

Die Wanduhr wird nur außerhalb der Entscheidung als Cutover-Messwert
erfasst.

## Laufzeitkalibrierung

Gemessen wurde der vollständige `runAiDecisionCheckpoint` einschließlich
Live-Auswahl, Corp-Shadow und Debugaufbereitung auf den realen D4-/D5-
Checkpoints. Nach 20 Warmup-Entscheidungen folgten je Lauf 400 alternierende
Messungen:

| Lauf |      p50 |      p95 |      p99 |  Maximum |
| ---- | -------: | -------: | -------: | -------: |
| 1    | 40,14 ms | 50,75 ms | 57,82 ms | 67,41 ms |
| 2    | 39,34 ms | 49,21 ms | 60,53 ms | 65,34 ms |

Das Corp-Cutover-Gate wird für denselben lokalen Kalibrierpfad auf
**p95 ≤ 75 ms** festgelegt. Der Abstand zur schlechteren gemessenen p95
beträgt rund 48 Prozent und lässt übliche lokale Schwankungen zu, ohne eine
Verdopplung unbemerkt zu akzeptieren. Die p50 bleibt Diagnosewert. Die
Messzeit beeinflusst weder Suchbudget noch Rangfolge.

## Behavior Baseline

Der Standardlauf umfasst sechs Slots, zehn Seeds, 60 Spiele und maximal 480
Aktionen. Nach den eng belegten Korrekturen ergibt er:

- 14.040 KI-Entscheidungen;
- null illegale Aktionen;
- null Runtime-, Replay-, Fallback-, Timeout-, Hidden-Info- oder
  No-LegalAction-Fehler;
- genau ein klassifiziertes Action-Limit.

Das verbleibende Limit betrifft
`strategy_panel_fast_advance_chrome_rush` mit Seed
`ai-behavior-baseline-v1-01`. Bei 600 statt 480 Aktionen endet dasselbe Spiel
regulär nach 525 Aktionen mit einem Corp-Sieg. Der Runner sammelt im späten
Spiel lange Credits, während bekannte Central-Routen keinen Ertrag bieten.
Das ist ein reales, aber nicht durch den Corp-Shadow verursachtes
Passivitätsproblem.

Zur Ursachenabgrenzung wurde der exakte ZK10-Ausgangsstand `3105db2ad` in
einem separaten diagnostischen Worktree mit den betroffenen Slots und Seeds
erneut ausgeführt. Dort traten bereits auf:

- dasselbe Action-Limit;
- die Top-Runners’-Conference-Kollision bei Seed 05;
- die Paris-City-Grid-Kollision bei Seed 08.

Die beiden Kollisionen entstanden, weil ein zweites Planmodul dieselbe exakt
gebundene Aktion zugleich als terminale Disposition markierte. Die Runtime
schützt nun eine konkrete wiederkehrende Economy-Installation vor einer
gleichzeitigen Hold-Disposition und lässt eine exakt ausführbare
Nicht-Economy-Planroute nicht durch die generische Defense-Disposition
entwerten. Beide gespeicherten Spielzustände sind als Regressionstests grün.
Eine Sonderregel gegen das verbleibende lange Spiel wurde bewusst nicht
eingebaut.

Der vollständige Maschinenbericht liegt in
`ai-behavior-baseline-v1-turn-planner-shadow-2026-07-29.md`; Rohdaten bleiben
unter `data/local/` unversioniert.

## Cutover-Schwellen für ZK11

Der Corp-Cutover ist nur zulässig, wenn:

1. ZK10a die minimale Kampagnenfortsetzung durch den Gegnerzug nachweist;
2. die reale Corp-Coverage 100 Prozent erreicht und weder fehlende noch
   konkurrierende Action-Owner enthält;
3. Wiederholung und Neustart dieselbe zulässige Planung erzeugen;
4. kein neuer illegaler, Runtime-, Replay-, Hidden-Info-, Fallback-,
   Timeout- oder No-LegalAction-Fehler gegenüber dem ZK10-Ausgang entsteht;
5. die dokumentierte lokale p95 von 75 ms eingehalten wird;
6. der neue TurnPlanner allein die Corp-Auswahl besitzt und die alte
   Aktionsauswahl nicht als stiller Fallback weiterhandelt.

Das reproduzierte Runner-Endspielproblem bleibt separat offen. Es blockiert
den Corp-Cutover nicht, solange sein Verhalten unverändert reproduzierbar
bleibt und keine Corp-TurnPlanner-Abhängigkeit nachgewiesen wird.
