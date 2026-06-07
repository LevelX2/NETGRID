# Activities-Inbox AI Run/MU Automation Process 2026-06-07

## Status

`active_process`

## Quelle/Vorgabe

Nutzerauftrag vom 2026-06-07: Die Pakete in `docs/activities/inbox/` mit dem Skill `paketprozess-worktree-goal` abarbeiten.

Relevante Inbox-Pakete:

- `act-2026-06-07-ai-run-payoff-signal-inventory`
- `act-2026-06-07-ai-run-payoff-hints-consumer`
- `act-2026-06-07-ai-run-payoff-regression-coverage`
- `act-2026-06-07-ai-mu-install-action-surface-audit`
- `act-2026-06-07-ai-program-sacrifice-evaluation`
- `act-2026-06-07-ai-mu-pressure-memory-support`
- `act-2026-06-07-ai-mu-sacrifice-regression-debug`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: alle geeigneten Inbox-Pakete mit `status: inbox` sequenziell nach Abhängigkeiten bearbeiten.
- Endzustand: abgeschlossene Pakete liegen in `docs/activities/done/`, jedes Paket hat Ergebnisnotiz, Checks, Artefakte und einen lokalen Commit.
- Reihenfolge: aus `blockedBy`-Abhängigkeiten ableitbar.
- In-Scope: AI-Run-Payoff-Signale, RunTargetEvaluation-Consumer, Program-Sacrifice-Bewertung, MU-Pressure und fokussierte Regressionen.
- Nicht-Ziele: keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Hidden-Info-, Decklegal-, Formatlegal- oder Protheus-AI-Freigabe.
- Verifikation: paketbezogene AI-Checks, `git diff --check` und finale Gesamtprüfung.
- Branch-/Worktree-Erwartung: Umsetzung im Worktree `C:\Projekte\NETGRID_ACTIVITIES_INBOX_AI_RUN_MU` auf Branch `codex/activities-inbox-ai-run-mu`; lokaler Merge nach `main` nur nach vollständigem Abschluss.

## Gesamtziel

Alle sieben AI-Run/MU-Activity-Pakete aus der Inbox kontrolliert abschließen, ohne Regelautorität, Hidden-Info-Grenzen oder deterministische Engine-Verträge auszuweiten.

## Annahmen

- Der Hauptworkspace enthält parallele uncommitted Änderungen und wird bis zum finalen Merge nicht bearbeitet.
- Der Branch startet vom lokalen `main`-HEAD `273091ae`.
- Die vorhandenen AI-Hints, Taktiksignale, PlayerViews und LegalActions sind die erlaubten Eingänge für AI-Bewertungen.
- Konzeptpakete dürfen Review-Artefakte erzeugen und Folgeempfehlungen dokumentieren, aber keine verdeckten Daten oder neue Produktfreigaben schaffen.

## Nicht-Ziele

- Keine neue Engine-Regel.
- Keine eigene Legalitätsberechnung in der KI.
- Keine verdeckten Korp-Daten in AI-Input, Debug, Evidence oder Tests.
- Keine Runtime-Datenbank-, Browser-E2E- oder UI-Arbeit, solange ein Paket das nicht ausdrücklich verlangt.
- Keine automatische Remote-Integration.

## Controller-Invarianten

- Genau ein Activity-Paket ist aktiv.
- `blockedBy`-Abhängigkeiten werden respektiert.
- Paketdateien werden beim Start von `inbox/` nach `in-progress/` verschoben und beim Abschluss nach `done/`.
- Jede finale Entscheidung bleibt LegalActions-/pendingChoice-basiert.
- Debug-/Evidence-Ausgaben bleiben side-safe und knapp.
- Änderungen bleiben auf das aktuelle Paket begrenzt.
- Nach jedem Paketabschluss gibt es einen lokalen Commit.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktuellen Paket eng debuggt.
- Wenn eine Anforderung nur durch Engine-, LegalAction- oder Hidden-Info-Änderung erfüllbar wäre, wird das Paket blockiert dokumentiert.
- Wenn ein Folgepaket nötig ist, wird es als kleiner Scope benannt statt in das aktuelle Paket gezogen.
- Bei Git-Konflikten werden beide fachlichen Intentionen gelesen und erhalten, soweit kompatibel.

## Sicherheitsblocker

Sofort stoppen und Blocker im aktiven Paket dokumentieren, wenn eine Umsetzung:

- verdeckte Karten, gegnerische Hand-/Stackinhalte, FullState oder private Payloads in AI-Debug/Evidence projizieren müsste;
- `applyAction`, LegalAction-Erzeugung, Replay oder StateHash ändern müsste, obwohl das Paket dies ausschließt;
- Protheus-Karten implizit `ai_supported`, `deck_legal` oder `format_legal` setzen würde;
- die finale AI-Auswahl außerhalb von `input.legalActions` oder `pendingChoice.options` erzeugen würde.

## State Machine

1. `preflight`: Prozessartefakt erstellen und committen.
2. `select_next_package`: Inbox nach Abhängigkeiten und Priorität prüfen.
3. `claim_package`: Paket nach `in-progress/` verschieben, Frontmatter aktualisieren.
4. `implement_or_review`: Scope umsetzen oder Review-Artefakt erstellen.
5. `verify_package`: fokussierte Checks und `git diff --check`.
6. `complete_package`: Paket nach `done/`, Ergebnisnotiz, Commit.
7. `repeat_or_finalize`: nächstes Paket oder finale Prüfung.
8. `integrate`: Arbeitsbranch lokal nach `main` mergen, Worktree entfernen.

## Paketfolge

1. `act-2026-06-07-ai-run-payoff-signal-inventory`
2. `act-2026-06-07-ai-run-payoff-hints-consumer`
3. `act-2026-06-07-ai-run-payoff-regression-coverage`
4. `act-2026-06-07-ai-mu-install-action-surface-audit`
5. `act-2026-06-07-ai-program-sacrifice-evaluation`
6. `act-2026-06-07-ai-mu-pressure-memory-support`
7. `act-2026-06-07-ai-mu-sacrifice-regression-debug`

## Paketdetails

### AI-RUN-PAYOFF-SIGNAL-INVENTORY

- Ziel: Inventar serverbezogener Run-/Access-Payoff-Signale und fehlender AI-Hints.
- Arbeit: bestehende Taktiksignale, AI-Hints und relevante aktive Runner-Karten prüfen.
- Kernartefakte: Review unter `docs/reviews/ai/`.
- Checks: Dokumentprüfung und `git diff --check`.
- Done-Gate: Kartenfamilien, Signallage, fehlende Signale und Folgeempfehlungen sind nachvollziehbar dokumentiert.
- Commit: `Document AI run payoff signal inventory`

### AI-RUN-PAYOFF-HINTS-CONSUMER

- Ziel: installierte Payoff-Karten side-safe in `RunnerRunTargetEvaluation` berücksichtigen.
- Arbeit: enger Consumer, moderate Boni/Mali, Evidence.
- Kernartefakte: AI-Quellen und Tests.
- Checks: `corepack pnpm --filter @netgrid/ai typecheck`; fokussierte RunTargetEvaluation-/TacticalGoal-Tests; `git diff --check`.
- Done-Gate: HQ-/F&E-/Remote-Payoffs wirken ohne Legalitätserzeugung und ohne Hidden-Info-Leak.
- Commit: `Consume installed run payoff hints in AI target scoring`

### AI-RUN-PAYOFF-REGRESSION-COVERAGE

- Ziel: neue Run-Payoff-Auswertung durch Regressionen absichern.
- Arbeit: fokussierte Tests für Bonus, Malus, Cap, Dämpfung, No-Legality und redigierte Evidence.
- Kernartefakte: AI-Testdateien.
- Checks: empfohlene AI-Testauswahl und `git diff --check`.
- Done-Gate: relevante AI-Tests grün.
- Commit: `Cover AI run payoff scoring regressions`

### AI-MU-INSTALL-ACTION-SURFACE-AUDIT

- Ziel: prüfen, ob die KI MU-Verdrängung vor Programminstallation sieht.
- Arbeit: LegalAction-, ActionSemanticCandidate-, pendingChoice- und PlayerView-Surface prüfen.
- Kernartefakte: Review unter `docs/reviews/ai/`.
- Checks: Dokumentprüfung und `git diff --check`.
- Done-Gate: verfügbare und fehlende side-safe MU-/Displacement-Felder sind dokumentiert.
- Commit: `Document AI MU install action surface audit`

### AI-PROGRAM-SACRIFICE-EVALUATION

- Ziel: Programme vor MU-Trash bewusst bewerten und Installationen mit kritischem Opfer abwerten.
- Arbeit: kleine Bewertungsroutine, Penalty, side-safe Evidence, Choice-Grenze.
- Kernartefakte: AI-Quellen und Tests.
- Checks: `corepack pnpm --filter @netgrid/ai typecheck`; fokussierte AI-Tests; `git diff --check`.
- Done-Gate: kritische Programme werden geschützt, Low-Value-Opfer bleiben bei klarer Lücke möglich.
- Commit: `Evaluate AI program sacrifice costs`

### AI-MU-PRESSURE-MEMORY-SUPPORT

- Ziel: Memory-Support bei voller/fast voller MU dynamisch aufwerten.
- Arbeit: MU-Pressure-Assessment, Memory-/Hosting-/Protection-Scoring, Economy-Fallback.
- Kernartefakte: AI-Quellen und Tests.
- Checks: `corepack pnpm --filter @netgrid/ai typecheck`; fokussierte AI-Tests; `git diff --check`.
- Done-Gate: Memory-Hardware wird nur bei echtem MU-Druck bevorzugt, Debug nennt side-safe Gründe.
- Commit: `Prioritize AI memory support under MU pressure`

### AI-MU-SACRIFICE-REGRESSION-DEBUG

- Ziel: MU-/Program-Sacrifice-Logik durch Tests und Debug-Evidence absichern.
- Arbeit: Regressionen für kritische Breaker, Payoff-Programme, Low-Value-Opfer, Memory-Alternative und Choice-Grenze.
- Kernartefakte: AI-Testdateien.
- Checks: empfohlene AI-Testauswahl und `git diff --check`.
- Done-Gate: Tests beweisen Schutz, erlaubte Opfer und redigierte Evidence.
- Commit: `Cover AI MU sacrifice regressions`

## Verifikationsregeln

- Dokumentpakete: `git diff --check` plus Review der erzeugten Artefakte.
- AI-Implementierungspakete: mindestens `corepack pnpm --filter @netgrid/ai typecheck` und passende fokussierte Vitest-Dateien.
- Finale Prüfung: `corepack pnpm --filter @netgrid/ai typecheck`, relevante AI-Testdateien und `git diff --check`.
- Nicht ausgeführte Checks müssen im Paket und Abschlussbericht mit Grund genannt werden.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_ACTIVITIES_INBOX_AI_RUN_MU`
- Arbeitsbranch: `codex/activities-inbox-ai-run-mu`
- Hauptworkspace: `C:\Projekte\NETGRID`
- `main` bleibt lokaler Integrationsbranch.
- Keine fremden Hauptworkspace-Änderungen stagen oder revertieren.
- Nach jedem Paket nur paketbezogene Änderungen stagen.
- Nach Abschluss aller Pakete `main` in den Arbeitsbranch integrieren, finale Checks ausführen und lokal nach `main` mergen.
- Push oder Pull Request nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite Activities-Inbox AI Run/MU Automation 2026-06-07 vollständig und sequenziell von AI-RUN-PAYOFF-SIGNAL-INVENTORY bis AI-MU-SACRIFICE-REGRESSION-DEBUG ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis-Startseiten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ACTIVITIES_INBOX_AI_RUN_MU auf Branch codex/activities-inbox-ai-run-mu. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Alle sieben Pakete sind erledigt oder ein Blocker ist sauber dokumentiert.
- Für jedes erledigte Paket existiert ein Commit.
- Finale Checks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Hauptworkspace-Status ist transparent berichtet, inklusive fremder uncommitted Änderungen.
