# AI-ADV-THRESHOLD-1 Exact Overadvance Thresholds

Status: `in_progress`

## Quelle/Vorgabe

Folgeanpassung aus der GitHub-geprüften Rückmeldung vom 2026-06-13: Die Advancement-Witness-Klassifizierung ist grundsätzlich korrekt, aber `agenda_overadvance_threshold` wird noch zu grob erkannt. Für Overadvance-Agenden muss die KI nicht nur "über Difficulty" sehen, sondern die konkrete nächste Payoff-Schwelle.

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Overadvance-Witness nur bei tatsächlicher nächster Payoff-Schwelle.
- Relevante Artefakte: `packages/ai/src/index.ts`, `packages/ai/src/legacy/corp-plans.ts`, `packages/ai/src/index.test.ts`.
- Akzeptanzfälle: `Project Babylon`, `Project Venice`, `Project Zurich`.
- Verifikation: AI-Typecheck, fokussierte AI-Tests, vollständiger AI-Testlauf, Format- und Diff-Checks.
- Branch/Worktree: `codex/ai-adv-thresholds` in `C:\Projekte\NETGRID_AI_ADV_THRESHOLDS`, finaler lokaler Merge nach `main`.

## Gesamtziel

Die Corp-KI bewertet Overadvance-Agenden nur dann als `agenda_overadvance_threshold`, wenn ein zusätzlicher Advancement-Counter die nächste echte Payoff-Schwelle erreicht. Zwischenstände über Difficulty ohne neuen Payoff werden nicht als Schwellen-Witness behandelt.

## Annahmen

- `Project Babylon` hat eine Schwelle von 2 Countern über Difficulty.
- `Project Venice` hat eine Schwelle von 3 Countern über Difficulty.
- `Project Zurich` hat eine Schwelle von 2 Countern über Difficulty.
- Für andere Overadvance-Karten ohne zuverlässig erkannten Schwellenwert bleibt die bisherige konservative Klassifizierung erhalten oder wird nicht aggressiver gemacht.

## Nicht-Ziele

- Keine mehrzügigen Transferpläne.
- Keine allgemeinen Distribution-Profile für flexible Advancement-Operationen.
- Keine Cashout-Timing-Neubewertung.
- Keine Ambush-Risk-Kontextbewertung.
- Keine Modul-Extraktion.

## Controller-Invarianten

- Die Rules Engine bleibt Regelautorität.
- Die KI erzeugt keine neuen LegalActions und manipuliert keine Engine-Regeln.
- Keine Hidden-Info-Ausweitung: Klassifizierung nutzt nur Definitionstext und sichtbare Zielkarte.
- Runtime- und Legacy-Pfad bleiben funktional konsistent.

## Automatische Fehlerbehandlung

- Wenn TypeScript oder fokussierte Tests rot sind, wird im aktiven Paket eng korrigiert.
- Wenn Babylon/Venice/Zurich-Texte nicht sicher erkennbar sind, wird eine explizite Karten-ID-Mapping-Tabelle für Schwellen genutzt.
- Wenn `main` weiterläuft, wird `main` vor finalem Merge defensiv in den Arbeitsbranch gemergt.

## Sicherheitsblocker

Blocker, wenn:

- die Implementierung Engine-/LegalAction-Verträge ändern müsste;
- Hidden-Info-Daten für die Klassifizierung nötig wären;
- `Project Venice` oder `Project Zurich` lokal nicht als legal advancebare Testziele verfügbar sind und kein sauberer synthetischer Fixture-Pfad möglich ist.

## State Machine

```text
process_planned
-> classifier_thresholds
-> regression_tests
-> integration_preflight
-> merged_to_main
-> complete
```

## Paketfolge

1. `AI-ADV-THRESHOLD-1A Prozessartefakt`
2. `AI-ADV-THRESHOLD-1B Schwellenklassifizierung`
3. `AI-ADV-THRESHOLD-1C Regressionen`
4. `AI-ADV-THRESHOLD-1D Integration`

## Paketdetails

### AI-ADV-THRESHOLD-1A Prozessartefakt

Ziel: Scope, Annahmen, Gates und Paketfolge versionieren.

Kernartefakt:

- `docs/architecture/ai/ai-advancement-thresholds-process-2026-06-13.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozessartefakt ist versioniert.

Commit:

- `docs: plan exact overadvance thresholds`

### AI-ADV-THRESHOLD-1B Schwellenklassifizierung

Ziel: Overadvance-Witness nur bei echter nächster Payoff-Schwelle setzen.

Arbeit:

- Schwellenprofil pro Agenda bestimmen.
- `currentOver`, `afterActionOver`, `thresholdSize`, `hitsThreshold` und `nextThresholdDistance` berechnen.
- `agenda_overadvance_threshold` nur bei `hitsThreshold:true` setzen.
- Debug-Evidence für Overadvance-Ziele ergänzen.
- Runtime und Legacy konsistent anpassen.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/legacy/corp-plans.ts`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierter AI-Testlauf, soweit vorhanden
- `git diff --check`

Done-Gate:

- Typecheck grün.
- Bestehende Advancement-Witness-Tests bleiben grün oder werden im nächsten Paket gezielt aktualisiert.

Commit:

- `fix(ai): require exact overadvance thresholds`

### AI-ADV-THRESHOLD-1C Regressionen

Ziel: Babylon/Venice/Zurich-Schwellen explizit absichern.

Akzeptanzfälle:

- `Project Babylon`: Difficulty + 1 -> kein voller Zusatzpunkt-Witness.
- `Project Babylon`: Difficulty + 2 -> `agenda_overadvance_threshold`.
- `Project Babylon`: Difficulty + 3 -> kein neuer Threshold.
- `Project Babylon`: Difficulty + 4 -> nächster Threshold.
- `Project Venice`: alle 3 Counter über Difficulty als Schwelle.
- `Project Zurich`: alle 2 Counter über Difficulty als Schwelle.

Debug-Evidence:

- `overadvance_threshold_size`
- `overadvance_current_over`
- `overadvance_after_action_over`
- `overadvance_hits_threshold`
- `overadvance_next_threshold_distance`

Kernartefakt:

- `packages/ai/src/index.test.ts`

Checks:

- fokussierter Vitest-Lauf für Overadvance-/Advancement-Tests
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:

- Neue Schwellenfälle grün.
- Vollständiger `@netgrid/ai`-Testlauf grün.

Commit:

- `test(ai): cover exact overadvance thresholds`

### AI-ADV-THRESHOLD-1D Integration

Ziel: Arbeitsbranch sauber nach lokalem `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:

- Arbeitsbranch ist sauber.
- Lokaler `main` enthält die Paketcommits.
- Worktree ist entfernt.

## Verifikationsregeln

- Paketchecks werden vor jedem Commit ausgeführt.
- Vor finalem Merge werden Typecheck, kompletter AI-Testlauf, Formatcheck und Diffcheck erneut ausgeführt.
- Rote Tests stoppen die Paketfolge.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-adv-thresholds`
- Worktree: `C:\Projekte\NETGRID_AI_ADV_THRESHOLDS`
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für finalen Merge genutzt.
- Push/PR erfolgen nicht ohne ausdrücklichen Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-ADV-THRESHOLD-1 Exact Overadvance Thresholds vollständig und sequenziell von AI-ADV-THRESHOLD-1A bis AI-ADV-THRESHOLD-1D ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ADV_THRESHOLDS auf Branch codex/ai-adv-thresholds.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Exakte Overadvance-Schwellen sind in Runtime und Legacy umgesetzt.
- Babylon/Venice/Zurich-Schwellen sind getestet.
- Debug-Evidence erklärt Schwellenstatus.
- Alle relevanten AI-Checks sind grün.
- Arbeitsbranch ist lokal nach `main` gemergt.
