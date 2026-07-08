# Runner-Plancontroller Review-Followups Prozess 2026-07-08

Status: abgeschlossen, lokaler Merge nach `main` vorbereitet

## Quelle/Vorgabe

- Nutzerauftrag vom 2026-07-08: Rückmeldungen prüfen und abgeleitete Anpassungen mittels `paketprozess-worktree-goal` umsetzen.
- Feedbackdatei `d534f19d-1d0a-4ea1-8e46-27cf7ab46c51/pasted-text.txt`: fachliche Lücken der Runner-Planebene.
- Feedbackdatei `e711f5f9-b96e-4e71-9453-7f12f62c0103/pasted-text.txt`: Code-Review zu Plancontroller, RunnerRunPlan, R&D-Memory und Tag-Survival.
- Vorlaufartefakte: `docs/architecture/ai/runner-plan-controller-process-2026-07-07.md`, `docs/reviews/ai/runner-plan-controller-final-report-2026-07-07.md`.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Die Rückmeldungen enthalten konkrete Runtime-Dateien, Fehlerbilder, Prioritäten und fachliche Grenzen. Größere Erweiterungen ohne engen Akzeptanzpfad werden als Folgepunkte dokumentiert, nicht stillschweigend in dieses Paket gezogen.

## Gesamtziel

Die Runner-KI soll die nach dem Plancontroller-Cutover sichtbar gewordenen harten Lücken schließen:

- R&D-Zugriffstiefe darf nicht aus unsicheren harten Karten-IDs abgeleitet werden.
- Der aktive RunnerRunPlan darf sichtbare Survival-Subroutinen nicht ignorieren, nur weil kein End-the-run droht.
- Break-Sequenzen müssen konkrete relevante Subroutinen adressieren.
- Access-Reserve für Steal-/Trash-Payoffs darf nicht inert bleiben.
- Tag-Entfernung in gefährlichen Zuständen muss als Planlinie vor normalen Off-plan-Scores sichtbar werden.

## Annahmen

- Alle Änderungen bleiben AI-intern und wählen weiter nur Engine-`LegalActions`.
- Keine neuen Karten werden freigeschaltet.
- Keine Engine-Regeländerung, keine PlayerView- oder Replay-Vertragsänderung.
- Falls eine Review-Idee ohne vorhandene side-safe Daten nicht belastbar umsetzbar ist, wird sie als Folgepunkt dokumentiert.

## Nicht-Ziele

- Kein vollständiger neuer Runner-Planner.
- Keine vollständige Scout-/Success-Window-/ICE-Control-Planfamilie in diesem Prozess.
- Keine globale Neukalibrierung aller Plan- und Scorewerte.
- Kein Push, kein Pull Request, keine Remote-Integration.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Legalitäts- und Regelautorität.
- Runner-KI nutzt nur `PlayerView`, side-filtered PublicEvents, LegalActions und explizit erlaubte Metadata.
- Keine Hidden-Info-Ausweitung in Debug, Replays, PlayerViews, PublicEvents oder KI-Inputs.
- Planebene ist Mapping- und Priorisierungsschicht, keine LegalAction-Erzeugung.
- Jeder Paketabschluss braucht fokussierte Tests oder begründete engere Checks plus `git diff --check`.

## Automatische Fehlerbehandlung

- Bei rotem Test wird eng im aktuellen Paket debuggt.
- Bei fachlichem Konflikt zwischen Review-Ziel und LegalAction-Vertrag wird ein Blocker mit Removal Condition dokumentiert.
- Bestehende fremde Änderungen werden nicht revertet.
- Bei Merge-Konflikten werden beide Intentionen gelesen und, wenn kompatibel, erhalten.

## Sicherheitsblocker

- Eine Lösung bräuchte verdeckte Korp-Hand-, R&D-, Remote- oder Stackdaten.
- Eine benötigte Aktion ist keine aktuelle Engine-`LegalAction`.
- Eine Subroutine-Zuordnung ist nicht side-safe aus LegalAction/PlayerView ableitbar.
- Der RunPlan müsste eine Regelentscheidung treffen, die `applyAction` nicht revalidiert.

## State Machine

1. Review-Scope dokumentieren.
2. R&D-Access-Depth korrigieren.
3. RunnerRunPlan-Survival- und Subroutine-Sequenzen korrigieren.
4. Access-Reserve aktivieren.
5. Tag-Survival-Plan ergänzen.
6. Abschlussbericht, Log, finale Checks, lokaler Merge nach `main`.

## Paketfolge

### RPF-0 Prozessartefakt und Review-Scope

Ziel: Prozess, Annahmen, In-Scope und Paketfolge festhalten.

Kernartefakt: dieses Dokument.

Checks: `git diff --check`.

Commit: `docs(ai): plan runner plan review followups`

### RPF-1 R&D-Access-Depth

Ziel: `known-central-access-payoff` darf R&D-Multiaccess nur aus semantisch belastbaren Access-Rollen beziehungsweise tatsächlichen Run-/Access-Payoff-Signalen ableiten. Reine Look-/Info-/Replacement-Effekte dürfen keinen falschen bekannten Multiaccess-No-Payoff erzeugen.

Kernartefakte:

- `packages/ai/src/known-central-access-payoff.ts`
- `packages/ai/src/known-central-access-payoff.test.ts`
- bei Bedarf `packages/ai/src/simulation/central-pressure-card.ts` oder bestehende Role-/Hint-Utilities.

Checks: fokussierte Known-Central-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): derive rd access depth from access semantics`

### RPF-2 RunnerRunPlan Survival- und Subroutine-Sequenzen

Ziel: Sichtbare Survival-Subroutinen wie Damage, Tags oder Program-Trash erzwingen Break-/Abort-Planung auch ohne ETR. Break-Sequenzen dürfen nicht beliebige billigste Subroutinen wählen, sondern müssen relevante Subroutine-Ziele adressieren.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-path-quote.ts`
- `packages/ai/src/runtime/runner-run-plan-path-quote.test.ts`
- `packages/ai/src/runtime/runner-run-plan-policy.test.ts`

Checks: RunPlan-PathQuote-/Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): require survival subroutine breaks in run plans`

### RPF-3 Access-Reserve

Ziel: `reserveForStealOrTrash`, `reservedCreditsForSteal` und `reservedCreditsForTrash` werden mit sichtbaren beziehungsweise side-safe projizierten Kosten gefüllt, statt immer null zu bleiben.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-start.ts`
- `packages/ai/src/runtime/runner-run-plan-access-policy.ts`
- zugehörige RunPlan-Access-Tests.

Checks: RunPlan-Memory-/Access-Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): reserve credits for runner run access payoff`

### RPF-4 Tag-Clear/Survival-Plan

Ziel: Tags und plausible Punish-/Survival-Fenster werden als eigene Runner-Planlinie abgebildet, damit `remove_tag` nicht nur globaler Score-Ausreißer bleibt und nicht von normaler Plan-Dominanz verdrängt wird.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/plans/tactical-plan-runner-plans.ts`
- `packages/ai/src/plans/tactical-plan-legal-action-mapping.ts` beziehungsweise Step-Matching.
- fokussierte Plan-/Ranking-Tests.

Checks: Plan-Mapping-/Semantic-Ranking-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): add runner tag survival tactical plan`

### RPF-5 Abschluss und Integration

Ziel: Final-Report, Wissenslog, kompletter fokussierter Verify-Lauf und lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/runner-plan-review-followups-final-2026-07-08.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`

Checks: alle Paketchecks erneut, `git status --short`, `git diff --check`, Merge nach `main`, Main-Checks.

Commit: `docs(ai): finalize runner plan review followups`

## Verifikationsregeln

- Fokussierte Unit-Tests pro Paket haben Vorrang vor breiten, langsamen Suites.
- `corepack pnpm --filter @netgrid/ai typecheck` ist Pflicht vor Abschluss jedes Codepakets.
- `git diff --check` ist Pflicht vor jedem Commit und nach finalem Merge.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_RUNNER_PLAN_REVIEW_FOLLOWUPS`
- Branch: `codex/runner-plan-review-followups`
- Hauptworkspace `C:\Projekte\NETGRID` bleibt bis zum finalen Merge unberührt.
- Jeder abgeschlossene Paketstand wird separat committed.
- Nach Abschluss wird der Arbeitsbranch lokal nach `main` gemerged.

## Controller-Prompt-Kern

`/Goal Arbeite Runner-Plancontroller-Review-Followups vollständig und sequenziell von RPF-0 bis RPF-5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, dieses Prozessartefakt und die zwei Nutzerfeedbackdateien. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RUNNER_PLAN_REVIEW_FOLLOWUPS auf Branch codex/runner-plan-review-followups. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket, dokumentiere Blocker mit Removal Condition und markiere das Goal erst nach erfolgreichem lokalen Merge und Main-Verify complete.`

## Abschlusskriterien

- Alle RPF-Pakete sind entweder umgesetzt und committed oder mit hartem Blocker dokumentiert.
- Finale Checks sind grün oder Abweichungen sind als bestehende, nicht paketbedingte Testschulden belegt.
- Branch ist lokal nach `main` integriert.
- Keine nicht klassifizierten Arbeitsdateien bleiben offen.

## Abschlussstand 2026-07-08

- RPF-1 umgesetzt: R&D-Access-Depth nutzt semantische R&D-Multiaccess-Rollen, Tactic-Signals und zielgerichtete `multiaccess`-Effekte statt harter Karten-ID-Liste.
- RPF-2 umgesetzt: RunnerRunPlan Required-Break-Sequenzen adressieren konkrete Subroutine-Indizes und behandeln sichtbare Damage-/Program-Trash-Survival-Routinen als Break-/Abort-Pflicht.
- RPF-3 umgesetzt: RunPlan-Start reserviert sichtbare oder aus Evidence side-safe projizierte Trash-Kosten getrennt in Steal-/Trash-Budgetfeldern.
- RPF-4 umgesetzt: `runner.clear_tags_or_survive` ist als TacticalPlan-Linie aktiv, wenn der Runner Tags hat, und mappt auf `tag.remove`.
- Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.
