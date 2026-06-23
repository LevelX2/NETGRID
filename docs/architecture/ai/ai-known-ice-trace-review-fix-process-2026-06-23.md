# AI Known ICE Trace Review Fix Process 2026-06-23

## Status

`abgeschlossen`

## Quelle/Vorgabe

Nutzerauftrag vom 2026-06-23 mit Review-Befund zum bereits gemergten Known-ICE-Run-Risk-Fix. Der Hauptfehler `Hunter` auf bekanntem/rezzed R&D ist behoben, aber die Review benennt sechs Nacharbeiten:

1. Base-Link wird zu günstig bewertet, weil Aktivierungskosten und Nebenwirkungen fehlen.
2. Sichtbare Corp-Bid-Kapazität wird nicht in die Pre-Run-Trace-Spanne einbezogen.
3. Mehrere Trace-Subroutinen desselben ICE teilen ihr Budget nicht sequenziell.
4. Engine -> PlayerView -> DTO -> AI ist nicht end-to-end gegen die neuen Trace-Felder abgesichert.
5. High-Payoff und generische Trace-Folgen fehlen auf Top-Level-Decision-Ebene.
6. Prozess- und Final-Report müssen den tatsächlich ausgeführten Final-Green-Umfang präzisieren.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung präzise genug.

- Gesamtziel: Die Known-ICE-Trace-Hazard-Bewertung wird näher an die sichtbare Engine-Realität gebracht und die Aussagen aus Prozess/Report werden präzisiert.
- Reihenfolge: erst Modellkorrekturen, dann echte Integrationstests, dann Berichtskorrektur.
- In Scope: `packages/ai/src/visible-run-analysis.ts`, RunTarget-/Decision-Tests, Engine/DTO-vertragliche Tests, Prozess-/Review-Dokumente und Juni-Projektlog.
- Nicht-Ziele: keine neue LegalAction-Erzeugung, keine Engine-Regeländerung, keine FullState-/Hidden-Info-Projektion, keine UI-Änderung.
- Abnahme: Die Review-Gegenbeispiele sind testbar korrigiert, fokussierte AI-/Engine-/Shared-Checks sind grün, bekannte Baseline-rote Tests werden korrekt eingeordnet.

## Gesamtziel

Eine side-safe Known-ICE-Trace-Hazard-Bewertung, die sichtbare Kosten und Garantien korrekt unterscheidet:

```text
Bekannte/rezzed ICE dürfen aus sichtbaren RunQuotes bewertet werden.
Trace-Vermeidung wird nicht pauschal über baseTraceStrength gerechnet, sondern berücksichtigt sichtbare Base-Link-Kosten, sichtbare Corp-Bid-Kapazität und gemeinsam verbrauchtes Budget bei mehreren Trace-Subroutinen.
Die KI darf Risiko weiterhin akzeptieren, wenn ein sichtbarer High-Payoff dies rechtfertigt.
```

## Annahmen

- Base-Link-Kosten werden bevorzugt aus CardImplementation-Ability-Daten der sichtbaren Runner-Karte gelesen; falls nicht verfügbar, aus konservativen bekannten CardDefinition-/Mechanikdaten.
- Base-Link-Nebenwirkungen werden als Risiko-/Blockersignal geführt, wenn sie die Run-Fortsetzung gefährden können.
- Sichtbare Corp-Bid-Kapazität ist eine Obergrenze aus `opponent.credits` plus offensichtlich sichtbaren Ressourcen im PlayerView; nicht sichtbare private Corp-Entscheidungen bleiben unbekannt.
- Sequenzielle Budgetierung muss mindestens Credits, Trace-Credit-Pools und Breaker-Stärke innerhalb desselben ICE berücksichtigen.
- Bestehende Shell-Traders-Baselinefehler sind nicht Teil dieses Prozesses.

## Nicht-Ziele

- Keine vollständige Trace-Simulation mit echten Bid-Choices.
- Keine Vorhersage, ob die Corp tatsächlich bietet.
- Keine Hidden-Info-Nutzung aus Full GameState.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine neue Kartenfreigabe.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität.
- AI wählt ausschließlich vorhandene `LegalActions`.
- PlayerView, DTO, Debug und Tests dürfen keine verdeckten Corp-Daten leaken.
- CardDefinition-/Implementation-Fallbacks bleiben auf bereits sichtbare bekannte/rezzed Karten oder eigene bekannte Runner-Rig-Karten beschränkt.
- Diagnostic-Evidence bleibt side-safe und beschreibt Kategorien, sichtbare Werte und sichtbare Kartentitel.

## Automatische Fehlerbehandlung

- Wenn Base-Link-Kosten nicht sicher bestimmbar sind, wird der Kandidat nicht als kostenlos garantierte Vermeidung behandelt.
- Wenn sichtbare maximale Corp-Kapazität nicht garantiert deckbar ist, bleibt ein Risiko-Penalty erhalten, auch wenn die Trace-Basis bezahlbar ist.
- Wenn mehrere Trace-Subroutinen das Budget überziehen, werden spätere Hazards als nicht garantiert vermeidbar markiert.
- Wenn High-Payoff sichtbar ist, darf die Recommendation `run_now` bleiben, aber Diagnostics müssen Risiko und Tradeoff zeigen.

## Sicherheitsblocker

Stoppen und Blocker dokumentieren, wenn:

- die Lösung Zugriff auf Full GameState oder verdeckte Kartendaten bräuchte;
- AI neue LegalActions erzeugen müsste;
- Engine-Regeln oder `applyAction` geändert werden müssten;
- Base-Link-Kosten nur über fragile UI-Textanalyse lösbar wären;
- ein Konflikt mit laufenden `main`-Änderungen denselben Vertrag widersprüchlich definiert.

Removal Condition: Der Blocker ist entfernt, wenn die Bewertung über sichtbare PlayerView-/CardDefinition-/CardImplementation-/LegalAction-Daten generisch und testbar bleibt.

## State Machine

```text
process_prepared
  -> TRACEFIX-0_process_preflight
  -> TRACEFIX-1_base_link_costs
  -> TRACEFIX-2_corp_bid_capacity
  -> TRACEFIX-3_multi_trace_budget
  -> TRACEFIX-4_end_to_end_and_decision_matrix
  -> TRACEFIX-5_reports_and_final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `TRACEFIX-0` | Prozessartefakt und Preflight | Worktree/Branch existiert, Prozess ist versioniert, `git diff --check` grün | `docs(ai): define known ice trace review fix process` |
| `TRACEFIX-1` | Base-Link-Kosten und Side Effects | Access through Alpha 0/1 Credit wird korrekt bewertet; keine kostenlose Base-Link-Vermeidung mehr | `fix(ai): price visible base link trace support` |
| `TRACEFIX-2` | Sichtbare Corp-Bid-Kapazität | Hazards unterscheiden Basisdeckung und garantierte Deckung gegen sichtbares Corp-Maximum | `fix(ai): include visible corp trace bid capacity` |
| `TRACEFIX-3` | Mehrfach-Trace-Budget | Zwei Traces teilen Budget; Replicator/Breaker-Stärke wird sequenziell berücksichtigt | `fix(ai): sequence visible trace hazard budgets` |
| `TRACEFIX-4` | E2E- und Decision-Matrix | Echter Engine->PlayerView->DTO->AI-Test und Top-Level-Matrix für High-Payoff/Trace-Folgen bestehen | `test(ai): cover known trace hazard integration matrix` |
| `TRACEFIX-5` | Reports und Final Green | Prozess, Final Report und Projektlog sind korrigiert; finale Checks sind dokumentiert | `docs(ai): correct known ice trace review reports` |

## Paketstatus

- `TRACEFIX-0`: abgeschlossen mit Commit `f40de7a8` (`docs(ai): define known ice trace review fix process`).
- `TRACEFIX-1`: abgeschlossen. Base-Link-Kandidaten werden aus Engine-CardImplementation-Quotes bewertet; `Access through Alpha` zählt bei 0 Credits nicht mehr als vermeidbar, bei 1 Credit mit Kosten 1, und `Submarine Uplink` wird wegen Jack-out nicht als access-sichere Vermeidung gezählt.
  - Checks: `packages/ai` `visible-run-analysis.test.ts` grün, `packages/ai` Typecheck grün, `packages/engine` Typecheck grün.
- `TRACEFIX-2`: abgeschlossen. Trace-Hazards unterscheiden jetzt Basisdeckung (`baseTraceCovered`) von garantierter Deckung gegen sichtbare Corp-Credits (`visibleCorpMaxTraceCovered`) und führen `visibleCorpBidCapacity` sowie garantierte Max-Kosten als Evidence.
  - Checks: `packages/ai` `visible-run-analysis.test.ts` + `runner-run-target-evaluation.test.ts` grün, `packages/ai` Typecheck grün.
- `TRACEFIX-3`: abgeschlossen. Mehrere Trace-Subroutinen werden innerhalb desselben bekannten ICE gegen fortgeschriebene Credits bewertet; Break-Affordability nutzt das laufende Restbudget, damit Replicator-/Breaker-Kosten nicht mehrfach aus demselben Budget gezählt werden.
  - Checks: `packages/ai` `visible-run-analysis.test.ts` + `runner-run-target-evaluation.test.ts` grün, `packages/ai` Typecheck grün.
- `TRACEFIX-4`: abgeschlossen. Ein echter Engine-`getPlayerView()`-zu-DTO-zu-Runner-AI-Test sichert `baseTraceStrength` und `traceSuccessEffect`; Top-Level-Entscheidungen decken Remote-Agenda-Override sowie `add_counter`, `net_damage`, `end_run_and_run_lock`, `end_run_trash_program_and_run_lock` und `trash_runner_resource_and_add_tag` ab.
  - Checks: `packages/ai` `known-ice-run-risk.test.ts` + `visible-run-analysis.test.ts` + `runner-run-target-evaluation.test.ts` + `runner-run-target-guidance.test.ts` grün, `packages/ai` Typecheck grün.
- `TRACEFIX-5`: abgeschlossen. Abschlussreport, Vorgänger-Report-Addendum und Juni-Projektlog ordnen Feature-spezifisches Grün und vollständiges AI-Baseline-Rot sauber ein; `tactical-plans.test.ts` wurde separat ausgeführt.
  - Checks: `packages/ai` `tactical-plans.test.ts` grün; `@netgrid/ai test` baseline-rot mit ausschließlich vier bekannten Shell-Traders-Fixture-Fehlern; `git diff --check` vor Paketcommit.

## Paketdetails

### TRACEFIX-0: Prozessartefakt und Preflight

Arbeit:

- Hauptworkspace und vorhandene Worktrees prüfen.
- Worktree `C:\Projekte\NETGRID_AI_KNOWN_ICE_TRACE_REVIEW_FIX` auf Branch `codex/ai-known-ice-trace-review-fix` anlegen.
- Dieses Prozessartefakt erstellen.

Checks:

```bash
git diff --check
git status --short
```

### TRACEFIX-1: Base-Link-Kosten und Side Effects

Arbeit:

- Base-Link-Kandidaten aus sichtbaren eigenen Runner-Karten mit Linkwert, Aktivierungskosten und Side-Effect-Kategorie modellieren.
- `Access through Alpha` bei 0 Credits nicht als vermeidbar werten.
- Bei 1 Credit die Aktivierungskosten als Vermeidungskosten zählen.
- Side effects wie `Submarine Uplink` als nicht kostenlos/risikofrei behandeln.

Checks:

```bash
corepack pnpm exec vitest run src/visible-run-analysis.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
git diff --check
```

### TRACEFIX-2: Sichtbare Corp-Bid-Kapazität

Arbeit:

- Sichtbare Corp-Trace-Bid-Kapazität in der Hazard-Bewertung berechnen.
- Evidence-Felder `baseTraceCovered`, `visibleCorpMaxTraceCovered`, `visibleCorpBidCapacity` hinzufügen.
- Nicht garantierte Vermeidbarkeit als Risiko beibehalten.

Checks:

```bash
corepack pnpm exec vitest run src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
git diff --check
```

### TRACEFIX-3: Mehrfach-Trace-Budget

Arbeit:

- Trace-Hazards sequenziell pro ICE und Budgetzustand bewerten.
- Gemeinsame Credits/Trace-Pools und Breaker-Stärke über mehrere Trace-Subroutinen fortschreiben.
- Tests für zwei Traces, Replicator und kopierte Trace-Subroutine ergänzen.

Checks:

```bash
corepack pnpm exec vitest run src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
git diff --check
```

### TRACEFIX-4: E2E- und Decision-Matrix

Arbeit:

- Echtes GameState-Szenario: rezzed `Hunter` -> `getPlayerView()` -> `buildAiDecisionInputDto()` -> `chooseRunnerAction()` -> `gain_credit`.
- Sanitization explizit auf `baseTraceStrength` und `traceSuccessEffect` prüfen.
- Top-Level-Test für bekannte Remote-Agenda + Hunter bleibt Run.
- Matrix für `add_counter`, `net_damage`, `end_run_and_run_lock`, `end_run_trash_program_and_run_lock`, `trash_runner_resource_and_add_tag`.

Checks:

```bash
corepack pnpm exec vitest run src/known-ice-run-risk.test.ts src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts src/runner-run-target-guidance.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
git diff --check
```

### TRACEFIX-5: Reports und Final Green

Arbeit:

- `docs/architecture/ai/ai-known-ice-run-risk-process-2026-06-23.md` und Final Report präzisieren.
- Dokumentieren, dass Feature-spezifische Checks grün sind und vollständiges AI-Paket baseline-rot war.
- `tactical-plans.test.ts` separat ausführen und Ergebnis dokumentieren.
- Juni-Projektlog bei Relevanz ergänzen.

Checks:

```bash
corepack pnpm exec vitest run src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec vitest run src/known-ice-run-risk.test.ts src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts src/runner-run-target-guidance.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
corepack pnpm --filter @netgrid/shared typecheck
corepack pnpm --filter @netgrid/engine typecheck
git diff --check
git status --short
```

## Verifikationsregeln

- Nach jedem Codepaket fokussierte Tests und AI-Typecheck.
- Bei Shared-/Engine-Vertragserweiterung zusätzlich Shared-/Engine-Typecheck.
- `git diff --check` vor jedem Paketcommit.
- Keine roten testspezifischen Assertions lockern, außer die Dokumentation wird präzisiert und der Codevertrag bleibt strenger.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-known-ice-trace-review-fix`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_KNOWN_ICE_TRACE_REVIEW_FIX`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Ein Commit pro Paket.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite TRACEFIX-0 bis TRACEFIX-5 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und docs/architecture/ai/ai-known-ice-trace-review-fix-process-2026-06-23.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_KNOWN_ICE_TRACE_REVIEW_FIX auf Branch codex/ai-known-ice-trace-review-fix.
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

- Alle sechs Review-Punkte sind umgesetzt oder mit enger Removal Condition blockiert.
- Known-ICE-Trace-Hazard-Tests decken Kosten, Corp-Bid-Spanne, mehrfaches Budget, E2E-DTO und Top-Level-Entscheidung ab.
- Prozess-/Final-Report-Aussagen sind auf den tatsächlichen Verifikationsumfang korrigiert.
- Keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung.
- Paketcommits liegen auf `codex/ai-known-ice-trace-review-fix`.
- Arbeitsbranch ist lokal nach `main` integriert und der Worktree entfernt.

## Abschlussstand 2026-06-23

TRACEFIX-0 bis TRACEFIX-5 sind umgesetzt. Der Fix bleibt AI-intern beziehungsweise DTO-/Engine-Quote-read-only:

- `Access through Alpha` wird bei 0 Credits nicht mehr als kostenlose Trace-Vermeidung gewertet und kostet bei 1 Credit korrekt 1.
- `Submarine Uplink` wird wegen öffentlicher Jack-out-Nebenwirkung nicht als access-sichere Vermeidung gezählt.
- `visibleCorpBidCapacity` trennt Basisdeckung von garantierter Deckung gegen sichtbares Corp-Maximum.
- Mehrere Trace-Subroutinen teilen das Restbudget innerhalb desselben ICE.
- Engine-`getPlayerView()` -> DTO -> Runner-AI ist für rezzed `Hunter` gegen Verlust von `baseTraceStrength` und `traceSuccessEffect` abgesichert.
- Top-Level-Decision-Regressionen decken High-Payoff-Remote-Agenda und generische Trace-Erfolgseffekte ab.

Feature-spezifische Checks sind grün. Der vollständige `@netgrid/ai`-Paketlauf bleibt baseline-rot mit vier bekannten Shell-Traders-Fixture-Tests in `packages/ai/src/index.test.ts`; das ist außerhalb dieses Review-Fixes dokumentiert.
