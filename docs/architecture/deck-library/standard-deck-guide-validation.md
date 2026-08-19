# Standarddeck-Guide-Validierung

Stand: 2026-08-19

## Laufzeitvertrag

Beim Serverstart werden Standarddeck-Anleitungen ausschließlich gegen den
Deckquellhash und den Strategieprofil-Eingabehash geprüft. Die Laufzeit
berechnet dafür keine `buildDeckStrategyProfile`-Profile.

Der Eingabehash bindet den normierten Deckquellhash an
`DECK_STRATEGY_PROFILE_ANALYSIS_REVISION`. Fehlt er oder weicht er ab, bleibt
der Guide sichtbar, aber mit dem Status `stale`. Das ist absichtlich
fail-closed; ein alter Guide wird nicht stillschweigend als aktuell ausgegeben.

## Pflege-Gate

`corepack pnpm check:standard-deck-guides` berechnet die vollständigen
Strategieprofile und vergleicht weiterhin deren Ausgaben mit
`sourceAnalysisHash` sowie den hinterlegten Strategiezuordnungen. Dadurch
bleibt auch eine vergessene Revisionserhöhung im Gate sichtbar.

Bei einer semantischen Änderung von `buildDeckStrategyProfile` oder einer
verwendeten Strategiequelle wird
`DECK_STRATEGY_PROFILE_ANALYSIS_REVISION` erhöht. Nach redaktioneller Prüfung
aktualisiert:

```text
corepack pnpm check:standard-deck-guides -- --write-analysis --reviewed-at=YYYY-MM-DD
```

Die einmalige Migrationsoption `--write-analysis-input-hashes` schreibt nur
Eingabehashes für bereits gegen das vollständige Profil verifizierte Guides;
sie bestätigt keine veraltete Analyse nachträglich.
