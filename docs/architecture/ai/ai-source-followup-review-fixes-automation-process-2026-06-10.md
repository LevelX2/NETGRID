# AI Source Follow-up Review Fixes Automationsprozess

Stand: 2026-06-10
Status: Prozessdefinition für direkte sequenzielle Umsetzung
Primärer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/ai-source-followup-review-fixes`
Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_REVIEW_FIXES`

## Quelle/Vorgabe

Ausgangspunkt ist die Nutzeranforderung vom 2026-06-10: Der lokal integrierte AI Source Follow-up Action-Semantics-Stand soll nicht über GitHub, sondern lokal sorgfältig geprüft und gehärtet werden. Der Zielstand `67f4c51c` ist lokal vorhanden, aber nicht remote sichtbar.

Die Vorgabe verlangt diese Paketfolge:

```text
AI-FUP-R0  Lokaler Review-Audit
AI-FUP-R1  Action-Identity-Kontrakt härten
AI-FUP-R2  Coverage mit echten LegalActions
AI-FUP-R3  index.ts-Restlogik abschließen
AI-FUP-R4  Test-Split-Vertrag sichern
AI-SEM-3   TargetDefinition-/TargetProfile-Gap-Report
AI-SEM-4   Semantik-Invariant-Checks
FINAL-GREEN
```

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: lokale Review-Funde nach der AI-Source-Reorg und Action-Semantics-Folgearbeit prüfen, absichern und dokumentieren.
- Sequenz: Audit zuerst, danach Identity-Vertrag, echte LegalAction-Coverage, `index.ts`-Inventar/Extraktion, Testsplit-Vertrag, TargetProfile-Gaps, Semantik-Invarianten, abschließend vollständiger AI-Green-Lauf.
- In-Scope: `packages/ai`, fokussierte AI-Tests, AI-Dokumentation unter `docs/reviews/ai/` und dieses Prozessartefakt.
- Nicht-Ziele: Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash, Randomness, Hidden-Info-Vertrag, Legacy-Löschung, produktive DeckDoctrine-v2-Wirkung, Push oder PR.
- Checks: paketbezogene Vitest-Dateien, `@netgrid/ai` Typecheck, `git diff --check`, abschließend vollständiger `@netgrid/ai` Testlauf.
- Git: eigener Worktree, Commit je Paket, finaler lokaler Merge nach `main` nur bei grünem Stand und konfliktfreier Hauptworkspace-Lage.

Konservative Annahmen:

- Der Hauptworkspace kann parallel uncommitted Änderungen enthalten. Diese werden als fremde Arbeit behandelt und nicht verändert.
- Wenn `main` beim finalen Merge durch fremde Änderungen blockiert ist, wird der Prozess mit einem Blocker-Report gestoppt statt fremde Änderungen zu stashen, zu committen oder zu überschreiben.
- Kleine Extraktionen aus `index.ts` erfolgen nur, wenn sie ohne Exportbruch und ohne Verhaltensänderung eindeutig sind.

## Gesamtziel

Der lokal integrierte AI-Action-Semantics-Follow-up-Stand wird prüfbar und robuster:

1. Der lokale Stand wird als Review-Audit im Repository dokumentiert.
2. CardInstanceId und CardDefinitionId bleiben in ActionSemanticCandidates eindeutig getrennt.
3. Die Semantikprojektion wird mit echten Engine-LegalActions aus realistischen Zuständen abgesichert.
4. `index.ts` bleibt Fassade oder es wird genau dokumentiert, welche Restlogik bewusst verbleibt.
5. Der reduzierte `index.test.ts`-Vertrag bleibt durch Entry-, LegalAction-, Legacy-, Hidden-Info-, Debug- und Cross-module-Smokes erhalten.
6. TargetProfile-Gaps und Semantik-Invarianten werden diagnostisch erfasst, ohne Runtime-Wirkung.
7. Der vollständige `@netgrid/ai` Testlauf ist grün.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln.
- Keine Änderung an LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung.
- Keine neue Legalität durch KI.
- Keine Entfernung von Legacy-Fallback, No-Candidate-Fallback oder `NETGRID_SEMANTIC_AI_RUNTIME=legacy`.
- Keine öffentliche Export-Entfernung aus `@netgrid/ai`.
- Keine produktive neue Zielwahl, keine DeckDoctrine-v2-Aktivierung und keine Planner-Gewichte aus SEM-3/SEM-4.
- Kein Push und keine PR.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Jede KI-Action bleibt aus `input.legalActions`.
- Action-Semantik ist read-only und erzeugt keine Legalität.
- TargetProfiles dürfen nur LegalAction-Zieloptionen bewerten.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert.
- Verdeckte gegnerische Karten dürfen nicht über State, Debug oder private Deckdaten auf Definitionen aufgelöst werden.
- Tests werden nicht gelöscht, geskipped oder pauschal gelockert.
- Paketcommits enthalten nur paketzugehörige Änderungen.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eingegrenzt und eng behoben.
- Unklare Semantik bleibt diagnostisch, nicht produktiv.
- Unklare `sourceCardId`-Altnutzung wird als Legacy-Alias dokumentiert oder in eindeutigere Felder überführt.
- Wenn eine Extraktion aus `index.ts` Export- oder Runtime-Risiko erzeugt, wird sie nicht erzwungen; der Befund wird im Review-Report dokumentiert.
- Fremde Hauptworkspace-Änderungen werden nicht gestasht, nicht committed und nicht reverted.

## Sicherheitsblocker

Der Prozess stoppt ohne finalen Merge, wenn einer dieser Punkte bestätigt ist:

- Eine KI würde eine Action wählen, die nicht in `input.legalActions` enthalten ist.
- Eine Änderung nutzt oder leakt verdeckte gegnerische Kartendaten.
- Öffentliche Payloads, PlayerViews, Reconnect-Daten, Undo-Previews, Replays, Logs oder Client-Fehler enthalten neue Hidden-Info-Leaks.
- Engine-Regelvalidierung, LegalAction-Erzeugung oder `applyAction` müssten geändert werden.
- Replay-Determinismus oder StateHash würden durch AI-Diagnostik beeinflusst.
- Tests lassen sich nur durch `skip`, `only`, Testlöschung oder Assertion-Lockerung grün bekommen.
- Der finale Merge nach `main` würde fremde uncommitted Änderungen überschreiben.

## State Machine

```text
preflight_process
-> ai_fup_r0_local_review_audit
-> ai_fup_r1_action_identity_contract
-> ai_fup_r2_real_legalaction_coverage
-> ai_fup_r3_index_restlogic
-> ai_fup_r4_test_split_contract
-> ai_sem_3_target_profile_gap_report
-> ai_sem_4_semantic_invariant_checks
-> final_green
-> integration_preflight
-> merged_to_main
-> worktree_removed
-> complete
```

Blocker-Pfad:

```text
current_step -> blocked
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define review fixes package process` |
| `AI-FUP-R0` | Lokaler Review-Audit | Audit-Report mit Git-, `index.ts`-, Action-Identity- und Testsplit-Befund; keine Codeänderung | `docs(ai): audit action semantics follow-up result` |
| `AI-FUP-R1` | Action-Identity-Kontrakt | Typ-/Join-Vertrag und Tests für Definition-vs-Instance, Hidden-Info und Multi-Ability | `test(ai): harden action card identity contract` |
| `AI-FUP-R2` | Real LegalAction Coverage | echte Engine-LegalActions werden durch ActionSemanticCandidate-Coverage geprüft | `test(ai): cover semantic projection for real legal actions` |
| `AI-FUP-R3` | `index.ts`-Restlogik | Inventar und ggf. kleine Extraktion ohne Export- oder Verhaltensänderung | `refactor(ai): move remaining index implementation to modules` |
| `AI-FUP-R4` | Test-Split-Vertrag | Entrypoint-, LegalAction-, Legacy-, Hidden-Info-, Debug- und Cross-module-Smokes sind gesichert | `test(ai): preserve index suite contracts after split` |
| `AI-SEM-3` | TargetProfile-Gap-Report | diagnostischer Gap-Report und Tests ohne produktive Zielwahl | `docs(ai): report target profile gaps for action semantics` |
| `AI-SEM-4` | Semantik-Invariant-Checks | Signal-/StrategySupport-/TargetProfile-Invarianten diagnostisch geprüft | `test(ai): add semantic invariant coverage` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf | voller `@netgrid/ai test`, Typecheck, `git diff --check`, Abschlussreport | `docs(ai): record review fixes final green` |

## Paketdetails

### AI-FUP-R0

Kernartefakt:

- `docs/reviews/ai/ai-source-followup-action-semantics-review-audit-2026-06-10.md`

Arbeit:

- Git-Stand, lokale Remote-Sichtbarkeit, `git show --stat`, `git show --name-status` dokumentieren.
- `index.ts`-Linecount und Restfunktionskategorien erfassen.
- Action-Identity-Felder und Profil-Map-Namen inventarisieren.
- Testsplit-Flächen inventarisieren.
- Keine Codeänderung.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-FUP-R1

Kernartefakte:

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`
- `packages/ai/src/action-semantic-candidate.test.ts`
- `packages/ai/src/actions/action-semantic-coverage.test.ts`

Arbeit:

- `sourceCardInstanceId?: CardInstanceId` und `sourceDefinitionId?: CardDefinitionId` als Zielvertrag sichtbar halten.
- `sourceCardId` nur als Legacy-Alias verwenden, falls Kompatibilität nötig bleibt.
- CardSemanticProfiles über Definition-ID joinen.
- Verdeckte gegnerische Quellen nicht über echten State oder private Daten auflösen.
- Tests für eigene private Quelle, sichtbare Gegnerquelle, verdeckte Gegnerquelle, BasicAction, Multi-Ability und explizite AbilityRef ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-FUP-R2

Kernartefakte:

- `packages/ai/src/actions/action-semantic-coverage.test.ts`
- optional `packages/ai/src/actions/action-semantic-fixture-coverage.test.ts`

Arbeit:

- Echte Engine-LegalActions aus realistischen Fixture-Zuständen sammeln.
- Candidate count, `actionId`, `legalActionRef`, Gates, Timing, Cost und Hidden-Info-Redaction prüfen.
- Pflichtfamilien mindestens abdecken: Draw, Economy, Install, Play Event/Operation, Advance, Score, Run, Continue, Jack-out, Rez/Decline, Pump/Break, Access/Steal/Trash/Decline, Remove Tag, Resolve Choice, Trigger/Activated Ability, End Turn.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-FUP-R3

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/runtime/semantic-runtime-types.ts`
- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/legacy/legacy-baseline.ts`
- `packages/ai/src/simulation/**`

Arbeit:

- `index.ts` inventarisieren.
- Debug-, Legacy-Baseline- oder Simulation-Implementierung nur bei eindeutigem, kleinem Risiko extrahieren.
- Exportnamen und Runtime-Verhalten unverändert lassen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/simulation-harness.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/v143-fixtures.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-FUP-R4

Kernartefakte:

- `packages/ai/src/index.test.ts`
- `packages/ai/src/simulation/simulation-harness.test.ts`
- `packages/ai/src/simulation/v143-fixtures.test.ts`
- `packages/ai/src/actions/action-semantic-coverage.test.ts`

Arbeit:

- Sicherstellen, dass Entry-, LegalAction-, Legacy-, Hidden-Info-, Debug- und Cross-module-Verträge weiter abgedeckt sind.
- Fehlende kleine Smokes ergänzen.
- Keine Testlöschung, kein `skip`, kein `only`, keine pauschale Assertion-Lockerung.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/simulation-harness.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/v143-fixtures.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-SEM-3

Kernartefakte:

- `docs/reviews/ai/ai-target-profile-gap-report-2026-06-10.md`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/action-doctrine-goal-diagnostics.ts`

Arbeit:

- Ziel-/Modus-/Optionswahl-Fälle inventarisieren.
- Gap-Kategorien definieren: `target_not_needed`, `target_static_constraint_only`, `target_required_but_no_profile`, `target_profile_exists_no_legal_options`, `target_profile_exists_with_legal_options`, `target_hidden_info_blocked`.
- Report schreiben, keine produktive Zielwahl.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-doctrine-goal-diagnostics.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### AI-SEM-4

Kernartefakte:

- `packages/ai/src/action-doctrine-goal-diagnostics.test.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `docs/reviews/ai/ai-semantic-invariants-report-2026-06-10.md`

Arbeit:

- TacticSignals, StrategySupportPairs, TargetProfiles und Test-/Fixture-Karten-Trennung prüfen.
- Invarianten für keine reinen Typ-/Subtyp-/Namenssignale, keine SupportPairs ohne `strategyId`, `role`, `confidence`, `evidence`, keine Strategy IDs aus support-only Signalen.
- Nur diagnostische Wirkung.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-doctrine-goal-diagnostics.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### FINAL-GREEN

Kernartefakt:

- `docs/reviews/ai/ai-source-followup-review-fixes-final-report-2026-06-10.md`

Pflichtchecks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Wenn Dateien außerhalb `packages/ai` geändert wurden, werden betroffene Paketchecks ergänzt.

## Verifikationsregeln

Nach jedem Paket:

1. Relevante Checks ausführen.
2. Ergebnisse im Paket- oder Abschlussartefakt dokumentieren.
3. `git diff --check` ausführen.
4. Nur paketzugehörige Änderungen stagen.
5. Paketcommit erstellen.

Final:

1. Vollständigen `@netgrid/ai` Testlauf ausführen.
2. `@netgrid/ai` Typecheck ausführen.
3. `git diff --check` ausführen.
4. `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
5. Bei sauberem Hauptworkspace lokal nach `main` mergen.
6. Hauptworkspace erneut prüfen.
7. Worktree entfernen.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_REVIEW_FIXES`
- Branch: `codex/ai-source-followup-review-fixes`
- Integrationsbranch: `main`
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen Merge verwenden.
- Offene fremde Hauptworkspace-Änderungen bleiben unangetastet.
- Kein Push und keine PR.

## Controller-Prompt-Kern

```text
/Goal Prüfe und härte den lokal integrierten AI Source Follow-up Action Semantics Stand nach. Arbeite AI-FUP-R0, AI-FUP-R1, AI-FUP-R2, AI-FUP-R3, AI-FUP-R4, AI-SEM-3, AI-SEM-4 und FINAL-GREEN sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_REVIEW_FIXES auf Branch codex/ai-source-followup-review-fixes.
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

- Prozessartefakt ist committed.
- Paketcommits für AI-FUP-R0 bis AI-SEM-4 und FINAL-GREEN liegen auf `codex/ai-source-followup-review-fixes`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Vollständiger `@netgrid/ai` Testlauf und Typecheck sind grün.
- Arbeitsbranch ist lokal nach `main` gemerged, sofern der Hauptworkspace sauber und konfliktfrei ist.
- Worktree ist entfernt.
