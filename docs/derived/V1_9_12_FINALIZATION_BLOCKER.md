# V1.9.12 Finalization Blocker

Stand: 2026-05-13 00:27 CEST
Status: hard_gate_blocker

## Blocker

V1.9.12 darf noch nicht final auf `human_playable`, `deck_legal` oder `ai_supported` promotet werden, obwohl Engine, Katalog-WIP-Guard und Checks gruen sind.

Grund:

- Die elf V1.9.12-Zielkarten haben in `packages/shared/src/index.ts` weiterhin sichtbare `V1.9.12 WIP:`-Regeltexte.
- Im Automations-Worktree ist keine versionierte lokale Volltextquelle fuer diese elf Karten vorhanden; die fuehrenden Planungsartefakte enthalten abgeleitete Regelkern-Aussagen aus lokal bestaetigten Texten, aber keine finalen versionierten Anzeige-/Release-Texte.
- Eine Final-Promotion mit WIP-Texten wuerde den Completion-Gate-Vertrag verletzen, weil Katalog und Web dann finale Spielbarkeit anzeigen, waehrend die Kartenoberflaeche selbst noch WIP markiert.

## Bereits gruen

- Engine-WIP fuer alle elf Zielkarten.
- Katalog-WIP-Zielmenge und No-Promotion-Guard.
- Manifest, Mechanics-Coverage, AI-Hints, AI-Smoke-Plan und AI-Approval-Manifest als WIP-Artefakte.
- JSON-Validation, `engine`, `catalog`, `ai`, `server`, `web`, `typecheck`, `test`, `lint` und `build`.

## Removal Condition

Eine der folgenden Bedingungen muss erfuellt sein:

1. Finale, releasefaehige Anzeige-/Rules-Texte fuer die elf V1.9.12-Karten werden aus der lokal bestaetigten Quelle in den Release uebernommen oder als private lokale Overlay-Daten verfuegbar gemacht.
2. Der Nutzer bestaetigt explizit, dass die abgeleiteten V1.9.12-Regelkernaussagen fuer die Versionierung als finale Anzeige-/Release-Texte ausreichend sind.

Danach:

- `V1.9.12 WIP:`-Texte entfernen oder finalisieren.
- `card-implementation-manifest-1.9.12.json`, `mechanics-coverage-1.9.12.json`, `ai-card-hints-deck-legal-v1912.json`, `ai-deck-legal-v1912-smokes.json` und `deck-legal-ai-approval-v1912-manifest.json` auf finale Gatewerte setzen.
- V1.9.12 in `packages/catalog/src/index.ts` aus WIP in Runtime-Release-IDs promoten.
- Webclient-Version auf `V1.9.12` anheben.
- Final Review schreiben, volle Checkgruppe wiederholen, Cursor danach auf V1.9.13 setzen.
