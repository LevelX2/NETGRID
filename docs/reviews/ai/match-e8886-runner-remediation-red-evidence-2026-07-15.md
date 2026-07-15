# Match E8886 Runner-Remediation: Red Evidence (2026-07-15)

## Spiel und Capture-Grundlage

- Match: `match_e8886c6f5a9d0c24`
- Modus: `human_corp_vs_runner_ai`
- KI: Runner `hard`
- Gewinner: Runner durch Agendapunkte
- End-StateVersion: 76
- Evidence: 77 Events, 77 Snapshots und 47 detaillierte
  AI-Decision-Traces
- lokale Read-only-Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Alle Checkpoints wurden auf Ausgangs-`main`
`ebe70b88870beada70f0fb9b130aab431ba35338` mit strengem Warmup gecaptured.
Die Warmup-Folgen bis D13, D16, D22 und D23 zeigten jeweils null Drift. Jeder
Checkpoint erzeugt PlayerView und LegalActions neu über die Engine und nutzt
nur das für den Runner redigierte öffentliche Eventpräfix bis zur jeweiligen
StateVersion.

## Rote Zielentscheidungen

Der unveränderte produktive Chooser reproduziert alle vier freigegebenen
Fehler als `behavior_regression`:

| Finding | Anker | Historische und aktuell reproduzierte Auswahl | Erwartung |
| --- | --- | --- | --- |
| E8886-F01 | D13 / SV24 | `runner.start_run.rd` | Credit nehmen oder freies HQ; kein nullfinanzierter nicht dringlicher R&D-Run gegen bezahlbares unbekanntes ICE |
| E8886-F02 | D16 / SV28 | Junkyard BBS installieren, inklusive `runner_install_economy` | keine Economy-Klassifizierung und keine absolute Empty-Heap-Installation |
| E8886-F03 | D22 / SV39 | Inside Job auf R&D trotz aktionsspezifischem `blocked_unpayable` | freies HQ oder Funding; kein unbezahlbarer R&D-Run |
| E8886-F04 | D23 / SV41 | `runner.continue_run` trotz bekannter unbezahlbarer Reststrecke | `runner.jack_out` |

## Grüne Gegenproben vor dem Fix

Sechs Kontrollen sind auf demselben unveränderten Code grün:

1. D3/SV8 startet den frühen Remote-Check-Run vor der
   Cyfermaster-Installation. Diese Option bleibt bewusst erhalten, weil
   unbekanntes ICE billig sein oder einen installierten unpassenden Breaker
   zerstören kann.
2. D39/SV67 startet R&D bei einem vollständig bekannten Pfad mit exakt vier
   verfügbaren und vier benötigten Credits.
3. D21/SV38 spielt Livewire's Contacts als echte Economy-Aktion und weist den
   Scorebestandteil `runner_credit_action_yield` nach.
4. Der vorhandene Checkpoint `cp-four-match-02-inside-job-rd` hält einen
   tatsächlich erreichbaren Inside-Job-Pfad grün.
5. Eine synthetische D16-Gegenprobe mit sichtbarem Bodyweight im Heap hält die
   Junkyard-Recovery-Installation verfügbar.
6. Eine synthetische D23-Gegenprobe mit zwei Credits läuft auf derselben
   bekannten Reststrecke weiter, weil Keeper nun bezahlbar ist.

## Ausgeführter Red-Lauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-e8886-runner-decision-checkpoints.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis: eine Testdatei, zehn Tests, davon vier erwartungsgemäß rot mit
Fehlercode `behavior_regression` und sechs Gegenproben grün. Es gab keinen
Engine-, Runtime-, Fixture-, Redaction- oder Warmup-Drift. Damit sind alle
vier freigegebenen Punkte auf aktuellem Code implementierungsreif.
