---
activityId: act-2026-05-23-corp-spoiler-alignment-values-and-omitted-effects
status: inbox
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Corp-Karten: Zahlenwerte und ausgelassene Spoilereffekte korrigieren

## Ziel

Corp-Karten mit Zahlenabweichungen oder ausgelassenen Spoilereffekten sollen gegen `docs/source/Corpspoiler 1.0.txt` geprüft und korrigiert werden. Der Fokus liegt auf Engine-Korrektheit, weil mehrere Karten bereits `human_playable`, `deck_legal` und `ai_supported` sind.

## Kontext und Quellen

- Nutzerauftrag vom 2026-05-23: Spoiler-/Kartenvergleich im Einzelnen prüfen und echte Fehler als Activity anlegen.
- Vergleichsquelle: `docs/source/Corpspoiler 1.0.txt`.
- Auffällige Karten:
  - `onr_v1_220_tycho-extension` / Tycho Extension: Katalog `No additional Regeltext.` vs Spoiler `n/a`; wahrscheinlich nur Anzeige-/Sprachmischung, aber Katalogtext bereinigen.
  - `onr_v1_222_ball-and-chain` / Ball and Chain: `data/cards` zeigt Encounter-Tax `1`, `packages/shared` wirkt mit `2` korrekt. Katalog-/Tooltiptext synchronisieren und Runtime prüfen.
  - `onr_v1_234_data-darts` / Data Darts: `data/cards` zeigt 1 Net und zusätzlich ETR; `packages/shared` wirkt mit 3 Net und Next-ICE-unbreakable korrekt. Katalog-/Runtime-Parität prüfen.
  - `onr_v1_236_data-raven` / Data Raven: `data/cards` fügt ETR hinzu und fehlt Runner-Removal für `[1]`; `packages/shared` wirkt näher am Spoiler. Katalog, LegalAction und Counter-Removal prüfen.
  - `onr_v1_317_data-masons` / Data Masons: wahrscheinlich sinngemäß korrekt; prüfen, ob Modifier global/fortbezogen nach Spoiler wirkt.
  - `onr_v1_320_encoder-inc` / Encoder, Inc.: Katalog/Runtime reduziert Code-Gate-Rez um 2; Spoiler reduziert um `[1]` und fügt allen Code Gates zusätzliche `End the run`-Subroutine hinzu.
  - `onr_v1_341_skalderviken-sa-beta-test-site` / Skälderviken SA Beta Test Site: wahrscheinlich sinngemäß korrekt (`[2]` Black-ICE-Rez-Reduktion), Katalog-/Runtime-Parität prüfen.
  - `onr_v1_349_aardvark` / Aardvark: `packages/shared` wirkt spoilerkonform, aber `data/cards` fehlt der Bit-Verlust-/weiterer-Icebreaker-Teil. Katalog-/Runtime-Parität prüfen.
  - `onr_v1_351_bizarre-encryption-scheme` / Bizarre Encryption Scheme: `packages/shared` wirkt spoilerkonform, aber `data/cards` ist enger/verkürzt. Katalog-/Runtime-Parität und delayed-score Edge Cases prüfen.
  - `onr_v1_352_chester-mix` / Chester Mix: Installkostenreduktion `1` statt Spoiler `[2]`; Funktion und Katalog korrigieren.
  - `onr_v1_353_chimera` / Chimera: wahrscheinlich sinngemäß korrekt; prüfen, ob `daemon`-Trash nicht fälschlich nur installierte Daemons trifft, falls Spoiler weiter ist.

## Scope

- Katalogdaten, Runtime-`rulesText`, Resolver, LegalActions, AI-Hints und Tests für die genannten Corp-Karten prüfen.
- Zahlenfehler und ausgelassene Effekte korrigieren.
- Bei Karten, deren Runtime bereits stimmt, nur Katalog-/Tooltiptext und Regression ergänzen.
- PublicEvents und PlayerViews auf Hidden-Info-Sicherheit prüfen, besonders bei ICE/Subroutine- und Access-Ambush-Effekten.

## Nicht im Scope

- Keine globale Änderung am ICE-/Asset-/Upgrade-Modell ohne kartenbezogene Notwendigkeit.
- Keine Änderung an modernen Trace-/Open-Bidding-Projektentscheidungen.
- Keine externe Datenquelle gegenüber dem lokalen Spoiler bevorzugen.

## Akzeptanzkriterien

- Encoder, Inc. reduziert Code-Gate-Rez um 1 und fügt Code Gates die zusätzliche ETR-Subroutine hinzu.
- Chester Mix reduziert ICE-Installkosten auf dem Fort um 2.
- Ball and Chain, Data Darts, Data Raven, Aardvark und Bizarre Encryption Scheme haben konsistente Katalog-/Runtime-/Tooltiptexte.
- Data Raven bietet Runner-Counter-Removal für `[1]`, falls noch nicht vorhanden, ohne falsche Zusatz-ETR.
- Tycho Extension nutzt einen sauberen display-only Text ohne deutsches/englisches Mischfragment.
- Tests decken geänderte Zahlenwerte, ausgelassene Effekte und relevante stale/wrong-side/visibility-Fälle ab.

## Umsetzungshinweise

- Startpunkte: `data/cards/originalset-v1-cards.json`, `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `apps/web/app/api/cards/catalog-data.test.ts`.
- `Data Masons`, `Skälderviken`, `Aardvark`, `Bizarre Encryption Scheme` und `Chimera` können reine Paritäts-/Regressionfälle sein; erst verifizieren, dann minimal ändern.

## Ergebnisnotiz

Noch offen.
