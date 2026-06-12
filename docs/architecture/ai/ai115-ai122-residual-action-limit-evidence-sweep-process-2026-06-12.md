# AI115-AI122 Residual-Action-Limit Evidence Sweep

Status: in Umsetzung

Datum: 2026-06-12

Arbeitsbranch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

Worktree: `C:\Projekte\NETGRID_AI115_AI122_RESIDUAL_ACTION_LIMIT_EVIDENCE_SWEEP`

## Quelle und Vorgabe

Ausgangspunkt ist die Review-Folgeanalyse nach AI108-AI114. Der Stand ist fachlich sauber: `actionLimitReached = 9`, `mixed_unknown = 0`, `continue_without_progress = 0` und `late_draw_without_coverage_or_hand_goal = 0`. Ein breiter Runtime-Fix ist nicht zulässig.

Die Folgearbeit konzentriert sich auf drei eng abgegrenzte Untersuchungsrichtungen:

- B005 Runner-Reserve-Credits ohne Folgekonversion.
- Corp-Endfenster mit opaker Ability-Alternative.
- Late-Draw-for-Coverage-Outcome.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

- Gesamtziel: Restfälle mit side-safe LegalAction-/Alternative-Evidence belegen und nur bei konkret besserer legaler Alternative einen engen Runtime-Kandidaten testen.
- Reihenfolge: AI115 bis AI122 sequenziell.
- In-Scope: AI-Diagnostik, Trace-/Report-Artefakte, eng begrenztes Snapshot-Framework, optionale enge Runtime-Korrektur.
- Nicht-Ziele: neue LegalActions, Engine-Vertragsänderungen, Hidden-Info-Ausweitung, generische Credit-/Draw-/Run-/Corp-Economy-Strafen.
- Abnahmekriterien: Paketartefakte, Tests/Checks, `git diff --check`, Commit je Paket, finaler Full Sweep und lokaler Merge nach `main`.

## Gesamtziel

AI115 bis AI122 vollständig und sequenziell abarbeiten, jeden Paketstand verifizieren und committen, anschließend den abgeschlossenen Arbeitsbranch lokal nach `main` integrieren und den Worktree entfernen.

## Annahmen

- Lokaler `main` ist der führende Integrationsstand.
- Push/PR ist nicht Teil dieses Prozesses.
- Redaction-safe Alternative-Snapshots dürfen nur öffentliche oder side-safe Felder enthalten.
- Wenn keine konkrete bessere legale Alternative belegt ist, wird kein Runtime-Fix eingebaut.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness ohne echten Engine-Bug.
- Keine Hidden-Info-Ausweitung.
- Keine generische Credit-, Draw-, Run- oder Corp-Economy-Strafe.
- Kein kosmetisches Detector-Tuning zur Zielwerterreichung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Die KI bewertet ausschließlich von der Engine angebotene `LegalActions`.
- Snapshots dürfen keine `cardInstances`, `privatePayload`, FullGameState, gegnerischen Hidden-Zonen oder privaten Kartenlisten enthalten.
- Runtime-Fix nur bei konkreter legaler, side-safe besserer Alternative.
- Bei `unsafeScoreChosen > 3`, klarer Verschlechterung von `repeated_no_progress_run` über den AI114-Basisbereich oder Safety-Fail wird ein Runtime-Kandidat verworfen.

## Automatische Fehlerbehandlung

- Rote Tests werden eng debuggt und im aktuellen Paket behoben.
- Wenn ein Paket keine belastbare Fix-Evidence liefert, wird ein No-Go dokumentiert und ohne Runtime-Änderung fortgesetzt.
- Sicherheitsblocker stoppen den Prozess mit Blocker-Report und Removal Condition.

## State Machine

1. `process_preflight`
2. `ai115_b005_snapshot`
3. `ai116_snapshot_framework`
4. `ai117_b005_decision`
5. `ai118_corp_ability_evidence`
6. `ai119_coverage_draw_outcome`
7. `ai120_x10_watch`
8. `ai121_runtime_candidate_or_no_go`
9. `ai122_full_sweep`
10. `local_main_integration`
11. `cleanup_complete`

## Paketfolge

### AI115: B005 LegalAction Snapshot für Reserve-No-Conversion

Ziel: B / `ai-v143-tuning-005` vollständig side-safe sichtbar machen.

Arbeit:

- Reproduziere den B005-Lauf.
- Erfasse relevante Reserve-Credit-Entscheidungen mit `stateVersion`, Turn, Side, gewählter Action, LegalActions, Top-Alternativen mit Score/Evidence, semantischen Kandidaten, HardGate-Summary, Kosten, sichtbaren Coverage-Lücken, Reachability und No-Progress-Gates.
- Kein Runtime-Fix.

Artefakte:

- `docs/reviews/ai/ai115-b005-reserve-legalaction-snapshot-2026-06-12.md`
- `docs/reviews/ai/ai115-b005-reserve-legalaction-snapshot-2026-06-12.json`

Checks:

- Redaction-Safety prüfen.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `docs(ai): capture B005 reserve legal-action alternatives`

### AI116: Action Alternative Snapshot Framework

Ziel: Wiederverwendbares, optionales redaction-safe Snapshot-Framework für ausgewählte Findings integrieren.

Arbeit:

- Optionalen Trace-/Report-Parameter `includeActionAlternativesForFindings` ergänzen.
- `maxAlternativesPerFinding` ergänzen.
- Alternative-Summary nur für ausgewählte Findings erzeugen.
- Runtime-Entscheidung unverändert lassen.

Artefakt:

- `docs/reviews/ai/ai116-action-alternative-snapshot-framework-2026-06-12.md`

Checks:

- Unit-Test für Alternatives am Action-Limit-Finding.
- Redaction-Guard-Test.
- Runtime-Unverändert-Test soweit lokal ableitbar.
- `corepack pnpm --filter @netgrid/ai test -- src/simulation/benchmark-reports.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `feat(ai): add redaction-safe action alternative snapshots`

### AI117: B005 Coverage Alternative Decision

Ziel: Auf Basis von AI115/AI116 entscheiden, ob ein enger Runtime-Fix erlaubt ist.

Arbeit:

- B005-Snapshot über Framework bewerten.
- Nur bei konkreter besserer legaler Alternative einen engen Guard entwerfen.
- Sonst No-Go dokumentieren.

Artefakt:

- `docs/reviews/ai/ai117-b005-coverage-alternative-decision-2026-06-12.md`

Checks:

- Bei Fix: gezielte Unit-/Trace-Tests.
- Ohne Fix: AI-Typecheck und `git diff --check`.

Commit: `docs(ai): decide B005 reserve coverage alternative`

### AI118: Corp Ability Alternative Evidence

Ziel: Corp-No-Safe-Alternative-Fall als Semantik-Gap verbessern.

Arbeit:

- Pair D / `ai-v143-tuning-004` auswerten.
- `activated_card_ability` read-only klassifizieren: `scoreline_progress`, `remote_protection`, `rez_or_ice_progress`, `economy_only`, `opaque_no_progress`, `unknown`.
- Keine Runtime-Wirkung.

Artefakt:

- `docs/reviews/ai/ai118-corp-ability-alternative-evidence-2026-06-12.md`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `docs(ai): classify corp endwindow ability alternatives`

### AI119: Coverage Draw Outcome Review

Ziel: Neuen `late_draw_for_coverage_or_hand_goal`-Fall outcome-basiert prüfen.

Arbeit:

- Pair C / `ai-v143-tuning-004` Folgefenster nach Late-Draws prüfen.
- Kategorien: `coverage_draw_converted`, `coverage_draw_preserved_option`, `coverage_draw_no_conversion`, `coverage_draw_unknown`.
- Kein Runtime-Fix ohne `coverage_draw_no_conversion` plus bessere LegalAction.

Artefakt:

- `docs/reviews/ai/ai119-coverage-draw-outcome-review-2026-06-12.md`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `docs(ai): audit late coverage draw outcome`

### AI120: A-D-x10 Residual Watch

Ziel: Stabilität des `<= 9`-Zielwerts auf erweitertem Seed-Korpus prüfen.

Arbeit:

- A-D-x10 mit Seeds 001 bis 010 ausführen.
- ActionLimit-, Safety- und Subcluster-Verteilung bewerten.

Artefakte:

- `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai120-residual-action-limit-watch-2026-06-12.md`

Checks:

- Trace safety-grün.
- `git diff --check`

Commit: `docs(ai): run residual action-limit x10 watch`

### AI121: Narrow Runtime Candidate oder explizites No-Go

Ziel: Genau einen engen Fix testen oder explizites No-Go dokumentieren.

Arbeit:

- Kandidat nur aus AI115-AI120 ableiten.
- Stop-Regeln strikt anwenden.
- Kein kosmetisches Detector-Tuning.

Artefakt:

- `docs/reviews/ai/ai121-narrow-runtime-candidate-review-2026-06-12.md`

Checks:

- Bei Fix: A-D-x5 Safety-Trace und relevante Unit-Tests.
- Ohne Fix: `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.

Commit: `docs(ai): close narrow residual action-limit candidate`

### AI122: Full Sweep und Fehlerbeseitigung

Ziel: Abschluss des Folgeblocks.

Pflichtchecks:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm -r --if-present run typecheck
corepack pnpm -r --if-present run test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/web test
git diff --check
```

Finaler Trace:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai122-final-a-d-5seed-2026-06-12.json --max-actions 160 --max-findings 50
```

Artefakt:

- `docs/reviews/ai/ai122-final-full-sweep-review-2026-06-12.md`

Commit: `test(ai): complete residual action-limit evidence sweep`

## Verifikationsregeln

- Nach jedem Paket: relevante Checks, `git diff --check`, gezieltes Staging, Commit.
- Keine Weiterarbeit am nächsten Paket bei rotem Done-Gate.
- Finale Integration nur bei sauberem Arbeitsbranch.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich im Worktree `C:\Projekte\NETGRID_AI115_AI122_RESIDUAL_ACTION_LIMIT_EVIDENCE_SWEEP`.
- Hauptworkspace nur für finalen Merge nach `main`.
- Vor finalem Merge prüfen, ob `main` weitergelaufen ist.
- Bevorzugt Fast-Forward-Merge nach `main`.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI115 bis AI122 sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI115_AI122_RESIDUAL_ACTION_LIMIT_EVIDENCE_SWEEP auf Branch codex/ai115-ai122-residual-action-limit-evidence-sweep.
Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- AI115 bis AI122 abgeschlossen.
- Jedes Paket hat einen Commit.
- Finaler Full Sweep ist grün oder blockierende Fehler sind eng behoben und dokumentiert.
- Finaler A-D-x5-Trace ist geschrieben.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
