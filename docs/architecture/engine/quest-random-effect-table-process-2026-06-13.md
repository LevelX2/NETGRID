# Engine Quest Random Effect Table Process 2026-06-13

Status: completed_locally_merged_to_main

## Quelle/Vorgabe

Ausgang ist die Rückmeldung aus `C:\Users\Lui\.codex\attachments\15b2bf76-9dd9-4a9f-a41b-be27e5c2e168\pasted-text.txt`.

Die Rückmeldung bestätigt den abgeschlossenen Guard-Folgeprozess und nennt als nächsten sinnvollen technischen Schnitt `Quest for Cattekin`: weg von kartenspezifischer Longtail-Semantik und kartenspezifischem Permanent-Action-State, hin zu einer generischen Start-of-turn-Random-Effect-Tabelle.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: `Quest for Cattekin` nutzt generische funktionale Namen und generischen persistenten Action-Modifikator-State.
- Scope: Review-Text, Quest-CardImplementation, Ability-Definitionstypen, Start-of-turn-Resolver, Shared-State, Quest-Tests und Card-Function-Abstraction-Guard-Baseline.
- Nicht-Ziel: Code Viral Cache, Krumz, Startup Immolator, Siren, Bizarre Encryption Scheme oder Pirate Broadcast refaktorieren.
- Sicherheitsgrenzen: keine Hidden-Info-Ausweitung, keine neue LegalAction-Erzeugung, kein RandomCounter-/RandomDrawRecords-Vertragsbruch, keine Replay-/StateHash-Semantikänderung.

## Gesamtziel

`Quest for Cattekin` wird als zweiter Card-Function-Abstraction-Slice auf generische Mechanikbausteine verschoben:

- `quest_for_cattekin_start_turn_random_permanent_action` wird zu `start_turn_random_effect_table`.
- `questForCattekinPermanentActionGain` wird durch eine generische persistente Runner-Action-Modifikatorstruktur ersetzt.
- Start-of-turn-Auswertung bleibt deterministisch, nutzt weiterhin den bestehenden RandomPurpose und verarbeitet die Ergebnisse:
  - Wurf 6: Quelle trashen und permanente zusätzliche Runner-Aktion gewähren.
  - Wurf 1: 1 unpreventable Core Damage.
  - Wurf 2: 1 unpreventable Net Damage.
  - sonst: kein Effekt.

## Annahmen

- Die private Version-0-Umgebung benötigt keine Rückwärtskompatibilität für alte Runtime-State- oder Replay-Formate.
- Tests dürfen Kartennamen in Testtiteln und Fixture-IDs behalten.
- Öffentliche Effektpayloads dürfen bestehende Quest-spezifische Testvertragsfelder nur dann behalten, wenn sie keine Hidden-Info leaken; bevorzugt werden generische Outcome-Felder.
- Der Card-Function-Abstraction-Guard wird nach dem Refactor per `--write-report` auf den neuen Stand aktualisiert.

## Nicht-Ziele

- Keine Änderung am Kartenregeltext.
- Keine Änderung an Installierbarkeit, Kosten oder Aktivierungsfenstern anderer Karten.
- Keine Zusammenführung mit Preying-Mantis-End-of-turn-Damage.
- Kein Refactor weiterer Random-Karten wie AI Boon oder Corporate-Random-Fälle.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- LegalActions bleiben die einzige Quelle für PlayerActions.
- `applyAction`-Validierung wird nicht abgeschwächt.
- Keine verdeckten Kartendaten in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect, Undo, Replay, Logs oder Client-Fehlern.
- StateHash, Replay und Zufall bleiben deterministisch.
- Kartenkatalogebene und funktionale Runtime-Semantik bleiben getrennt.

## Automatische Fehlerbehandlung

- Bei rotem Paketcheck wird nur der aktuelle Paketumfang debuggt.
- Bei nicht risikofreiem Umbau wird ein Blocker mit Removal Condition dokumentiert.
- Bei Hidden-Info-, LegalAction-, Replay- oder Randomness-Vertragsrisiko wird gestoppt.
- Bei Merge-Konflikten werden beide fachlichen Intentionen geprüft; kein pauschales Revert.

## Sicherheitsblocker

Sofort stoppen, wenn eine Änderung:

- verdeckte Karteninformationen in öffentliche oder gegnerische Views projiziert;
- LegalActions erzeugt, die nicht aus bestehenden Regeln ableitbar sind;
- RandomCounter/RandomDrawRecords umgeht;
- Quest-Schaden in falsche Timingfenster verschiebt;
- permanente Zusatzaktionen nicht persistent oder mehrfach falsch gewährt;
- bestehende StateHash-/Replay-Tests durch fachliche Semantikänderung bricht.

## State Machine

```text
process_planned
  -> review_text_corrected
  -> quest_random_table_refactored
  -> guard_baseline_updated
  -> final_verified
  -> locally_merged_to_main
```

## Paketfolge

### Paket 0: Prozessartefakt

Ziel: diesen Prozess als verbindliche Arbeitsgrundlage festhalten.

Checks:

- `git diff --check`

Commit: `docs: plan quest random effect table process`

### Paket 1: Review-Text korrigieren

Ziel: die veraltete Formulierung im Card-Function-Abstraction-Review korrigieren.

Arbeit:

- Abschnitt `Nächste Umsetzung` so ändern, dass der Guard-Ausbau als umgesetzt beschrieben wird.
- Nächste Refactor-Slices als Quest for Cattekin, Code Viral Cache und Krumz sichtbar lassen.
- Keine Codeänderung.

Checks:

- `git diff --check`

Commit: `docs: clarify card function next slices`

### Paket 2: Quest-Random-Effect-Table refaktorieren

Ziel: Quest for Cattekin von kartenspezifischer Runtime-Semantik auf generische Start-of-turn-Random-Effect-Tabelle verschieben.

Arbeit:

- Ability-Definitionstypen für `start_turn_random_effect_table` und generische Outcomes ergänzen.
- CardImplementation von Quest parametrisieren.
- `questForCattekinPermanentActionGain` durch generischen persistenten Runner-Action-Modifikator-State ersetzen.
- Start-of-turn-Resolver generisch benennen und aus Parametern auswerten.
- Tests auf generische Outcome-/State-Felder anpassen.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test -- card-release-smokes`
- `git diff --check`

Commit: `refactor(engine): generalize quest random effect table`

### Paket 3: Guard-Baseline aktualisieren

Ziel: Card-Function-Abstraction-Review und JSON nach dem Quest-Slice aktualisieren.

Arbeit:

- `scripts/check-card-name-leakage-in-runtime.mjs --write-report` ausführen.
- Abstraktionsplan für Quest als erledigten Slice kennzeichnen.
- Guard-Check ausführen.

Checks:

- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `git diff --check`

Commit: `docs: update card function guard after quest slice`

### Paket 4: Finale Verifikation und Integration

Ziel: branchintern final verifizieren und lokal nach `main` integrieren.

Checks:

- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test -- card-release-smokes`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Abschluss:

- Arbeitsbranch sauber.
- Hauptworkspace auf `main` prüfen.
- Arbeitsbranch lokal nach `main` mergen.
- `git status --short` und `git diff --check` auf `main`.
- Worktree entfernen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_QUEST_RANDOM_EFFECT_TABLE`
- Arbeitsbranch: `codex/quest-random-effect-table`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Jedes Paket bekommt einen eigenen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite Engine Quest Random Effect Table vollständig und sequenziell von Paket 0 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden KI-Wissen-Einstiegsseiten, agents/release-implementation-agent.md und docs/architecture/engine/quest-random-effect-table-process-2026-06-13.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_QUEST_RANDOM_EFFECT_TABLE auf Branch codex/quest-random-effect-table.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt vorhanden.
- Review-Text widerspricht dem umgesetzten Guard-Stand nicht mehr.
- Quest for Cattekin nutzt `start_turn_random_effect_table`.
- Kein `questForCattekinPermanentActionGain`-Runtime-State bleibt.
- Quest-Tests decken No-op, Core Damage, Net Damage und permanente Zusatzaktion ab.
- Card-Function-Abstraction-Guard und Self-Test bestehen.
- Branch ist lokal nach `main` integriert.

## Abschlussnotiz 2026-06-13

Paket 0 bis Paket 3 sind abgeschlossen und committet. Ausgeführt wurden:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test -- card-release-smokes`
- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `git diff --check`

Der frische Worktree erhielt eine lokale `pnpm install --offline`-Dependency-Installation, weil eine reine `node_modules`-Junction Workspace-Pakete wie `@netgrid/shared` nicht korrekt auflösen konnte.
