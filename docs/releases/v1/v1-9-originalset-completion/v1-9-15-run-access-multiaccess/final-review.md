# V1.9.15 Final Review - Run Flow, Access, Multiaccess und Ambush on Access

Stand: 2026-05-13 08:05 CEST
Status: final

## Gate-Ergebnis

`V1_9_15_done: true`

`ready_for_V1_9_16: true`

V1.9.15 ist als Release-Slice abgeschlossen. Alle 14 Zielkarten sind im privaten lokalen O:NR-v1-Originalset `human_playable`, `deck_legal` und `ai_supported`. Die sichtbare Webclient-Version steht auf `V1.9.15`.

## Abgeschlossener Scope

- Runner-Event-Runs fuer `Lucidrine Booster Drug`, `Priority Wreck`, `Social Engineering` und `Stumble through Wilderspace` laufen ueber explizite `play_event`-LegalActions mit revalidierten Serverzielen.
- `Priority Wreck` erzeugt eine deterministische R&D-Multiaccess-Queue ohne Leak spaeterer Queue-Karten und mit Replay/StateHash-Nachweis.
- Installierte V1.9.15-Run-/Access-Helfer nutzen bestehende Run-, Counter-, Breach- und Hidden-Zone-Barrierepfade; `Dupré` setzt einen oeffentlichen Power-Counter beim Run-Start, Access-Helfer erweitern die Breach-Queue begrenzt und Reveal-Helfer markieren legalen Access side-sicher.
- `Cerberus` und `Mastiff` nutzen das bestehende side-sichere Trace-Bid-Fenster vor Damage/End-the-run-Ueberlappungen.
- `New Blood` ist nur nach sichtbarem Runner-Run-Versuch im letzten Zug legal und erzeugt oeffentliche Credit-Pressure.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.15.json`
- `data/rules/mechanics-coverage-1.9.15.json`
- `data/scenarios/v1915-run-access-multiaccess-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1915.json`
- `data/manifests/deck-legal-ai-approval-v1915-manifest.json`
- `data/scenarios/ai-deck-legal-v1915-smokes.json`

## Text- und Regelautoritaet

Die V1.9.15-Kartentexte sind finale display-only Texte aus lokal bestaetigten Regelkern-Aussagen nach `docs/releases/v1/v1-9-originalset-completion/display-text-finalization-policy.md`. Kartentext bleibt keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Verifikation

- JSON-Validation: pass, 252 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 30 Tests.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 227 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass; bekannte nicht-blockierende Turbopack-NFT-Warnung bleibt.

## Grenzen

- Keine V1.9.16+-Karten wurden freigegeben.
- Keine generische `trigger_ability`-Freischaltung.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
