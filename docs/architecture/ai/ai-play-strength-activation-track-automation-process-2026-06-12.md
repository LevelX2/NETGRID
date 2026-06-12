# AI Play-Strength Activation Track Automation Process 2026-06-12

## Status

`final_green_passed_pending_local_main_merge`

Arbeitsbranch: `codex/ai-play-strength-activation-track`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_ACTIVATION_TRACK`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Ergebnisanalyse `Ergebnisprüfung und nächste mutige Paketserie`. Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push ohne Nutzerwunsch.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: Decision Spine von erklärbarer Infrastruktur zu messbarer, lokal opt-in aktivierbarer Spielstärke weiterentwickeln.
- Reihenfolge: Report-Sync und Redaction zuerst, dann neutrale Ziele, Run-Ziel-Mapping, reale Engine-Szenarien, Shadow-League, Kalibrierung, lokale Pilot-Scopes, TargetChoice-Shadow, pure Diagnostics-Cuts, Abschlussbericht und FINAL-GREEN.
- Scope: `packages/ai/src/**`, AI-Architektur- und Review-Dokumente, Wissenslog.
- Nicht-Ziele: keine Engine-Änderung, keine LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash, Randomness, Hidden-Info-Grenzen, Legacy-Fallback oder No-Candidate-Fallback.
- Abnahme: paketbezogene Vitest-Läufe, Typecheck, `git diff --check`; am Ende vollständiger `@netgrid/ai`-Testlauf und Main-Integration.
- Branch-/Worktree-Erwartung: `codex/ai-play-strength-activation-track` in `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_ACTIVATION_TRACK`.

Konservative Annahme: Wenn ein Paket produktive Runtime-Wirkung verlangen würde, wird nur der diagnostische oder lokal opt-in Anteil umgesetzt. Keine Paketarbeit darf Engine- oder Hidden-Info-Verträge still erweitern.

## Schlussfolgerung aus der Ergebnisanalyse

Die vorangegangene Play-Strength-Folgearbeit ist fachlich richtig und lokal integriert. Der nächste Engpass ist nicht Struktur, sondern kontrollierte Messbarkeit und Aktivierung. Vor Pilot-Erweiterungen müssen Redaction, neutrale Grundziele, RunTarget-Alignment und echte Engine-Szenarien belastbar sein.

## Gesamtziel

```text
report sync
-> centralized semantic redaction
-> neutral goal synthesis
-> run target/action alignment
-> real engine decision corpus
-> shadow league metrics
-> shadow-only calibration profile
-> local runner_safe_access pilot
-> local corp_score_window pilot
-> target choice shadow ranking
-> pure diagnostics extraction
-> final report
-> final green and local main integration
```

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, AI-Inputs, Debug, Reports, Logs, Reconnect-Payloads oder Simulationstraces.
- Keine produktive CardId-Sonderlogik.
- Keine automatische produktive Kalibrierungsübernahme.
- Keine Entfernung von Legacy- oder No-Candidate-Fallback.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- Finale AI-Actions stammen weiterhin aus `input.legalActions`.
- Die KI erzeugt keine Legalität.
- Debug-, Report-, Frame- und Trace-Ausgaben bleiben redigiert oder werden geblockt.
- Neue Pilot-Scopes bleiben lokal opt-in.
- Shadow-, Benchmark- und League-Reports haben keine Runtime-Wirkung.
- Konkrete Kartenfälle sind Fixtureanker, nicht Produktiv-Sonderregeln.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktiven Paket eingegrenzt und eng behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Keine Hidden-Info-Allowlist-Erweiterung ohne konkreten, side-safe Vertrag.
- Wenn ein sinnvoller Score nur über Hidden-Info oder Engine-Änderungen möglich wäre, wird der Fall als Blocker oder Follow-up dokumentiert.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus `input.legalActions` stammt;
- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Replay, StateHash oder Randomness beeinflusst würden;
- Legacy- oder No-Candidate-Fallback nicht erhalten werden kann;
- Debug-/Trace-/Reportdaten verdeckte Gegnerinformationen leaken;
- Pilot-Scopes ohne explizites Flag Runtime-Wirkung bekommen;
- NEXT-Pakete eine produktive Gewichtungsänderung statt nur Diagnose oder shadow-only Kalibrierung verlangen.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai_act_0_report_sync
  -> ai_act_1_semantic_redaction
  -> ai_act_2_neutral_goal_synthesis
  -> ai_act_3_run_target_action_alignment
  -> ai_act_4_real_engine_decision_corpus
  -> ai_act_5_shadow_league_metrics
  -> ai_act_6_calibration_profile
  -> ai_act_7_runner_safe_access_pilot
  -> ai_act_8_corp_score_window_pilot
  -> ai_act_9_target_choice_shadow
  -> ai_act_10_pure_diagnostics_cut
  -> ai_act_11_final_report
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert und `git diff --check` ist grün | `docs(ai): define play strength activation process` |
| `AI-ACT-0` | Report-Sync und Arbeitsbaum-Schutz | Follow-up-Report/Prozess stehen auf `complete`; lokale Main-Verifikation und GitHub-Versatz sind dokumentiert | `docs(ai): mark play strength followup complete on main` |
| `AI-ACT-1` | Einheitliche Semantic Redaction Utilities | gemeinsamer Redaction-Kern prüft Keys und String-Werte case-insensitive; Frame/Pilot blocken, Reports scrubben | `refactor(ai): centralize semantic redaction checks` |
| `AI-ACT-2` | NeutralGoal Synthesizer | No-goal Frames erhalten side-sichere Neutralziele und ranken LegalActions | `feat(ai): synthesize neutral decision goals` |
| `AI-ACT-3` | RunTarget zu ActionTarget Alignment | Run-Opportunity-/Threat-Boni binden an konkrete passende `start_run`-Action | `feat(ai): align run target opportunities to run actions` |
| `AI-ACT-4` | Real Engine Decision Corpus | echte Engine-/Runtime-nahe Corpus-Szenarien erzeugen Frames/Traces aus echten LegalActions | `test(ai): add real engine decision corpus` |
| `AI-ACT-5` | Shadow League Metrics | kurze report-only League aggregiert Agreement, Mistakes, Scores und Blocker | `test(ai): add semantic shadow league metrics` |
| `AI-ACT-6` | Calibration Profile V1 | `baseline_v1` reproduziert bisherigen Score; `shadow_calibrated_v1` bleibt shadow-only | `feat(ai): add shadow calibration profile` |
| `AI-ACT-7` | Lokaler Pilot `runner_safe_access` | Flag erlaubt nur eng gegatete sichere Run-Übernahme; default bleibt unverändert | `feat(ai): add local runner safe access pilot` |
| `AI-ACT-8` | Lokaler Pilot `corp_score_window` | Flag erlaubt nur legales `score_agenda` in klaren Scorefenstern; kein Advance/Rez-Cutover | `feat(ai): add local corp score window pilot` |
| `AI-ACT-9` | Target Choice Shadow | legale Zieloptionen werden diagnostisch gerankt, ohne `selectedChoices` zu setzen | `feat(ai): add target choice shadow ranking` |
| `AI-ACT-10` | `index.ts` pure Diagnostics Cut | nur reine Formatting-/Report-Helfer extrahiert; keine Auswahl-/Fallback-Logik bewegt | `refactor(ai): extract pure semantic diagnostics helpers` |
| `AI-ACT-11` | Abschlussbericht | Final Report dokumentiert Runtime-Wirkung, Grenzen und Checks | `docs(ai): record play strength activation track` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf | vollständiger `@netgrid/ai test`, Typecheck, Diffcheck und Runtime-Contract-Tests grün; lokal nach `main` integriert | `docs(ai): record play strength activation final green` |

## Paketdetails

Die Paketdetails folgen der Nutzer-Ergebnisanalyse. Prüfbefehle werden paketweise eng angewendet und bei Bedarf um direkt betroffene Tests ergänzt.

### AI-ACT-0

Docs-only Report-Sync. Prüfbefehl: `git diff --check`.

### AI-ACT-1

Neuer Kern `packages/ai/src/diagnostics/semantic-redaction.ts` mit:

```ts
containsForbiddenSemanticMarker(value: unknown): boolean;
findForbiddenSemanticPath(value: unknown): string | undefined;
redactSemanticString(value: string): string;
assertSemanticObjectSideSafe(value: unknown, label: string): void;
```

Marker sind case-insensitive und prüfen Keys wie String-Werte. Frame-/Trace-Pfade werfen; Debug-/Report-Pfade scrubben.

### AI-ACT-2 bis AI-ACT-10

Jedes Paket bleibt auf den in der Vorgabe genannten Dateien, Tests und Gates begrenzt. Wenn die vorhandenen APIs eine direkte Umsetzung einzelner vorgeschlagener Szenarien nicht tragen, wird die minimal side-sichere Variante umgesetzt und der Rest als Follow-up-Gap im jeweiligen Review dokumentiert.

### AI-ACT-11

Abschlussbericht `docs/reviews/ai/ai-play-strength-activation-track-final-report-2026-06-12.md`.

## Verifikationsregeln

- Nach jedem Paket paketbezogene Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`.
- Wenn Dateien außerhalb `packages/ai` geändert werden, betroffene Paketchecks ergänzen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für den finalen lokalen Merge.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt; falls nicht möglich, Ursache prüfen und dokumentieren.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite die Paketserie AI-ACT-0 bis AI-ACT-11 plus FINAL-GREEN vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAY_STRENGTH_ACTIVATION_TRACK auf Branch codex/ai-play-strength-activation-track.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- Alle Folgepakete und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-play-strength-activation-track`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Default-Runtime bleibt unverändert; neue Pilot-Scopes bleiben lokal opt-in.
- Vollständiger `@netgrid/ai`-Testlauf, Typecheck und `git diff --check` sind grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
