---
activityId: act-2026-05-23-runner-icebreaker-spoiler-alignment
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
  - packages/engine/src/index.test.ts
  - apps/web/app/api/cards/catalog-data.test.ts
checks:
  - node -e "JSON.parse(require('fs').readFileSync('data/cards/originalset-v1-cards.json','utf8')); JSON.parse(require('fs').readFileSync('data/ai/ai-card-hints-active.json','utf8')); console.log('json ok')"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web test app/api/cards/catalog-data.test.ts
  - corepack pnpm --filter @netgrid/engine test src/index.test.ts -t "P3.44|P3.45|Ramming Piston|Jackhammer|core runner breakers"
---

# Runner-Icebreaker: Spoilertexte, Kosten und Sonderregeln abgleichen

## Ziel

Die aktiven Runner-Icebreaker-Texte und ihre Runtime-Funktion sollen gegen `docs/source/Runnerspoiler 1.0.txt` abgeglichen und korrigiert werden, ohne bestehende Hidden-Info-, LegalAction-, Replay- oder StateHash-Grenzen zu schwächen.

## Kontext und Quellen

- Nutzerauftrag vom 2026-05-23: Alle aktiven Kartentexte gegen Spoiler prüfen; bei fehlender Funktionalität Activity anlegen.
- Vergleichsquelle: `docs/source/Runnerspoiler 1.0.txt`.
- Aktive Kartendaten: `data/cards/originalset-v1-cards.json`.
- Runtime-Basis: `packages/shared/src/index.ts` und Engine-Resolver/Tests.
- Auffällige Karten:
  - `onr_v1_015_codeslinger` / Codeslinger: Katalog/Runtime zeigt `0 credits: Break sentry subroutine`; Spoiler sagt `[1]: Break sentry subroutine.`
  - `onr_v1_018_dogcatcher` / Dogcatcher: Katalog/Runtime wirkt als generischer Breaker; Spoiler begrenzt auf Pit Bull, Hellhound, Bloodhound oder Watchdog.
  - `onr_v1_019_dropp` / Dropp: Katalog/Runtime zeigt falsche Kosten `1/2` und fehlt der Run-Ende-Nachteil; Spoiler sagt `[0]: Break ice subroutine. [1]: +1 strength. Using Dropp [TM] ends your run.`
  - `onr_v1_036_jackhammer` / Jackhammer: Text/Runtime prüfen, ob der Stealth-Verlust nach Wall-Break wirklich umgesetzt ist; Spoiler verlangt Verlust von `[1]` aus einer Stealth-Karte, falls möglich.
  - `onr_v1_052_raffles` / Raffles: Katalog/Runtime zeigt Break-Kosten `0`; Spoiler sagt `[1]: Break code gate subroutine.`
  - `onr_v1_053_ramming-piston` / Ramming Piston: `packages/shared` wirkt bereits spoilerkonform, aber `data/cards` hatte im Audit noch einen falschen Trace-Limit-Text. Katalog-/Tooltiptext auf Runtime/Spoiler paritätisch prüfen.
  - `onr_v1_066_snowball` / Snowball: Katalog/Runtime fehlt der temporäre Stärkeaufbau pro gebrochener Subroutine während des Runs.

## Scope

- Betroffene Kartentexte in aktiven Katalogdaten und Runtime-Definitionen prüfen und korrigieren.
- LegalActions/Resolver nur dort ändern, wo der bestätigte Spoilertext funktional nicht erfüllt wird.
- AI-Hints und Entscheidungsscores nur nachziehen, wenn geänderte Kosten, Ziele oder Nebenwirkungen die KI-Auswahl beeinflussen.
- Fokussierte Engine- und AI-Regressionsfälle für jede geänderte Funktionskarte ergänzen.

## Nicht im Scope

- Keine Freischaltung neuer Karten außerhalb der genannten Karten.
- Keine generische Icebreaker-Architektur neu bauen, sofern ein enger Resolver-/Definition-Fix reicht.
- Keine Änderung an verdeckten ICE-Informationen oder erlaubten LegalActions außerhalb sichtbarer/zulässiger Informationen.

## Akzeptanzkriterien

- Codeslinger und Raffles verwenden die Spoiler-Break-Kosten.
- Dogcatcher bricht nur die im Spoiler genannten ICE-Untertypen/Namen.
- Dropp hat Spoiler-Kosten und beendet den Run nach Nutzung.
- Jackhammer und Ramming Piston verlieren die geforderten Stealth-Credits, falls möglich, und bleiben replay-/StateHash-stabil.
- Snowball erhält temporäre Stärke nur für im aktuellen Run gebrochene Subroutinen.
- Katalog, Board, Tooltip und Runtime-`rulesText` widersprechen sich für diese Karten nicht.
- Tests decken Kosten, Zielbegrenzungen, Nebenwirkungen, Wrong-Side/Stale-Action und AI-Score-Auswirkungen ab.

## Umsetzungshinweise

- Startpunkte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, vorhandene Icebreaker-Tests in `packages/engine/src/index.test.ts`, AI-Tests in `packages/ai/src/index.test.ts`.
- `Ramming Piston` kann ein Text-only-Fall sein; vor Änderung prüfen, ob die Funktion bereits stimmt.
- Für `Dogcatcher` ist vermutlich eine ICE-Namen-/Subtype-Whitelist nötig; keine verdeckten gegnerischen ICE-Informationen in Runner-LegalActions leaken.

## Ergebnisnotiz

Abgeschlossen am 2026-05-23.

- Katalog- und Shared-Texte fuer Codeslinger, Dogcatcher, Dropp, Jackhammer, Raffles, Ramming Piston und Snowball gegen `docs/source/Runnerspoiler 1.0.txt` korrigiert.
- Shared-Definitionen fuer Codeslinger/Raffles-Kosten, Dropp-Kosten, Dogcatcher-Zieltext, Jackhammer-/Ramming-Stealth-Verlusttext, Ramming-`Noisy`-Subtype und Snowball-Run-Staerke angeglichen.
- AI-Hints fuer die geaenderten Runner-Icebreaker nachgezogen, insbesondere Dogcatcher-Restriktion, Dropp-Ende-des-Runs und Snowball-Run-Staerke.
- Bestehende Engine-CardImplementations fuer Dogcatcher, Dropp, Jackhammer, Ramming Piston und Snowball waren funktional bereits spoilerkonform; der Ramming-Test wurde auf den jetzt korrekt sichtbaren `Noisy`-Subtype angepasst.
