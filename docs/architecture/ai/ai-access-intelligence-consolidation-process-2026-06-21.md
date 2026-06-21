# AI Access Intelligence Consolidation Process

Status: `prepared_for_execution`

Quelle/Vorgabe: Ergebnisanalyse `Prüfungsergebnis` vom 2026-06-21 zur bereits abgeschlossenen MAT5-Serie und den verbleibenden Access-Intelligence-Schwachstellen.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Paketfolge, Zielmodule, Nicht-Ziele, Sicherheitsgrenzen, Checks und FINAL-GREEN sind benannt. Datumsangaben aus der Quelle mit `2026-06-14` werden für neue Artefakte auf den aktuellen Projekttag `2026-06-21` aktualisiert.

## Gesamtziel

AI-ACCESS-0 bis AI-ACCESS-19 sequenziell umsetzen, je Paket verifizieren und committen, FINAL-GREEN ausführen, den Arbeitsbranch lokal nach `main` integrieren, `main` erneut prüfen, den Worktree entfernen und das Goal erst danach abschließen.

## Annahmen

- MAT5 ist Teil des aktuellen `main`; die neue Serie baut darauf auf.
- Alte Root-Importpfade bleiben zunächst über Fassaden kompatibel.
- Access-Intelligence bleibt AI-intern und LegalActions-only.
- Wenn ein vorgeschlagenes Zielmodul schon in ähnlicher Form existiert, wird es erweitert statt dupliziert.

## Nicht-Ziele

- Keine Engine-Regeländerungen.
- Keine neuen LegalActions oder PlayerAction-Verträge.
- Keine Änderungen an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Allowlist-Erweiterung.
- Keine produktive TargetChoice-, RemoteContest- oder Proteus-Aktivierung.
- Kein Big-Bang-Verschieben aller Access-Dateien; Root-Fassaden dürfen bleiben.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI reicht nur aus `LegalActions` abgeleitete `PlayerActions` ein.
- Access-Projektionen und Outcome-Memory sind side-safe und speichern keinen Engine-State.
- Dry-Run-Ausgaben erzeugen keine `selectedChoices` oder `selectedTargets`.
- Evidence bleibt Debug-/Reportmaterial, nicht primäre Planlogik.

## Automatische Fehlerbehandlung

Bei roten Tests wird die betroffene Datei gelesen, die Ursache eng behoben, der Einzeltest wiederholt und erst danach der relevante Paketcheck sowie der vollständige AI-Lauf ausgeführt. Kein `test.skip`, kein `test.only`, keine Testlöschung und keine pauschale Assertion-Lockerung.

## Sicherheitsblocker

Blocker sind Hidden-Info-Leakage, nicht side-safe Memory-Inhalte, neue Engine-Regelautorität, LegalAction-Erzeugung aus AI-Modulen, widersprüchliche Access-Entscheidungsverträge oder ein fachlicher Konflikt zwischen Pre-Run-Projektion und tatsächlicher Engine-Access-Logik, der nicht mit vorhandenen öffentlichen Daten lösbar ist.

## State Machine

`prepared_for_execution` -> `worktree_created` -> `packages_in_progress` -> `final_green` -> `merged_to_main` -> `worktree_removed` -> `complete`

## Paketfolge

1. `AI-ACCESS-0`: Preflight und aktuelle Basis.
2. `AI-ACCESS-1`: Gemeinsamer Access-Typvertrag.
3. `AI-ACCESS-2`: Commitment-Gründe fachlich korrigieren.
4. `AI-ACCESS-3`: AccessDecision-Invarianten.
5. `AI-ACCESS-4`: RemoteRootValueProjection V2.
6. `AI-ACCESS-5`: Remote Trash Spendability Quote.
7. `AI-ACCESS-6`: Gemeinsame ReservePolicy verwenden.
8. `AI-ACCESS-7`: Multi-Root Access Candidate Evaluation.
9. `AI-ACCESS-8`: Projected Commitment und Observed Outcome trennen.
10. `AI-ACCESS-9`: Persistentes AccessOutcomeMemory.
11. `AI-ACCESS-10`: Remote-Fingerprint und Invalidierung.
12. `AI-ACCESS-11`: Projection-vs-Outcome Feedback.
13. `AI-ACCESS-12`: TacticalPlans konsumieren strukturierte Access-Daten.
14. `AI-ACCESS-13`: RunnerRunTargetEvaluation anbinden.
15. `AI-ACCESS-14`: TargetChoice Access Dry-Run angleichen.
16. `AI-ACCESS-15`: Real-Engine Access Corpus.
17. `AI-ACCESS-16`: Selfplay Access-Loop Detector.
18. `AI-ACCESS-17`: `index.ts` Access-Schnitt.
19. `AI-ACCESS-18`: Import- und Export-Grenzen.
20. `AI-ACCESS-19`: Entwicklerregel und Abschlussbericht.
21. `FINAL-GREEN`: vollständige Paket- und Main-Verifikation.

## Paketdetails

Die Paketdetails folgen der Quelle. Je Paket werden die dort genannten Kernartefakte erstellt oder erweitert, paketnahe Tests ausgeführt, `@netgrid/ai typecheck` und `git diff --check` geprüft und ein Commit mit der vorgeschlagenen Message erstellt.

## Verifikationsregeln

Paketchecks sind mindestens die in der Quelle genannten Vitest-Läufe plus `@netgrid/ai typecheck` und `git diff --check`. FINAL-GREEN umfasst:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
```

Falls Engine-, Server- oder Web-Dateien berührt werden, kommen die entsprechenden Paket-Tests und Typechecks hinzu.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-access-intelligence-consolidation`
- Worktree: `C:\Projekte\NETGRID_AI_ACCESS_INTELLIGENCE_CONSOLIDATION`
- Der Hauptworkspace wird nach dem Prozessartefakt nur für den finalen Merge genutzt.
- Kein pauschales `git add .`.
- Fremde Änderungen werden nicht zurückgesetzt.
- Push oder PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite AI Access Intelligence Consolidation vollständig und sequenziell von AI-ACCESS-0 bis AI-ACCESS-19 plus FINAL-GREEN ab. Lies Projektanweisungen, Agentenvorgabe und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_ACCESS_INTELLIGENCE_CONSOLIDATION` auf Branch `codex/ai-access-intelligence-consolidation`. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Committe jedes abgeschlossene Paket. Stoppe nur bei Sicherheitsblocker. Nach Abschluss final verifizieren, lokal nach `main` mergen, `main` prüfen, Worktree entfernen und Goal erst danach abschließen.

## Abschlusskriterien

- AI-ACCESS-0 bis AI-ACCESS-19 sind abgeschlossen und committed.
- FINAL-GREEN ist grün oder ein Sicherheitsblocker ist dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- `main` wurde final geprüft.
- Der Worktree wurde entfernt.

