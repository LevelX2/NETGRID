# Rote Evidence: Trapdoor-/Dumpster-Deflector (2026-07-14)

Status: Vor dem Deflector-Fix reproduziert; Ressourcenklassifikation in P2 korrigiert

## Ergebnis

Die fehlende Deflector-Wirkung ist auf `main` `d60f82a5d` als reine
`behavior_regression` reproduziert. Die erste rote Klassifikation enthielt
zusätzlich eine falsche Ressourcenannahme: Cortical Cybermodem stellt 2
sichtbare Run-Bits bereit und Lockjaw kann Krash im Encounter kostenlos um 2
Stärke erhöhen. Engine-Legalität, Fixture-Schema, Redaction und StateHash sind
stabil.

Quelle ist das aktive Hard-Runner-KI-Spiel `match_f450485d3e5be1ab` aus der
read-only geöffneten SQLite-Datei
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.

## Spielgleiche Checkpoints

| Checkpoint | Decision / StateVersion | StateHash | Erwartung | Baseline |
| --- | --- | --- | --- | --- |
| `cp-trapdoor-dumpster-deflector-01-pump` | DI52 / SV92 | `fnv1a:de36867f` | bezahlbare Krash-Sequenz mit `pump_breaker` beginnen | rot: `continue_run`, `behavior_regression` |
| `cp-trapdoor-dumpster-deflector-02-no-run` | DI56 / SV96 | `fnv1a:d499214e` | den mit 7 Credits plus 2 Run-Bits bezahlbaren R&D-Pfad starten | grün; ursprüngliche No-Run-Erwartung war fachlich falsch |
| `cp-trapdoor-dumpster-deflector-03-unaffordable-control` | DI57 / SV97 | `fnv1a:d3dabd03` | die zweite bezahlbare Krash-Break-Sequenz beginnen | rot: `continue_run`, Deflector nicht als Break-Ziel erkannt |
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

## Korrigierter Ressourcenvertrag am zweiten Run

Bei SV96 sind Trapdoor auf R&D und Dumpster auf der einzigen Remote gerezzt
und für Runner sichtbar. Runner besitzt nach der Mem-Chip-Installation 7
Credits sowie 2 sichtbare, für Icebreaker während Runs nutzbare
Cybermodem-Bits. Der konservativ ohne Lockjaw kalkulierte Trapdoor-Break für
8 Credits ist daher bereits bezahlbar. Zusätzlich kann Lockjaw Krash im
Encounter kostenlos +2 Stärke geben. `runner.start_run.rd` ist in diesem
konkreten Zustand folglich keine Fehlentscheidung.

Die alte Run-Bewertung enthielt zwar keinen Deflector-Pfadvertrag und setzte
fälschlich 0 statt 8 bekannte Pfadkosten an. Nach Einbeziehung der sichtbaren
Run-Bits bleibt der Pfad aber erreichbar. Eine synthetische Gegenprobe mit nur
1 Credit plus den 2 Run-Bits sichert nun das echte Negativkriterium: Reichen
alle sichtbaren Breaker-Ressourcen nicht, darf R&D nicht gestartet werden.

## Grüne Gegenproben

- DI57/SV97 reproduziert denselben Planungsfehler ein zweites Mal: Trotz 7
  Credits, 2 Run-Bits und Lockjaw lässt die KI Trapdoor ungeblockt auslösen.
- DI59/SV99 bestätigt die bereits integrierte Redirect-Revalidation: Nach der
  Dumpster-Umleitung auf freie Archives wird der Run fortgesetzt und nicht
  mehr wegen des alten R&D-Ziels abgebrochen.
- Eine synthetische Gegenprobe auf dem SV96-Zustand mit nur 1 statt 7 Credits
  verbietet `start_run` auf R&D. Der Fix darf den sichtbaren Pfad nur sperren,
  wenn das zugriffserhaltende Brechen unter Einbeziehung der sichtbaren
  Icebreaker-Ressourcen wirklich unbezahlbar ist.

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

Die beiden Encounter-Zeitpunkte und die wirklich unterfinanzierte synthetische
Gegenprobe sind die fachlich korrigierten Fix-Gates.
