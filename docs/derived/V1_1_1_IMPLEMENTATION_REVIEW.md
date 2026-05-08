# V1.1.1 Implementation Review - Discard, Handlimit und Core Damage

Stand: 2026-05-07
Status: implemented

## Ergebnis

V1.1.1 ist umgesetzt. Discard-Phasen fuer Korp und Runner laufen als Engine-Timingpunkte mit side-privaten Choices ueber `LegalActions`/`PlayerActions`. Handlimit ist ein Engine-Wert in GameState und PlayerView. Core Damage ist als spielbarer Damage-Typ freigegeben, reduziert dauerhaft das Runner-Handlimit und loest die negative-Handlimit-Flatline zu Beginn des Runner-Discard-Steps aus.

## Umgesetzter Scope

- `corp_discard_phase` und `runner_discard_phase` als neue Engine-Phasen.
- Discard-Choices mit exakt erforderlicher Kartenanzahl und erneuter Revalidierung in `applyAction`.
- Korp-Discard aus HQ facedown in Archives.
- Runner-Discard aus Grip faceup in Heap.
- `maxHandSize` fuer Korp und Runner in GameState/PlayerView.
- `coreDamage` fuer Runner in GameState/PlayerView.
- Core Damage ueber den bestehenden Damage-Pfad inklusive RandomDrawRecords, Hidden-Info-Barriere und Undo-Block.
- Flatline bei negativem Runner-Handlimit am Beginn des Runner-Discard-Steps.
- Lokale Harness-Karte `v111_core_damage_operation` fuer enge Core-Damage-Tests.
- Multiplayer-, Reconnect-, Undo- und Visibility-Pfade fuer Discard/Core-Damage-Status.
- Deterministische AI-Discard-Choice nur aus PlayerView und LegalActions.
- Web-UI fuer dynamisches Handlimit, Core-Status und Discard-Auswahl.
- E2E-Harness an Setup/Discard/aktuellen Lifecycle angepasst.

## Geänderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `apps/web/app/globals.css`
- `apps/web/app/action-board-ui.test.ts`
- `apps/web/app/action-cues.test.ts`
- `tests/specs/visibility-contract.test.ts`
- `tests/e2e/helpers/match-flow.ts`
- `tests/e2e/netgrid-v1-0-7.spec.ts`
- `docs/derived/V1_1_1_REQUIREMENTS.md`
- `docs/derived/DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md`
- `docs/derived/V1_1_1_TEST_MATRIX.md`
- `docs/derived/V1_1_1_REQUIREMENTS_REVIEW.md`

## Architekturentscheidungen

- Discard ist kein UI-Sonderfall, sondern ein Engine-Timingpunkt mit normalem Choice-Vertrag.
- Verdeckte Discards aus HQ bleiben Hidden-Info-Barrieren; PublicEvents nennen keine verdeckten Kartentitel.
- Core Damage nutzt den vorhandenen deterministischen Damage-Pfad und erweitert ihn nur um dauerhafte Handlimit-Reduktion.
- Die negative-Handlimit-Flatline wird am Beginn des Runner-Discard-Steps geprueft, nicht sofort beim Core-Damage-Zaehlerwechsel.
- AI waehlt Discard-Karten deterministisch aus sichtbaren eigenen Choice-Optionen; keine FullState- oder gegnerischen Hidden-Zone-Daten.
- Full Archives Access, Damage Prevention, Avoid, Interrupts und Replacement Effects bleiben gesperrt.

## Test- und Review-Befund

Die V1.1.1-Testmatrix ist durch Engine-, Server-, AI-, Web-, Visibility- und E2E-Regressionen abgedeckt. Der finale Gate-Lauf ist in `docs/derived/V1_1_1_FINAL_REVIEW.md` dokumentiert.

## Bekannte Grenzen

- Keine Damage Prevention, kein Avoid, keine Interrupts und keine Replacement Effects.
- Kein Full Archives Access; Archives bleiben fuer gegnerische verdeckte Korp-Karten redigiert.
- Keine Runner-Deckout-Siegbedingung.
- Keine neuen offiziellen Assets, Accounts, Matchmaking-, Ranking- oder Turnierfunktionen.
- Der Web-Build zeigt weiterhin die bekannte Turbopack-NFT-Warnung in der Next-Konfiguration.
