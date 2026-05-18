# V1.9.14 Final Review - Trace, Link, Tags und Resource-Tag-Interaktionen

Stand: 2026-05-13
Status: final
Primaerer Agent: release-implementation-agent

## Scope

V1.9.14 schliesst genau die 25 Zielkarten aus `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/plan.md` ab. Alle Karten sind `human_playable`, `deck_legal` und `ai_supported`.

## Umsetzung

- Trace-ICE laufen ueber das bestehende side-sichere Corp-/Runner-Bid-Fenster.
- Installierte Link-Karten erhoehen den Runner-Link deterministisch fuer Trace-Aufloesungen.
- `Total Genetic Retrofit` nutzt einen eng typisierten Runner-Event-Pfad zur Tag-Entfernung.
- Runner-Resources installieren ueber normale LegalActions und bleiben nur bei sichtbarem Runner-Tag per Corp-Resource-Trash angreifbar.
- `Power Grid Overload` ist als tagbedingte Operation implementiert und trasht deterministisch installierte Runner-Hardware.
- Finale Kartentexte sind display-only aus lokal bestaetigten Regelkern-Aussagen abgeleitet; sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.
- Die Webclient-Version steht auf `V1.9.14`.

## Gate-Artefakte

- `data/manifests/card-implementation-manifest-1.9.14.json`
- `data/rules/mechanics-coverage-1.9.14.json`
- `data/scenarios/v1914-trace-tag-resource-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1914.json`
- `data/manifests/deck-legal-ai-approval-v1914-manifest.json`
- `data/scenarios/ai-deck-legal-v1914-smokes.json`

## Verifikation

- JSON-Validation: pass, 245 `data/**/*.json` Dateien
- `catalog`: pass, 29 Tests
- `engine`: pass, 221 Tests
- `ai`: pass, 84 Tests
- `server`: pass, 72 Tests
- `web`: pass, 76 Tests
- `typecheck`: pass
- `test`: pass
- `lint`: pass
- `build`: pass, mit bekannter nicht-blockierender Turbopack-NFT-Warnung

## Gate-Ergebnis

`V1_9_14_done: true`

`ready_for_V1_9_15: true`
