# Action Semantics Review Baseline Hygiene Process 2026-06-12

## Status

`in_progress`

## Quelle/Vorgabe

Eingefügter Prüfbefund vom 2026-06-12 zum zuvor lokal gemeldeten Merge-Commit `b3c004d7`, zur fehlenden GitHub-Prüfbarkeit und zu den Folgeblöcken A bis E.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung im Baseline-Teil präzise genug. Der zwingende nächste Schritt ist nicht ein neues Semantikfeature, sondern prüfbare Baseline-Hygiene.

Konservative Scope-Entscheidung:

- Direkt umgesetzt werden Block A1 bis A3.
- Die Blöcke B bis E bleiben als spätere Optimierungsaufträge außerhalb dieses Prozesses, weil sie neue Semantik-, Engine- und Strukturarbeit enthalten und den Review-Baseline-Fix sonst vermischen würden.
- Der Review-Branch `codex/action-semantics-followup-quality` darf remote sichtbar gemacht werden, weil der Prüfbefund genau diese GitHub-Prüfbarkeit als fehlenden Schritt benennt. `main` wird in diesem Prozess nicht automatisch gepusht.

## Gesamtziel

Der lokal bereits integrierte Action-Semantics-Follow-up-Stand wird remote prüfbar, die Abschlussdokumente widersprechen dem tatsächlichen Stand nicht mehr, und die neuen AI-Report-Artefakte seit `origin/main` sind nach Gate-Relevanz und Reproduzierbarkeit klassifiziert.

## Nicht-Ziele

- Keine neue Semantikfunktion.
- Kein produktiver KI-Cutover.
- Keine Engine-Regeländerung.
- Keine Löschung großer Reports ohne eigenes Gate.
- Kein Push von `main` ohne separaten Nutzerwunsch.
- Keine Bearbeitung der AI022-/Hints-Stash-Inhalte.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jedes Paket bekommt einen eigenen Commit.
- Prüfbarkeit wird ehrlich dokumentiert: lokal, remote Branch, remote main oder nicht ausgeführt.
- `format:changed -- main` wird nicht als sinnvoller Post-Merge-Main-Check verkauft.
- `origin/main` ist für Remote-Baseline-Checks die relevante Vergleichsbasis.

## Automatische Fehlerbehandlung

- Wenn GitHub-/Remote-Checks zeigen, dass ein im Prüfbefund als fehlend gemeldeter Commit inzwischen sichtbar ist, wird der Ist-Stand dokumentiert statt künstlich repariert.
- Wenn `format:changed -- origin/main` wegen bestehender Remote-Baseline rot ist, wird das Ergebnis dokumentiert und nicht als grün gemeldet.
- Wenn neue Report-Artefakte von Gates konsumiert werden, bleiben sie erhalten.

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn:

- ein Check Hidden-Info-Leaks oder LegalAction-Generation außerhalb der Engine zeigt;
- ein Report als öffentliches Artefakt private Runtime-Daten enthält;
- Remote-Push mehr als den explizit prüfbar zu machenden Review-Branch betreffen würde;
- ein Dokument behauptet, GitHub-CI habe geprüft, obwohl nur lokale Checks liefen.

## State Machine

- `P0_PROCESS_ARTIFACT`
- `P1_REMOTE_REVIEW_BASELINE`
- `P2_REPORT_ARTIFACT_HYGIENE`
- `P3_PROCESS_DOCUMENT_CLOSEOUT`
- `P4_FINAL_VERIFY_AND_MERGE`

## Paketfolge

1. P0 Prozessartefakt und Worktree-Preflight.
2. P1 Remote-/Review-Baseline herstellen.
3. P2 Report-Artefakt-Hygiene.
4. P3 Prozessdokumente schließen und entwirren.
5. P4 Final prüfen, lokal nach `main` integrieren und Worktree entfernen.

## Paketdetails

### P0 Prozessartefakt und Worktree-Preflight

Ziel: Neuen Hygieneprozess sauber starten.

Arbeit:

- Worktree `C:\Projekte\NETGRID_REVIEW_BASELINE_HYGIENE` auf Branch `codex/review-baseline-hygiene` anlegen.
- Prozessartefakt erstellen.
- AI022-/Hints-Stash als out-of-scope dokumentieren.

Checks:

- `git status --short --branch`
- `corepack pnpm format:changed -- origin/main`
- `git diff --check`

Done-Gate: Prozess ist angelegt, Scope trennt Baseline-Hygiene von späteren Semantik-/Struktur-Follow-ups.

Commit: `docs(ai): define review baseline hygiene process`

### P1 Remote-/Review-Baseline herstellen

Ziel: Der lokale Action-Semantics-Follow-up-Abschluss ist remote prüfbar.

Arbeit:

- Prüfen, ob `b3c004d7` inzwischen in `origin/main` enthalten ist.
- Prüfen, ob `origin/codex/action-semantics-followup-quality` existiert.
- Falls der Review-Branch fehlt, `codex/action-semantics-followup-quality` pushen.
- Commitliste, Diff-Stat und Stash-Status dokumentieren.

Checks:

- `git fetch origin --prune`
- `git merge-base --is-ancestor b3c004d7 origin/main`
- `git branch -r --list origin/codex/action-semantics-followup-quality`
- `git log --oneline origin/main..codex/action-semantics-followup-quality`
- `git diff --check origin/main..HEAD`

Done-Gate: GitHub kann entweder den Merge über `origin/main` oder die P0-P10-Commitfolge über den Review-Branch prüfen.

Commit: `docs(ai): record remote review baseline`

### P2 Report-Artefakt-Hygiene

Ziel: Neue AI-Reports seit `origin/main` sind inventarisiert und klassifiziert.

Arbeit:

- Neue oder geänderte `docs/reviews/ai/*.json` seit dem Action-Semantics-Follow-up-Start bestimmen.
- Je Artefakt klassifizieren: `gate-required`, `benchmark-baseline`, `one-off diagnostic`, `artifact-only`.
- Reproduzierbarkeit und Gate-Verbraucher dokumentieren.
- Keine Löschung ohne separates Gate.

Checks:

- `git diff --name-status origin/main..HEAD -- docs/reviews/ai`
- `git diff --check origin/main..HEAD`
- `corepack pnpm format:changed -- origin/main`

Done-Gate: Inventar liegt vor und trifft keine ungesicherte Löschentscheidung.

Commit: `docs(ai): classify review report artifacts`

### P3 Prozessdokumente schließen und entwirren

Ziel: Abschlussdokumente enthalten keine widersprüchlichen Status- oder Gate-Aussagen.

Arbeit:

- `action-semantics-followup-quality-process-2026-06-12.md` auf `complete` setzen.
- Remote-Prüfbarkeit nachtragen: `origin/main` enthält den Merge, Review-Branch wurde gepusht.
- Post-Merge-Formatbaseline präzisieren: `format:changed -- main` ist nach Merge leer oder trivial; sinnvolle Remote-Baseline ist `origin/main` beziehungsweise explizit dokumentierter Stand.
- AI022-/Hints-Stash ausdrücklich out-of-scope lassen.

Checks:

- `rg -n "in_progress|GitHub geprüft|format:changed -- main" docs/architecture/ai/action-semantics-followup-quality-process-2026-06-12.md`
- `corepack pnpm format:changed -- origin/main`
- `git diff --check origin/main..HEAD`

Done-Gate: Prozessdokument ist formal abgeschlossen und beschreibt lokale/remote Verifikation korrekt.

Commit: `docs(ai): close action semantics followup process`

### P4 Final Verify und lokale Integration

Ziel: Hygieneprozess abschließend prüfen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm -r --if-present typecheck`
- `corepack pnpm format:changed -- origin/main`
- `git diff --check origin/main..HEAD`

Done-Gate: Keine durch diesen Prozess verursachten roten Checks. Branch ist lokal nach `main` integriert, Worktree entfernt, Goal complete.

Commit: `test(ai): verify review baseline hygiene`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Remote-Prüfbarkeit wird mit Git-Befehlen belegt, nicht nur behauptet.
- Große Reports werden nur entfernt, wenn ein eigener Gate-Entscheid im Prozess dokumentiert ist.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_REVIEW_BASELINE_HYGIENE`.
- Arbeitsbranch: `codex/review-baseline-hygiene`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Push in diesem Prozess nur für `codex/action-semantics-followup-quality`, um die im Prüfbefund fehlende GitHub-Prüfbarkeit herzustellen.
- Kein automatischer Push von `main`.

## Controller-Prompt-Kern

`/Goal Arbeite Action Semantics Review Baseline Hygiene vollständig und sequenziell von P0 bis P4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_REVIEW_BASELINE_HYGIENE auf Branch codex/review-baseline-hygiene. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- GitHub-/Remote-Prüfbarkeit ist hergestellt oder der tatsächliche Remote-Stand ist dokumentiert.
- Action-Semantics-Follow-up-Prozessdokument steht konsistent auf `complete`.
- Formatbaseline-Aussagen unterscheiden Arbeitsbranch-, Main- und Remote-Baseline.
- Neue AI-Report-Artefakte sind klassifiziert.
- AI022-/Hints-Stash bleibt getrennt.
- Lokaler `main` enthält die Hygienecommits.
