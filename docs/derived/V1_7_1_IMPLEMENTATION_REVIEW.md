# V1.7.1 Implementation Review - Mechanikpaket E

Stand: 2026-05-09  
Status: implemented

## Scope

V1.7.1 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 48-Kartenplans wurden 5 freigabefähige Karten mit Search-/Access-Replacement-/HQ-Multiaccess-Kernpfaden implementiert.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_114_temple-microcode-outlet`
  - `onr_v1_106_private-ldl-access`
  - `onr_v1_118_weather-to-finance-pipe`
  - `onr_v1_084_edited-shipping-manifests`
  - `onr_v1_129_hq-interface`
- Engine-Erweiterung:
  - Event-Resolver für alle fünf Karten
  - Hidden-Zone-Search-Choice für Temple Microcode Outlet (Search -> Choice -> Shuffle)
  - Run-`accessServerOverride` für Private LDL Access (HQ-Run, Access auf R&D)
  - Erfolgsrun-Access-Replacementpfade ohne Kartenzugriff (Corp-Credit-Loss, Runner-Tag, Corp-Draw)
  - HQ-Multiaccess-Bonus pro installierter `HQ Interface`-Instanz
  - Validierungsanpassung: Breach-Serverprüfung gegen effektiven Access-Server
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_7_1_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.7.1`
- Regression-Fix außerhalb Feature-Scope, aber gate-relevant:
  - veraltete harte Erwartungsliste im Web-Katalogtest auf konstanzbasierte AI-Approval-Menge umgestellt (`apps/web/app/api/cards/catalog-data.test.ts`)

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.7.1.json`
- `data/scenarios/v171-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.7.1.json`
- `docs/derived/V1_7_1_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_7_1_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_E_1_7_1_SPEC.md`
- `docs/derived/V1_7_1_TEST_MATRIX.md`
- `docs/derived/V1_7_1_REQUIREMENTS_REVIEW.md`

## No-Scope-Bestätigung

- Keine Trace-/Tag-/ActionEconomy-Breite aus V1.7.2
- Keine Agenda-/Scored-Static-Breite aus V1.8.0
- Keine Counter-/Virus-/Purge-Breite aus V1.8.1
- Keine V1.9.0-Würfelmechanik
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
