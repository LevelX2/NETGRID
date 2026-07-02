# Assets Semantic Review v2 Automation Process

Status: in Umsetzung
Datum: 2026-07-02
Branch: `codex/assets-semantic-review-v2`
Worktree: `C:\Projekte\NETGRID_ASSETS_SEMANTIC_REVIEW_V2`

## Quelle/Vorgabe

Führende Eingaben:

- `C:\Users\Lui\Downloads\assets-ai-hints-change-list-v2-2026-07-01.json`
- `C:\Users\Lui\Downloads\assets-ai-hints-change-list-v2-2026-07-01.md`
- Nutzerfreigabe: v2-Liste mit `paketprozess-worktree-goal` sauber komplett umsetzen.

Der Upload-Report `assets-semantic-review-v1-2026-07-01` wird nicht 1:1 übernommen. Führend ist der v2-Zielzustand aus `fullFinalRecommendations`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise:

- Gesamtziel: 55 Corp-Assets auf den v2-Zielzustand für KI-Spielbarkeit bringen.
- Erwarteter Endzustand: 42 Karten mit Strategieanker, 13 support-only Karten, 49 bestätigte `strategySupportPairs`.
- In Scope: `data/ai/ai-card-hints-active.json`, `data/ai/tactic-signals-v1.json`, nötige Ontologie-/Validierungsanpassungen, Prozess-/Review-/Checker-Artefakte.
- Nicht-Ziele: Engine-Regeln, LegalActions, PlayerViews, Runtime-Gewichte, Decklegalität, Produktflags, neue Strategiegruppen.
- Sicherheitsgrenzen: Keine Hidden-Info-Ausweitung, keine automatische Strategy-Ableitung aus Signalen, keine produktive Semantik außerhalb der geprüften Hints.

## Gesamtziel

Alle 55 in der v2-Liste enthaltenen Corp-Assets erhalten die geprüften finalen Taktiksignale, Strategieanker, strategischen Rollen und `strategySupportPairs`. Support-only-Karten bleiben ohne lose `lineSupport`-/`strategicRole`-Anker. Die Umsetzung wird durch einen wiederholbaren Checker abgesichert und in einem Vorher/Nachher-Report dokumentiert.

## Annahmen

- `fullFinalRecommendations` ist der maßgebliche Zielzustand.
- Der aktuelle `main`-Stand enthält bereits die Agenda- und Operations-Review-Logik.
- Neue Taktiksignale bleiben read-only Hint-Metadaten und erzeugen keine LegalActions, Planner-Gewichte oder Engine-Effekte.
- Bestehende `allowedStrategyAnchors` im Signalkatalog dürfen support-only Karten nicht übersteuern; die expliziten `strategySupportPairs` sind führend.

## Nicht-Ziele

- Keine neue Strategie-ID.
- Keine Änderung an Kartenregeln oder Engine-CardImplementations.
- Keine automatische Rückwärtsmigration historischer Review-v1-Artefakte.
- Keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

- Genau 55 Asset-Empfehlungen werden verarbeitet.
- Alle `cardId` aus der v2-Liste existieren in `ai-card-hints-active.json`.
- Exakt 42 Karten haben mindestens einen `strategySupportPair`.
- Exakt 13 Karten bleiben support-only.
- Exakt 49 `strategySupportPairs` sind gesetzt.
- Die Strategie-Verteilung entspricht der v2-Zusammenfassung:
  - `corp.ambush_bluff`: 10
  - `corp.asset_economy`: 8
  - `corp.central_stabilize`: 1
  - `corp.damage_kill`: 6
  - `corp.draw_engine`: 1
  - `corp.economy_rez_reserve`: 2
  - `corp.fast_advance`: 3
  - `corp.ice_tax_glacier`: 5
  - `corp.remote_scoring`: 2
  - `corp.tag_trace_punish`: 11
- Support-only Karten haben keine losen `lineSupport`- oder `strategicRole`-Einträge.
- `ACME Savings and Loan`, `South African Mining Corp` und `Syd Meyer Superstores` bleiben support-only.
- `Fortress Architects` hat nur `corp.ice_tax_glacier`, nicht `corp.economy_rez_reserve`.
- `Satellite Monitors` nutzt `condition.runner_attempted_run_last_turn` und `risk.random_outcome`, nicht `condition.multiple_runs_last_turn`.
- `Syd Meyer Superstores` nutzt `economy.corp_rezzed_ice_cashout`, nicht `economy.corp_asset_cashout`.
- `Government Contract` hat keine strukturierte `requires_during_run`-Condition.

## Automatische Fehlerbehandlung

- Fehlende Karte: Paket stoppen, Blocker-Report schreiben.
- Fehlendes Signal: im Signalkatalog ergänzen, sofern es in v2 eindeutig definiert ist; sonst Blocker.
- Schemafehler: Ontologie/Schema nur so weit erweitern, wie die v2-Liste es verlangt.
- Test-/Checkerfehler: nicht zum nächsten Paket wechseln, bis der Fehler behoben oder als harter Blocker dokumentiert ist.

## Sicherheitsblocker

- Eine Änderung würde LegalActions, `applyAction`, Engine-Regeln, PlayerViews, Replays, StateHash oder Hidden-Info-Sichtbarkeit verändern.
- Eine support-only Karte würde durch automatische Ableitung wieder als produktiver Strategieanker aktiviert.
- Eine neue Strategie-ID wäre erforderlich.

## State Machine

1. `preflight`
2. `process_artifact`
3. `taxonomy_update`
4. `asset_hint_update`
5. `checker_report`
6. `integration_preflight`
7. `main_merge`
8. `complete`

## Paketfolge

### ASSET-V2-1 Prozess und Quellen

Ziel: Prozessartefakt und unveränderte Quellkopien im Repository ablegen.

Kernartefakte:

- `docs/architecture/ai/assets-semantic-review-v2-automation-process-2026-07-02.md`
- `docs/reviews/ai/assets-ai-hints-change-list-v2-input-2026-07-01.json`
- `docs/reviews/ai/assets-ai-hints-change-list-v2-input-2026-07-01.md`

Checks:

- Quellen lesbar und JSON parsebar.
- `git diff --check`.

Commit:

- `docs(ai): add assets semantic review v2 process`

### ASSET-V2-2 Signalkatalog

Ziel: Alle v2-Taktiksignale im Signalkatalog verfügbar machen.

Konkrete Arbeit:

- Fehlende v2-Signale ergänzen.
- Bestehende Signale nicht pauschal umdeuten.
- Neue Signale als read-only Review-v2-Hint-Metadaten markieren.

Checks:

- Alle 77 v2-Signale sind in `tactic-signals-v1.json` vorhanden.
- Kein neues Signal erzeugt automatische Strategieanker außerhalb expliziter `strategySupportPairs`.
- `git diff --check`.

Commit:

- `data(ai): catalog assets semantic review v2 signals`

### ASSET-V2-3 Asset-Hints

Ziel: 55 Asset-Hints gemäß `fullFinalRecommendations` aktualisieren.

Konkrete Arbeit:

- `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints`, `reviewStatus`, `priority` und `rationale` je Karte auf v2-Zielzustand setzen.
- Support-only Karten erhalten leere `lineSupport`, `strategicRole` und `strategySupportPairs`.
- Keine anderen Karten verändern.

Checks:

- 55 Karten aktualisiert.
- 42 verankerte Karten, 13 support-only Karten, 49 Pairs.
- Strategie-Verteilung exakt wie v2.
- `git diff --check`.

Commit:

- `data(ai): apply assets semantic review v2 hints`

### ASSET-V2-4 Checker und Report

Ziel: Umsetzung dauerhaft prüfbar und reviewbar machen.

Kernartefakte:

- `scripts/check-assets-semantic-review-v2.mjs`
- `docs/reviews/ai/assets-semantic-review-v2-implementation-2026-07-02.md`
- `docs/reviews/ai/assets-semantic-review-v2-implementation-2026-07-02.json`

Checks:

- Checker läuft grün.
- Report enthält Vorher/Nachher je Karte.
- JSON-Dateien parsebar.
- `git diff --check`.

Commit:

- `test(ai): verify assets semantic review v2 invariants`

### ASSET-V2-5 Integration

Ziel: Arbeitsbranch lokal nach `main` integrieren und Worktree entfernen.

Checks:

- Arbeitsbranch sauber.
- Checker grün.
- `git diff --check` grün.
- Falls `main` weitergelaufen ist, defensiv integrieren.
- Fast-Forward-Merge nach `main`, wenn möglich.
- Checker und `git diff --check` auf `main` erneut ausführen.

Abschluss:

- Worktree entfernen.
- Goal erst danach als `complete` markieren.

## Verifikationsregeln

Primärer fachlicher Gate-Befehl:

```powershell
node scripts/check-assets-semantic-review-v2.mjs
```

Leichte technische Gates:

```powershell
git diff --check
node -e "JSON.parse(require('fs').readFileSync('data/ai/ai-card-hints-active.json','utf8')); JSON.parse(require('fs').readFileSync('data/ai/tactic-signals-v1.json','utf8')); console.log('json ok')"
```

Optionaler AI-Test:

```powershell
pnpm --filter @netgrid/ai test -- hint-ontology
```

Wenn PNPM wegen lokaler Build-Approval-Policy vor Testausführung blockiert, wird der Blocker dokumentiert und keine Paketfreigabe von diesem optionalen Gate abhängig gemacht.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in `C:\Projekte\NETGRID_ASSETS_SEMANTIC_REVIEW_V2`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Pro Paket ein Commit.
- Keine fremden/untracked v1-Review-Artefakte anfassen.
- Kein Push und kein PR.

## Controller-Prompt-Kern

Arbeite ASSET-V2-1 bis ASSET-V2-5 sequenziell ab. Stelle keine Zwischenfragen, solange die v2-Liste und dieses Prozessartefakt eine konservative automatische Fortsetzung erlauben. Nach jedem Paket relevante Checks ausführen, nur paketbezogene Dateien stagen, committen und erst dann fortfahren. Bei Sicherheitsblocker stoppen und Blocker-Report mit Removal Condition schreiben.

## Abschlusskriterien

- Alle Pakete sind committed.
- `main` enthält den finalen Assets-v2-Stand.
- Checker läuft auf `main` grün.
- Temporärer Worktree ist entfernt.
- Goal ist als abgeschlossen markiert.
