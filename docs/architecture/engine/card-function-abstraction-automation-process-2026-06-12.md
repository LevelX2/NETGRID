# Engine Card Function Abstraction Automation Process 2026-06-12

Status: in_progress

## Quelle/Vorgabe

Ausgang ist die Ergebnisanalyse aus `C:\Users\Lui\.codex\attachments\4c23f4a4-f4ce-4014-a5df-eeecd7a4207f\pasted-text.txt`.

Die Analyse stellt fest, dass Kartennamen in `CardImplementation`-Dateinamen, Exportnamen, Kommentaren, `cardDefinitionId` und Registry-Zuordnung zulässig sind, aber nicht in funktionaler Engine-Semantik wie `kind`-Literal, Runtime-State-Feld, Payload-Key, Resolvername oder verhaltenssteuernder Konstante.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: funktionale Engine-Codepfade von kartenspezifischen Namen entkoppeln.
- Reihenfolge: erst Inventar, dann Zielabstraktion, dann erster vertikaler Slice, dann Guard.
- Scope: Engine/CardImplementation/Shared-State/Skripte und Reviews.
- Nicht-Ziel: kosmetisches Entfernen zulässiger Katalognamen.
- Sicherheitsgrenzen: keine LegalAction-Erzeugung außerhalb bestehender Regeln, keine Hidden-Info-Ausweitung, keine Replay-/StateHash-/Randomness-Vertragsänderung.
- Verifikation: Engine-Typecheck, Engine-Tests, AI-Checks soweit sinnvoll, Format-Check für geänderte Dateien und `git diff --check`.

## Gesamtziel

Kartenspezifische funktionale Namen werden sichtbar inventarisiert, klassifiziert und durch generische Funktionsnamen und Parameterstrukturen vorbereitet. Mindestens `Preying Mantis` wird als vertikaler Muster-Slice refaktoriert:

- `preying_mantis_optional_action_unpreventable_core_damage` wird zu `optional_extra_action_with_delayed_damage`.
- `preying_mantis_gain_action` wird zu einer generischen Ability-Identität.
- `resolvePreyingMantisGainAction` wird zu einem Funktionsresolver.
- kartenspezifische Preying-Mantis-Turn-Flags werden durch generische Ability-Use- und Delayed-Effect-State-Felder ersetzt.

## Annahmen

- Die private Version-0-Umgebung benötigt keine Rückwärtskompatibilität für alte Runtime-State- oder Replay-Formate, solange aktuelle Tests grün bleiben.
- Tests dürfen konkrete Kartennamen behalten, wenn sie bewusst konkrete Kartenverträge prüfen.
- Bestehende kartenspezifische Problemstellen außerhalb des ersten Slice werden als `refactor_required` oder `deferred` dokumentiert, wenn sie nicht risikolos im aktuellen Prozess umsetzbar sind.
- Der Guard startet als lokaler Architektur-Check und wird konservativ klassifizieren, damit zulässige Katalogreferenzen nicht blockieren.

## Nicht-Ziele

- Kein Entfernen von Kartennamen aus CardImplementation-Dateipfaden, Exportnamen, `cardDefinitionId`, Registry-Mapping oder Testtiteln.
- Keine neue Kartenfreigabe.
- Keine KI-/Planner-Wirkung.
- Keine Engine-Regeländerung außer neutraler Umbenennung/Parametrisierung bestehender funktionaler Pfade.
- Keine Public-Payload- oder Hidden-Info-Erweiterung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- LegalActions bleiben die einzige Quelle für PlayerActions.
- `applyAction` validiert Aktion, Seite, Timing, Kosten, Ziel, StateVersion und Choices erneut.
- Keine verdeckten Kartendaten in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect, Undo, Replay, Logs oder Client-Fehlern.
- StateHash, Replay und Zufall bleiben deterministisch.
- Katalogebene und funktionale Runtime-Semantik bleiben getrennt.

## Automatische Fehlerbehandlung

- Bei rotem Paketcheck wird nur der aktuelle Paketumfang debuggt.
- Bei nicht eindeutig risikofreiem Umbau wird die Fundstelle als `deferred` dokumentiert.
- Bei Hidden-Info-, LegalAction- oder Replay-Vertragsrisiko wird gestoppt und ein Blocker mit Removal Condition dokumentiert.
- Bei Merge-Konflikten werden beide fachlichen Intentionen geprüft; kein pauschales Revert.

## Sicherheitsblocker

Sofort stoppen, wenn eine Änderung:

- verdeckte Karteninformationen in öffentliche oder gegnerische Views projiziert;
- LegalActions erzeugt, die nicht aus bestehenden Regeln ableitbar sind;
- `applyAction`-Revalidation abschwächt;
- RandomCounter/RandomDrawRecords umgeht;
- bestehende StateHash-/Replay-Tests durch fachliche Semantikänderung bricht.

## State Machine

```text
process_planned
  -> inventory_reported
  -> abstraction_plan_documented
  -> vertical_slice_refactored
  -> invariant_guard_added
  -> final_verified
  -> locally_merged_to_main
```

## Paketfolge

### Paket 0: Prozessartefakt

Ziel: diesen Prozess als verbindliche Arbeitsgrundlage festhalten.

Checks:

- `git diff --check`

Commit: `docs: plan card function abstraction process`

### Paket 1: Inventar und Report

Ziel: kartennamenspezifische funktionale Fundstellen im Scope maschinenlesbar und lesbar erfassen.

Artefakte:

- `scripts/check-card-name-leakage-in-runtime.mjs`
- `docs/reviews/engine/card-function-abstraction-2026-06-12.md`
- `docs/reviews/engine/card-function-abstraction-2026-06-12.json`

Checks:

- `node scripts/check-card-name-leakage-in-runtime.mjs --write-report`
- `git diff --check`

Commit: `docs: inventory functional card-name engine coupling`

### Paket 2: Abstraktionsplan

Ziel: für die priorisierten Fundklassen generische Zielfunktionen, Parameter und Umsetzungsreihenfolge dokumentieren.

Artefakte:

- Aktualisierte Review-Artefakte aus Paket 1.

Checks:

- `node scripts/check-card-name-leakage-in-runtime.mjs --write-report`
- `git diff --check`

Commit: `docs: map card-name coupling to generic engine functions`

### Paket 3: Preying-Mantis-Slice

Ziel: den ersten vertikalen Slice generisch refaktorieren.

Arbeit:

- CardImplementation-Kind und Parameter generisch machen.
- LegalAction-Payload generisch benennen.
- Resolver nach Funktionsart benennen.
- Preying-Mantis-spezifische Turn-Flags durch generische Ability-Use-/Delayed-Effect-Strukturen ersetzen.
- Tests auf neue funktionale Namen anpassen, Kartentesttitel aber beibehalten.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test`
- `git diff --check`

Commit: `refactor(engine): generalize optional extra action delayed damage`

### Paket 4: Invariant-Check

Ziel: neue kartenspezifische funktionale Namen außerhalb erlaubter Katalogzonen melden.

Arbeit:

- Check-Modus ergänzen, der ohne `--write-report` als Guard läuft.
- Root-Script `check:card-function-abstraction` ergänzen.
- Review-Artefakte aktualisieren.

Checks:

- `corepack pnpm check:card-function-abstraction`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test`
- `git diff --check`

Commit: `chore: add card function abstraction guard`

### Paket 5: Finale Verifikation und Integration

Ziel: branchintern final verifizieren und lokal nach `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Abschluss:

- Arbeitsbranch sauber.
- `main` in Arbeitsbranch integrieren, falls nötig.
- Hauptworkspace auf `main` prüfen.
- Arbeitsbranch lokal nach `main` mergen.
- `git status --short` und `git diff --check` auf `main`.
- Worktree entfernen.

## Verifikationsregeln

Paketchecks werden nicht übersprungen. Falls ein breit angelegter Check aus bestehender fremder Baseline scheitert, wird die konkrete Fehlstelle dokumentiert und ein engerer, paketbezogener Check nachgezogen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CARD_FUNCTION_ABSTRACTION`
- Arbeitsbranch: `codex/card-function-abstraction`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace wird erst für den finalen Merge genutzt.
- Jedes Paket bekommt einen eigenen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite Engine Card Function Abstraction vollständig und sequenziell von Paket 0 bis Paket 5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden KI-Wissen-Einstiegsseiten, agents/architecture-review-agent.md und docs/architecture/engine/card-function-abstraction-automation-process-2026-06-12.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARD_FUNCTION_ABSTRACTION auf Branch codex/card-function-abstraction.
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
- Report und JSON-Inventar vorhanden.
- Jede priorisierte Fundstelle ist `allowed`, `deferred` oder `refactor_required`.
- Preying-Mantis-Slice nutzt generische Funktionsnamen und generischen Runtime-State.
- Guard gegen neue kartenspezifische funktionale Namen ist vorhanden.
- Paket- und Finalchecks sind dokumentiert.
- Branch ist lokal nach `main` integriert.
