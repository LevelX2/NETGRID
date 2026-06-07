---
activityId: act-2026-06-07-ai-hq-memory-debug-surface
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-hq-hidden-install-candidates
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - apps/web/app/ai-decision-debug-ui.ts
  - apps/web/app/ai-decision-debug-ui.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "names fair known cards and remote candidates in Runner DecisionDebug memory"
  - corepack pnpm --filter @netgrid/web exec vitest run app/ai-decision-debug-ui.test.ts
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - corepack pnpm --filter @netgrid/web exec tsc --noEmit
  - git diff --check
---

# HQ-Hand-Wissen im DecisionDebug differenziert anzeigen

## Ziel

Die KI-Debuganzeige soll nicht mehr nur `x/y Karten namentlich bekannt` zeigen, wenn intern sichere Restkarten und Kandidatengruppen existieren. Sie soll side-sicher sichtbar machen, was sicher bekannt, unbekannt und mehrdeutig ist.

## Kontext und Quellen

- Vorgängerpakete:
  - `act-2026-06-07-ai-hq-memory-ledger-foundation`
  - `act-2026-06-07-ai-hq-hidden-install-candidates`
- Aktuelle UI-Stelle: `apps/web/app/page.tsx` zeigt im DecisionDebug `HQ-Hand-Wissen` und `HQ-Hand-Inhalt` aus `opponentModel.hqHandMemory`.
- Aktuelle AI-Debug-Zusammenfassung: `packages/ai/src/index.ts` baut `hqHandMemory.knownCards` aus `knownDefinitions`.

## Scope

- DecisionDebug-Daten side-sicher um ergänzende HQ-Memory-Felder erweitern, falls diese nach den Vorgängerpaketen verfügbar sind:
  - sichere bekannte Karten,
  - unbekannte Restkarten,
  - Kandidatengruppen mit Count und Kategorie,
  - kurze Invalidierungs-/Unsicherheitsgründe.
- Webanzeige knapp und lesbar anpassen:
  - z. B. `2 sicher bekannt / 1 unklar / 1 unbekannt`,
  - Kandidaten ohne echte verdeckte Instanzdaten anzeigen.
- Tests für Debug-Redaction und UI-Format ergänzen.

## Nicht im Scope

- Keine Änderung der Belief-Logik selbst.
- Keine neue Offenlegung verdeckter HQ-Karten, Instanz-IDs, Decklisten, `cardInstances`, `privatePayload` oder FullState.
- Kein Board-Redesign und keine Änderung der normalen Kartenanzeige.
- Keine Anpassung der KI-Scoringgewichte.

## Akzeptanzkriterien

- [x] DecisionDebug kann sichere, unbekannte und mehrdeutige HQ-Hand-Anteile getrennt darstellen.
- [x] Die Anzeige bleibt bei altem/fehlendem Ledger-Feld rückwärtskompatibel.
- [x] Redaction-Tests verhindern `cardInstances`, `privatePayload`, FullState, Session-/Reconnect-Tokens und echte nicht gesehene Kartenidentitäten.
- [x] Web-Tests für die relevante Debug-Zeile sind ergänzt oder bestehende Tests angepasst.
- [x] `@netgrid/ai` und `@netgrid/web` fokussierte Tests/Typechecks sowie `git diff --check` sind grün.

## Umsetzungshinweise

- Die Anzeige ist Diagnosefläche, nicht normales UI-Gameplay. Sie darf präzise, aber kompakt sein.
- Keine langen Erklärtexte im Spielbildschirm; vorhandene DecisionDebug-Tabellenstruktur nutzen.
- Wenn Kandidatengruppen noch nicht im Debug-DTO stabil sind, dieses Paket blockiert lassen statt aus UI-Seite zu raten.

## Ergebnisnotiz

DecisionDebug gibt für HQ-Hand-Memory nun eine side-sichere Zusammenfassung mit sicheren bekannten Karten, unklaren Kandidaten und unbekannten Restkarten aus. Die Web-Debuganzeige nutzt diese Zusammenfassung kompakt und bleibt beim alten DTO-Format rückwärtskompatibel. Fokussierte AI-/Web-Tests, beide Typechecks und `git diff --check` sind grün.
