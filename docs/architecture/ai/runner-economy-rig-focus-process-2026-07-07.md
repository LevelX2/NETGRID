# Runner Economy Rig Focus Process 2026-07-07

## Status

Umsetzung abgeschlossen auf Branch `codex/ai-runner-economy-rig-focus` im Worktree `C:\Projekte\NETGRID_AI_RUNNER_ECONOMY_RIG_FOCUS`; finale lokale Integration nach `main` steht als letzter Schritt an.

## Quelle

- Replay-Analyse des neuesten beendeten Matches `match_6e8f03d9b28d5898`.
- Nutzerbeobachtung: Die Runner-KI startet solide, verliert danach aber Rig-/Economy-Fokus, sucht zu viele Breaker, installiert sie zu spät, verwirft starke Economy-Karten und verfolgt kein stringentes Remote-Ziel.
- Nutzerergänzung nach Freigabe: Runner-Karten sollen grundsätzlich verwertet statt abgeworfen werden. Discard ist nur plausibel bei nutzlosen, klar redundanten oder situativ irrelevanten Karten. Iterative Economy-Karten wie `Broker` brauchen eine eigene mehrzügige Planlogik.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung.

Bestimmte Endzustände:

- Broker-/Bank-Economy wird als eigener mehrzügiger Plan behandelt: installieren, mehrere Male laden, erst bei Bedarf oder ausreichend großem Bankstand auszahlen.
- Wiederholbare Economy-Engines erhalten gegenüber einfachem `gain_credit` eine höhere Planpriorität, wenn sie legal und side-safe als Economy-Weg erkennbar sind.
- Runner-Coverage-Suche geht nach sichtbarer Handantwort in Credits/Installation/Run-Fortsetzung über.
- Discard-Entscheidungen schützen Economy-Engines, gerade gesuchte Coverage-Karten und nicht redundante Rig-Teile.
- Remote-Contest und R&D-Wiederholungen werden gegen sichtbaren Payoff und bekannte No-Payoff-Information gebunden.
- Fokussierte Regressionen decken die neuen Verhaltensverträge ab.

## Gesamtziel

Die Runner-KI soll aus dem Spiel `match_6e8f03d9b28d5898` folgende generische Verhaltensverbesserungen lernen:

1. Economy-Engines, insbesondere Broker-/Bank-Karten, aktiv entwickeln statt discarden.
2. Broker als Wertplan führen: erste Installation, wiederholte Loads, spätes Cashout bei Fundingbedarf oder ausreichend großem Bankwert.
3. Sichtbare Breaker-/Coverage-Antworten installieren, bevor weitere Programme gesucht werden.
4. Discards nach Wiederverwendbarkeit, Redundanz und aktuellem Planwert gewichten.
5. Runs an tatsächliche Ziele binden: Remote-Contest bei Scorefenster, R&D nur bei frischem oder payoffstarkem Access.

## Annahmen

- Die Lösung nutzt nur PlayerViews, LegalActions, PublicEvents, erlaubte Deck-/Hint-Semantik und redigierte AI-Traces.
- Keine verdeckten Korp- oder Runner-Zonen werden als Entscheidungsgrundlage gelesen.
- `The Short Circuit`, `Broker` und weitere Karten sind Beispiele; die Umsetzung bleibt generisch über Rollen, TacticSignals, Semantik und LegalAction-Payloads.
- Bestehende aktuelle Fixes aus `runner-short-circuit-install-discipline` bleiben gültig und werden nicht dupliziert.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung durch die KI.
- Keine Kartenpool-, Decklegal-, AI-Supported- oder Hint-Freigabe jenseits nachweislich falscher Semantik.
- Kein Push und kein PR.
- Keine vollständige Neubewertung aller Runner-Strategien.

## Controller-Invarianten

- KI wählt ausschließlich aus vorhandenen `LegalActions`.
- `applyAction` bleibt finaler Guardrail.
- Kein Hidden-Info-Leak in AI-Inputs, Debug, Reports, Replays oder Payloads.
- Economy-Pläne dürfen akute Agenda-Steal- oder Remote-Contest-Fenster nicht blind übersteuern.
- Broker-Cashout darf nicht zum Load/Cashout-Pingpong werden. Ein einzelner Load mit sofortigem Cashout ist nur bei akutem Funding- oder Überlebensbedarf plausibel.
- Discard darf nicht nur aus Handlimitdruck heraus wertvolle Einzelkarten opfern, wenn vorher legale Verwertungsschritte möglich waren.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktiven Paket debuggt.
- Wenn ein gewünschter Verwertungsschritt keine LegalAction hat, wird kein KI-Workaround gebaut; der Fall wird als Engine-/Hint-Folgepunkt dokumentiert.
- Wenn ein Fix eine bestehende Gegenfall-Regression bricht, wird der neue Score enger an sichtbaren Planbedarf gebunden.
- Wenn `main` beim finalen Merge kollidiert, werden Konflikte defensiv gelesen und nur fachlich kompatible Intentionen zusammengeführt.

## Sicherheitsblocker

- Die Lösung benötigt verdeckte Stack-, HQ-, R&D- oder Remote-Inhalte.
- KI-Code erzeugt oder errät Aktionen außerhalb der LegalActions.
- Tests zeigen Hidden-Info-, Replay-, StateHash- oder Engine-Vertragsrisiken.
- Finaler Merge nach `main` ist fachlich oder technisch nicht sicher lösbar.

## State Machine

1. `preflight`: Worktree, Branch, aktuelle Artefakte prüfen.
2. `process_evidence`: Prozess- und Evidence-Artefakte anlegen.
3. `broker_plan`: Broker-/Bank-Planlogik und Tests implementieren.
4. `coverage_install_discard`: Coverage-Install-Disziplin und Discard-Schutz härten.
5. `run_payoff`: Remote-/R&D-Payoff-Bindung aus dem Match absichern.
6. `verify`: fokussierte Tests, `@netgrid/ai typecheck`, `git diff --check`.
7. `finalize`: Final-Report, Log, Paketcommits, lokale Integration nach `main`.

## Paketfolge

### Paket P1: Prozess und Evidence

Ziel: Replay-Befunde, Nutzerergänzung und Umsetzungsschnitt side-safe dokumentieren.

Arbeit:

- Prozess unter `docs/architecture/ai/` anlegen.
- Evidence-Report unter `docs/reviews/ai/` anlegen.
- Akzeptanzkriterien für Broker, Discard, Coverage/Install und Run-Payoff festhalten.

Checks:

- `git diff --check`

Done-Gate:

- Prozess und Evidence sind committed.

Commit:

- `docs(ai): document runner economy rig focus process`

### Paket P2: Broker-/Bank-Economy-Plan

Ziel: Broker und ähnliche Bank-Economy als mehrzügigen Plan steuern.

Arbeit:

- Install-Commitment so anpassen, dass Broker bei ausreichender Restklick-/Creditlage nicht wegen fehlendem sofortigem Follow-up-Load abgewertet wird.
- Build-Plan so stärken, dass mehrere Loads bis zu einem sinnvollen Zielbereich bevorzugt werden.
- Cashout-Gate so sichern, dass keine Load/Cashout-Schleife entsteht.
- Debug-Evidence für `install_ready`, `build_first_load`, `build_more_loads`, `cashout_ready` und Defer-Gründe ergänzen oder prüfen.

Checks:

- Fokussierte `semantic-ai-runtime-cutover.test.ts`-/Runtime-Tests für Broker-Install, Mehrfach-Load, Cashout-Defer und Funding-Cashout.
- `git diff --check`

Done-Gate:

- Broker-Verhalten ist generisch über Bank-Semantik abgesichert und committed.

Commit:

- `fix(ai): treat broker as multi-load economy plan`

### Paket P3: Coverage-Install- und Discard-Disziplin

Ziel: Gesuchte oder sichtbare Coverage wird installiert/verwendet; wertvolle Einzelkarten werden geschützt.

Arbeit:

- Coverage-Search-Sättigung auf Install-/Funding-Fortschritt ausrichten.
- Handentwicklung priorisiert nicht redundante Breaker und wichtige Economy-Engines vor weiterer Suche.
- Discard-Choice bewertet Karten nach `worth_using`, `plan_anchor`, `redundant`, `dead_context` und `low_value_duplicate`.
- Broker-/Bank-Economy, gerade gesuchte Coverage, einzigartige Breaker und relevante Baseline-/Trace-Tech-Karten erhalten Discard-Schutz, solange sie nicht sichtbar nutzlos sind.

Checks:

- Fokussierte Discard-/Handentwicklungs- und Coverage-Tests.
- `git diff --check`

Done-Gate:

- Discard-Regeln schützen die im Match beobachteten Kartenklassen und Gegenfälle bleiben erlaubt.

Commit:

- `fix(ai): prefer useful runner hand cards`

### Paket P4: Run-Payoff und Remote-Fortsetzung

Ziel: Runs folgen einem payoffstarken Ziel; R&D-Repeat und Remote-Aufgabe werden begrenzt.

Arbeit:

- Bekannte R&D-Topkarten ohne Agenda-/Trash-/Multiaccess-Payoff senken Repeat-Runs.
- Remote-Contest wird bei sichtbarer Scoring-Gefahr produktiv, auch wenn Strategieportfolio bisher Central bevorzugt.
- Funding-/Coverage-Subziele sollen zum Remote zurückführen, solange das Remote nicht sichtbar invalidiert ist.

Checks:

- Fokussierte Runtime-Tests für R&D-No-Payoff-Repeat, Remote-Scorefenster und zentrale Gegenfälle.
- `git diff --check`

Done-Gate:

- Runs werden an sichtbaren Payoff gebunden und committed.

Commit:

- `fix(ai): require reserve for known R&D trash payoff`

### Paket P5: Abschluss, Verifikation und lokale Integration

Ziel: Prozess sauber schließen und lokal nach `main` integrieren.

Arbeit:

- Final-Report schreiben.
- Wissenslog ergänzen, wenn dauerhafte Verträge entstanden sind.
- Relevante Checks wiederholen.
- Arbeitsbranch lokal nach `main` mergen.

Checks:

- Fokussierte Vitest-Suites.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- Wenn realistisch: `corepack pnpm --filter @netgrid/ai test`.
- `git diff --check`.
- Nach Merge Status und Diff-Check auf `main`.

Done-Gate:

- Branch ist sauber committed und lokal nach `main` integriert.

Commit:

- `docs(ai): summarize runner economy rig focus closeout`

## Abschlusskriterien

- Alle freigegebenen Analysepunkte sind umgesetzt oder als Blocker/Folgepunkt dokumentiert.
- Broker-/Bank-Economy nutzt einen mehrzügigen Wertplan statt Einzelaktion.
- Coverage-Suche endet in Installation/Nutzung statt Suchloop.
- Discard schützt verwertbare Karten.
- Run-Auswahl respektiert sichtbaren Payoff und Remote-Scorefenster.
- Keine Hidden-Info- oder LegalAction-Grenze wurde aufgeweicht.
- Paketcommits und lokaler Merge nach `main` sind erfolgt.
