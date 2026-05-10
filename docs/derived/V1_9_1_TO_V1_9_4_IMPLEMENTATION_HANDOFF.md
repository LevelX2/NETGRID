# V1.9.1 bis V1.9.4 Implementation Handoff

Stand: 2026-05-10  
Status: aktiv für V1.9.1, vorgeplant für V1.9.2 bis V1.9.4

## Ziel

Dieses Handoff überführt die planungsgefrorene Sequenz V1.9.1 bis V1.9.4 in einen ausführbaren, releaseweisen Arbeitsrahmen mit harten Freigabe-Gates.

## Reihenfolge und Freigabe

1. Umsetzung V1.9.1 vollständig abschließen und verifizieren.
2. Danach stoppen und explizites `OK V1.9.2` einholen.
3. Erst dann V1.9.2 starten; analog bis V1.9.4.

## Aktiver Umsetzungsscope

### V1.9.1 (aktiv)

- Requirements: `docs/derived/V1_9_1_REQUIREMENTS.md`
- Spezifikation: `docs/derived/MECHANIKPAKET_J_1_9_1_SPEC.md`
- Testmatrix: `docs/derived/V1_9_1_TEST_MATRIX.md`
- Requirements Review: `docs/derived/V1_9_1_REQUIREMENTS_REVIEW.md`

Pflichtausgaben:

- `data/manifests/card-implementation-manifest-1.9.1.json`
- `data/rules/mechanics-coverage-1.9.1.json`
- `data/scenarios/v191-card-release-smoke.json`
- `docs/derived/V1_9_1_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_9_1_FINAL_REVIEW.md`

### V1.9.2 bis V1.9.4 (noch nicht aktiv)

Nur vorbereitend geplant. Keine Implementierung vor expliziter Freigabe.

## Pflichtchecks je Release

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Harte Stopkriterien

Sofortiger Stopp mit Blockerbericht bei:

1. Hidden-Info-Leak
2. Determinismusabweichung (Replay/StateHash)
3. Scope-Drift
4. fehlender expliziter Freigabe für den nächsten Release

## Abschlusspflichten je Release

1. sichtbare Webclient-Version auf Zielrelease erhöhen
2. Final Review mit Gate-Nachweisen erstellen
3. `docs/codex/CODEX_STATUS.md` aktualisieren
4. KI-Wissensindex aktualisieren

## Handoff-Ergebnis

V1.9.1 ist der einzig aktive Umsetzungsschritt.  
V1.9.2 bis V1.9.4 sind verbindlich vorstrukturiert, bleiben aber bis zur jeweiligen expliziten Freigabe gesperrt.
