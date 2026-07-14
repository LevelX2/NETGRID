# Rote Evidence: Follow-up zu f450 und 10311

Status: Vor den fachlichen Fixes reproduziert

## Quelle und Methode

- SQLite-Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Match: `match_10311b60ca1364f6`
- Capture: `scripts/capture-ai-decision-checkpoint.ts`
- Warmup-Policy: `rebase`
- Test:
  `packages/ai/src/evaluation/decision-checkpoints/f450-10311-followup-decision-checkpoints.test.ts`

`rebase` ist hier erforderlich, weil bereits integrierte KI-Fixes mehrere ältere
Warmup-Entscheidungen bewusst verändert haben. Jeder Zielzustand selbst bleibt
als vollständiger GameState mit StateHash, side-safe Event-Prefix,
PlayerView-ableitbarem Runtime-Checkpoint und echter LegalAction-Generierung
gesichert.

## Spielgleiche Checkpoints

| Finding           | Decision | StateVersion | StateHash        | Erwartung                                            |
| ----------------- | -------: | -----------: | ---------------- | ---------------------------------------------------- |
| `F450-10311-F01A` |      167 |          279 | `fnv1a:1e4cfe3c` | installierte Agenda über aktivierte Fähigkeit scoren |
| `F450-10311-F01B` |      173 |          291 | `fnv1a:0ba3590f` | installierte Agenda über aktivierte Fähigkeit scoren |
| `F450-10311-F01C` |      183 |          309 | `fnv1a:a06ea847` | installierte Agenda über aktivierte Fähigkeit scoren |
| `F450-10311-F02`  |       69 |          113 | `fnv1a:77208449` | Breaker-Suchzugriff im Discard behalten              |
| `F450-10311-F03`  |      120 |          209 | `fnv1a:164ae7c1` | Puzzle-Wahl beibehalten, Metadaten korrigieren       |

## Bestätigte rote Baseline

Der fokussierte Lauf auf Commit `3920cfdc1` ergab fünf erwartete Fehler und drei
grüne Kontrollen:

1. StateVersion 279: `behavior_regression`; gewählt wird Basis-Credit statt
   `Theorem Proof scoren`.
2. StateVersion 291: `behavior_regression`; gewählt wird `Score!` statt
   `Theorem Proof scoren`.
3. StateVersion 309: `behavior_regression`; gewählt wird Basis-Credit statt
   `Theorem Proof scoren`.
4. StateVersion 113: `behavior_regression`; die Auswahl verwirft
   `Temple Microcode Outlet`, obwohl keine Breaker-Abdeckung installiert ist.
5. StateVersion 209: Der echte `continue_run`-Payload meldet
   `encounterWillEndRun: false` und enthält kein
   `encounterSourceWillTrashAtEndOfTurn`, obwohl beide ungebrochenen
   Subroutinen den Run beenden und die ICE-Quelle zum Ende des Zugs trashen.

Die Retain-Prüfung des Checkpoint-Runners musste vor dieser Klassifikation
korrigiert werden: Bei verdeckten Discard-Optionen lag die Karteninstanz in
`option.value`, während die alte Prüfung nur `option.card.instanceId` betrachtete.
Dadurch konnte ein tatsächlich verworfenes Exemplar fälschlich als behalten
gelten. Die korrigierte Zuordnung verändert keine KI-Entscheidung.

## Grüne Kontrollen

- Der bereits bestehende Cybermodem-Checkpoint bleibt grün und zeigt, dass nicht
  beliebige aktivierte Fähigkeiten global bevorzugt werden dürfen.
- Wird im Temple-Zustand ein Krash aus dem sichtbaren eigenen Stack in den Rig
  verschoben, darf Temple weiterhin verworfen werden; diese Gegenprobe ist grün.
- Die historische Puzzle-Entscheidung `continue_run` ist grün. Sie war bei 18
  Credits für den vollständigen Pfad gegenüber dem Akzeptieren der beiden
  Subroutinen und dem späteren Selbst-Trash taktisch passend.
- `checkpoint-runner.test.ts` und der bestehende Match-7bfe-Checkpoint bleiben
  nach der Retain-Prüfkorrektur mit 14 von 14 Tests grün.

## Red-Gate

```text
Test Files  1 failed (1)
Tests       5 failed | 3 passed (8)
```

Die roten Tests sind ab jetzt die verbindlichen Fix-Gates. Ein fachlicher Fix
darf erst committet werden, wenn die jeweils zugehörige Regression und ihre
Gegenprobe gemeinsam grün sind.
