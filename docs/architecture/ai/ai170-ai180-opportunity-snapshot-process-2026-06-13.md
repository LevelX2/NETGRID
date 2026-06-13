# AI170-AI180 Opportunity Snapshot Process

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse `pasted-text.txt` vom 2026-06-13 zu AI159-AI169 und daraus abgeleitete Folgeaufträge AI170 bis AI180.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Gesamtziel, Reihenfolge, In-Scope, Nicht-Ziele, Artefakte, Paket-Done-Gates, Tests und Sicherheitsblocker sind bestimmbar. Kleine Lücken werden konservativ gelöst: Wenn ein Paket keinen belegten same-state LegalAction-Kandidaten erzeugt, wird ein No-Go-Report erstellt statt Runtime-Verhalten zu ändern.

## Gesamtziel

AI170 bis AI180 bauen die fehlende Opportunity-State-Evidence nach AI159-AI169 auf: redaction-sichere LegalAction-Snapshots an früheren relevanten Entscheidungszeitpunkten, reproduzierbare Fixtures, Goal-Conversion-Contracts, konkrete Runner-/Corp-Solver, Scorecard v3, ein Cutover-Gate, höchstens ein bewiesener Runtime-Kandidat oder No-Go, Web-Test-Stabilisierung und finaler Sweep. Der Arbeitsbranch wird nach Abschluss lokal nach `main` integriert.

## Annahmen

- Der gültige Integrationsbranch ist `main`.
- Die Umsetzung läuft im Worktree `C:\Projekte\NETGRID_AI170_AI180_OPPORTUNITY_SNAPSHOTS`.
- Der Arbeitsbranch ist `codex/ai170-ai180-opportunity-snapshots`.
- Analyseartefakte behalten die fachlichen Datumsnamen `2026-06-13`.
- Bestehende AI159-AI169-Artefakte sind Eingangs-Evidence.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine Änderung an Engine-Legalität, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung.
- Keine generischen Credit-, Draw-, Run- oder Corp-Economy-Mali.
- Kein produktiver Cutover ohne Opportunity-State-Snapshot mit same-state LegalAction-Beweis.
- Keine offiziellen oder externen Asset-/Kartendatenabhängigkeiten.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI, Server und menschliche Spieler reichen nur von `LegalActions` abgeleitete `PlayerActions` ein.
- Alle neuen Snapshot-/Fixture-/Review-Artefakte müssen redaction-safe bleiben.
- Runtime-Wirkung ist nur bei AI178 zulässig und nur für genau einen bewiesenen Kandidaten, optional eng geflaggt und default off.
- Wenn ein Beweis fehlt, ist No-Go der korrekte Abschluss.

## Automatische Fehlerbehandlung

- Testfehler werden im aktiven Paket eng debuggt.
- Scope wird nicht auf Folgeprobleme erweitert; neue Funde werden als Gap oder Follow-up dokumentiert.
- Bei fachlichem Sicherheitsblocker wird ein Blocker-Report mit Removal Condition geschrieben und nicht fortgesetzt.
- Bei Git-Konflikten werden beide Intentionen gelesen und kompatibel zusammengeführt; unvereinbare Vertragskonflikte blockieren.

## Sicherheitsblocker

- Snapshot enthält FullGameState, `cardInstances`, gegnerische Hidden-Zonen oder private Payloads.
- Solver nutzt nicht side-safe Ziel- oder Karteninformationen.
- Candidate wird ohne same-state LegalAction, Kosten-/Timing-/TargetContext-Beweis produktiv.
- x5/x10 Safety zeigt Illegal Action, Replay Failure oder Hidden-Info Marker.

## State Machine

1. `process_defined`
2. `worktree_ready`
3. `package_active`
4. `package_verified`
5. `package_committed`
6. `integration_preflight`
7. `main_merged`
8. `worktree_removed`
9. `complete`

## Paketfolge

| Paket | Titel | Commit |
| --- | --- | --- |
| AI170 | Opportunity-State Snapshot Instrumentation | `feat(ai): capture opportunity-state legal action snapshots` |
| AI171 | Opportunity Replay Fixtures | `test(ai): add opportunity-state decision fixtures` |
| AI172 | Goal Conversion Contract v1 | `feat(ai): define endgame goal conversion contracts` |
| AI173 | Runner Coverage Opportunity Solver | `feat(ai): solve runner coverage opportunities from snapshots` |
| AI174 | Corp Tag/Punish Stale Intent Review | `docs(ai): classify stale corp tag punish intents` |
| AI175 | Corp Tempo Opportunity Solver | `feat(ai): solve corp tempo opportunities from snapshots` |
| AI176 | Endgame Opportunity Scorecard v3 | `docs(ai): add opportunity proof metrics to endgame scorecard` |
| AI177 | Opportunity Candidate Selection Gate | `docs(ai): define opportunity candidate cutover gate` |
| AI178 | One Proven Opportunity Candidate | `fix(ai): test one proven opportunity candidate` oder No-Go-Commit |
| AI179 | Web Test Timeout Stabilization | `test(web): stabilize catalog data focused test timeout` |
| AI180 | Full Sweep | `test(ai): complete opportunity snapshot sweep` |

## Paketdetails

### AI170 Opportunity-State Snapshot Instrumentation

Ziel: Die in AI159 fehlenden LegalAction-Snapshots für frühere Opportunity-Zustände erzeugen.

Kernartefakte:

- `docs/reviews/ai/ai170-opportunity-state-snapshot-instrumentation-2026-06-13.md`
- `docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json`

Done-Gate:

- Mindestens die zwei AI159-TargetContext-missing-Fälle enthalten echte Opportunity-Snapshots oder eine präzise Removal Condition.
- Snapshots enthalten LegalActions, side-safe TargetContext, Kosten-/Timingprofil und Gate-Summary.
- Keine Runtime-Entscheidung ändert sich.
- Redaction-Prüfung grün.

### AI171 Opportunity Replay Fixtures

Ziel: Reproduzierbare Fixtures aus AI170 bauen.

Kernartefakt:

- `docs/reviews/ai/ai171-opportunity-replay-fixtures-2026-06-13.md`

Done-Gate:

- Mindestens drei Opportunity-Fixtures oder dokumentiertes No-Go, wenn AI170 nicht genug echte Snapshots liefert.
- Same-state LegalActions sind deterministisch.
- Redaction safe.

### AI172 Goal Conversion Contract v1

Ziel: Endgame-Absichten bekommen klare Konversionsverträge.

Kernartefakt:

- `docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.md`

Done-Gate:

- Die sechs vorgegebenen Contract-Typen sind read-only definiert.
- Stale Intents werden nach fehlender Konversion klassifiziert.
- Kein Scoring-Eingriff.

### AI173 Runner Coverage Opportunity Solver

Ziel: Runner-Coverage-Fälle gegen echte Opportunity-Snapshots prüfen.

Kernartefakt:

- `docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.md`

Done-Gate:

- Coverage-Fälle werden in konkrete Pfadklassen getrennt.
- Mindestens ein Coverage-Fall ist `cutover_candidate` oder begründet No-Go.
- Kein Stack-Hidden-Info-Leak.

### AI174 Corp Tag/Punish Stale Intent Review

Ziel: `corp.convert_tag_to_punish` in konkrete Stale-Klassen trennen.

Kernartefakt:

- `docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.md`

Done-Gate:

- Stale Punish ist in `missing_tag`, `missing_payoff`, `unpayable_payoff`, `payoff_not_legal`, `scoreline_should_replace` getrennt.
- Kein Runtime-Fix.

### AI175 Corp Tempo Opportunity Solver

Ziel: Corp-Endgame-Tempo in konkrete LegalActions übersetzen.

Kernartefakt:

- `docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.md`

Done-Gate:

- Corp-/mixed-Fälle werden in Scoreline, Advance, Protection, Economy, Punish und Ability-Klassen geprüft.
- Mindestens ein Corp-Fall ist Cutover-Kandidat oder No-Go.
- Keine Runtime-Wirkung.

### AI176 Endgame Opportunity Scorecard v3

Ziel: Scorecard um Opportunity- und Intent-Metriken erweitern.

Kernartefakte:

- `docs/reviews/ai/ai176-endgame-opportunity-scorecard-v3.md`
- `docs/reviews/ai/ai176-endgame-opportunity-scorecard-v3.json`

Done-Gate:

- Scorecard zeigt Snapshot-Verfügbarkeit, same-state better rate, TargetContext missing rate, stale intent/punish, Solver-Raten, Lookahead und Cutover Eligibility.
- x5/x10 bleiben vergleichbar.

### AI177 Opportunity Candidate Selection Gate

Ziel: Verbindliches Gate für künftige Runtime-Kandidaten definieren.

Kernartefakt:

- `docs/reviews/ai/ai177-opportunity-candidate-selection-gate.md`

Done-Gate:

- Gate enthält Snapshot, LegalAction, TargetContext, Kosten, Timing, HardGates, Progress-Delta, Intent-Contract, Redaction und Wiederholbarkeit.
- AI178 darf nur Gate-positive Kandidaten übernehmen.

### AI178 One Proven Opportunity Candidate

Ziel: Genau einen Runtime-Kandidaten testen, falls AI170-AI177 ihn belegen.

Kernartefakt:

- `docs/reviews/ai/ai178-one-proven-opportunity-candidate.md`

Done-Gate:

- Entweder messbarer sicherer Fix mit Fixture, x5, x10 Watch, Safety/Replay/Redaction und optional default-off Flag.
- Oder No-Go ohne Runtime-Eingriff.

### AI179 Web Test Timeout Stabilization

Ziel: Wiederholtes fokussiertes `@netgrid/web`-Timeout in `catalog-data.test.ts` stabilisieren, ohne Assertions abzuschwächen.

Kernartefakt:

- `docs/reviews/web/ai179-catalog-data-timeout-stabilization.md`

Done-Gate:

- Ursache eingegrenzt.
- Fokussierter Web-Test stabil.
- Root-/rekursive Tests bleiben grün.

### AI180 Full Sweep

Ziel: Abschluss des Blocks.

Kernartefakt:

- `docs/reviews/ai/ai180-final-opportunity-snapshot-sweep.md`

Done-Gate:

- Finaler x5 Trace und x10 Watch.
- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`

## Worktree-, Git- und Integrationsregeln

- Arbeit nur im Worktree `C:\Projekte\NETGRID_AI170_AI180_OPPORTUNITY_SNAPSHOTS`.
- Hauptworkspace nur für finalen Merge nach `main`.
- Jedes Paket wird einzeln geprüft und committed.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls nötig.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI170 bis AI180 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis-Einstiegsseiten und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI170_AI180_OPPORTUNITY_SNAPSHOTS auf Branch codex/ai170-ai180-opportunity-snapshots.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- AI170 bis AI180 sind abgeschlossen oder mit zulässigem No-Go dokumentiert.
- Alle Paketcommits liegen auf dem Arbeitsbranch.
- Finale Checks sind grün oder ein harter Blocker ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
- Keine Remote-Integration ohne Nutzerwunsch.
