# Rote Evidence: AI-Match 03575 (2026-07-16)

Status: Vor den Produktionsfixes reproduziert

## Ergebnis

Die zwei freigegebenen Runner-KI-Fehler aus
`match_03575bf4efae5bc7` sind auf dem Ausgangsstand `b643f4f18` als reine
`behavior_regression` reproduziert. Engine-Legalität, Fixture-Schema,
Redaction, StateHash und Runtime-Restore sind stabil. Zwei enge synthetische
Gegenproben bleiben gleichzeitig grün.

Quelle ist die read-only geöffnete SQLite-Datei
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.

## Spielgleiche Checkpoints

| Checkpoint | Decision / StateVersion | StateHash | Erwartung | Baseline |
| --- | --- | --- | --- | --- |
| `cp-03575-01-trace-bid-economy` | DI37 / SV61 | `fnv1a:ba768f74` | `bid_0` statt sechs Credits ohne sichtbaren Tag-Punish zu verbrauchen | rot: `bid_6`, `behavior_regression` |
| `cp-03575-02-rd-repeat-fresh-matchpoint` | DI58 / SV94 | `fnv1a:6429998a` | `runner.start_run.rd` auf frisch randomisiertes R&D bei fünf Agenda-Punkten | rot: `runner.draw_card`, `behavior_regression` |

Beide Captures liefen mit `--warmup-policy strict`. Vor DI37 wurden 36, vor
DI58 wurden 57 historische KI-Entscheidungen exakt reproduziert; es gab keine
Warmup-Abweichung. Die Fixtures enthalten den exakten GameState, das für Runner
redigierte öffentliche Eventpräfix, den eigenen Decksnapshot und den
kompatiblen Runtime-Checkpoint. PlayerView und LegalActions werden im Test
erneut durch Engine und produktiven AI-Eingang aufgebaut.

## Trace-Bid-Vertrag

Runner besitzt bei SV61 sechs Credits, drei verbleibende Clicks und keinen Tag.
Der Run benötigt nach dem Trace keine weiteren Credits. Ohne sichtbaren aktiven
Tag-Punish wählt die KI dennoch `bid_6`. Nimmt sie stattdessen den Tag, bezahlt
zwei Credits und einen Click für die Bereinigung und nutzt die übrigen zwei
Clicks für Basis-Credits, endet sie tagfrei mit sechs Credits. Der historische
Pfad endet nach drei Basis-Credits nur bei drei Credits. `bid_0` ist damit im
sichtbaren Folgezustand strikt um drei Credits besser.

Die synthetische Gegenprobe setzt die verbleibenden Clicks auf null. Ohne
möglichen Bereinigungs-Click bleibt `bid_6` grün; der Fix darf hohe Gewinn-Bids
also nicht pauschal abschalten.

## R&D-Repeat-Run-Vertrag

Runner steht bei SV94 auf fünf Agenda-Punkten, vier Clicks und drei Credits.
Der letzte R&D-Zugriff kannte Paris City Grid als oberste Karte. Seitdem hat die
Corp ihre Pflichtkarte gezogen; der oberste R&D-Inhalt ist wieder frisch und
unbekannt. Der Pfad ist erreichbar. Trotzdem überstimmt die pauschale
`runner_recent_same_server_runs`-Strafe von `-2600` die Matchpoint- und
Unknown-Top-Signale und erzeugt `runner.draw_card`. Nach genau diesem
irrelevanten Draw wählt die KI im nächsten historischen Zustand den R&D-Run.

Die synthetische Gegenprobe entfernt die zwischenzeitliche `mandatory_draw` aus
dem sichtbaren Eventpräfix. Beim dadurch wirklich unveränderten R&D-Top bleibt
`runner.draw_card` grün; der Fix muss Frische unterscheiden und darf echten
Repeat-Spam weiter abwerten.

## Reproduktionslauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-03575-runner-decision-checkpoints.test.ts `
  --reporter=verbose
```

Baseline:

```text
Test Files  1 failed (1)
Tests       2 failed | 2 passed (4)
Zieltests  behavior_regression
Kontrollen grün
```
