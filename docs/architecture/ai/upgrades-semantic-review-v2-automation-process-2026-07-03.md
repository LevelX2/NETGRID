# Upgrades Semantic Review v2 Automation Process

Status: active

Stand: 2026-07-03

## Quelle/Vorgabe

- Nutzerauftrag: Die korrigierte Review-v2-Überarbeitung der Corp-Upgrade-KI-Hints direkt mit `paketprozess-worktree-goal` umsetzen.
- Primäre Eingabe: `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-input-2026-07-02.json`.
- Lesbare Eingaben: `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-input-2026-07-02.md` und `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-pasted-summary-2026-07-02.txt`.

## Zielprüfung

Die Vorgabe ist automatisch ausführbar. Die JSON enthält mit `fullFinalRecommendations` einen vollständigen Zielzustand für alle 45 Corp-Upgrades, inklusive `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, Reviewstatus, Priorität und Begründung.

## Gesamtziel

Alle 45 Corp-Upgrades in `data/ai/ai-card-hints-active.json` werden auf den v2-Zielzustand gebracht. Fehlende Taktiksignale werden in `data/ai/tactic-signals-v1.json` ergänzt. Am Ende liegen ein Vorher/Nachher-Report und ein maschineller Checker vor, die den Zielzustand gegen die v2-Eingabe absichern.

## Annahmen

- `fullFinalRecommendations` ist die führende Quelle; `cardOverridesAgainstUploadedReport` und Markdown dienen als Begründung.
- Es werden keine neuen Strategy IDs eingeführt.
- Neue Taktiksignale sind read-only Hint-Metadaten und erzeugen keine Planner-, Engine-, Legalitäts-, Targeting-, Profil-/Default-, ActionScore-, PlanWeight-, UI- oder Hidden-Info-Wirkung.
- StrategySupportPairs bleiben card-level Support-Hinweise; sie erzeugen keine LegalActions.
- Der Hauptworkspace bleibt bis zum finalen Merge unberührt.

## Nicht-Ziele

- Keine Änderung an Engine, Rules Engine, `applyAction`, LegalActions, PlayerViews, Replays, StateHash oder UI.
- Keine automatische produktive Ableitung von Strategien aus einzelnen Taktiksignalen.
- Keine Einführung einer Breaker-Hate-, Overadvance-, Action-Tempo- oder Deck-Recycle-Strategie.
- Keine Rückwärtskompatibilitäts- oder Migrationspflege für historische lokale Daten.

## Controller-Invarianten

- Es gibt genau 45 geprüfte Corp-Upgrades.
- Finale v2-Zahlen: 38 Karten mit Strategieanker, 7 support-only Karten, 47 StrategySupportPairs.
- Finale v2-Verteilung: `corp.ambush_bluff` 6, `corp.central_stabilize` 1, `corp.damage_kill` 2, `corp.economy_rez_reserve` 1, `corp.ice_tax_glacier` 16, `corp.remote_scoring` 15, `corp.tag_trace_punish` 6.
- Support-only Karten haben leere `lineSupport`, leere `strategicRole` und leere `strategySupportPairs`.
- Alle `tacticSignals` der 45 Upgrades existieren im Signal-Katalog.
- `corp.ice_tax_glacier` wird nicht allein aus Worm-, Stealth- oder Noisy-Breaker-Hate gesetzt.
- `corp.remote_scoring` wird nicht allein aus generischer Remote-Kapazität oder rigabhängiger Tax gesetzt.

## Automatische Fehlerbehandlung

- Bei fehlender Karte, fehlender Signal-ID, Schemaabweichung oder Zählungsdrift stoppt das aktuelle Paket.
- Bei fremden Änderungen in Paketdateien werden sie gelesen und erhalten, wenn sie fachlich kompatibel sind.
- Bei Testblockern wird der Blocker mit Befehl, Symptom und Removal Condition im Paketreport dokumentiert.

## Sicherheitsblocker

- Jede Änderung, die Engine-Autorität, Hidden-Info-Schutz, LegalActions-only-Prinzip oder Replay-/StateHash-Determinismus berührt, ist außerhalb dieses Prozesses und blockiert.
- Jede StrategySupportPair-Erzeugung ohne konkrete v2-Empfehlung blockiert.

## State Machine

1. `preflight`
2. `package_1_process_sources`
3. `package_2_signal_catalog`
4. `package_3_hint_data`
5. `package_4_report_checker`
6. `integration_preflight`
7. `merged_to_main`
8. `complete`

## Paketfolge

### Paket 1: Prozess und Quellen

Ziel: Worktree anlegen, v2-Eingaben sichern und dieses Prozessartefakt erstellen.

Kernartefakte:

- `docs/architecture/ai/upgrades-semantic-review-v2-automation-process-2026-07-03.md`
- `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-input-2026-07-02.json`
- `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-input-2026-07-02.md`
- `docs/reviews/ai/upgrades-ai-hints-critical-review-v2-pasted-summary-2026-07-02.txt`

Checks:

- JSON parsebar.
- `git diff --check`.

Commit: `docs(ai): add upgrades semantic review v2 process`

### Paket 2: Signal-Katalog

Ziel: Alle in v2 genutzten, noch fehlenden Taktiksignale katalogisieren.

Kernartefakt:

- `data/ai/tactic-signals-v1.json`

Checks:

- Alle 72 v2-Signale existieren im Katalog.
- Neue Signale sind read-only und erzeugen keine automatische Strategieableitung.
- `git diff --check`.

Commit: `data(ai): catalog upgrades semantic review v2 signals`

### Paket 3: Hint-Daten

Ziel: Alle 45 Corp-Upgrades in `ai-card-hints-active.json` auf `fullFinalRecommendations` setzen.

Kernartefakt:

- `data/ai/ai-card-hints-active.json`

Checks:

- 45 Zielkarten existieren.
- Finale Zahlen und Strategy-Verteilung stimmen.
- Support-only Demotions sind wirksam.
- `git diff --check`.

Commit: `data(ai): apply upgrades semantic review v2 hints`

### Paket 4: Report und Checker

Ziel: Vorher/Nachher-Report und reproduzierbaren Checker erstellen.

Kernartefakte:

- `scripts/check-upgrades-semantic-review-v2.mjs`
- `docs/reviews/ai/upgrades-semantic-review-v2-implementation-2026-07-03.md`
- `docs/reviews/ai/upgrades-semantic-review-v2-implementation-2026-07-03.json`

Checks:

- Checker grün.
- JSON-Artefakte parsebar.
- `git diff --check`.
- Bestehende passende Paket-/AI-Checks, soweit ohne bekannte lokale Build-Freigabeprobleme ausführbar.

Commit: `test(ai): verify upgrades semantic review v2 invariants`

## Verifikationsregeln

- Der Checker ist die maßgebliche Paketverifikation für den Zielzustand.
- Zusätzliche Tests dürfen den Scope nicht still erweitern.
- Bekannte lokale `pnpm`-Build-Freigabeprobleme werden dokumentiert und nicht durch Workspace-Metadaten-Churn behoben.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/upgrades-semantic-review-v2`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_UPGRADES_SEMANTIC_REVIEW_V2`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen Merge nach `main` genutzt.
- Jedes Paket bekommt einen eigenen Commit.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Controller-Prompt-Kern

Arbeite diesen Prozess vollständig und sequenziell ab. Lies zuerst Projektanweisungen und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_UPGRADES_SEMANTIC_REVIEW_V2` auf Branch `codex/upgrades-semantic-review-v2`, nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach `main` mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.

## Abschlusskriterien

- Vier Paketcommits liegen auf `codex/upgrades-semantic-review-v2`.
- `main` enthält den gemergten Arbeitsbranch.
- Der Checker läuft auf `main` erfolgreich.
- Der Arbeits-Worktree ist entfernt.
- Das Goal ist als complete markiert.
