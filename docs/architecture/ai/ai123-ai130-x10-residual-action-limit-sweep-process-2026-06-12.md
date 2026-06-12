# AI123-AI130 x10 Residual Action-Limit Evidence Sweep

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse vom 2026-06-12 zu AI115-AI122 und Folgeauftrag AI123-AI130.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: x10-Restcluster vollständig inventarisieren, engere Residual-Fälle prüfen, Action-Alternative-Snapshots in den normalen Trace-Mining-Reviewfluss integrieren, höchstens einen belegten Runtime-Kandidaten testen, neue Gates definieren und mit Full Sweep abschließen.
- Sequenz: AI123 bis AI130 ist verbindlich vorgegeben.
- In-Scope: AI-Trace-Mining, Review-Artefakte, redaction-safe Action-Alternativen, Pakettests und Abschlusschecks.
- Nicht-Ziele: keine neue LegalAction-Erzeugung, keine Engine-/`applyAction`-/Replay-/StateHash-/Randomness-Änderung ohne echten Engine-Bug, keine Hidden-Info-Ausweitung, kein erneuter AI121-B005-Draw-Malus.
- Abnahme: je Paket Artefakt, Paketcheck, `git diff --check`, eigener Commit; final vollständiger Sweep und lokaler Merge nach `main`.

## Gesamtziel

AI123 bis AI130 sequenziell im Worktree `C:\Projekte\NETGRID_AI123_AI130_X10_RESIDUAL_ACTION_LIMIT_SWEEP` auf Branch `codex/ai123-ai130-x10-residual-action-limit-sweep` umsetzen, jeden abgeschlossenen Schritt committen, anschließend lokal nach `main` integrieren und den Worktree aufräumen.

## Annahmen

- AI115-AI122 ist abgeschlossen; führender Ausgangsstand ist Commit `db6c8afb`.
- A-D-x5 bleibt mit `actionLimitReached = 9`, `illegalActions = 0`, `replayFailures = 0`, `redactionSafe = true`, `repeated_no_progress_run = 31`, `unsafeScoreChosen = 3` der bekannte Basiskorridor.
- A-D-x10 mit 21/40 Action-Limit-Spielen ist der neue Hauptbefund.
- Wenn vorhandene Trace-Artefakte ausreichen, dürfen sie geladen statt neu reproduziert werden; neue Reproduktion ist erforderlich, wenn ein Paket sonst nicht belastbar abgeschlossen werden kann.

## Nicht-Ziele

- Kein pauschaler Credit-, Draw-, Run- oder Corp-Economy-Malus.
- Keine Wiederholung des verworfenen AI121-B005-Draw-Malus in gleicher Form.
- Keine produktive Legalitätslogik außerhalb der Engine.
- Keine Redaction-Aufweichung und keine Hidden-Info-Erweiterung.
- Kein kosmetisches Detector-Tuning als Ersatz für belegte Verhaltensverbesserung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI, Server und menschliche Spieler reichen nur aus `LegalActions` abgeleitete `PlayerActions` ein.
- `applyAction`-, Replay-, StateHash- und Randomness-Verträge bleiben unverändert, solange kein echter Engine-Bug belegt ist.
- Action-Alternative-Snapshots sind opt-in, redaction-safe und dürfen keine privaten Kartenlisten, `FullGameState`, `cardInstances`, `privatePayload` oder gegnerische Hidden-Zonen enthalten.
- Runtime-Fixes sind nur zulässig, wenn mehrere oder besonders klare side-safe LegalAction-Alternativen mit besserem Outcome belegt sind.

## Automatische Fehlerbehandlung

- Rote Tests werden eng im Paket-Scope debuggt.
- Tests werden nicht gelöscht.
- Wenn ein Runtime-Kandidat `actionLimitReached`, `unsafeScoreChosen` oder `repeated_no_progress_run` verschlechtert, wird er verworfen und als No-Go dokumentiert.
- Bei Illegal Actions, Replay-Fehlern oder Redaction-Fail stoppt die Runtime-Übernahme.
- Bei fachlichem Blocker wird ein Blocker-Report mit Removal Condition geschrieben.

## State Machine

1. `process_preflight`
2. `ai123_inventory`
3. `ai124_late_draw_regression`
4. `ai125_runner_reserve_review`
5. `ai126_corp_endwindow_review`
6. `ai127_snapshot_integration`
7. `ai128_candidate_or_no_go`
8. `ai129_gate_decision`
9. `ai130_full_sweep`
10. `integration_preflight`
11. `main_merge`
12. `cleanup`
13. `complete`

## Paketfolge

### AI123: x10 Residual Cluster Inventory

Ziel: Alle 21 A-D-x10-Action-Limit-Spiele einzeln klassifizieren und Top-3-Restursachen priorisieren.

Kernartefakte:

- `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.md`
- optional `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`

Done-Gate: 21 Action-Limits inventarisiert, Tabellen nach Gesamt/Pair/Seedbereich/neuen x10-Fällen, keine Runtime-Änderung.

Commit: `docs(ai): inventory x10 residual action-limit clusters`

### AI124: Pair-A Late-Draw No-Goal Regression

Ziel: Pair-A-Late-Draw-ohne-Coverage-Ziel isolieren, Detector-Verhalten absichern und Kandidatenstatus klären.

Kernartefakt:

- `docs/reviews/ai/ai124-pair-a-late-draw-no-goal-review-2026-06-12.md`

Done-Gate: Pair-A-Fall klassifiziert, Regressionstest ergänzt, kein pauschaler Draw-Malus.

Commit: `test(ai): isolate pair A late no-goal draw`

### AI125: x10 Runner Reserve No-Conversion Review

Ziel: Alle Runner-Reserve-Fälle im x10-Korpus outcome-basiert in echte Reserve und Nicht-Konversion trennen.

Kernartefakt:

- `docs/reviews/ai/ai125-x10-runner-reserve-outcome-review-2026-06-12.md`

Done-Gate: 9 Fälle kategorisiert; Runtime-Fix nur vorbereitet, wenn mehrere Fälle dieselbe bessere Alternative zeigen.

Commit: `docs(ai): audit x10 runner reserve outcomes`

### AI126: Corp Economy Endwindow Evidence v2

Ziel: Corp-Credit-Endfenster aus x10 als Reserve, No-Alternative oder Tempo-Fehler klassifizieren.

Kernartefakt:

- `docs/reviews/ai/ai126-corp-economy-endwindow-evidence-v2-2026-06-12.md`

Done-Gate: Corp-Credits klassifiziert; opake Ability-Referenzen zählen ohne Fortschritts-Evidence nicht als sichere Alternative.

Commit: `docs(ai): audit x10 corp economy endwindows`

### AI127: Action Alternative Snapshot Integration

Ziel: Redaction-safe Action-Alternative-Snapshots in den normalen Trace-Mining-Reviewfluss integrieren.

Kernartefakt:

- `docs/reviews/ai/ai127-action-alternative-snapshot-integration-2026-06-12.md`

Done-Gate: gewünschte Findings können opt-in Alternativen enthalten; verbotene Marker fehlen; keine Runtime-Wirkung.

Commit: `feat(ai): integrate redaction-safe alternatives into trace findings`

### AI128: One-Candidate Runtime Experiment

Ziel: Genau einen Runtime-Kandidaten testen, nur wenn AI123-AI127 einen wiederholbaren sicheren Alternativpfad belegen; sonst explizites No-Go.

Kernartefakt:

- `docs/reviews/ai/ai128-one-candidate-runtime-experiment-2026-06-12.md`

Done-Gate: Verbesserung ohne Nebenwirkung oder dokumentiertes No-Go; kein kosmetisches Detector-Tuning.

Commit: `fix(ai): test one residual action-limit runtime candidate`

### AI129: x10 Gate Decision and Target Reset

Ziel: x5- und x10-Gates sowie Watch-Zielkorridore getrennt festlegen.

Kernartefakt:

- `docs/reviews/ai/ai129-action-limit-x10-gate-decision-2026-06-12.md`

Done-Gate: klarer Zielkorridor; kein Vermischen von x5-Gate und x10-Watch.

Commit: `docs(ai): define residual action-limit x10 gates`

### AI130: Full Sweep and Error Fixing

Ziel: vollständiger Testlauf, finale Traces, Fehlerbeseitigung und Abschlussbericht.

Kernartefakte:

- `docs/reviews/ai/ai130-final-a-d-5seed-2026-06-12.json`
- optional `docs/reviews/ai/ai130-final-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai130-final-full-sweep-review-2026-06-12.md`

Done-Gate: Root-Test grün, Typecheck grün, AI/Engine/Server/Web grün, finaler Trace safety-grün, Restziele dokumentiert.

Commit: `test(ai): complete x10 residual action-limit sweep`

## Verifikationsregeln

Paketabschluss:

- relevante Paketchecks
- `git diff --check`
- nur paketzugehörige Änderungen stagen
- ein Commit je Paket

AI130-Pflichtchecks:

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

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai123-ai130-x10-residual-action-limit-sweep`
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI123_AI130_X10_RESIDUAL_ACTION_LIMIT_SWEEP`
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls nötig.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI123 bis AI130 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den release-implementation-agent und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI123_AI130_X10_RESIDUAL_ACTION_LIMIT_SWEEP auf Branch codex/ai123-ai130-x10-residual-action-limit-sweep.
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

- AI123-AI130 sind vollständig umgesetzt oder ein Sicherheitsblocker ist sauber dokumentiert.
- Alle Paketcommits liegen auf dem Arbeitsbranch.
- Finale Checks und Traces sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` gemerged.
- Der Arbeits-Worktree ist entfernt.
