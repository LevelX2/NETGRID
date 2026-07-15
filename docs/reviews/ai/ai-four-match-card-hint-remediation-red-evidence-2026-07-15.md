# Rote Evidence: Kartenhints aus vier gespeicherten Spielen (2026-07-15)

Status: Vor Produktionsänderungen reproduziert

## Scope und Quellen

Geprüft wurden die freigegebenen Hint- und Consumer-Deltas aus:

- `match_dfe6223d817c646d`;
- `match_e6761d8fcdbd7996`;
- `match_f450485d3e5be1ab`;
- `match_10311b60ca1364f6`.

Die beiden neuen Match-Captures verwenden ausschließlich den historischen
GameState der Ziel-StateVersion, das öffentliche und für den Runner redigierte
Event-Präfix, den eigenen Decksnapshot sowie den produktiven Chooser auf
Engine-erzeugten `LegalActions`.

## Hint-Verträge vor dem Fix

Der neue fokussierte Vertrag
`packages/ai/src/four-match-card-hint-contract.test.ts` prüft aktive und
kompilierte Hints getrennt. Vor der Datenänderung sind alle 16 Assertions rot:

- `Disgruntled Ice Technician` fehlt die Run-/Derez-Semantik und trägt noch
  ICE-Trash sowie eine feste R&D-Rolle;
- `Militech MRAM Chip` und der homogene Peer `MRAM Chip` werden fälschlich als
  Memory und Remote-Upgrade-Modifikator klassifiziert;
- `Mantis, Fixer-at-Large` erzeugt zusätzlich zur Suche ein falsches
  Draw-Signal;
- `Score!` trägt falsche Run- und R&D-Druckrollen;
- `Corporate Downsizing` nennt noch `reveal_rd_top` und `protect_rnd` statt
  HQ-Agenda-Bereinigung;
- `Cloak` und `Vewy Vewy Quiet` beschränken ihre wiederkehrenden Credits nicht
  kanonisch auf nicht-noisy Icebreaker.

Der Test scheitert sowohl gegen `ai-card-hints-active.json` als auch gegen die
Runtimequelle `ai-card-hints-compiled.json`. Die Expectations werden nach dem
Fix nicht verändert.

## Spielgleiche Consumer-Reproduktion

### Disgruntled Ice Technician: bereits grüner Nicht-Fix

- Match: `match_f450485d3e5be1ab`
- Decision: 60
- StateVersion: 100
- historisch gewählt: Disgruntled Ice Technician auf Archives
- Capture: `cp-four-match-01-disgruntled-archives.json`
- Erwartung: diese Karte nicht für den leeren Archives-Run ausgeben

Der Capture benötigt `warmup-policy=rebase`, weil 18 der 59 historischen
Vorlaufentscheidungen durch bereits integrierte F450-/Redirect-Fixes bewusst
abweichen. Der produktive aktuelle Chooser besteht die Erwartung bereits. Es
gibt deshalb keinen zusätzlichen Disgruntled-Laufzeitfix; korrigiert wird nur
der nach Kartentext eindeutig falsche Hint.

### Inside Job: reproduzierbar roter Consumer

- Match: `match_dfe6223d817c646d`
- Decision: 62
- StateVersion: 116
- gewählt: Inside Job auf R&D
- unmittelbare Folge: Bypass des ersten ICE und erfolgreicher Access
- Capture: `cp-four-match-02-inside-job-rd.json`

Der Capture verwendet `warmup-policy=rebase`, weil die bereits integrierten
DFE6-Fixes zwei frühere Entscheidungen ändern; acht direkt vorgelagerte
Entscheidungen bilden wieder einen kompatiblen Suffix. Die Aktionswahl selbst
ist korrekt. Der unveränderte aktuelle Consumer meldet im ausgewählten
Score-Breakdown aber weiterhin:

```text
path:blocked_unpayable
credits_after:-2
```

Damit ist der Kartenhint vorhanden, erreicht aber die Run-Pfadquote der
kartenbezogenen Run-Aktion nicht. Der Zielvertrag verlangt unverändert
`path:reachable` und verbietet `path:blocked_unpayable`.

## Grüne Gegenbelege und Nicht-Fixes

- Die fünf bestehenden Checkpoint-Dateien für F450/10311, E676, DFE6 und
  Trapdoor/Dumpster bestehen vor dem Fix mit 34/34 Tests.
- Der Trapdoor-/Dumpster-Vertrag belegt bereits, dass Lockjaw und beschränkte
  Breaker-Credits in der sichtbaren Run-Pfadquote wirken.
- Clown und Pattel's Virus wurden in den historischen Zuständen nicht
  nachweislich falsch ausgelassen. Ihre Breakkosten-Supportsignale werden
  bereits abgeleitet; es wird keine pauschale Installationswertung ergänzt.
- Für `Core Command: Jettison Ice` ist kein spielgleicher Zustand belegt, in
  dem ICE-Trash sichtbar besser als die gewählte Tag-Entfernung war. Es folgt
  kein Zielwert- oder Kartenname-Sonderfix.

## Vor-Fix-Befehle

```text
corepack pnpm exec vitest run packages/ai/src/four-match-card-hint-contract.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
-> 1 Datei rot, 16/16 Assertions fachlich rot

corepack pnpm exec vitest run packages/ai/src/evaluation/decision-checkpoints/four-match-card-hint-decision-checkpoints.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose
-> Disgruntled grün; Inside-Job-Pfadquote fachlich rot

corepack pnpm exec vitest run <fünf vorhandene Match-Checkpoint-Dateien> --maxWorkers=1 --testTimeout=30000 --reporter=dot
-> 5 Dateien, 34/34 Tests grün
```

Die Fresh-Worktree-Abhängigkeiten wurden lockfile-fest per
`corepack pnpm install --offline --frozen-lockfile` aus dem lokalen pnpm-Store
installiert. Der erste Lauf ohne Worktree-Abhängigkeiten war ausschließlich
ein Infrastrukturfehler und zählt nicht als Red Evidence.
