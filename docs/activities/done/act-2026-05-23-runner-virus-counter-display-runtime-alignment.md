---
activityId: act-2026-05-23-runner-virus-counter-display-runtime-alignment
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-23
startedAt: 2026-05-23
completedAt: 2026-05-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - data/cards/originalset-v1-cards.json
  - data/ai/ai-card-hints-active.json
  - packages/shared/src/index.ts
  - apps/web/app/api/cards/catalog-data.test.ts
checks:
  - node -e "JSON.parse(require('fs').readFileSync('data/cards/originalset-v1-cards.json','utf8')); JSON.parse(require('fs').readFileSync('data/ai/ai-card-hints-active.json','utf8')); console.log('json ok')"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web test app/api/cards/catalog-data.test.ts
  - corepack pnpm --filter @netgrid/engine test src/index.test.ts -t "Butcher Boy|Cascade|Deep Thought|Skivviss|virus CardImplementations"
---

# Runner-Viruskarten: Katalogtexte und Counter-Funktion gegen Spoiler prüfen

## Ziel

Runner-Viruskarten mit falschen generischen Recurring-/Virus-Platzhaltern sollen gegen den lokalen Spoilertext korrigiert werden. Dabei ist getrennt zu prüfen, ob nur der Anzeige-/Katalogtext falsch ist oder ob Runtime-/AI-Funktionalität fehlt.

## Kontext und Quellen

- Nutzerauftrag vom 2026-05-23: Spoilertexte gegen aktive Karten prüfen und echte Abweichungen als Activities schneiden.
- Vergleichsquelle: `docs/source/Runnerspoiler 1.0.txt`.
- Aktive Daten: `data/cards/originalset-v1-cards.json`, `packages/shared/src/index.ts`, `data/ai/ai-card-hints-active.json`.
- Auffällige Karten:
  - `onr_v1_009_butcher-boy` / Butcher Boy: `packages/shared` wirkt bereits näher am Spoiler, aber `data/cards` zeigt noch generischen Recurring-Credit-Platzhalter.
  - `onr_v1_010_cascade` / Cascade: `data/cards` und `packages/shared` zeigen generischen Recurring-Credit-Platzhalter; Spoiler verlangt erfolgreiche R&D-Runs, Cascade-Counter und Corp-Trash am Start ihrer Züge.
  - `onr_v1_017_deep-thought` / Deep Thought: `data/cards` und `packages/shared` zeigen generischen Recurring-Credit-Platzhalter; Spoiler verlangt erfolgreiche R&D-Runs, Thought-Counter und Top-of-R&D-Look ab drei Countern.
  - `onr_v1_064_skivviss` / Skivviss: `packages/shared` wirkt bereits spoilerkonform, aber `data/cards` zeigt generischen Recurring-Credit-Platzhalter.

## Scope

- Pro Karte prüfen, ob Katalogtext, Runtime-`rulesText`, Resolver, PublicEvents und AI-Hints den Spoilervertrag erfüllen.
- Anzeige-only-Abweichungen in `data/cards` beheben, wenn Runtime bereits stimmt.
- Bei Cascade und Deep Thought die vorhandene Runtime nicht als korrekt voraussetzen; erfolgreiche R&D-Run-Trigger, Counter, Purge-Verhalten und Start-of-turn-Folgen gezielt prüfen.
- Regressionen für Katalogtext und Engine-Verhalten ergänzen.

## Nicht im Scope

- Keine pauschale Änderung am Virus-/Purge-System außerhalb der vier Karten.
- Keine neue externe Regelquelle; führend ist der lokale Spoiler plus bestehende Projektentscheidungen.
- Keine Hidden-Info-Erweiterung: R&D-/HQ-Informationen bleiben nach PlayerView-Grenzen geschützt.

## Akzeptanzkriterien

- Keine der vier Karten zeigt im Katalog/Tooltip noch einen generischen `1 recurring credit for run costs`-Text.
- Butcher Boy und Skivviss sind, falls Runtime bereits korrekt ist, durch Text-/Katalogregressionen geschützt.
- Cascade legt/führt Cascade-Counter nach erfolgreichen R&D-Runs korrekt und zwingt/erzeugt den Corp-Trash-Effekt nach Spoiler.
- Deep Thought erlaubt ab drei Thought-Countern den zulässigen Blick auf die oberste R&D-Karte ohne Hidden-Info-Leak.
- AI-Hints beschreiben keine falsche Recurring-Credit-Rolle.

## Umsetzungshinweise

- Historische Nähe: `The Shell Traders` hatte denselben Katalogtext-Drift; dort wurde `data/cards` nach dem Tooltip-Befund korrigiert.
- Startpunkte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `apps/web/app/api/cards/catalog-data.test.ts`, `data/ai/ai-card-hints-active.json`.

## Ergebnisnotiz

Abgeschlossen am 2026-05-23.

- Katalogtexte, Shared-`rulesText` und AI-Hints fuer Butcher Boy, Cascade, Deep Thought und Skivviss gegen `docs/source/Runnerspoiler 1.0.txt` korrigiert.
- Recurring-Credit-Platzhalter aus Cascade, Deep Thought und allen vier Katalogeintraegen entfernt.
- Bestehende CardImplementations und fokussierte Engine-Regressionen fuer Counter, Start-of-turn-Folgen, Hidden-Zone-Schutz und Purge-nahe Viruspfade verifiziert.
