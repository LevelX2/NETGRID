---
activityId: act-2026-05-23-runner-prevention-tag-protection-spoiler-alignment
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
  - corepack pnpm --filter @netgrid/engine test src/index.test.ts -t "Armored Fridge|Green Knight|Techtronica|Fall Guy|Nomad Allies|Trauma Team|Umbrella Policy|Wilson|Joan of Arc|Lifesaver|Nasuko"
---

# Runner-Prevention und Tag-Schutz: falsche Platzhalterfunktionen bereinigen

## Ziel

Runner-Hardware/-Resources/-Programme aus der Prevention-/Tag-Schutz-Familie sollen gegen `docs/source/Runnerspoiler 1.0.txt` geprüft werden. Mehrere aktive Karten tragen offenbar generische Damage-Prevention-Platzhalter, obwohl der Spoiler Tag-Avoidance, Trash-Prevention, Counter oder Sonderaktionen verlangt.

## Kontext und Quellen

- Nutzerauftrag vom 2026-05-23: Sinngemäße Abweichungen aus Spoilervergleich in Activities überführen.
- Auffällige Karten:
  - `onr_v1_038_joan-of-arc` / Joan of Arc: Katalog/Runtime beschreibt Net/Core-Damage-Prevention; Spoiler schützt andere installierte Programme vor Trash und kann Joan auf die Hand zurücknehmen.
  - `onr_v1_121_armored-fridge` / Armored Fridge: Katalog/Runtime vereinfacht zu 2 Meat-Prevention pro Turn; Spoiler verlangt 7 Ablative-Counter, je Counter 1 Meat-Prevention, Trash beim letzten Counter.
  - `onr_v1_128_green-knight-surge-buffers` / Green Knight: Katalog/Runtime verhindert 2 Net; Spoiler verhindert 1 Net pro Turn.
  - `onr_v1_130_lifesaver-nanosurgeons` / Lifesaver: Katalog/Runtime nur Core-Prevention; Spoiler: `A: Draw two cards` nach Damage in den letzten drei Aktionen plus `[T]: Prevent 1 brain damage.`
  - `onr_v1_135_nasuko-cycle` / Nasuko Cycle: Katalog/Runtime Damage-Prevention; Spoiler: `[3]: Avoid receiving a tag.`
  - `onr_v1_143_techtronica-utility-suit` / Techtronica: Katalog/Runtime stark verkürzt; Spoiler: +1 MU, 1 Meat-Prevention, 5 Link-Bits, Refresh, Deck-Limit.
  - `onr_v1_161_fall-guy` / Fall Guy: Katalog/Runtime Damage-Prevention; Spoiler: `[T]: Avoid receiving a tag.`
  - `onr_v1_170_nomad-allies` / Nomad Allies: Katalog/Runtime Damage-Prevention; Spoiler: `A, [1]` Tag entfernen und `[T]` Tag vermeiden.
  - `onr_v1_185_trauma-team` / Trauma Team: Katalog/Runtime pauschale 2 Meat-Prevention; Spoiler: zwei Trauma-Counter, Trauma-Counter verhindert 1 Meat, `A` legt Counter nach.
  - `onr_v1_186_umbrella-policy` / Umbrella Policy: Katalog/Runtime Damage-Prevention; Spoiler verhindert Trash einer installierten Programm- oder Hardwarekarte.
  - `onr_v1_187_wilson-weeflerunner-apprentice` / Wilson: Katalog/Runtime nur 1 Meat-Prevention; Spoiler gibt optionale Run-only-Aktion mit Spend-Limit, `[T]` Tag-Avoid und `[T]` beliebige Meat-Prevention.

## Scope

- Für jede genannte Karte prüfen, ob Katalogtext, Runtime-`rulesText`, LegalActions, Trigger, Costs, Tap/Use-Limits und AI-Hints den Spoiler erfüllen.
- Karten mit bloß falschem Katalogtext gezielt korrigieren; Karten mit falscher Funktionalität in Engine/AI reparieren.
- Counter- und Tap-Zustände side-sicher, replay-/StateHash-stabil und reconnect-fähig modellieren.

## Nicht im Scope

- Keine generische Neufassung aller Damage-Prevention-Karten.
- Keine Änderung am globalen Tag-/Damage-System außerhalb der benötigten Kartenpfade.
- Keine Hidden-Info-Ausnahme für Präventionsentscheidungen.

## Akzeptanzkriterien

- Keine genannte Karte zeigt oder nutzt einen generischen Prevention-Platzhalter, wenn der Spoiler etwas anderes verlangt.
- Tag-Avoidance-Karten erzeugen nur legale Reaktions-/Aktionsfenster und zahlen/tappen korrekt.
- Counter-Karten wie Armored Fridge und Trauma Team initialisieren, verbrauchen, refreshen oder trashen nach Spoiler.
- Techtronica deckt MU, Meat-Prevention, Link-Bits und Deck-Limit konsistent ab.
- Tests decken mindestens einen positiven und einen stale/wrong-side/hidden-info-sicheren Negativfall je geänderter Mechanikfamilie ab.

## Umsetzungshinweise

- Startpunkte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `apps/web/app/action-board-ui.ts`, `data/ai/ai-card-hints-active.json`.
- Einige Karten könnten höhere Mechanikkomplexität haben; falls eine Karte nicht in einem kleinen Schnitt sauber lösbar ist, ein enger Folgeauftrag pro Karte anlegen statt halb umzusetzen.

## Ergebnisnotiz

Abgeschlossen am 2026-05-23.

- Katalogtexte, Shared-`rulesText` und AI-Hints der genannten Prevention-/Tag-Schutz-Karten gegen `docs/source/Runnerspoiler 1.0.txt` korrigiert.
- Runtime-CardImplementations fuer Joan of Arc, Armored Fridge, Green Knight, Lifesaver, Nasuko Cycle, Techtronica Utility Suit, Fall Guy, Nomad Allies, Trauma Team, Umbrella Policy und Wilson waren vorhanden und wurden ueber bestehende fokussierte Engine-Regressionen verifiziert.
- Alte generische Damage-Prevention-Platzhalter aus Katalog/Shared/Hints fuer die betroffenen Karten entfernt.
