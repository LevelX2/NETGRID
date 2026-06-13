# AI-ADV-NET-1 Advancement Net-Value Comparator Prozess

Status: in Umsetzung

Quelle/Vorgabe: GitHub-Prüfungsrückmeldung zur abgeschlossenen Basic-Advance-Dominanz für `Team Restructuring` und Folgeempfehlung `AI-ADV-NET-1: Advancement Net-Value Comparator`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Der nächste Schritt ist kein Rückbau des bestehenden Fixes, sondern eine kompakte Erweiterung der Bewertungslogik: Advancement-Counter-Placement-Aktionen sollen nicht nur nach Zielanzahl kippen, sondern gegen einfache Basisaktionen und konkreten Board-Mehrwert bewertet werden.

## Gesamtziel

Die Corp-KI bewertet `Team Restructuring` und gleichartige Placement-Aktionen über einen Net-Value-Vergleich. Der Vergleich ermittelt Board-Delta, Basic-Action-Äquivalent, Compression, Window-Mehrwert, Card-Spend-Penalty, schwache Zielqualität und resultierenden Netto-Wert. Schwache zweite Ziele sollen die Operation nicht automatisch gut machen; echte Score-, Overadvance-, Ambush-, Cashout- oder Transferfenster dürfen weiterhin gewinnen.

## Annahmen

- Primärer Scope ist `Team Restructuring`, weil dort die konkrete Regression und bestehende Profilierung bereits vorhanden ist.
- Die Logik wird so generisch formuliert, dass spätere flexible Counter-Verteilungen anschließen können, ohne sie jetzt vollständig freizuschalten.
- Die vorhandene LegalActions-only-Grenze bleibt unverändert.
- Keine Engine-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.

## Nicht-Ziele

- Keine vollständige AI-ADV-NET-2-Zielklassifizierung für alle genannten Kartenfamilien.
- Keine generische Profilierung aller Advancement-Counter-Karten aus AI-ADV-NET-3.
- Keine Dateiextraktion aus `packages/ai/src/index.ts` in diesem Paket.
- Kein GitHub-Push, kein PR, keine GitHub-CI-Anforderung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI bewertet ausschließlich vorhandene legale `LegalActions`.
- BasicAction-Vergleiche dürfen keine neuen Aktionen erzeugen.
- Hidden-Info bleibt redigiert; Evidence darf keine privaten Kartendaten leaken.
- Bestehender Basic-Advance-Dominanz-Fix bleibt erhalten.

## Automatische Fehlerbehandlung

- Bei roten Tests wird ausschließlich der aktuelle Paketumfang debuggt.
- Bei unklarer Zielklasse wird konservativ als schwach oder ohne Witness bewertet.
- Bei Konflikten mit zeitgleich geändertem `main` werden beide fachlichen Intentionen gelesen und erhalten, sofern kompatibel.

## Sicherheitsblocker

- Änderung würde legale Engine-Aktionen verändern.
- Debug-Evidence würde verdeckte Kartendaten offenlegen.
- KI müsste für den Comparator hypothetische Aktionen erzeugen, die nicht aus `LegalActions` ableitbar sind.

## State Machine

`process_planned -> implementation_net_value -> regression_tests -> integration_preflight -> merged_main -> complete`

## Paketfolge

1. `AI-ADV-NET-1A`: Prozessartefakt und Scope sichern.
2. `AI-ADV-NET-1B`: Net-Value Comparator in semantischem und Legacy-Pfad einbauen.
3. `AI-ADV-NET-1C`: Regressionen für schwache zweite Ziele und echte Fenster ergänzen.
4. `AI-ADV-NET-1D`: Finale Verifikation, Main-Integration und Worktree-Aufräumen.

## Paketdetails

### AI-ADV-NET-1A Prozessartefakt

Ziel: Umsetzungsscope, Nicht-Ziele, Invarianten und Paketfolge versionieren.

Arbeit:
- Dieses Dokument anlegen.
- Worktree und Branch prüfen.

Kernartefakte:
- `docs/architecture/ai/ai-advancement-net-value-comparator-process-2026-06-13.md`

Checks:
- `git diff --check`

Done-Gate:
- Prozessartefakt ist versioniert und benennt Folgepakete.

Commit:
- `docs: plan advancement net value comparator`

### AI-ADV-NET-1B Net-Value Comparator

Ziel: Die vorhandene Placement-Bewertung um einen Nettovergleich erweitern.

Arbeit:
- `best_basic_equivalent`, `card_spend_penalty`, `compression_value`, `window_value` und `net_advancement_value` berechnen.
- Schwache zweite Ziele bestrafen, wenn kein Witness existiert.
- Witness-Typen mindestens unterscheiden: `score_now`, `score_next_action`, `overadvance_threshold`, `cashout_next_turn`, `transfer_destination_visible`, `none`.
- Semantischen Runtime-Pfad und Legacy-Corp-Planpfad konsistent halten.

Kernartefakte:
- `packages/ai/src/index.ts`
- `packages/ai/src/legacy/corp-plans.ts`

Checks:
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:
- Typecheck grün.
- Debug-Evidence enthält die neuen Net-Value-Felder.
- Dominierte Ein-Ziel-Aktion bleibt unter Basic Advance.

Commit:
- `fix(ai): compare advancement operations by net value`

### AI-ADV-NET-1C Regressionen

Ziel: Die Folgefälle aus der Review-Rückmeldung abdecken.

Arbeit:
- `Team Restructuring` auf zwei schwache Counter-Banks gewinnt nicht automatisch.
- `Team Restructuring` auf Agenda plus echtem Score-/Window-Ziel kann gewinnen.
- Debug-Ausgabe enthält `best_basic_equivalent`, `card_spend_penalty`, `compression_value`, `window_value` und `net_advancement_value`.

Kernartefakte:
- `packages/ai/src/index.test.ts`

Checks:
- Fokussierter Vitest-Lauf für neue Fixtures.
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:
- Alle neuen und bestehenden `@netgrid/ai`-Tests grün.

Commit:
- `test(ai): cover advancement net value comparator`

### AI-ADV-NET-1D Integration

Ziel: Arbeitsbranch sauber nach lokalem `main` integrieren.

Arbeit:
- Arbeitsbranch sauber prüfen.
- Lokales `main` in Arbeitsbranch integrieren, falls nötig.
- Finale Checks wiederholen.
- Hauptworkspace per Fast-Forward nach `main` mergen.
- Worktree entfernen.

Checks:
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm format:changed`
- `git diff --check`

Done-Gate:
- `main` enthält alle Paketcommits.
- Arbeits-Worktree entfernt.
- Keine fremden untracked Dateien verändert.

## Verifikationsregeln

Fokussierte Tests dürfen während der Entwicklung genutzt werden. Vor Integration müssen `@netgrid/ai`-Typecheck, vollständiger `@netgrid/ai`-Testlauf, `format:changed` und `git diff --check` grün sein.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ADV_NET_VALUE`
- Branch: `codex/ai-adv-net-value`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge verwenden.
- Die im Hauptworkspace vorhandene untracked Datei `docs/architecture/engine/scored-agenda-flow-orchestrator-cleanup-process-2026-06-13.md` bleibt unangetastet.

## Controller-Prompt-Kern

`/Goal Arbeite den AI-ADV-NET-1 Advancement Net-Value Comparator vollständig und sequenziell von AI-ADV-NET-1A bis AI-ADV-NET-1D ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ADV_NET_VALUE auf Branch codex/ai-adv-net-value. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe ohne Rückfrage und schreibe einen Blocker-Report mit Removal Condition. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- Prozessartefakt, Implementierung und Tests sind separat committet.
- `Team Restructuring` verliert bei schwachen zweiten Zielen gegen bessere Basisoptionen.
- Echte Advancement-Fenster bleiben spielbar.
- Debug-Evidence zeigt den Nettovergleich.
- Lokaler `main` enthält die abgeschlossene Arbeit.
