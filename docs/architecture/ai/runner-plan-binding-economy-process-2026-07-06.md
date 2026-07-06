# Runner-Planbindung und Economy-Route Prozess 2026-07-06

Status: aktiv

Quelle/Vorgabe:

- Analyse des abgeschlossenen Matches `match_779a04a679f02d14` aus `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.
- Nutzerfreigabe vom 2026-07-06: planzentrierte Runner-KI-Fixes umsetzen.
- Skill-Vertrag: `netgrid-ai-spielanalyse-worktree` plus Paket-/Worktree-Disziplin aus `paketprozess-worktree-goal`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung.

Bestimmte Endzustände:

- Runner-KI verfolgt bei akutem Score-Remote einen Remote-Contest-Plan statt opportunistische Archives-/HQ-Runs zu bevorzugen.
- Economy-Aufbau wird aus Deckstrategie und sichtbaren legalen Möglichkeiten abgeleitet; reines `gain_credit` bleibt Fallback.
- Opportunistische zentrale Runs bleiben erlaubt, verdrängen aber keinen akuten Remote-Contest-Plan.
- Regressionstests prüfen echte Aktionswahl über die Runtime, nicht nur isolierte Helper.
- Ergebnis wird paketweise committed und lokal nach `main` integriert.

## Gesamtziel

Runner-KI so verbessern, dass sie mittelstufige Pläne setzt und verfolgt:

1. Economy-Route aus Deckstrategie, Rig, Handentwicklung und LegalActions ableiten.
2. Bei fortgeschrittenem Remote 1 einen konkreten Remote-Contest-Plan halten.
3. Coverage-, Probe- und Economy-Subziele an dieses Remote-Ziel zurückbinden.
4. Archives/HQ/R&D nur als definierte Interrupts erlauben.
5. Verhalten durch fokussierte Runtime-Regressionen absichern.

## Annahmen

- Die KI darf weiterhin nur side-sichere PlayerViews, PublicEvents, LegalActions und explizit erlaubte Metadaten verwenden.
- Die Rules Engine bleibt die einzige Regelautorität; es werden keine illegalen Aktionen konstruiert.
- Das betroffene Spiel liefert belastbare Evidence für Runner-KI in `human_corp_vs_runner_ai`.
- Bestehende Planer-, Semantic-Runtime- und Deck-Capability-Schichten sollen erweitert werden, nicht durch Match-Sonderregeln ersetzt werden.

## Nicht-Ziele

- Keine Engine-Regeländerung ohne klaren LegalAction-Blocker.
- Keine Hidden-Info-Heuristik über verdeckte Remote-, HQ-, R&D- oder Archives-Inhalte.
- Keine kartennamenspezifische Sonderregel für das analysierte Match.
- Kein Push und kein PR.

## Controller-Invarianten

- Jede gewählte Aktion muss aus `LegalActions` stammen.
- Planbindung darf nur sichtbare oder erlaubte Signale verwenden.
- Ein Remote-Contest-Plan darf opportunistische Runs blockieren, aber nicht irreversible Blocker ignorieren: leeres Remote, bekannter Nicht-Agenda-Zustand, unbezahlbarer Pfad ohne sinnvolle Vorbereitung oder fehlende LegalAction.
- Economy-Fallback `gain_credit` bleibt legaler Rückfall, wenn keine bessere Route verfügbar oder legal ist.
- Regressionstests müssen mindestens einen Fall prüfen, in dem Remote-Druck gewinnt, und mindestens einen Gegenfall, in dem ohne Remote-Druck zentrale Strategie erlaubt bleibt.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktiven Paket debuggt.
- Wenn eine erwartete LegalAction fehlt, wird kein KI-Workaround gebaut; stattdessen entsteht ein Blocker/Folgepaket.
- Wenn `main` beim finalen Merge kollidiert, werden Konflikte defensiv gelesen und nur fachlich kompatible Intentionen zusammengeführt.

## Sicherheitsblocker

- Lösung benötigt verdeckte Kartendaten.
- KI-Code würde Aktionen außerhalb der LegalActions erzeugen.
- Tests zeigen Hidden-Info-Leak, Replay-Instabilität oder Engine-Regelbruch.
- Finaler Merge nach `main` ist nicht kollisionsfrei oder fachlich unklar.

## State Machine

1. `preflight`: Vorgaben, Worktree und Branch prüfen.
2. `process`: Prozessartefakt anlegen und committen.
3. `evidence`: Match-Evidence und Regression-Scope dokumentieren und committen.
4. `economy`: deckstrategieabhängige Economy-Route implementieren und testen.
5. `remote`: Remote-Contest-Planbindung und Interrupt-Regeln implementieren und testen.
6. `verify`: fokussierte Tests, Typecheck und Diff-Check ausführen.
7. `finalize`: Final-Report, Wissenslog, Commits, Merge nach `main`, Nachprüfung.

## Paketfolge

### Paket P0: Prozessartefakt

Ziel: Ablauf und Sicherheitsregeln festhalten.

Arbeit:

- Prozess unter `docs/architecture/ai/` anlegen.
- Worktree/Branch dokumentieren.

Checks:

- `git diff --check`

Done-Gate:

- Prozessdokument committed.

Commit-Message:

- `docs(ai): document runner plan binding process`

### Paket P1: Spiel-Evidence und Regression-Scope

Ziel: Replay-Befunde und gewünschte Regressionen side-safe dokumentieren.

Arbeit:

- Evidence-Report unter `docs/reviews/ai/`.
- Relevante Decision-/StateVersion-Anker, Score-Komponenten und Fehlergruppen festhalten.
- Konkrete Akzeptanzkriterien für Economy- und Remote-Planbindung definieren.

Checks:

- `git diff --check`

Done-Gate:

- Evidence-Report committed.

Commit-Message:

- `docs(ai): capture runner plan binding evidence`

### Paket P2: Deckstrategieabhängige Economy-Route

Ziel: Economy-Aufbau als Planroute statt generischer Klick-Credit-Fallback.

Arbeit:

- Bestehende Deck-Capability-/Strategie- und Handentwicklungsdaten nutzen.
- LegalActions mit besserer Economy-Funktion bevorzugen, wenn sie zur Deckroute passen.
- `gain_credit` nur als Fallback oder kurzfristige Funding-Stufe.
- Debug-/Evidence-Signale so ergänzen, dass die Route sichtbar wird.

Checks:

- Fokussierte AI-Tests für Economy-Auswahl.
- `git diff --check`

Done-Gate:

- Tests grün; Paket committed.

Commit-Message:

- `fix(ai): route runner economy plans through deck strategy`

### Paket P3: Remote-Contest-Planbindung und Interrupts

Ziel: Remote 1 mit Score-Gefahr wird als aktiver Plan verfolgt.

Arbeit:

- Remote-Contest-Planpriorität und Planbindung gegenüber opportunistischen Archives-/HQ-Runs stärken.
- Coverage- und Funding-Subziele an den Remote-Plan binden.
- Opportunistische R&D-/HQ-Interrupts nur erlauben, wenn kein akuter Remote-Contest-Plan aktiv ist oder der Remote-Plan invalidiert wurde.
- Gegenfälle absichern.

Checks:

- Fokussierte Runtime-Tests für Remote-Druck, Archives-Block und zentrale Gegenfälle.
- `git diff --check`

Done-Gate:

- Tests grün; Paket committed.

Commit-Message:

- `fix(ai): keep runner contest plans over opportunistic runs`

### Paket P4: Finale Verifikation und Integration

Ziel: Änderung sauber abschließen und lokal nach `main` integrieren.

Arbeit:

- Final-Report unter `docs/reviews/ai/`.
- Wissenslog bei dauerhaftem Vertrag aktualisieren.
- Relevante Checks wiederholen.
- Arbeitsbranch lokal nach `main` mergen.
- Worktree nur entfernen, wenn sauber und integriert.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- Relevante fokussierte Tests.
- Wenn realistisch: `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`
- Nach Merge Status und Diff-Check auf `main`.

Done-Gate:

- Branch lokal in `main` integriert oder sauberer Blocker dokumentiert.

Commit-Message:

- `docs(ai): summarize runner plan binding fix`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_RUNNER_PLAN_BINDING_ECONOMY`
- Branch: `codex/ai-runner-plan-binding-economy`
- Hauptworkspace: `C:\Projekte\NETGRID`
- `main` ist lokaler Integrationsbranch.
- Kein Push/PR ohne Nutzerwunsch.
- Jedes Paket wird separat committed.

## Abschlusskriterien

- Alle freigegebenen Punkte sind umgesetzt oder als Blocker/Folgepunkt dokumentiert.
- Keine neue Hidden-Info- oder LegalAction-Grenzverletzung.
- Fokussierte Runtime-Regressionen decken Economy-Route und Remote-Planbindung.
- Arbeitsbranch ist lokal nach `main` integriert.
