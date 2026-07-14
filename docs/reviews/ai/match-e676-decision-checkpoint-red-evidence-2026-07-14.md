# Match E676: Decision-Checkpoint Red Evidence

## Stand

Die drei freigegebenen historischen Zielzustände aus
`match_e6761d8fcdbd7996` sind side-safe eingefroren und gegen den
unveränderten Ausgangsstand `5140d468bc` ausgeführt.

- CP01 ist bereits grün: Der aktuelle Chooser exponiert Tycho Extension nicht
  mehr und nimmt stattdessen einen Credit. Für diesen historischen Fund wird
  kein neuer Fix umgesetzt.
- CP02 und CP03 reproduzieren jeweils exakt eine `behavior_regression`.
- Drei synthetische Gegenproben sind vor dem Fix grün.
- Es liegt kein `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Redaction- oder Fixture-Fehler vor.

## Fixture-Herkunft

- SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only geöffnet
- Match: `match_e6761d8fcdbd7996`
- Actor: Corp, Difficulty `hard`, Profil `corp-ai-v0.9-hard`
- Engine-PlayerView und LegalActions werden bei jedem Lauf aus dem exakten
  historischen GameState und dem öffentlichen Eventpräfix neu erzeugt.
- Alle drei Runtime-Restores enthalten TacticalPlan, PlanPortfolio und
  StrategicIntent. Ein RunnerRunPlan ist für diese Corp-Hauptphasen nicht
  vorhanden.

| Checkpoint | Zustand | Warmup | Eventpräfix | Unveränderte Erwartung |
| --- | --- | --- | ---: | --- |
| CP01 | SV162 / DI78 | strikt, 77 Entscheidungen, 0 Drift | 163 | Tycho Extension nicht in Remote 1 installieren |
| CP02 | SV221 / DI101 | Rebase, 100 Entscheidungen, 1 früher Drift, kompatibler Suffix 22 | 222 | Chester Mix vor der HQ-ICE-Installation rezzen |
| CP03 | SV340 / DI158 | Rebase, 157 Entscheidungen, 2 frühere Drifts, kompatibler Suffix 28 | 341 | Night Shift statt Basis-Credit spielen |

CP02 und CP03 benötigen Rebase-Warmup, weil der aktuelle Chooser bereits bei
DI78 von der historischen Serverpartie abweicht. CP03 enthält zusätzlich eine
frühere Abweichung bei DI129: Der aktuelle Chooser installiert dort Liche im
zweiten Remote statt eines Basis-Credits. Beide Zielzustände selbst bleiben
unverändert; der damalige Runtime-Zustand wird am Ziel exportiert und im
Checkpoint wiederhergestellt.

## Ergebnisse auf unverändertem Code

| Checkpoint | Aktuelle Auswahl | Ergebnis |
| --- | --- | --- |
| CP01 | `corp.gain_credit` | grün; historischer Fehler aktuell nicht reproduzierbar |
| CP02 | Fetch 4.0.1 vor HQ installieren | rot; `behavior_regression` |
| CP03 | `corp.gain_credit` | rot; `behavior_regression` |

Die CP02-Aktion überspringt einen legalen kostenlosen Chester-Mix-Rez und
bezahlt dadurch den ersten vermeidbaren HQ-ICE-Installationscredit. CP03 wird
weiterhin durch den absoluten Scoreline-Reservecontroller auf die schwächere
Basisaktion gebunden.

## Grüne Gegenproben vor dem Fix

1. Mit 12 Corp-Credits und Project Consultants in HQ installiert die KI Tycho
   Extension weiterhin in einen neuen Remote, weil die Agenda noch im selben
   Zug konvertiert werden kann. Der Matchpoint-Schutz darf solche sicheren
   Fast-Advance-Fenster nicht blockieren.
2. Ohne ICE in HQ wird Chester Mix nicht allein wegen seiner Rez-Kosten 0
   erzwungen. Der neue Vorteil darf nur an eine konkrete begünstigte
   Same-Fort-ICE-Installation gebunden werden.
3. Bei leerem Corp-R&D wird Night Shift nicht gespielt. Eine höhere nominale
   Ökonomie darf einen schädlichen oder unmöglichen Draw nicht erzwingen.

## Roter Testlauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-e676-decision-checkpoints.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis:

```text
Test Files  1 failed (1)
Tests       2 failed | 4 passed (6)
```

Beide Ziel-Fehlschläge melden `behavior_regression`. CP01 und alle drei
Gegenproben sind grün. Die fachlichen Erwartungen werden für den Fix nicht
verändert.

## Gleichzeitig grüne Infrastruktur

Der Capture-Einstieg benötigte im frischen Worktree die unveränderten
Workspace-Paketverknüpfungen. Sie wurden mit
`corepack pnpm install --offline --frozen-lockfile` aus dem vorhandenen Cache
erzeugt. `tsx` wurde ausschließlich als `pnpm dlx`-Runner verwendet; dadurch
entstand keine versionierte Abhängigkeitsänderung.

Es wurden keine Benchmarks, Selfplays oder Serverprozesse gestartet.
