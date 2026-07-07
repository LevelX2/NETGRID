# OwnDeckSnapshot Required Runtime Process 2026-07-07

## Status

`in_progress` auf Branch `codex/ai-deck-snapshot-required` im Worktree `C:\Projekte\NETGRID_AI_DECK_SNAPSHOT_REQUIRED`.

## Quelle/Vorgabe

Nutzerauftrag vom 2026-07-07: Normale KI-Partien dürfen nur noch mit gültigem, aktuellem `ownDeckSnapshot` laufen. Keine stillen Fallbacks, keine NeutralDoctrine bei fehlendem Snapshot und keine Legacy-V1-Doctrine-Nutzung als produktive KI-Runtime-Grundlage.

## Zielprüfung

Die Vorgabe ist automatisch umsetzbar. Gesamtziel, betroffene Module, harte Fehlerfälle, Nicht-Ziele und Tests sind bestimmt. Die Umsetzung bleibt local-first und ändert keine Engine-Regelautorität, keine LegalAction-Erzeugung und keine Hidden-Info-Grenzen.

## Gesamtziel

Normale Server-KI-Entscheidungen und normale Matchstarts mit KI brechen explizit ab, wenn der erwartete eigene Deck-Snapshot fehlt, ungültig, side-falsch, cardpool-falsch oder stale ist. Der produktive semantische Runtime-Kontext basiert auf V2 StrategyProfile, V2 Diagnostic, DeckCapabilities und StrategicIntentState.

## Annahmen

- `DeckSnapshot` aus `@netgrid/decks` ist die matchstartnahe immutable Quelle fuer Server-Matches.
- `AiDeckStrategyDeckSnapshot` bleibt die AI-interne minimale Snapshot-Form und kann aus `DeckSnapshot` validiert abgeleitet werden.
- Stale-Erkennung nutzt die im aktuellen Modell verfügbaren Metadaten: `deckSnapshotId`, `side`, `cards`, `cardPoolSnapshotId`, `formatProfileId` und `deckHash`/`publicMetadata.deckHash`, soweit vorhanden.
- Low-Level-Tests dürfen weiterhin explizite Test-Fixtures bauen, aber produktive Server- und Runtime-Pfade dürfen keinen Missing-Snapshot-Fallback importieren oder nutzen.

## Nicht-Ziele

- Keine neue Enterprise-Gate-Struktur.
- Keine Migration historischer SQLite-Matches.
- Keine stille Reparatur oder Neuerzeugung eines Snapshots während einer laufenden Partie.
- Keine Erweiterung der KI-Regelautorität; die KI bewertet weiterhin nur LegalActions.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jedes abgeschlossene Paket wird geprüft und committed.
- Der Hauptworkspace bleibt bis zum finalen lokalen Merge unberührt.
- Bei einem fachlichen Sicherheitsblocker stoppt der Prozess mit Blocker-Report.

## Automatische Fehlerbehandlung

- `ai_deck_snapshot_missing`: erwarteter Snapshot fehlt.
- `ai_deck_snapshot_empty`: Snapshot enthält keine Karten.
- `ai_deck_snapshot_side_mismatch`: Snapshot-Seite passt nicht zur KI-Seite.
- `ai_deck_snapshot_unknown_card`: Snapshot referenziert eine nicht im Runtime-Card-Pool vorhandene Karte.
- `ai_deck_snapshot_invalid`: Snapshot ist strukturell oder mengenbezogen ungültig.
- `ai_deck_snapshot_stale`: Snapshot-Metadaten oder Hash passen nicht zum erwarteten Match-Deck.

## Sicherheitsblocker

- Ein produktiver Pfad braucht nach der Änderung weiterhin `buildNeutralDeckStrategyProfile` bei fehlendem Snapshot.
- Ein produktiver Serverpfad ruft `buildAiDecisionInput` ohne `ownDeckSnapshot`.
- Der normale semantische Runtime-Pfad konsumiert wieder Legacy-V1-Doctrine-Felder als Strategiegrundlage.

## State Machine

1. `preflight`: Wiki, Agenten, Worktree und relevante Dateien prüfen.
2. `process_artifact`: Dieses Artefakt erstellen und committen.
3. `runtime_contract`: AI-Runtimevertrag und Snapshot-Assertion verschärfen.
4. `match_start_contract`: Server-Matchstart und KI-Step-/Preview-Pfade absichern.
5. `tests`: gezielte Regressionstests und Produktivpfad-Guards ergänzen.
6. `final_verify`: relevante Checks ausführen, Arbeitsbranch lokal nach `main` integrieren.

## Paketfolge

### Paket SNAP-1: Prozessartefakt und Preflight

Ziel: Umsetzungsprozess, Worktree und Scope dokumentieren.

Arbeit:
- Prozessartefakt anlegen.
- Worktree-Status prüfen.
- Paketcommit erstellen.

Checks:
- `git diff --check`

Done-Gate:
- Dokument existiert im Worktree und ist committed.

Commit-Message:
- `docs: define own deck snapshot required process`

### Paket SNAP-2: Runtime-Vertrag härten

Ziel: `buildAiDecisionInput` und `buildDeckDoctrineRuntimeContext` verlangen für normale Nutzung einen gültigen Snapshot.

Arbeit:
- Gemeinsame Assertion wie `assertValidAiDeckSnapshotForRuntime(...)` einführen.
- Optionalen Missing-Snapshot-Fallback und `missingDeckContextMode` aus produktivem Vertrag entfernen.
- Neutral-Profile nicht mehr aus normalem Runtime-Kontext erzeugen.
- Legacy-V1-Doctrine nicht als normale Runtime-Grundlage importieren oder zurückführen.

Checks:
- Relevante AI-Tests.
- `git diff --check`

Done-Gate:
- Normale AI-Decision ohne Snapshot wirft klaren Fehlercode.

Commit-Message:
- `feat(ai): require valid own deck snapshot for runtime input`

### Paket SNAP-3: Matchstart- und Server-KI-Pfad absichern

Ziel: Normale KI-Matches starten nur mit validierten privaten Deck-Snapshots; laufende KI-Entscheidungen reparieren nicht still.

Arbeit:
- Matchstart-Snapshots vor Aktivierung validieren.
- `runAiStep` und `previewAi` nutzen dieselbe Assertion gegen Match-Deck-Metadaten.
- Fehlende oder stale Snapshots führen zu expliziten SafeError-Codes.

Checks:
- Relevante Server-Tests.
- `git diff --check`

Done-Gate:
- KI-Matchstart mit ungültigem Snapshot startet nicht; laufender KI-Step mit fehlendem Snapshot bricht klar ab.

Commit-Message:
- `feat(server): enforce ai deck snapshots at match start`

### Paket SNAP-4: Tests und Produktivpfad-Guards

Ziel: Die Abnahmekriterien sind testseitig abgesichert.

Arbeit:
- AI-Decision-Tests fuer gültig, missing, wrong side und unknown card ergänzen.
- Server-Matchstart-/AI-Step-Tests für gültige und ungültige Snapshots ergänzen.
- Guard-Test gegen produktive Nutzung von NeutralDoctrine-/Legacy-V1-Fallbacks ergänzen.

Checks:
- Paketbezogene Vitest-Dateien.
- `pnpm typecheck`
- `git diff --check`

Done-Gate:
- Tests und Typecheck grün oder bekannte externe Ausfälle dokumentiert.

Commit-Message:
- `test(ai): cover required own deck snapshots`

### Paket SNAP-5: Integration

Ziel: Arbeitsbranch final prüfen und lokal nach `main` integrieren.

Arbeit:
- Arbeitsbranch sauber prüfen.
- Falls nötig, aktuelles `main` in den Arbeitsbranch integrieren.
- Finale Checks ausführen.
- Lokal nach `main` fast-forwarden oder begründet mergen.
- Worktree entfernen.

Checks:
- `git status --short`
- `git diff --check`
- Relevante Paketchecks erneut.

Done-Gate:
- `main` enthält die Paketcommits, Worktree ist entfernt, `/Goal` ist abgeschlossen.

## Verifikationsregeln

Minimal erforderlich:
- Paketbezogene Vitest-Tests in `packages/ai` und `apps/server`.
- `pnpm typecheck`.
- `git diff --check`.

Breitere Checks werden nur ergänzt, wenn die geänderten Pfade oder Testfehler es erfordern.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_AI_DECK_SNAPSHOT_REQUIRED`
- Arbeitsbranch: `codex/ai-deck-snapshot-required`
- Basis: aktueller Branch-Commit `9cf1e6a28`, weil `main` dessen Vorfahr ist und der Commit bereits einschlägige Doctrine-/Strategy-Änderungen enthält.
- `main` bleibt lokaler Integrationsbranch.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite OwnDeckSnapshot Required Runtime Process 2026-07-07 vollständig und sequenziell von SNAP-1 bis SNAP-5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensstartseiten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_DECK_SNAPSHOT_REQUIRED auf Branch codex/ai-deck-snapshot-required. Nutze den Hauptworkspace nur für finalen lokalen Merge beziehungsweise einen separaten Main-Merge-Worktree, falls der Hauptworkspace belegt ist. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Normale KI-Partie startet nur noch mit gültigem Snapshot.
- Fehlender oder veralteter Snapshot führt zu explizitem Fehler, nicht zu NeutralDoctrine.
- Kein produktiver Aufruf von `missingDeckContextMode: "legacy_compatible"` oder äquivalentem Missing-Snapshot-Fallback.
- Keine produktive Nutzung von Legacy-V1-Doctrine als KI-Runtime-Grundlage.
- Tests und Typecheck sind ausgeführt und dokumentiert.
