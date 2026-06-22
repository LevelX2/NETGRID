# AI Play Strength Loop 2

Status: package_done:AI-PS2-2

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat beauftragt, die Optimierungen des KI-Spielverhaltens per
verbindlichem Goal in einer Schleife so weit auszuführen, wie es innerhalb der
aktuellen Codex-Grenzen belastbar möglich ist.

Der unmittelbare Ausgangspunkt ist AI222-AI224:

- Der praktische Taktik-Benchmark zeigt eine deutliche opt-in Verbesserung.
- Der Candidate bleibt default-off.
- Candidate-Corp verbessert im x5-Lauf Action-Limits und Corp-Scores.
- Candidate-Runner verbessert die x5-Matchmetrik noch nicht.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise, wenn die
Schleife endlich und gate-orientiert geschnitten wird. Diese Schleife endet
nach einem erweiterten Benchmark, höchstens zwei konkreten Verhaltenspaketen und
einem gepaarten Gate. Es wird kein unbounded Tuning und kein weiterer
Diagnose-only-Block gestartet.

## Gesamtziel

AI-PS2 soll die praktische KI-Spielstärke messbar verbessern, ohne die
Engine-Verträge, LegalAction-Disziplin, Hidden-Info-Grenzen oder deterministisches
Replay zu berühren. Verbesserungen müssen aus aktuellen `LegalActions` wählen
und in gepaarten Läufen mindestens eine praktische Matchmetrik verbessern, ohne
Safety-Gates zu verletzen.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Die Umsetzung läuft im Worktree
  `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_2`.
- Arbeitsbranch ist `codex/ai-play-strength-loop-2`.
- Der parallel vorhandene Source-Structure-Loop bleibt getrennt und wird nicht
  in diesem Prozess bearbeitet.
- Der bestehende Practical-Tactic-Overlay bleibt kontrolliert; Default-Promotion
  ist nur nach ausdrücklichem Gate erlaubt und nicht Ziel dieser Schleife.
- Wenn mehrere Deckpaare verfügbar sind, wird zuerst eine kleine, reproduzierbare
  x5/x10-Matrix genutzt; größere Läufe sind nur FINAL-GATE-Evidence.

## Nicht-Ziele

- Kein Rewrite von `packages/ai/src/index.ts`.
- Keine neue LegalAction-Erzeugung.
- Keine Rules-Engine-, `applyAction`-, Replay-, StateHash- oder
  Randomness-Änderung.
- Keine Hidden-Info-Erweiterung und keine neuen öffentlichen Payloads.
- Keine Proteus-AI-Freigabe.
- Kein globaler Default-Cutover ohne separaten Nutzerauftrag.
- Keine neue Reporting-Kaskade ohne direkte Verhaltenswirkung.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- KI wählt nur aus Engine-`LegalActions`.
- Alle produktiven Eingriffe müssen side-safe aus `AiDecisionInput` ableitbar
  sein.
- Candidate-Logik darf verdeckte Kartendaten nicht lesen, speichern oder
  rekonstruieren.
- Benchmark- und Review-Artefakte dürfen Runtime-Verhalten nicht heimlich
  aktivieren.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket eng debuggt.
- Ein Safety-Verstoß blockiert den Loop und erzeugt einen Blocker-Report mit
  Removal Condition.
- Ein Kandidat ohne praktische Verbesserung bleibt opt-in oder wird verworfen.
- Zusätzliche Beobachtungen werden als Follow-up notiert, nicht still in den
  aktiven Paketumfang gezogen.

## Sicherheitsblocker

- `illegalActions > 0`.
- `replayFailures > 0`.
- `redactionSafe !== true`.
- Eine KI-Entscheidung braucht verdeckte Kartendaten.
- Eine Änderung erzeugt oder mutiert LegalActions.
- Eine Änderung verschlechtert Candidate-Runner und Candidate-Corp gleichzeitig
  in Action-Limits oder Abschlussfortschritt.

## State Machine

1. `prepared_for_execution`
2. `worktree_created`
3. `package_active:AI-PS2-0`
4. `package_done:AI-PS2-0`
5. `package_active:AI-PS2-1`
6. `package_done:AI-PS2-1`
7. `package_active:AI-PS2-2`
8. `package_done:AI-PS2-2`
9. `package_active:AI-PS2-3`
10. `package_done:AI-PS2-3`
11. `final_green`
12. `merged_to_main`
13. `complete`
14. `blocked:<reason>`

## Paketfolge

1. `AI-PS2-0` Preflight und Benchmark-Harness verbreitern
2. `AI-PS2-1` Runner-Practical-Tactic-Verbesserung
3. `AI-PS2-2` Corp-Practical-Tactic-Verbesserung
4. `AI-PS2-3` Paired-Gate, Entscheidung und Dokumentation
5. `FINAL-GREEN` vollständige Verifikation, lokaler Merge und Worktree-Cleanup

## AI-PS2-0 Messbefund

Umgesetzt wurde ein neuer, enger Gate-Runner:

- `scripts/run-ai-ps2-play-strength-gate.ts`
- Schema: `ai-ps2-play-strength-gate-v1`
- Standard: Demo-Decks plus optional eingefrorene Trace-Mining-Pairs `a` bis
  `d`
- Legs:
  - Legacy Runner vs Legacy Corp
  - Candidate Runner vs Legacy Corp
  - Legacy Runner vs Candidate Corp
- Ausgabe:
  - Taktik-Benchmark Legacy/Candidate
  - getrennte Aggregates je Leg
  - Runner-/Corp-Deltas
  - harte Entscheidung `keep_candidate_opt_in` oder `keep_default_off`

Schneller Preflight-Lauf:

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps2-preflight-play-strength-gate-2026-06-22.json --pairs a --seeds ai-v143-tuning-001 --max-actions 80
```

Ergebnis:

- Szenarien: 2
- Spiele je Leg: 2
- Safety: 0 IllegalActions, 0 ReplayFailures, RedactionSafe true
- Taktik-Hit-Rate-Delta: +1.0
- Candidate-Runner: Runner-Steals 4 statt 3, Action-Limits unverändert 1
- Candidate-Corp: schlechter im Schnelllauf, Action-Limits 2 statt 1 und
  Corp-Scores 0 statt 1

Schluss: Der erweiterte Gate-Runner funktioniert. Der schnelle Preflight stützt
die zuvor identifizierte Asymmetrie: Runner kann punktuell profitieren, Corp ist
im breiteren Szenario nicht automatisch stabil besser. Deshalb bleiben AI-PS2-1
und AI-PS2-2 getrennt.

## AI-PS2-1 Messbefund

Runner-Practical-Tactic wurde eng erweitert:

- `runner_open_access_card`: Wenn der Runner bereits eine legale `access_card`
  Aktion im Access-Fenster hat, wird diese gegenüber passiver Vorbereitung
  gewählt.
- `runner_take_high_payoff_run`: Wenn eine legale `start_run`-Action explizit
  side-safe als `accessPayoff` `agenda`, `score_threat`, `trash_affordable`,
  `fresh` oder `access_bonus` markiert ist, wird dieser konkrete Run gegenüber
  passiver Vorbereitung gewählt.

Der praktische Taktik-Benchmark wächst von 32 auf 40 Fälle. Der Candidate trifft
40/40, Frozen Legacy bleibt bei 0/40. Der kleine Gate-Lauf nach AI-PS2-1 bleibt
safety-grün und zeigt weiter die Runner-Asymmetrie:

- Candidate-Runner: Runner-Steals 4 statt 3, Action-Limits unverändert 1
- Candidate-Corp: in diesem kleinen Lauf weiter nicht verbessert
- IllegalActions: 0
- ReplayFailures: 0

## AI-PS2-2 Messbefund

Corp-Practical-Tactic wurde stabilisiert, nicht aggressiver gemacht:

- `corp_safe_score` greift nur noch, wenn die aktuelle `score_agenda`-Action
  side-safe als `safeScoreWindow` oder `protectedRemoteReady` markiert ist oder
  das Label explizit ein sicheres/protected Score-Fenster benennt.
- Unmarkierte Score-Fenster werden nicht mehr durch das Overlay erzwungen.
- Die Benchmark-Fixtures markieren sichere Score-Fenster explizit.

Der kleine Gate-Lauf nach AI-PS2-2 bleibt safety-grün, zeigt aber noch keine
Corp-Metrikverbesserung. Das Paket ist deshalb eine Stabilisierung des
opt-in-Candidate-Verhaltens, keine Default- oder Stärke-Promotion.

## Paketdetails

### AI-PS2-0 Preflight und Benchmark-Harness verbreitern

Ziel: Eine reproduzierbare Vergleichsbasis schaffen, die über den einzelnen
AI224-x5-Lauf hinausgeht, ohne neue Infrastrukturkaskade.

Arbeit:

- Bestehenden AI224-Paired-Runner so erweitern oder ergänzen, dass mehrere
  Seed-Sets und, falls lokal verfügbar, mehrere eingefrorene Deckpaare genutzt
  werden können.
- Baseline, Candidate-Runner und Candidate-Corp getrennt aggregieren.
- Kriterien für Runner- und Corp-Verbesserung maschinenlesbar ausgeben.
- Preflight-Review mit Ausgangsbefund schreiben.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- Benchmark-Script mit kleinem x5-Lauf
- `git diff --check`

Done-Gate:

- Erweiterter Runner erzeugt reproduzierbares JSON.
- Baseline/Candidate-Vergleich trennt Runner- und Corp-Wirkung.
- Commit: `test(ai): expand practical play strength benchmark gate`

### AI-PS2-1 Runner-Practical-Tactic-Verbesserung

Ziel: Candidate-Runner soll in konkreten legalen Situationen besser werden,
ohne generische Run-/Draw-Mali.

Arbeit:

- Runner-Taktikfälle aus der AI224-Schwäche ableiten: erreichbarer Access,
  vermeidbarer stale Run, bezahlbarer Trash, Setup vor blockiertem Pfad.
- Practical-Tactic-Overlay um höchstens eng begrenzte Runner-Heuristiken
  erweitern.
- Tests ergänzen, die mindestens eine neue Runner-Auswahl gegenüber dem
  bisherigen Runtime-Referenzpfad zeigen.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- `pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Neue Runner-Fälle treffen im Benchmark.
- Kein Default-Cutover.
- Keine LegalAction- oder Hidden-Info-Vertragsänderung.
- Commit: `feat(ai): improve runner practical tactic choices`

### AI-PS2-2 Corp-Practical-Tactic-Verbesserung

Ziel: Die bereits positive Candidate-Corp-Wirkung stabilisieren, ohne
überbreite Score-/Punish-Heuristik.

Arbeit:

- Corp-Taktikfälle für konkrete Score-/Advance-/Punish-Fenster ergänzen.
- Practical-Tactic-Overlay um höchstens eng begrenzte Corp-Heuristiken
  erweitern.
- Tests ergänzen, die Scoreline-Fortschritt gegen stale Economy/Punish absichern.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- `pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Corp-Fälle treffen im Benchmark.
- Candidate-Corp bleibt safety-stabil.
- Kein globaler Default-Cutover.
- Commit: `feat(ai): stabilize corp practical tactic choices`

### AI-PS2-3 Paired-Gate, Entscheidung und Dokumentation

Ziel: Die Schleife trifft eine harte Keep-/Discard-/Opt-in-Entscheidung anhand
gepaarter Evidenz.

Arbeit:

- Paired-Gate mit mindestens x10 Seeds oder mehreren x5-Sets ausführen, soweit
  lokal zeitlich robust möglich.
- JSON-Report und Review-Dokument schreiben.
- Entscheidung dokumentieren:
  - `promote_candidate_scope` nur bei klarer, beidseitig stabiler Verbesserung.
  - `keep_candidate_opt_in` bei safety-grüner, aber gemischter Verbesserung.
  - `discard_behavior_delta` bei fehlender Verbesserung oder Safety-Verstoß.

Checks:

- Paired-Gate-Script
- `pnpm --filter @netgrid/ai test -- --run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- `pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Entscheidung ist maschinenlesbar und im Review begründet.
- Safety-Gates sind grün oder Blocker ist dokumentiert.
- Commit: `test(ai): gate play strength loop candidate`

### FINAL-GREEN

Ziel: Der Arbeitsbranch ist vollständig verifiziert, lokal nach `main` gemerged
und der Worktree ist entfernt.

Checks:

- `pnpm --filter @netgrid/ai test`
- `pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:

- Arbeitsbranch ist sauber.
- Branch ist lokal nach `main` integriert.
- Hauptworkspace ist sauber.
- Worktree ist entfernt.
- Goal wird erst danach als complete markiert.

## Verifikationsregeln

- Paketchecks dürfen fokussiert sein, müssen aber den berührten Code direkt
  abdecken.
- `git diff --check` läuft vor jedem Paketcommit.
- Vollständiger AI-Testlauf läuft im FINAL-GREEN.
- Nicht ausgeführte Checks werden mit Grund dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Branch: `codex/ai-play-strength-loop-2`
- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_2`
- Umsetzung läuft ausschließlich im Worktree.
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Jeder Paketabschluss erhält einen Commit.
- Kein Push ohne separaten Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Play Strength Loop 2 vollständig und sequenziell von AI-PS2-0
bis AI-PS2-3 plus FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md falls vorhanden,
agents/release-implementation-agent.md und
docs/architecture/ai/ai-play-strength-loop-2-automation-process-2026-06-22.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_2 auf Branch
codex/ai-play-strength-loop-2.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung
erlaubt ist.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit
Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen,
Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete sind in Reihenfolge umgesetzt oder mit Blocker dokumentiert.
- Mindestens ein konkreter Spielverhaltens-Kandidat wurde praktisch geprüft.
- Safety-Gates bleiben grün oder der Kandidat wird nicht übernommen.
- FINAL-GREEN besteht oder ein klarer Blocker verhindert den Merge.
