# Rote Evidence: Trapdoor-/Dumpster-Deflector (2026-07-14)

Status: Vor dem Deflector-Fix reproduziert

## Ergebnis

Zwei freigegebene Runner-KI-Fehler sind auf aktuellem `main`
`d60f82a5d` als reine `behavior_regression` reproduziert. Drei Gegenverträge
sind bereits grün. Engine-Legalität, Fixture-Schema, Redaction und StateHash
sind stabil.

Quelle ist das aktive Hard-Runner-KI-Spiel `match_f450485d3e5be1ab` aus der
read-only geöffneten SQLite-Datei
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.

## Spielgleiche Checkpoints

| Checkpoint | Decision / StateVersion | StateHash | Erwartung | Baseline |
| --- | --- | --- | --- | --- |
| `cp-trapdoor-dumpster-deflector-01-pump` | DI52 / SV92 | `fnv1a:de36867f` | bezahlbare Krash-Sequenz mit `pump_breaker` beginnen | rot: `continue_run`, `behavior_regression` |
| `cp-trapdoor-dumpster-deflector-02-no-run` | DI56 / SV96 | `fnv1a:d499214e` | den bekannten unbezahlbaren R&D-Redirect-Pfad nicht starten | rot: `runner.start_run.rd`, `behavior_regression` |
| `cp-trapdoor-dumpster-deflector-03-unaffordable-control` | DI57 / SV97 | `fnv1a:d3dabd03` | im bereits laufenden, unbezahlbaren Encounter `continue_run` zulassen | grün |
| `cp-trapdoor-dumpster-deflector-04-archives-continue` | DI59 / SV99 | `fnv1a:2f129234` | nach Dumpster auf freien Archives `continue_run` | grün |

Alle Fixtures enthalten den exakten historischen GameState und ausschließlich
das für Runner redigierte öffentliche Eventpräfix bis zur Ziel-StateVersion.
PlayerView und LegalActions werden im Test erneut durch die Engine erzeugt;
die Entscheidung läuft durch `buildAiDecisionInput` und den produktiven
`chooseAiAction`-Pfad.

## Roter Vertrag 1: bezahlbaren Deflector brechen

Bei SV92 besitzt Runner 10 Credits, Krash mit Stärke 0 und begegnet der
gerezzten Trapdoor mit Stärke 3. Drei Pumps kosten 6 Credits; das Brechen der
einzigen Subroutine kostet weitere 2 Credits. Die vollständige Sequenz ist
mit 8 Credits bezahlbar und erhält den geplanten R&D-Zugriff.

Die Pump-LegalAction ist vorhanden. Die Semantic Runtime schließt sie dennoch
mit `pump_cannot_lead_to_useful_break` aus und wählt
`runner.continue_run.card_implementation.onr_classic_014_trapdoor...`.
Damit liegt kein Engine- oder Break-Legalitätsfehler vor, sondern eine
fehlende Deflector-Wirkung in der Encounter-Viability.

## Roter Vertrag 2: unbezahlbaren bekannten Pfad nicht erneut starten

Bei SV96 sind Trapdoor auf R&D und Dumpster auf der einzigen Remote gerezzt
und für Runner sichtbar. Runner besitzt nach der Mem-Chip-Installation nur
noch 7 Credits. Die Trapdoor-Sequenz kostet weiterhin 8 Credits und ist daher
nicht zugriffserhaltend bezahlbar. Trotzdem wählt die KI erneut
`runner.start_run.rd`.

Die Run-Bewertung enthält keinen Deflector-Pfadvertrag und behandelt R&D als
erreichbares Druckziel. Die Kette
`R&D -> Trapdoor -> Remote 1 -> Dumpster -> Archives` wird vor dem Run nicht
als sichtbare Zieländerung bewertet.

## Grüne Gegenproben

- DI57/SV97 bestätigt, dass die KI in einem bereits laufenden Encounter keine
  unbezahlbare Pump-Sequenz beginnen muss. Das Auslösen der Trapdoor-Routine
  bleibt korrekt zulässig.
- DI59/SV99 bestätigt die bereits integrierte Redirect-Revalidation: Nach der
  Dumpster-Umleitung auf freie Archives wird der Run fortgesetzt und nicht
  mehr wegen des alten R&D-Ziels abgebrochen.
- Eine synthetische Gegenprobe auf dem exakten SV96-Zustand mit 10 statt 7
  Credits erlaubt weiterhin `start_run` auf R&D. Der spätere Fix darf den
  sichtbaren Pfad nicht pauschal sperren, wenn das zugriffserhaltende Brechen
  bezahlbar ist.

## Warmup-Einordnung

Die Captures verwenden `--warmup-policy rebase`, weil bereits integrierte
Run-Revalidation-Fixes fünf frühere historische Jack-outs bewusst in
`continue_run` geändert haben. Vor DI56 kommt zusätzlich eine aktuelle
Abweichung beim Mem-Chip-Schritt hinzu. Deshalb besitzt der SV96-Capture
keinen kompatiblen Runtime-Suffix; sein vollständiger GameState, Eventpräfix,
PlayerView, LegalActions und die Zielentscheidung bleiben jedoch exakt und
reproduzierbar. DI52, DI57 und DI59 enthalten einen aktuellen
RunnerRunPlan-Checkpoint.

## Reproduktionslauf

```powershell
corepack pnpm exec vitest run `
  packages/ai/src/evaluation/decision-checkpoints/trapdoor-dumpster-deflector-decision-checkpoints.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Baseline:

```text
Test Files  1 failed (1)
Tests       2 failed | 3 passed (5)
```

Die zwei Fehlschläge sind ab jetzt die unveränderten Fix-Gates.

