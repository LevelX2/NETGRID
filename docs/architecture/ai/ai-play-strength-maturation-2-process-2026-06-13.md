# AI Play-Strength Maturation II Prozess

Status: active

Quelle/Vorgabe: Nutzeranalyse `Prüfung über GitHub und Statusbericht` vom 2026-06-13 mit Folgepaketen `AI-MAT2-0` bis `AI-MAT2-23` und `FINAL-GREEN`.

## Zielprüfung

Die Vorgabe ist für automatische sequenzielle Umsetzung ausreichend präzise. Sie nennt Branch, Worktree, Paketfolge, Kernartefakte, Checks, Commit-Messages und Sicherheitsgrenzen. Der lokale Preflight korrigiert nur den Startstand: `main` ist sauber, steht auf `4d2d2811`, ist lokal `ahead 1` gegenüber `origin/main`, und die ältere Abschlussmeldung `ahead 25` ist nicht mehr führend.

## Gesamtziel

AI Play-Strength Maturation II synchronisiert die lokale Repo-Wahrheit mit den sichtbaren AI-Reports, härtet Pilot-/Corpus-/Fixture-/Shadow-League-Metriken, erweitert diagnostische Ziel- und Targetwahl-Logik, trennt weitere Debug-Strukturen aus `index.ts`, stärkt Import- und Public-Export-Grenzen und dokumentiert den Abschluss lokal grün auf `main`.

## Annahmen

- Lokaler `main` ist der führende Integrationsbranch.
- GitHub-Drift wird dokumentiert und lokal korrigiert; Push oder PR gehört nicht zum Prozess.
- Dateinamen aus der Vorgabe mit Datum `2026-06-12` bleiben erhalten, wenn es um Fortsetzung bestehender AI-MAT-Dokumente geht.
- Neue Prozesssteuerung nutzt das tatsächliche Erstellungsdatum `2026-06-13`.
- Falls ein Paket technisch bereits erfüllt ist, wird der Ist-Stand geprüft, dokumentiert und nur der fehlende Delta-Schutz ergänzt.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung durch KI.
- Keine produktive Aktivierung neuer RemoteContest-, Doctrine- oder TargetChoice-Wirkung.
- Keine Hidden-Info-Allowlist-Erweiterung ohne belegte Side-Safety.
- Kein Remote-Push, kein PR und keine GitHub-Integration.
- Keine große `index.ts`-Big-Bang-Extraktion.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Paketabschluss nur nach passenden Checks, `git diff --check`, gezieltem Staging und Commit.
- `eligible`, `wouldOverride` und `actualOverride` bleiben begrifflich getrennt.
- Pilot-Erlaubnis darf nicht allein aus Evidence-Fallback entstehen.
- RemoteContest V2 bleibt Kandidaten-/Reportschicht ohne Runtime-Verbraucher.
- TargetChoiceShadow bleibt ohne `selectedChoices`.
- DoctrineGoalSynthesis bleibt diagnostisch; Boardstate-Bedrohungen dominieren Doctrine-Signale.
- Real-Engine-Corpus-Zählung und Shadow-League-Erwartungen werden aus Code/Metadata abgeleitet.

## Automatische Fehlerbehandlung

Bei roten Tests wird zuerst der konkrete Test, die Assertion und die betroffene Vertragsgrenze gelesen. Danach wird eng korrigiert, der Einzeltest erneut ausgeführt und anschließend der passende Paketcheck wiederholt. Es gibt kein `test.skip`, kein `test.only`, keine Testlöschung und keine pauschale Assertion-Lockerung.

## Sicherheitsblocker

Der Prozess stoppt ohne Nachfrage, wenn eine Änderung Engine-Validierung, `applyAction`, Replay/StateHash, Randomness, PublicEvents, PlayerViews, Reconnect-Payloads, Logs oder KI-Inputs so berührt, dass Hidden-Info- oder Regelautoritätsgrenzen nicht lokal beweisbar bleiben. Removal Condition ist ein dokumentierter Side-Safety- und Regelautoritätsnachweis mit grünen relevanten Tests.

## State Machine

`preflight` -> `worktree_ready` -> `process_committed` -> `package_active` -> `package_checked` -> `package_committed` -> nächstes Paket -> `final_green` -> `main_merge` -> `main_verified` -> `worktree_removed` -> `complete`

## Paketfolge

1. `AI-MAT2-0` Local/GitHub Sync Audit
2. `AI-MAT2-1` Env-Kontrakt für Pilot-Scopes festziehen
3. `AI-MAT2-2` Real-Engine-Corpus-Zählung hart machen
4. `AI-MAT2-3` Real-Engine-Fixture-Builder erzwingen
5. `AI-MAT2-4` Pilot-Eligibility-Begriffe trennen
6. `AI-MAT2-5` Pilot-Registry Decision Matrix
7. `AI-MAT2-6` Structured RunProjectionSummary am Candidate
8. `AI-MAT2-7` RunnerSafeAccess ohne Evidence-Fallback
9. `AI-MAT2-8` RemoteContest Candidate V2
10. `AI-MAT2-9` TargetChoiceShadow V2 goal-aware scoring
11. `AI-MAT2-10` TargetChoiceShadow mit echten Engine-Targets
12. `AI-MAT2-11` DoctrineGoalSynthesis erweitern
13. `AI-MAT2-12` Doctrine-vs-Boardstate Arbitration
14. `AI-MAT2-13` ShadowLeague aus Corpus-Metadata generieren
15. `AI-MAT2-14` Real-Engine-Corpus auf 50 Szenarien erweitern
16. `AI-MAT2-15` Calibration Profile als Baseline-Artefakte
17. `AI-MAT2-16` ShadowLeague-Delta-Report
18. `AI-MAT2-17` Selfplay Trace Mining zu Decision Corpus
19. `AI-MAT2-18` Originalset-Semantik-Backlog in Worklists schneiden
20. `AI-MAT2-19` Proteus Readiness nur diagnostisch
21. `AI-MAT2-20` `index.ts` Schnitt 1: `semantic-runtime-debug.ts`
22. `AI-MAT2-21` Module-Boundary-Guard erweitern
23. `AI-MAT2-22` AI Public Export Contract Test
24. `AI-MAT2-23` Abschlussbericht
25. `FINAL-GREEN` Finale Checks, lokaler Main-Merge und Worktree-Entfernung

## Fortschritt

| Schritt | Status | Commit | Notiz |
|---|---|---|---|
| Prozess-Setup | complete | `d63f0d5e` | Prozessartefakt angelegt und Worktree vorbereitet. |
| AI-MAT2-0 | complete | AI-MAT2-0 commit | Local/GitHub Sync Audit, Final-Report-Status, Env-Name und 80/1236-AI-Teststand synchronisiert. |
| AI-MAT2-1 | complete | AI-MAT2-1 commit | Offizieller Pilot-Env-Vertrag dokumentiert; Legacy-Env ohne Runtime-Wirkung getestet. Checks: Registry-Test 10/10, Typecheck grün. |

## Paketdetails

| Paket | Kernartefakte | Checks | Commit |
|---|---|---|---|
| AI-MAT2-0 | Sync-Preflight, AI-MAT-Final-Report, AI-README | `git diff --check` | `docs(ai): sync play strength maturation final state` |
| AI-MAT2-1 | Pilot-Env-Kontrakt, Registry-Test, Docs | Registry-Test, Typecheck, Diff-Check | `docs(ai): normalize play strength pilot env contract` |
| AI-MAT2-2 | Corpus-Fixtures, Corpus-Test, Shadow-League-Baseline | Corpus-Test, ShadowLeague-Test, Typecheck | `test(ai): enforce real engine corpus scenario counts` |
| AI-MAT2-3 | `real-engine-fixture-builder.ts`, Corpus-Fixtures/Test | Corpus-Test, Typecheck | `refactor(ai): enforce real engine fixture builder` |
| AI-MAT2-4 | Shadow-League-Metriken, Pilot Registry | ShadowLeague-Test, Registry-Test, Typecheck | `test(ai): split pilot eligibility metrics` |
| AI-MAT2-5 | PilotScopeDecisionMatrix, DecisionDebug | Registry-Test, DecisionDebug-Test, Typecheck | `feat(ai): expose pilot scope decision matrix` |
| AI-MAT2-6 | Candidate `runProjectionSummary`, Run-Projektion, Alignment | Alignment-Test, ActionCoverage-Test, Typecheck | `feat(ai): add structured run projection summary` |
| AI-MAT2-7 | RunnerSafeAccess-Pilot, Alignment | SafeAccess-Test, Alignment-Test, Typecheck | `test(ai): require structured run alignment for safe access pilot` |
| AI-MAT2-8 | RemoteContest-Candidate V2, ShadowLeague | RemoteContest-Test, ShadowLeague-Test, Typecheck | `test(ai): harden remote contest pilot candidates` |
| AI-MAT2-9 | TargetChoiceShadow, Tactical/Threat/Opportunity Inputs | TargetChoiceShadow-Test, Typecheck | `feat(ai): score target choice shadow by tactical context` |
| AI-MAT2-10 | Real-Engine-Zieloptionen, TargetChoiceShadow-Test | TargetChoiceShadow-Test, Corpus-Test, Typecheck | `test(ai): validate target choice shadow with real targets` |
| AI-MAT2-11 | DoctrineGoalSynthesis Linien | Doctrine-Test, NeutralGoal-Test, Typecheck | `feat(ai): expand diagnostic doctrine goal synthesis` |
| AI-MAT2-12 | Doctrine/Boardstate Arbitration | Doctrine-Test, ShadowDecision-Test, Typecheck | `test(ai): keep boardstate above doctrine goals` |
| AI-MAT2-13 | Corpus-Metadata, ShadowLeague | ShadowLeague-Test, Corpus-Test, Typecheck | `refactor(ai): derive shadow league expectations from corpus metadata` |
| AI-MAT2-14 | 50 Real-Engine-Szenarien | Corpus-Test, ShadowLeague-Test, Typecheck | `test(ai): expand real engine corpus to fifty scenarios` |
| AI-MAT2-15 | Calibration-Metadata, Baseline-Doc | Calibration-Test, Benchmark-Test, Typecheck | `test(ai): lock semantic shadow calibration metadata` |
| AI-MAT2-16 | ShadowLeague-Delta-Modul und Report | Delta-Test, ShadowLeague-Test, Typecheck | `test(ai): add shadow league delta report` |
| AI-MAT2-17 | Selfplay Decision Snapshot Mining | Mining-Test, Trace-Mining-Test, Typecheck | `test(ai): mine selfplay decisions into snapshot corpus` |
| AI-MAT2-18 | Originalset Worklists, Invariant Guard | Invariant-Test, Typecheck | `docs(ai): split originalset semantic play strength worklists` |
| AI-MAT2-19 | Proteus Readiness Report, Invariant Guard | Invariant-Test, Typecheck | `docs(ai): assess proteus play strength readiness` |
| AI-MAT2-20 | `semantic-runtime-debug.ts`, Tests, `index.ts` | Debug-, Runtime-, Index-Test, Typecheck | `refactor(ai): extract semantic runtime debug formatting` |
| AI-MAT2-21 | Module-Boundary-Guard | Boundary-Test, Typecheck | `test(ai): strengthen play strength import boundaries` |
| AI-MAT2-22 | Public Export Contract Test | Export-Test, Typecheck | `test(ai): guard public ai export contract` |
| AI-MAT2-23 | Final-Report | `git diff --check` | `docs(ai): record play strength maturation two` |

## Verifikationsregeln

Paketchecks werden eng ausgeführt. Wegen pnpm/Vitest-Argumentweitergabe darf ein enger Check effektiv mehr Testdateien ausführen; dann wird die tatsächlich gelaufene Zahl im Prozessfortschritt oder Abschlussbericht notiert.

Finale Pflichtchecks:

```powershell
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
```

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_2`
- Arbeitsbranch: `codex/ai-play-strength-maturation-2`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace wird nur für finalen lokalen Merge nach `main` genutzt.
- Staging erfolgt paketbezogen per expliziten Pfaden.
- Push/PR ist nicht Teil dieses Prozesses.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Play-Strength Maturation II vollständig und sequenziell von AI-MAT2-0 bis AI-MAT2-23 sowie FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den Release Implementation Agent und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_2 auf Branch codex/ai-play-strength-maturation-2.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus, dokumentiere nicht ausgeführte Checks, führe git diff --check aus, stage nur Paketpfade und committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker stoppe ohne Rückfrage, schreibe einen Blocker-Report mit Removal Condition.
Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete `AI-MAT2-0` bis `AI-MAT2-23` sind umgesetzt oder als bereits erfüllter Delta-Stand belastbar nachgewiesen.
- Alle Paketcommits liegen auf `codex/ai-play-strength-maturation-2`.
- FINAL-GREEN ist im Arbeitsbranch und nach lokalem Main-Merge grün.
- `main` ist sauber.
- Der Worktree `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_2` ist entfernt.
