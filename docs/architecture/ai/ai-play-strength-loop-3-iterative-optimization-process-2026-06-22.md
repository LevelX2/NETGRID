# AI Play Strength Loop 3 Iterative Optimization

Status: final_no_potential_or_gate

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat beauftragt, die KI-Spielverhaltensoptimierung in einer
Optimierungsschleife mit Planungsteil und nachfolgendem Umsetzungsteil so lange
zu iterieren, bis innerhalb der aktuellen Codex-Grenzen kein klares Potential
mehr sichtbar ist.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise, wenn
`kein Potential mehr` operativ begrenzt wird. Dieser Prozess endet, sobald ein
Planungsgate keinen klaren, risikoarmen, LegalAction-basierten Hebel findet
oder ein Kandidat das Safety-/Quality-Gate nicht erfüllt. Er ist keine
unendliche Suche und kein breites Heuristik-Tuning.

## Gesamtziel

PS3 soll nach PS2 weiteres praktisches Spielstärke-Potential finden und nur dann
umsetzen, wenn eine konkrete, side-safe Entscheidungskorrektur sichtbar ist.
Jede Iteration besteht aus:

1. Planungsgate mit gepaarter Messung und Hypothese.
2. Umsetzung eines engen Kandidaten.
3. Paired Gate gegen Baseline.
4. Stop-/Weiter-Entscheidung.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_3`.
- Branch: `codex/ai-play-strength-loop-3`.
- PS2 ist auf `main` und GitHub sichtbar.
- Bestehender Gate-Runner `scripts/run-ai-ps2-play-strength-gate.ts` wird
  wiederverwendet.
- Maximal zwei Implementierungsiterationen werden in dieser Codex-Schleife
  versucht; danach wird auf Basis des letzten Gates entschieden, ob noch
  belastbares Restpotential sichtbar ist.

## Nicht-Ziele

- Kein globaler Default-Cutover.
- Kein Rewrite von `packages/ai/src/index.ts`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder
  Randomness-Änderung.
- Keine Hidden-Info-Erweiterung.
- Keine neue Kartenfreigabe.
- Kein generisches Tuning ohne konkrete Entscheidungssituation.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI wählt ausschließlich aus Engine-`LegalActions`.
- Neue Kandidaten dürfen nur side-safe Informationen aus `AiDecisionInput`,
  LegalAction-Typ, Label, Kosten und expliziten Payload-Signalen nutzen.
- Kandidaten bleiben opt-in, solange kein separater Default-Gate-Auftrag
  vorliegt.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket debuggt.
- Ein Safety-Verstoß stoppt den Loop mit Blocker-Report.
- Ein Kandidat ohne praktische Gate-Verbesserung wird nicht weiter ausgebaut.
- Wenn das Planungsgate nur vage oder widersprüchliche Hebel zeigt, endet die
  Schleife mit `no_clear_low_risk_potential`.

## Sicherheitsblocker

- `illegalActions > 0`.
- `replayFailures > 0`.
- `redactionSafe !== true`.
- Kandidat braucht verdeckte Kartendaten.
- Kandidat erzeugt oder verändert LegalActions.
- Candidate-Runner und Candidate-Corp verschlechtern beide Action-Limits oder
  Abschlussfortschritt.

## State Machine

1. `prepared_for_execution`
2. `planning_gate_1`
3. `package_done:AI-PS3-0`
4. `implementation_iteration_1`
5. `package_done:AI-PS3-1`
6. `planning_gate_2`
7. `package_done:AI-PS3-2`
8. `implementation_iteration_2_optional`
9. `package_done:AI-PS3-3`
10. `final_no_potential_or_gate`
11. `final_green`
12. `merged_to_main`
13. `complete`
14. `blocked:<reason>`

## Paketfolge

1. `AI-PS3-0` Planungsgate 1: breite PS2-Nachmessung und Potentialauswahl
2. `AI-PS3-1` Umsetzung 1: engster LegalAction-Kandidat
3. `AI-PS3-2` Planungsgate 2: Wirkung prüfen und Restpotential entscheiden
4. `AI-PS3-3` Umsetzung 2 oder No-Potential-Abschluss
5. `FINAL-GREEN` vollständige Verifikation, lokaler Merge und Worktree-Cleanup

## AI-PS3-0 Planungsergebnis

Breiter Gate-Lauf:

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps3-planning-gate-1-2026-06-22.json --pairs a,b,c,d --max-actions 160
```

Ergebnis:

- Szenarien: 5
- Spiele je Leg: 25
- Safety: 0 IllegalActions, 0 ReplayFailures, RedactionSafe true
- Taktik-Benchmark-Delta: +1.0
- Candidate-Runner: Action-Limits 13 statt 16, Runner-Steals 47 statt 40
- Candidate-Corp: Action-Limits 13 statt 16, Corp-Scores 21 statt 12

Restpotential:

- Pair D (`R&D Interface Dig vs Shadoe Tag & Bag`) zeigt als auffälligstes
  Runner-Risiko: Candidate-Runner erreicht mehr Steals, verschlechtert aber
  Action-Limits von 0 auf 2.
- Der fachlich engste Low-Risk-Hebel ist Tag-Sicherheit: Eine legale
  `remove_tag`-Action soll die High-Payoff-Run-Übersteuerung schlagen, wenn der
  Runner getaggt ist. Das darf Steal/Trash/Open-Access nicht verdrängen.

Entscheidung für AI-PS3-1: Implementiere einen eng begrenzten
`runner_tag_cleanup_before_pressure`-Kandidaten im Practical-Tactic-Overlay.

## AI-PS3-1/2 Umsetzung und Gate-Entscheidung

Der Kandidat `runner_tag_cleanup_before_pressure` wurde lokal implementiert
und mit fokussierten Tests geprüft. Die Unit- und Typechecks waren grün:

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Die anschließenden gepaarten Gates zeigten aber keine praktische Verbesserung:

- Pair-D-Fokus blieb beim auffälligen Runner-Action-Limit-Cluster schlechter
  als Legacy.
- Der breite Gate-Lauf über Pair A-D blieb metrisch identisch zum
  Planungsgate.
- Safety blieb grün, aber der Kandidat bewegte den realen Gate-Gegenstand
  nicht messbar.

Entscheidung: Der Codekandidat wurde vor dem Commit verworfen. Ein Kandidat,
der nur synthetische Fixtures verbessert, aber im gepaarten Spielstärke-Gate
keinen Effekt zeigt, wird nicht in das KI-Verhalten übernommen.

## AI-PS3-3 No-Potential-Abschluss

Nach dem verworfenen Tag-Cleanup-Kandidaten bleibt innerhalb des aktuellen
Practical-Tactic-Overlay-Zuschnitts kein weiterer klarer Low-Risk-Hebel
sichtbar:

- Die PS2-Heuristik ist weiterhin insgesamt positiv und safety-grün.
- Die auffälligen Restsignale sind gemischt: mehr Fortschritt oder mehr
  Scoring bei gleichzeitig einzelnen schlechteren Action-Limit-Clustern.
- Eine weitere kleine Overlay-Regel wäre ohne Trace-Diagnose voraussichtlich
  heuristisches Tuning statt belegbarer Entscheidungskorrektur.
- Größeres Restpotential liegt eher in einem separaten Analysepaket mit
  Trace-Level-Ursachenanalyse, Default-Cutover-Gate oder Planner-Struktur,
  nicht in einer weiteren blind iterierten Mikro-Heuristik.

Finale Entscheidung: `no_clear_low_risk_potential`. Die Schleife endet ohne
neue Verhaltenänderung nach AI-PS3-0; der Planungs- und No-Potential-Befund
wird übernommen.

## Paketdetails

### AI-PS3-0 Planungsgate 1

Ziel: Nach PS2 über breitere Deck-/Seed-Abdeckung feststellen, ob noch ein
klarer risikoarmer Hebel sichtbar ist.

Arbeit:

- Gate-Lauf mit Pair A-D und fünf Seeds ausführen.
- Runner-/Corp-Deltas und Action-Limit-Cluster prüfen.
- Genau eine Kandidatenhypothese für AI-PS3-1 wählen oder Stop-Grund
  dokumentieren.

Checks:

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps3-planning-gate-1-2026-06-22.json --pairs a,b,c,d --max-actions 160`
- `git diff --check`

Done-Gate:

- Planungsgate liegt als JSON und Review vor.
- Eine konkrete Umsetzungshypothese oder No-Potential-Stop ist dokumentiert.
- Commit: `test(ai): plan play strength optimization loop 3`

### AI-PS3-1 Umsetzung 1

Ziel: Den im Planungsgate sichtbaren engsten Kandidaten umsetzen.

Arbeit:

- Nur eine konkrete, LegalAction-basierte Entscheidungskorrektur implementieren.
- Praktischen Taktikbenchmark oder fokussierten Runtime-Test ergänzen.
- Kleinen Gate-Lauf ausführen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- kleiner Gate-Lauf
- `git diff --check`

Done-Gate:

- Tests grün.
- Safety grün.
- Kandidat bleibt opt-in.
- Commit: `feat(ai): apply play strength loop 3 candidate`

### AI-PS3-2 Planungsgate 2

Ziel: Wirkung von AI-PS3-1 auf breiterem Gate prüfen und entscheiden, ob eine
zweite Iteration noch klar sinnvoll ist.

Arbeit:

- Gate-Lauf A-D mit fünf Seeds ausführen.
- Gegen AI-PS3-0 vergleichen.
- Falls kein klarer weiterer Hebel sichtbar ist, No-Potential-Abschluss
  vorbereiten.

Checks:

- breiter Gate-Lauf
- `git diff --check`

Done-Gate:

- Entscheidung `iterate_again`, `keep_candidate_opt_in` oder
  `no_clear_low_risk_potential`.
- Commit: `test(ai): review play strength loop 3 iteration`

### AI-PS3-3 Umsetzung 2 oder No-Potential-Abschluss

Ziel: Entweder eine zweite klare Kandidatenänderung umsetzen oder die Schleife
fachlich beenden.

Arbeit:

- Bei `iterate_again`: eine weitere enge Änderung plus Tests und Gate.
- Bei No-Potential: Abschlussreview mit Restpotentialbewertung.

Checks:

- Je nach Pfad fokussierte Tests oder Review-only `git diff --check`.

Done-Gate:

- Kein offenes, klares Low-Risk-Potential bleibt undokumentiert.
- Commit: `docs(ai): close play strength loop 3 potential review` oder
  passender `feat(ai)`-Commit.

### FINAL-GREEN

Ziel: Arbeitsbranch vollständig verifizieren, nach `main` mergen und Worktree
entfernen.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:

- Arbeitsbranch sauber.
- Lokal nach `main` integriert.
- Hauptworkspace sauber.
- Worktree entfernt.
- Goal erst danach complete.

## Verifikationsregeln

- Jede Codeänderung braucht fokussierte Tests.
- Jedes Planungsgate braucht JSON- und Markdown-Nachweis.
- `git diff --check` läuft vor jedem Commit.
- Nicht ausgeführte Checks werden begründet.

## Worktree-, Git- und Integrationsregeln

- Branch: `codex/ai-play-strength-loop-3`
- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_3`
- Umsetzung ausschließlich im Worktree.
- Hauptworkspace nur für finalen Merge.
- Kein Push ohne separaten Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Play Strength Loop 3 vollständig und sequenziell von AI-PS3-0
bis AI-PS3-3 plus FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_PLAY_STRENGTH_LOOP_3 auf Branch
codex/ai-play-strength-loop-3. Nutze den Hauptworkspace nur für den finalen
Merge. Jede Iteration besteht aus Planungsgate, Umsetzung, Gate-Review und
Stop-/Weiter-Entscheidung. Stelle keine Zwischenfragen, solange konservative
Fortsetzung möglich ist. Bei Safety-Blocker oder fehlendem klaren Low-Risk-
Potential: dokumentieren, stoppen, final verifizieren und integrieren.
```

## Abschlusskriterien

- Mindestens ein breites Planungsgate wurde ausgeführt.
- Jede sichtbare Low-Risk-Hypothese wurde umgesetzt oder als nicht tragfähig
  begründet.
- Safety-Gates bleiben grün oder blockieren die Übernahme.
- Kein weiteres klares, enges Potential bleibt sichtbar.
- Branch ist lokal nach `main` integriert und Worktree entfernt.
