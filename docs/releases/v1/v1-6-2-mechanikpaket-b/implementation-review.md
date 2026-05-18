# V1.6.2 Implementation Review - Mechanikpaket B

Stand: 2026-05-09  
Status: implemented

## Scope

V1.6.2 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 50-Kartenplans wurden 5 freigabefähige Karten mit globalen ICE-Modifierpfaden und score-/rez-basierter Persistenz implementiert.

## Umgesetzt

- Neue Agenda-/Asset-Karten:
  - `onr_v1_212_priority-requisition`
  - `onr_v1_215_security-net-optimization`
  - `onr_v1_317_data-masons`
  - `onr_v1_320_encoder-inc`
  - `onr_v1_341_skalderviken-sa-beta-test-site`
- Engine-Erweiterung:
  - deterministische globale ICE-Rez-Kosten-Reduktion über rezzed Root-Modifier
  - deterministische globale ICE-Stärke-Modifier über rezzed Root- und gescorte Agenda-Modifier
  - einheitliche Nutzung in LegalActions, `rezCard`, Encounter-Break-Checks und PlayerView-Stärke
  - Priority-Requisition-Scoreeffekt mit deterministischer freier ICE-Rez-Auswahl
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_6_2_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.6.2`

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.6.2.json`
- `data/scenarios/v162-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.6.2.json`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/release-assignment-preflight.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/requirements.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/spec.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/test-matrix.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/requirements-review.md`

## No-Scope-Bestätigung

- Keine Upgrade-/Uninstall-/ChoiceFlow-Freigabe aus V1.6.3
- Keine Hosting-/Recurring-/Unique-Freigabe aus V1.7.0
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
