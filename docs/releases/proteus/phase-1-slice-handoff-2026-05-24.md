# Proteus Phase 1 Slice Handoff

Stand: 2026-05-24. Dieses Handoff schneidet das blockierte Sammelpaket `act-2026-05-24-proteus-phase-1-visible-baseline-cards` in kleinere Planungsslices. Es ist planning-only und gibt keine Runtime-Implementierung, Decklegalität, Formatlegalität oder AI-Unterstützung frei.

## Ausgangslage

Der ursprüngliche Phase-1-Scope enthält 17 Karten. Der Abgleich gegen `packages/engine/src/ability-engine/definition-types.ts`, `packages/engine/src/card-implementations/registry.ts`, `data/cards/proteus-cards.json`, `data/manifests/proteus-card-support.json` und `docs/releases/proteus/release-slicing-plan.md` zeigt:

- Einige Karten sind mit vorhandenen deklarativen Familien oder sehr engem Registry-/Manifest-Nachweis abbildbar.
- Viele Karten brauchen neue generische Funktionsbausteine für Timingfenster, dynamische Subroutinen, Named Counter, Hidden-Info-Choices oder Run-/Access-Replacement.
- Keine Karte darf über Proteus-ID-Branches in `packages/engine/src/index.ts` umgesetzt werden.
- Human-Spielbarkeit, Decklegalität und AI-Support bleiben getrennte Gates.

## Slice-Reihenfolge

| Slice | Karten | Ziel | Primäre Funktionsbausteine |
| --- | --- | --- | --- |
| Phase 1a: Reuse-only Baseline | `Toughonium™ Wall`, `Networked Center`, `Research Bunker`, `Weapons Depot`, `Streetware Distributor` | Kleinster umsetzbarer Baseline-Schnitt ohne neue Mechanikfamilie | `printedSubroutines`, `agenda_difficulty`, `regionBaseline`, Hosted-Credits-Lifecycle, `activated` Runner-Main-Ability |
| Phase 1b: Dynamic Public ETR ICE | `Minotaur`, `Riddler` | Öffentliche dynamische ETR-Subroutinen für ICE | dynamische zusätzliche Subroutinen, Encounter-paid temporary subroutine, stabile Subroutine-IDs |
| Phase 1c: Free Rez and ICE Counter Lifecycle | `Emergency Rig`, `Rent-to-Own Contract` | Operationen, die ICE kostenlos rezzen und öffentliche Named Counter verwalten | target binding für ICE, free-rez effect, public named counters, Start-of-Corp-turn counter lifecycle |
| Phase 1d: Public Fort Pass Windows | `Lesley Major`, `Rasmin Bridger` | Fortbezogene Pass-Trigger ohne Hidden-Zone-Bewegung | subsidiary-fort install restriction, pass-last-ICE window, advancement-counter target binding, forced Runner pay-or-end-run |
| Phase 1e: Hidden Fort Manipulation and Central Access | `Herman Revista`, `Marcel DeSoleil`, `Pavit Bharat`, `Simon Francisco` | Fort-Reorder, HQ/R&D-Bewegung und zentrale Access-Modifikation mit Hidden-Info-Barrieren | private reorder choices, hidden R&D trash, temporary repeated subroutine, rez-after-last-ICE window, HQ-to-fort hidden install, central-only install restriction, access-count replacement |
| Phase 1f: Run Spend Cap | `Obfuscated Fortress` | Run-weite Credits-Ausgabenbegrenzung mit Ansage und Endabrechnung | start-of-run rez window, Runner credit-spend declaration, run payment cap, spend ledger, end-of-run shortfall loss |
| Phase 1g: Post-Pass Derez Utility | `Disintegrator` | Runner-Programm-Fähigkeit nach vollständig gebrochenem ICE | post-pass fully-broken hook, installed Runner paid ability during run, derez target ICE, end current run |

## Gemeinsame Gates

Jeder Slice braucht:

- eigene per-card CardImplementation-Datei pro Karte,
- Registry-/Coverage-/Manifest-Parität,
- Szenario- oder fokussierte Engine-Smokes,
- LegalAction-Projektion und `applyAction`-Revalidierung für Side, actionId, stateVersion, Timing, Kosten, Ziele und Choices,
- PlayerView-/PublicEvent-/Reconnect-/Replay-/Log-Redaction ohne verdeckte Karteninformationen,
- Replay/StateHash-Nachweis,
- Web-Catalog-Guard gegen breite Proteus-Promotion,
- keine `deck_legal`, `format_legal` oder `ai_supported` Promotion.

## Deferred Scope

Nicht Teil dieser Phase-1-Zerlegung:

- Hidden Runner Resources,
- variable Rez-ICE außerhalb der beiden Phase-1b-Karten,
- Random-/Würfelkarten,
- Proteus-Virus-/Antibody-/Purge,
- Bad-Publicity-7+-Karten,
- `Ice and Data Special Report`,
- Proteus-Deckgesamtfreigabe,
- AI-Hints und AI-Smokes.

## Activity-Handoff

Die konkrete Board-Zerlegung liegt in:

- `docs/activities/done/act-2026-05-24-proteus-phase-1a-reuse-only-baseline.md`
- `docs/activities/done/act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice.md`
- `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md`
- `docs/activities/done/act-2026-05-24-proteus-phase-1d-public-fort-pass-windows.md`
- `docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md`
- `docs/activities/inbox/act-2026-05-24-proteus-phase-1f-run-spend-cap.md`
- `docs/activities/inbox/act-2026-05-24-proteus-phase-1g-post-pass-derez-utility.md`
