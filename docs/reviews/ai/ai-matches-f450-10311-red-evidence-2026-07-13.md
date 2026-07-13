# Rote KI-Evidence für F450 und 10311 (2026-07-13)

## Ergebnis

Alle vier freigegebenen Fehlerverträge sind gegen den unveränderten
produktiven Chooser auf Ausgangs-`main` `2260d0e5b` als
`behavior_regression` reproduziert. Die Capture-Warmups liefen in allen fünf
Fixtures ohne eine einzige Verhaltensabweichung; Fixture-, Runtime-, Engine-,
Legality- oder Redaction-Drift liegt nicht vor.

## Ziel-Checkpoints

| Checkpoint | Historischer Anker | Aktuelle Wahl | Unveränderte Erwartung | Klassifikation |
| --- | --- | --- | --- | --- |
| `cp-f450-10311-01` | Match 10311, Decision 130, SV227 | `runner.jack_out` | `continue_run` | `behavior_regression` |
| `cp-f450-10311-02` | Match 10311, Decision 186, SV318 | `runner.draw_card` | ein legaler `start_run` | `behavior_regression` |
| `cp-f450-10311-03` | Match 10311, Decision 73, SV124 | Streetware laden | Streetware bei 23 liquiden Credits nicht laden | `behavior_regression` |
| `cp-f450-10311-04` | Match 10311, Decision 17, SV28 | R&D-Run starten | finanziertes Cortical Cybermodem installieren | `behavior_regression` |

Die Fixtures enthalten jeweils den exakten historischen GameState, das für
Runner redigierte öffentliche Event-Präfix, den eigenen Deck-Snapshot und den
durch vollständiges Warmup gewonnenen Runtime-Checkpoint. Der Headless-Runner
erzeugt PlayerView und LegalActions erneut über die Engine und ruft
`chooseAiAction` produktiv auf.

## Warmup- und Side-Safety-Evidence

- CP01: 129 Warmup-Entscheidungen, null Drifts, 228 öffentliche Events,
  gespeicherter RunnerRunPlan vorhanden.
- CP02: 185 Warmup-Entscheidungen, null Drifts, 319 öffentliche Events.
- CP03: 72 Warmup-Entscheidungen, null Drifts, 125 öffentliche Events.
- CP03-Gegenprobe: 53 Warmup-Entscheidungen, null Drifts, 87 öffentliche
  Events.
- CP04: 16 Warmup-Entscheidungen, null Drifts, 29 öffentliche Events.

Keine Erwartung verwendet später aufgedeckte Karten oder gegnerische
Hidden-Zone-Daten. Der Matchpoint-Vertrag stützt sich nur auf den öffentlichen
Corp-Punktestand, sichtbare Serverstruktur und side-safe Run-Reachability.

## Grüne Gegenproben vor dem Fix

- Ohne Corp-Matchpoint bleibt am Zustand von CP02 der historische Draw zulässig.
- Im historischen Niedrigkredit-Zustand SV86 bleibt das Laden von Streetware
  zulässig.
- Mit nur zehn Credits bleibt am Cybermodem-Zustand der weitere
  Finanzierungs-Klick korrekt.
- Die bestehenden Run-Plan-Policy- und Path-Quote-Suiten sichern 27 Fälle,
  darunter legitime Jack-outs bei nicht zugriffserhaltendem Restpfad sowie die
  Encounter-/Movement-Grenzen.

## Präzisierte Ursachenhypothesen

1. Der auf `main` integrierte Encounter-/Movement-Schutz reicht beim
   umgeleiteten Run nicht aus: der gespeicherte Plan zeigt noch auf R&D,
   während der aktive Run nach Trapdoor auf `remote_1` steht. Trotz bereits
   gebrochenem Deadeye und Serverposition gewinnt der invalide alte Zielbezug
   weiterhin den Runtime-Override zum Jack-out.
2. Der Runner besitzt keinen hinreichend starken öffentlichen
   Gegner-Matchpoint-Interrupt. Normale Draw-, Setup- und Bankwerte dürfen den
   letzten erreichbaren Contest deshalb noch verdrängen.
3. Der Bank-Commitment-Score berücksichtigt komfortable liquide Credits,
   fehlenden konkreten Finanzierungsbedarf und den kurzen Resthorizont nicht
   ausreichend.
4. Der Handkartenplan finanziert Cybermodem korrekt, schützt aber den direkt
   folgenden, nun bezahlbaren Installationsschritt nicht gegen eine gewöhnliche
   Run-Gelegenheit.

## Reproduktionsläufe

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/f450-10311-decision-checkpoints.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose

corepack pnpm --filter @netgrid/ai exec vitest run `
  src/runtime/runner-run-plan-policy.test.ts `
  src/runtime/runner-run-plan-path-quote.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=dot
```

Ergebnis vor produktiven Änderungen: vier erwartete
`behavior_regression`-Fehlschläge und drei grüne Checkpoint-Gegenproben;
zusätzlich 27 grüne Run-Plan-Tests.
