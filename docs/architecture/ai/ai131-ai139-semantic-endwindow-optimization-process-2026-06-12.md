# AI131-AI139 Semantic Endwindow Optimization Process

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse vom 2026-06-12 zu AI123-AI130 und Folgeauftrag AI131-AI139.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: die verbleibenden x10-Action-Limit-Endfenster nicht weiter über pauschale Draw-/Credit-/Run-Mali behandeln, sondern über redaction-safe Outcome-, Progress- und Zielauflösung auswerten.
- Sequenz: AI131 bis AI139 ist verbindlich vorgegeben.
- In-Scope: Corpus-Aufbau, Progress-Delta-Labels, progress-aware Action-Alternative-Snapshots, Runner-Coverage-Goals, Corp-Tempo-Goals, Semantic-Shadow-Challenger, genau ein Cutover nur bei belegtem Vorteil, Robustness-Gates und Full Sweep.
- Nicht-Ziele: keine neue LegalAction-Erzeugung, keine Engine-/`applyAction`-/Replay-/StateHash-/Randomness-Änderung ohne echten Engine-Bug, keine Hidden-Info-Ausweitung, keine Wiederholung des AI121/B005-Draw-Malus.
- Abnahme: je Paket Artefakt, Paketcheck, `git diff --check`, eigener Commit; final vollständiger Sweep und lokaler Merge nach `main`.

## Gesamtziel

AI131 bis AI139 sequenziell im Worktree `C:\Projekte\NETGRID_AI131_AI139_SEMANTIC_ENDWINDOW_OPTIMIZATION` auf Branch `codex/ai131-ai139-semantic-endwindow-optimization` umsetzen, jeden abgeschlossenen Schritt committen, anschließend lokal nach `main` integrieren und den Worktree aufräumen.

## Annahmen

- Führender Ausgangsstand ist der lokale `main`-Commit `924940fa`.
- AI123-AI130 ist lokal abgeschlossen; der x10-Endbefund bleibt `21/40` Action-Limit-Spiele ohne Illegal Actions, Replay-Fehler oder Redaction-Fail.
- Die Analyse meldet GitHub als nachlaufend. Dieser Prozess pusht nicht automatisch, weil der aktuelle Nutzerauftrag keinen Push verlangt.
- Wenn vorhandene Trace-Artefakte ausreichen, dürfen sie geladen statt neu reproduziert werden; neue Reproduktion ist erforderlich, wenn ein Paket sonst nicht belastbar abgeschlossen werden kann.

## Nicht-Ziele

- Kein generischer Credit-, Draw-, Run- oder Corp-Economy-Malus.
- Keine Wiederholung des verworfenen AI121/B005-Draw-Malus.
- Keine produktive Legalitätslogik außerhalb der Engine.
- Keine Redaction-Aufweichung und keine Hidden-Info-Erweiterung.
- Kein kosmetisches Detector-Tuning als Ersatz für belegte Verhaltensverbesserung.
- Kein Runtime-Cutover ohne x5- und x10-Nichtverschlechterung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI, Server und menschliche Spieler reichen nur aus `LegalActions` abgeleitete `PlayerActions` ein.
- `applyAction`-, Replay-, StateHash- und Randomness-Verträge bleiben unverändert, solange kein echter Engine-Bug belegt ist.
- Shadow-/Corpus-/Report-Artefakte verwenden ausschließlich redaction-safe PlayerView-, LegalAction- und Trace-Felder.
- Runtime-Fixes sind nur zulässig, wenn mehrere oder besonders klare side-safe LegalAction-Alternativen mit besserem Outcome belegt sind.
- Nichttriviale Guards erhalten knappe Kommentare, damit die Safety-Bedingung nachvollziehbar bleibt.

## Automatische Fehlerbehandlung

- Rote Tests werden eng im Paket-Scope debuggt.
- Tests werden nicht gelöscht.
- Wenn ein Runtime-Kandidat `actionLimitReached`, `unsafeScoreChosen`, `repeated_no_progress_run`, Illegal Actions, Replay-Fehler oder Redaction-Sicherheit verschlechtert, wird er verworfen und als No-Go dokumentiert.
- Wenn AI136 keinen stabil besseren Kandidaten zeigt, wird AI137 als No-Go dokumentiert statt einen produktiven Fix zu erzwingen.
- Bei fachlichem Blocker wird ein Blocker-Report mit Removal Condition geschrieben.

## State Machine

1. `process_preflight`
2. `ai131_failure_corpus`
3. `ai132_progress_delta_labeler`
4. `ai133_progress_alternative_snapshots`
5. `ai134_runner_coverage_goals`
6. `ai135_corp_tempo_goals`
7. `ai136_semantic_shadow_challenger`
8. `ai137_cutover_candidate_or_no_go`
9. `ai138_robustness_gate_redesign`
10. `ai139_full_sweep`
11. `integration_preflight`
12. `main_merge`
13. `cleanup`
14. `complete`

## Paketfolge

### AI131: x10 Failure Corpus Builder

Ziel: Aus den 21 x10-Action-Limit-Spielen einen reproduzierbaren redaction-safe Corpus mit Endfenster, finaler öffentlicher Zusammenfassung und Top-Ursachen bauen.

Kernartefakte:

- `docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json`
- `docs/reviews/ai/ai131-x10-action-limit-failure-corpus-review-2026-06-12.md`

Done-Gate: alle 21 Fälle enthalten, letzte 60 Actions je Fall, Top-5-Ursachen, Redaction-Scan ohne verbotene Marker, keine Runtime-Änderung.

Commit: `docs(ai): build x10 action-limit failure corpus`

### AI132: Progress Delta Labeler

Ziel: Jede Action in Action-Limit-Endfenstern mit Progress-/No-Progress-Labels und 5/10/20-Follow-up-Fenstern klassifizieren.

Kernartefakt:

- `docs/reviews/ai/ai132-progress-delta-labeler-review-2026-06-12.md`

Done-Gate: Labeler mit mindestens vier synthetischen Tests; keine Runtime-Wirkung; Labeldaten für den Corpus verfügbar.

Commit: `feat(ai): label action-limit endwindow progress deltas`

### AI133: LegalAction Alternative Outcome Snapshot

Ziel: Alternative Snapshots progress-aware erweitern: Action-Typ, semantischer Typ, Score-Schlüssel, Hard Gates, Zielkontext, erwartetes Progress-Label, Blockgrund und spätere ähnliche Outcomes.

Kernartefakt:

- `docs/reviews/ai/ai133-progress-aware-alternative-snapshots-2026-06-12.md`

Done-Gate: opt-in, redaction-safe, keine Runtime-Wirkung, Snapshot-Test deckt neue Felder ab.

Commit: `feat(ai): add progress-aware alternative snapshots`

### AI134: Runner Coverage Goal Resolution v1

Ziel: Runner-Coverage-Lücken als taktische Goals modellieren und LegalActions dagegen shadow-only klassifizieren.

Kernartefakt:

- `docs/reviews/ai/ai134-runner-coverage-goal-resolution-2026-06-12.md`

Done-Gate: Tests für sichtbare Wall-Coverage-Installation, unaffordability, Draw ohne sichtbare Option und Hidden-Info-Schutz.

Commit: `feat(ai): model runner coverage goals against legal actions`

### AI135: Corp Tempo Goal Resolution v1

Ziel: Corp-LegalActions in Endfenstern als safe score, advance-to-score, Remote-/Central-Schutz, meaningful ICE, economy-only oder opaque ability klassifizieren.

Kernartefakt:

- `docs/reviews/ai/ai135-corp-tempo-goal-resolution-2026-06-12.md`

Done-Gate: Tests für Corporate-Boon-Economy-only, echte Score-/Advance-Linie und opake Ability ohne Progress-Evidence.

Commit: `feat(ai): classify corp tempo goals in endwindows`

### AI136: Semantic Shadow Endwindow Challenger

Ziel: Für alle x10-Action-Limit-Endfenster legacy selected vs. semantic challenger vergleichen, ohne Runtime-Übernahme.

Kernartefakte:

- `docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json`
- `docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-report-2026-06-12.md`

Done-Gate: alle x10-Endfenster verglichen, 0 Hidden Info, 0 nichtlegale Challenger-Actions, Top-3-Verbesserungsfälle sichtbar.

Commit: `feat(ai): add semantic shadow challenger for action-limit endwindows`

### AI137: One Safe Cutover Candidate

Ziel: Genau einen produktiven Runtime-Fix nur dann schneiden, wenn AI136 einen stabil besseren, side-safe und legalen Kandidaten belegt.

Kernartefakt:

- `docs/reviews/ai/ai137-one-safe-cutover-candidate-2026-06-12.md`

Done-Gate: entweder ein belegter Cutover mit x5/x10-Nichtverschlechterung oder ein explizites No-Go; kein generischer Malus.

Commit: `fix(ai): cut over one proven endwindow improvement`

### AI138: Robustness Gate Redesign

Ziel: x5- und x10-Restrobustheit als getrennte Gates mit Residual-Korridoren, Watch-Entscheidung und Cutover-Kriterien definieren.

Kernartefakt:

- `docs/reviews/ai/ai138-x5-x10-robustness-gate-review-2026-06-12.md`

Done-Gate: x5 Gate und x10 Watch getrennt, Cutover-Blocker und Removal Conditions festgelegt.

Commit: `docs(ai): define x5 and x10 residual robustness gates`

### AI139: Full Sweep

Ziel: vollständiger Testlauf, finale Traces, Fehlerbeseitigung und Abschlussbericht.

Kernartefakte:

- `docs/reviews/ai/ai139-final-a-d-5seed-2026-06-12.json`
- optional `docs/reviews/ai/ai139-final-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai139-final-semantic-endwindow-optimization-sweep-2026-06-12.md`

Done-Gate: Root-Test grün, Typecheck grün, AI/Engine/Server/Web grün, finaler Trace safety-grün, Restziele dokumentiert.

Commit: `test(ai): complete semantic endwindow optimization sweep`

## Verifikationsregeln

Paketabschluss:

- relevante Paketchecks
- `git diff --check`
- nur paketzugehörige Änderungen stagen
- ein Commit je Paket

AI139-Pflichtchecks:

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

- Arbeitsbranch: `codex/ai131-ai139-semantic-endwindow-optimization`
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI131_AI139_SEMANTIC_ENDWINDOW_OPTIMIZATION`
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls nötig.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI131 bis AI139 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den release-implementation-agent und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI131_AI139_SEMANTIC_ENDWINDOW_OPTIMIZATION auf Branch codex/ai131-ai139-semantic-endwindow-optimization.
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

- AI131-AI139 sind vollständig umgesetzt oder ein Sicherheitsblocker ist sauber dokumentiert.
- Alle Paketcommits liegen auf dem Arbeitsbranch.
- Finale Checks und Traces sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` gemerged.
- Der Arbeits-Worktree ist entfernt.
