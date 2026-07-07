# Runner-KI Plancontroller Prozess 2026-07-07

Status: abgeschlossen und lokal integrationsbereit

## Quelle

- Nutzeranalyse und Diskussion zum zuletzt beendeten Spiel `match_c1057cdd40d936ed`.
- SQLite-Schnellpfad: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`, read-only inspiziert am 2026-07-07.
- Skill-Vertrag: `netgrid-ai-spielanalyse-worktree`.

## Gesamtziel

Die Runner-KI soll nicht mehr globale Aktionsscores als primäre Steuerung verwenden, wenn ein fachlicher Plan aktiv ist. Zuerst werden Planinstanzen erzeugt und priorisiert, danach bestimmt der aktive Plan den nächsten Schritt. Nur plan-kompatible LegalActions konkurrieren im Ranking. Off-plan-Aktionen dürfen nur durch klar begründete Planwechsel oder harte Interrupts übernehmen.

## Controller-Invarianten

- Keine neue LegalAction-Erzeugung; die KI wählt weiterhin ausschließlich Engine-`LegalActions`.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, KI-Inputs, Traces oder Reports.
- Kosten degradieren einen wichtigen Plan nicht zu beliebigen Nebenaktionen. Kosten werden als Blocker beziehungsweise als nächster Schritt `gain_credits` modelliert.
- Mehrere Remotes sind mehrere Planinstanzen, zum Beispiel `runner.contest_remote:remote_1` und `runner.contest_remote:remote_2`.
- Deckstrategie beeinflusst Planprioritäten, darf aber akute Score-Threats, kritische Tag-Defense oder Survival-Fenster nicht beliebig verdrängen.
- Planfortschreibung ist der Normalfall; Planwechsel brauchen einen expliziten stärkeren Plan oder ein objektiv obsoletes Ziel.

## In-Scope

- Runner-TacticalPlan-Auswahl und Plan-Mapping-Härtung.
- Planinstanz-Priorität für Remote Contest, Central Pressure, Economy/Funding, Coverage Search und Handentwicklung.
- Deckstrategie-Fit als Planprioritätskomponente, insbesondere für R&D/HQ/Remote-Decks.
- R&D-Planbewertung wird durch die bekannte zugreifbare Sequenz moduliert: vollständig bekannte Sequenzen ohne Agenda- oder sicheren Trash-Payoff erzeugen keinen guten R&D-Plan.
- Regressionen für Short-Circuit-Verdrängung, Remote-Funding und plan-dominante Auswahl.
- Prozess-, Evidence-, Final-Report und Wissenslog.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine Änderung der Security-Purge-Archives-Regel in diesem Paket.
- Kein vollständiger neuer Planner.
- Keine Balance-Endkalibrierung aller Aktionsscore-Komponenten; das ist ein Folgepaket nach der Plancontroller-Härtung.

## Paketfolge

### RPC-0 Preflight und Evidence

Ziel: Match-Evidence, freigegebene Fehlergruppen und Prozessregeln festhalten.

Checks: `git diff --check`.

Commit: `docs(ai): document runner plan controller process`

### RPC-1 Plan-Dominanz und Planwechsel-Regeln

Ziel: Runner-Planmapping darf bei aktiven Runner-Plänen nicht mehr durch beliebige globale Scores verdrängt werden. Zulässige Ausnahmen bleiben reaktive Fenster, aktiver Run-Plan, Self-Damage-Win und explizite Planwechsel-/Obsolete-Gründe.

Kernartefakte:

- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- fokussierte Tests in `packages/ai/src/runtime/semantic-choice-ranking.test.ts`

Checks: fokussierte Vitest-Datei, `git diff --check`.

Commit: `fix(ai): make runner tactical plans dominate off-plan ranking`

### RPC-2 Planinstanz-Priorität und Deckstrategie

Ziel: Runner-Planprioritäten bekommen explizite, side-safe strategische Plan-Gewichte. R&D-/HQ-/Remote-Strategien beeinflussen passende Planinstanzen, aber Remote-Score-Threat und konkrete Funding-Blocker bleiben strukturell erhalten.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-runner-run-targets.ts`
- `packages/ai/src/plans/tactical-plan-runner-plans.ts`
- Tests in `packages/ai/src/plans/`

Checks: fokussierte Plan-Tests, `git diff --check`.

Commit: `fix(ai): apply deck strategy to runner plan priorities`

### RPC-3 R&D-Bekanntheit als Planmodulator

Ziel: R&D-Planinstanzen dürfen nicht allein durch installierten Multiaccess gut bleiben, wenn die aktuell bekannte zugreifbare Sequenz vollständig aus nicht verwertbaren Karten besteht. Enthält die bekannte Sequenz eine Agenda oder einen sicheren Trash-Payoff, bleibt der Plan dagegen wertvoll.

Kernartefakte:

- `packages/ai/src/known-central-access-payoff.ts`
- `packages/ai/src/known-central-access-payoff.test.ts`

Checks: fokussierte Known-Central-Tests, Plancontroller-Regressionen, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): suppress stale known R&D multiaccess plans`

### RPC-4 Regression, Dokumentation und Integration

Ziel: betroffene Runtime-/Plan-Regressionen, Typecheck, Final-Report, Wissenslog und lokaler Merge nach `main`.

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- nach Merge relevante Checks im Hauptworkspace

Commit: `docs(ai): finalize runner plan controller report`

## Sicherheitsblocker

Stoppen ohne Workaround, wenn eine Lösung verdeckte Corp-Hand-/R&D-/Remote-Informationen benötigen würde, wenn eine benötigte LegalAction fehlt, oder wenn der lokale Merge nach `main` nicht kollisionsfrei lösbar ist.

## Ergebnis

- RPC-0 dokumentierte Match-Evidence und Prozessgrenzen.
- RPC-1 härtete `tacticalPlanMappedChoice`: Runner-Pläne definieren die aktive Aktionsspur; off-plan Score-Overrides werden blockiert, außer ein expliziter Hard-Interrupt oder ein Plan-Abbruchgrund wie wiederholter Run ohne Fortschritt greift. Innerhalb der gemappten Planaktionen entscheidet der semantische Score.
- RPC-2 ergänzte Planpriorität für score-bedrohte Remote-Ziele und Deckstrategie-Fit für R&D-, HQ- und Remote-Planinstanzen.
- RPC-3 härtete R&D-Planbewertung gegen bekannte Multiaccess-Sequenzen ohne Zugriffspayoff. Ein installierter R&D-Access-Bonus überstimmt diese negative Bekanntheit nicht mehr; bekannte Agenda-Sequenzen bleiben positiver Druck.
- RPC-4 dokumentierte Verifikation, Grenzen und lokalen Integrationsstand im Final-Report.
