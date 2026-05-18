# V1.8.0 Implementation Review - Mechanikpaket G

Stand: 2026-05-09  
Status: implemented

## Scope

V1.8.0 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 13-Kartenplans wurden 6 freigabefähige Karten mit Agenda-Difficulty-/Scored-Static-/Overadvance-Kernpfaden implementiert.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_083_desperate-competitor`
  - `onr_v1_090_hot-tip-for-wns`
  - `onr_v1_156_corporate-ally`
  - `onr_v1_159_databroker`
- Neue Corp-Karten:
  - `onr_v1_201_executive-extraction`
  - `onr_v1_214_project-babylon`
- Engine-Erweiterung:
  - turn-lokale Runner-Theft-Flags für Agenda-Subtypen (`gray_ops`/`black_ops`)
  - Play-Gates für `Desperate Competitor` und `Hot Tip for WNS` nur nach passender Agenda-Liberation im selben Runner-Turn
  - deterministischer Agenda-Punkt-Kostenpfad (`forfeit` nach `removed_from_game`) für `Corporate Ally`-Install und `Databroker`-Aktivierung
  - zentrale Agenda-Difficulty-Berechnung inkl. `Corporate Ally` (+1 global) und `Executive Extraction` (-1 auf `gray_ops`)
  - `Project Babylon`-Bonuspunkte beim Scoren als deterministische Overadvance-Ableitung
  - Scope-Fix: `runnerTurnFlags`-Typisierung (`stoleGrayOpsAgendaThisTurn`/`stoleBlackOpsAgendaThisTurn`) für saubere Revalidierung
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_8_0_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 6 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.8.0`
  - Text-/Numeric-Overrides für V1.8.0-Kernkarten
- Testabdeckung:
  - neuer V1.8.0-Engine-Testblock für Kernkorb, Subtype-Theft-Gates, Agenda-Kostenpfade, Difficulty-Statics und Overadvance-Bonuspunkte
  - aktualisierte Katalogtests für Runtime-Gate und V1.8.0-Manifestpriorität

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.8.0.json`
- `data/scenarios/v180-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.8.0.json`
- `docs/releases/v1/v1-8-0-mechanikpaket-g/release-assignment-preflight.md`
- `docs/releases/v1/v1-8-0-mechanikpaket-g/requirements.md`
- `docs/releases/v1/v1-8-0-mechanikpaket-g/spec.md`
- `docs/releases/v1/v1-8-0-mechanikpaket-g/test-matrix.md`
- `docs/releases/v1/v1-8-0-mechanikpaket-g/requirements-review.md`

## No-Scope-Bestätigung

- Keine Counter-/Virus-/Purge-Breite aus V1.8.1
- Keine Würfel-/Ambush-/Rest-Sonderresolver-Breite aus V1.9.0
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
