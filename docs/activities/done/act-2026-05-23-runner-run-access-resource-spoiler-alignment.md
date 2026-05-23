---
activityId: act-2026-05-23-runner-run-access-resource-spoiler-alignment
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
  - corepack pnpm --filter @netgrid/engine test src/index.test.ts -t "I Spy|R&D-Protocol Files|R&D Protocol|R&D Interface|Rigged Investments|Top Runners|MIT West Tier|Temple Microcode Outlet|Private LDL Access|Restrictive Net Zoning|Code Viral Cache|Deal with Militech|Edited Shipping Manifests|Hunt Club BBS"
---

# Runner-Run-, Access- und Resource-Karten gegen Spoiler abgleichen

## Ziel

Mehrere Runner-Karten aus Run-/Access-/Resource-Familien zeigen entweder falsche Katalogtexte oder abweichende Funktionsverträge. Diese Karten sollen einzeln gegen den lokalen Spoiler geprüft und korrigiert werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-05-23: Abweichungen prüfen, echte Fehler als Activities in die Inbox.
- Vergleichsquelle: `docs/source/Runnerspoiler 1.0.txt`.
- Auffällige Karten:
  - `onr_v1_032_i-spy` / I Spy: Katalog/Runtime zeigt Stack-Top-Reveal; Spoiler verlangt Spy-Counter in Data Fort, Expose aller Karten in/auf dem Fort, Corp-Removal für `[4]`, nur direkt nach erfolgreichem Run.
  - `onr_v1_050_r-and-d-protocol-files` / R&D-Protocol Files: Katalog enthält offenbar falschen Microcyb-Owl-/Stealth-Text; Spoiler: `A: Make a run on R&D, but instead of accessing cards, look at the top five cards of R&D.`
  - `onr_v1_082_deal-with-militech` / Deal with Militech: `packages/shared` wirkt korrekt, aber `data/cards` fehlt der +1-Strength-Text der Militech-Counter.
  - `onr_v1_084_edited-shipping-manifests` / Edited Shipping Manifests: `packages/shared` wirkt korrekt, aber `data/cards` sagt fälschlich Corp zieht 1 Karte statt Runner erhält `[10]`.
  - `onr_v1_091_hunt-club-bbs` / Hunt Club BBS: Katalogtext präzisiert `Corp cards`; wahrscheinlich nur Anzeigeformulierung. Trotzdem beim Paket prüfen, ob alle Tooltip-/Katalogpfade denselben Text verwenden.
  - `onr_v1_101_mit-west-tier` / MIT West Tier: wahrscheinlich sinngemäß korrekt; prüfen, ob `remove from game instead of trashing` in Runtime/Replay sauber ist.
  - `onr_v1_106_private-ldl-access` / Private LDL Access: wahrscheinlich sinngemäß korrekt; prüfen, ob Access wirklich ersetzt und nicht zusätzlich ausgeführt wird.
  - `onr_v1_114_temple-microcode-outlet` / Temple Microcode Outlet: Katalog sagt `reveal it`; Spoiler sagt `Show that program to the Corp`. Sichtbarkeit und PublicEvent/PlayerView prüfen.
  - `onr_v1_139_r-and-d-interface` / R&D Interface: wahrscheinlich Text-only-Präzisierung; Funktion zusätzlicher R&D-Zugriff prüfen.
  - `onr_v1_155_code-viral-cache` / Code Viral Cache: wahrscheinlich sinngemäß korrekt, aber Purge-Begriff und Corp-Trash-Action prüfen.
  - `onr_v1_173_restrictive-net-zoning` / Restrictive Net Zoning: Zusatzkosten in `data/cards` sind `1`, Spoiler sagt `[2]`; Funktion und Katalog prüfen.
  - `onr_v1_174_rigged-investments` / Rigged Investments: Katalog zeigt Recurring-Credit-Text; Spoiler verlangt 12-Bit-Pool, Start-of-turn `[1]` nehmen, Trash bei leer.
  - `onr_v1_184_top-runners-conference` / Top Runners' Conference: Gain `3` statt Spoiler `[2]`; Funktion und Katalog prüfen.

## Scope

- Karten einzeln gegen Spoilertext, `data/cards`, `packages/shared`, Engine-Resolver, PublicEvents, UI-Tooltip und AI-Hints prüfen.
- Text-only-Fälle korrigieren, wenn Runtime nachweislich stimmt.
- Funktionsfälle mit Engine-/AI-Tests absichern.
- Hidden-Zone-/Expose-/Access-Fälle explizit auf Hidden-Info-Leaks prüfen.

## Nicht im Scope

- Keine pauschale Neuimplementierung aller Run-/Access-Karten.
- Keine Änderung an allgemeinen Breach-/Run-Regeln ohne kartenbezogene Notwendigkeit.
- Keine Erweiterung des Kartenpools.

## Akzeptanzkriterien

- I Spy und R&D-Protocol Files erfüllen nicht mehr falsche Hidden-Zone-/Stealth-Platzhalterfunktionen.
- Edited Shipping Manifests, Deal with Militech, Restrictive Net Zoning, Rigged Investments und Top Runners' Conference haben korrekte Werte und Effekte.
- Temple Microcode Outlet zeigt die gefundene Karte der Corp side-sicher.
- Private LDL Access und R&D Interface sind durch Regressionen gegen falsches zusätzliches Access-Verhalten geschützt.
- Katalog, Board, Tooltip und Runtime-Text sind für alle geänderten Karten konsistent.

## Umsetzungshinweise

- Startpunkte: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `apps/web/app/api/cards/catalog-data.test.ts`, `apps/web/app/page.tsx`.
- Falls `Hunt Club BBS`, `MIT West Tier`, `Private LDL Access`, `R&D Interface` oder `Code Viral Cache` sich als reine Formulierungsfälle bestätigen, nur Katalog-/Regression nachziehen und im Ergebnis dokumentieren.

## Ergebnisnotiz

Abgeschlossen am 2026-05-23.

- Katalogtexte, Shared-`rulesText` und AI-Hints der genannten Run-/Access-/Resource-Karten gegen `docs/source/Runnerspoiler 1.0.txt` korrigiert.
- Bestehende CardImplementations und fokussierte Engine-Regressionen fuer I Spy, R&D-Protocol Files, R&D Interface, Rigged Investments, Top Runners' Conference, MIT West Tier, Temple Microcode Outlet, Private LDL Access, Restrictive Net Zoning, Code Viral Cache, Deal with Militech, Edited Shipping Manifests und Hunt Club BBS verifiziert.
- Alte Platzhaltertexte wie Microcyb-Owl-Stealthtext, falsche Manifests-Auszahlung, falsche Restrictive-Net-Zoning-Kosten, falsche Rigged-Investments-Counter und Top-Runners-`Gain 3` entfernt.
