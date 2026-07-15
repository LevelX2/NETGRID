# Match 424A – rote Evidence für Choice- und Discard-Follow-up (2026-07-15)

Status: historische Verhaltensregressionen auf unverändertem KI-Code bestätigt

## Quelle und Grenzen

- Match: `match_424abdd1c7ac054d`
- Modus: `human_corp_vs_runner_ai`
- Runner: KI, Profil `runner-ai-v0.9-hard`
- Capture-Quelle: lokale SQLite-Runtime, nur lesend
- Capture-Werkzeug: `scripts/capture-ai-decision-checkpoint.ts`
- Sichtbarkeitsgrenze: damalige Runner-PlayerView, LegalActions, redigiertes
  öffentliches Event-Präfix und erlaubte KI-Runtime-Metadaten
- Nicht übernommen: rohe `trace_json`- oder `game_state_json`-Kopien

Der strikte Warmup scheitert erwartungsgemäß bereits an der seit dem Match
geänderten Decision 8. Deshalb wurden die drei Zielzustände nach dem
verbindlichen Strict-Versuch mit `--warmup-policy rebase` aus den damaligen
StateSnapshots erfasst. D51 besitzt drei kompatible Warmup-Entscheidungen vor
dem Ziel, D93 besitzt 33 und D118 eine. Alle Checkpoints passieren Schema-,
StateHash-, Runtime- und Redaction-Prüfung; ihre einzige Zielabweichung lautet
`behavior_regression`.

## F11 – Force Shield wird im Schadensfenster nicht genutzt

| Decision | StateVersion | Sichtbarer Kontext | Legale Optionen | Aktuelle Wahl | Erwartung |
| --- | ---: | --- | --- | --- | --- |
| 51 | 91 | Runner mit 2 Handkarten und 0 Core Damage; Vacant Soulkiller verursacht 2 vermeidbaren Schaden | `pass`; Force Shield verhindert 2 | `pass` | Force Shield wählen |
| 118 | 216 | Runner mit 4 Handkarten und 2 Core Damage; Neural Blade verursacht 1 vermeidbaren Schaden | `pass`; zwei installierte Force Shields verhindern je 1 | `pass` | eine legale Force-Shield-Option wählen |

Die Checkpoints liegen unter:

- `data/scenarios/ai-decision-checkpoints/cp-424a-08-force-shield-damage-prevention.json`
- `data/scenarios/ai-decision-checkpoints/cp-424a-10-force-shield-damage-prevention.json`

Die aktive und die kompilierte Hint-Datei beschreiben Force Shield bereits
korrekt mit den Rollen `damage_prevention` und `rig_defense` sowie dem Effekt
`damage_prevention`, Timing `prevention_window`, Betrag 2. Der aktuelle
Choice-Consumer behandelt `v120.event_modification.prevent` jedoch nicht
semantisch und fällt auf die erste Option `pass` zurück.

## F12 – Discard verwirft einzigartige Pfadwerkzeuge

Decision 93 / StateVersion 162 verlangt drei Discards. Der Runner hat 4
Credits, keine Clicks, 3 von 4 MU belegt und folgende sichtbare Eigenkarten:

- Rig: Cyfermaster, Force Shield, SeeYa und Militech MRAM;
- Hand: Forged Activation Orders, zwei WuTech Mem Chips, Inside Job, SeeYa,
  Score! und drei Junkyard BBS.

Die aktuelle KI verwirft Forged Activation Orders, Inside Job und eine
Junkyard-Kopie. Sie behält damit die zweite SeeYa-Kopie trotz bereits
installiertem SeeYa sowie mehrere WuTech- und Junkyard-Kopien. Der unveränderte
Checkpoint verlangt mindestens:

- Forged Activation Orders behalten;
- Inside Job behalten;
- die redundante SeeYa-Handkopie verwerfen.

Die zwei übrigen Discards bleiben bewusst der generischen Bewertung
überlassen. Der Checkpoint liegt unter
`data/scenarios/ai-decision-checkpoints/cp-424a-09-discard-path-tools.json`.

Auch hier sind die Hints sachlich korrekt:

- SeeYa: `expose_info` auf legale installierte Ziele;
- Forged Activation Orders: `ice_trash` mit sichtbarer Rez-or-Trash-Wahl;
- Inside Job: Run plus Bypass des ersten ICE;
- WuTech: persistenter MU-Modifikator +1;
- Junkyard: Top-Trash-Recovery.

Die Consumer-Lücke ist zweigeteilt. `isRunnerNonAdditiveUtilityRole` erkennt
die SeeYa-Rollen `hidden_zone_tool` und `expose_helper` nicht als
nichtadditive Rig-Utility. Außerdem schützt `discardKeepScore` konkrete
Pfadwerkzeuge nur über den engen Legacy-Rollenbegriff `run_pressure`; die
strukturierten Effekte von Forged Activation Orders und Inside Job erreichen
die Discard-Bewertung nicht.

## Roter Testnachweis und Gegenproben

Ausgeführt auf Commit `a766e1ee9` zuzüglich ausschließlich Fixture- und
Teständerungen, ohne Produktionsänderung:

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/match-424a-runner-endgame-decision-checkpoints.test.ts \
  src/runtime/selected-choices-for-decision.test.ts \
  src/runtime/discard-keep-score.test.ts

Test Files  1 failed | 2 passed (3)
Tests       3 failed | 40 passed (43)
```

Alle drei Fehler melden:

```text
behavior_regression: Behavior expectation failed for runner.resolve_choice
```

Separat grün:

```text
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/runtime/selected-choices-for-decision.test.ts \
  src/runtime/discard-keep-score.test.ts \
  src/match-424a-card-hint-contract.test.ts

Test Files  3 passed (3)
Tests       43 passed (43)
```

Diese Gegenproben sichern insbesondere `pass`, wenn keine
Schadensverhinderungsquelle legal ist, sowie den Vorrang einzigartiger
MU-Unterstützung vor neutralen Duplikaten. Die Hint-Verträge prüfen aktive und
kompilierte Artefakte.

## Freigabe für die Produktionsfixes

F11 und F12 erfüllen den Red-vor-Fix-Vertrag. P2 darf deshalb einen
generischen Schadensverhinderungs-Selector ergänzen. P3 darf die vorhandene
Rollen-/Effektontologie im Discard-Consumer nutzen. Beide Fixes müssen die
hier festgeschriebenen Expectations unverändert grün machen.

