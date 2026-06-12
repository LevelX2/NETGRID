# AI140-AI148 Semantic Endgame Optimization Process

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse vom 2026-06-12 zu AI131-AI139 und Folgeauftrag AI140-AI148.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: von historischen Shadow-Challengern zu same-state LegalAction-Evidence kommen, TargetContext-Gaps schließen, Coverage-/Tempo-/Intent-/Lookahead-Shadow-Evidence bauen und höchstens einen belegten Runtime-Cutover schneiden.
- Sequenz: AI140 bis AI148 ist verbindlich vorgegeben.
- In-Scope: AI-Trace-/Review-Artefakte, redaction-safe LegalAction-/Alternative-Kontext, Shadow-Modelle, Scorecard und Abschlusschecks.
- Nicht-Ziele: keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung, keine generischen Credit-/Draw-/Run-/Corp-Economy-Strafen, kein Cutover ohne same-state Proof.
- Abnahme: je Paket Artefakt, Paketcheck, `git diff --check`, eigener Commit; final vollständiger Sweep und lokaler Merge nach `main`.

## Gesamtziel

AI140 bis AI148 sequenziell im Worktree `C:\Projekte\NETGRID_AI140_AI148_SEMANTIC_ENDGAME_OPTIMIZATION` auf Branch `codex/ai140-ai148-semantic-endgame-optimization` umsetzen, jeden abgeschlossenen Schritt committen, anschließend lokal nach `main` integrieren und den Worktree aufräumen.

## Annahmen

- Führender Ausgangsstand ist der lokale `main`-Commit `07dd9fad`.
- AI131-AI139 ist abgeschlossen und auf GitHub sichtbar.
- AI136 liefert 17 historische Verbesserungskandidaten, aber keine same-state LegalAction-Cutover-Freigabe.
- x5 bleibt bei 9 Action-Limits, x10 bei 21/40; Safety ist grün.
- Wenn vorhandene AI131-AI139-Artefakte ausreichen, dürfen sie geladen statt neu reproduziert werden; neue Reproduktion ist erforderlich, wenn ein Paket sonst nicht belastbar abgeschlossen werden kann.

## Nicht-Ziele

- Kein pauschaler Malus auf Credit, Draw, Run oder Corp Economy.
- Keine Wiederholung des verworfenen AI121/B005-Draw-Malus.
- Keine produktive Legalitätslogik außerhalb der Engine.
- Keine Redaction-Aufweichung und keine Hidden-Info-Erweiterung.
- Kein produktiver Cutover auf Basis historischer Challenger ohne same-state LegalAction-Proof.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI, Server und menschliche Spieler reichen nur aus `LegalActions` abgeleitete `PlayerActions` ein.
- `applyAction`-, Replay-, StateHash- und Randomness-Verträge bleiben unverändert, solange kein echter Engine-Bug belegt ist.
- Shadow-/Corpus-/Report-Artefakte verwenden ausschließlich redaction-safe PlayerView-, LegalAction- und Trace-Felder.
- Runtime-Fixes sind nur zulässig, wenn same-state LegalAction, Kosten, Timing, Ziele, Hard-/Risk-Gates und Progress-Vorteil belegt sind.
- Nichttriviale Guards erhalten knappe Kommentare, damit die Safety-Bedingung nachvollziehbar bleibt.

## Automatische Fehlerbehandlung

- Rote Tests werden eng im Paket-Scope debuggt.
- Tests werden nicht gelöscht.
- Wenn ein Runtime-Kandidat `actionLimitReached`, `unsafeScoreChosen`, `repeated_no_progress_run`, Illegal Actions, Replay-Fehler oder Redaction-Sicherheit verschlechtert, wird er verworfen und als No-Go dokumentiert.
- Wenn AI140-AI145 keinen sicheren Kandidaten zeigen, wird AI146 als No-Go dokumentiert statt einen produktiven Fix zu erzwingen.
- Bei fachlichem Blocker wird ein Blocker-Report mit Removal Condition geschrieben.

## State Machine

1. `process_preflight`
2. `ai140_same_state_challenger_proof`
3. `ai141_target_context_gap_closure`
4. `ai142_runner_coverage_goal_completion_shadow`
5. `ai143_corp_tempo_conversion_shadow`
6. `ai144_endgame_intent_memory_shadow`
7. `ai145_mcts_lite_endwindow_probe`
8. `ai146_cutover_candidate_or_no_go`
9. `ai147_semantic_endgame_scorecard`
10. `ai148_full_sweep`
11. `integration_preflight`
12. `main_merge`
13. `cleanup`
14. `complete`

## Paketfolge

### AI140: Same-State Challenger Proof

Ziel: Die 17 AI136-Verbesserungskandidaten nach Cutover-Tauglichkeit klassifizieren.

Kernartefakte:

- `docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json`
- `docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.md`

Done-Gate: alle 17 Verbesserungskandidaten klassifiziert; keine Runtime-Änderung; Redaction-Scan grün.

Commit: `docs(ai): prove same-state challenger candidates`

### AI141: TargetContext Gap Closure für Challenger-Fälle

Ziel: fehlende Ziel-/Kosten-/Timing-Kontexte in Challenger-Fällen side-safe schließen oder begründet als fehlend markieren.

Kernartefakt:

- `docs/reviews/ai/ai141-challenger-target-context-gap-review-2026-06-12.md`

Done-Gate: mindestens Top-5 Challenger-Fälle mit vollständigem oder begründet fehlendem TargetContext; Redaction-Safety belegt; keine neue Legalität.

Commit: `feat(ai): close target-context gaps for challenger cases`

### AI142: Runner Coverage Goal Completion Shadow

Ziel: Runner-dominante x10-Endfenster outcome-basiert nach Coverage-Completion-Potenzial klassifizieren.

Kernartefakt:

- `docs/reviews/ai/ai142-runner-coverage-goal-completion-shadow-2026-06-12.md`

Done-Gate: Coverage-Fälle in `completion_available`, `search_needed`, `draw_needed`, `reserve_needed`, `no_solution_visible` getrennt; Kandidat oder No-Go benannt.

Commit: `feat(ai): shadow runner coverage goal completion`

### AI143: Corp Tempo Conversion Shadow

Ziel: Corp-Economy-Endfenster nach Score-/Protection-/Rez-/Tempo-Konversion bewerten.

Kernartefakt:

- `docs/reviews/ai/ai143-corp-tempo-conversion-shadow-2026-06-12.md`

Done-Gate: Corp-Restfälle nach Conversion-Potenzial klassifiziert; keine pauschale Corp-Economy-Strafe; same-state Kandidaten für AI146 benannt, falls vorhanden.

Commit: `feat(ai): shadow corp tempo conversion goals`

### AI144: Endgame Intent Memory

Ziel: Endfenster-Schleifen als stale Absichten statt als isolierte Einzelaktionen diagnostizieren.

Kernartefakt:

- `docs/reviews/ai/ai144-endgame-intent-memory-shadow-2026-06-12.md`

Done-Gate: x10-Endfenster zeigen `intent_converted`, `intent_stale` oder `intent_blocked_by_no_legal_alternative`; keine Runtime-Wirkung.

Commit: `feat(ai): add shadow endgame intent memory`

### AI145: MCTS-lite Endwindow Probe

Ziel: Für mindestens fünf Endfenster einen deterministischen 2- bis 4-Ply-Lookahead oder sicheren Progress-Proxy bewerten.

Kernartefakt:

- `docs/reviews/ai/ai145-mcts-lite-endwindow-probe-2026-06-12.md`

Done-Gate: mindestens fünf Endfenster bewertet; Vergleich gegen Shadow-Challenger; kein Runtime-Cutover.

Commit: `feat(ai): prototype mcts-lite endwindow probes`

### AI146: One Same-State Cutover Candidate

Ziel: Genau einen produktiven Runtime-Fix nur übernehmen, wenn AI140-AI145 einen echten Kandidaten liefern.

Kernartefakt:

- `docs/reviews/ai/ai146-one-same-state-cutover-candidate-2026-06-12.md`

Done-Gate: sicherer Runtime-Fix mit x5/x10-Nichtverschlechterung oder dokumentiertes No-Go.

Commit: `fix(ai): cut over one same-state endwindow improvement`

### AI147: Semantic Endgame Scorecard

Ziel: KI-Spielstärke breiter als Action-Limit messen.

Kernartefakte:

- `docs/reviews/ai/ai147-semantic-endgame-scorecard-2026-06-12.md`
- `docs/reviews/ai/ai147-semantic-endgame-scorecard-2026-06-12.json`

Done-Gate: x5 und x10 Scorecard enthalten Safety, Action-Limit, stale No-Progress, Progress-Conversion, Coverage-/Tempo-Conversion und Ergebniskennzahlen.

Commit: `docs(ai): define semantic endgame scorecard`

### AI148: Full Sweep

Ziel: vollständiger Testlauf, finale Traces, Fehlerbeseitigung und Abschlussbericht.

Kernartefakte:

- `docs/reviews/ai/ai148-final-a-d-5seed-2026-06-12.json`
- optional `docs/reviews/ai/ai148-final-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai148-final-semantic-endgame-sweep-2026-06-12.md`

Done-Gate: Root-Test grün, Typecheck grün, AI/Engine/Server/Web grün, finaler Trace safety-grün, Scorecard aktualisiert.

Commit: `test(ai): complete semantic endgame optimization sweep`

## Verifikationsregeln

Paketabschluss:

- relevante Paketchecks
- `git diff --check`
- nur paketzugehörige Änderungen stagen
- ein Commit je Paket

AI148-Pflichtchecks:

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

- Arbeitsbranch: `codex/ai140-ai148-semantic-endgame-optimization`
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI140_AI148_SEMANTIC_ENDGAME_OPTIMIZATION`
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls nötig.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI140 bis AI148 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den release-implementation-agent und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI140_AI148_SEMANTIC_ENDGAME_OPTIMIZATION auf Branch codex/ai140-ai148-semantic-endgame-optimization.
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

- AI140-AI148 sind vollständig umgesetzt oder ein Sicherheitsblocker ist sauber dokumentiert.
- Alle Paketcommits liegen auf dem Arbeitsbranch.
- Finale Checks und Traces sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` gemerged.
- Der Arbeits-Worktree ist entfernt.
