# V1.9.2 Implementation Review - Mechanikpaket K

Stand: 2026-05-10  
Status: implemented

## Scope

V1.9.2 wurde als gate-konformer Kernrelease umgesetzt. Der im V1.9.2-Preflight eingefrorene 7-Karten-Kernkorb ist vollständig implementiert und freigegeben.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_076_all-nighter`
  - `onr_v1_096_kilroy-was-here`
  - `onr_v1_107_romp-through-hq`
  - `onr_v1_184_top-runners-conference`
- Neue Corp-Karten:
  - `onr_v1_188_ai-chief-financial-officer`
  - `onr_v1_211_polymer-breakthrough`
  - `onr_v1_235_data-naga`

- Engine-Erweiterung:
  - All-Nighter Folge-Run als LegalAction-only Bonus-Run ohne Clickkosten, strikt zustandsgebunden.
  - Kilroy/Romp Access-Erweiterung für kostenfreies Trashen auf R&D/HQ, inklusive deterministischer Breach-Reihenfolge.
  - Top Runners' Conference Start-of-turn-Credits und Auto-Trash beim Run-Start.
  - Polymer Breakthrough Corp-Start-of-turn-Credit aus gescorter Agenda.
  - AI Chief Financial Officer Agenda-Aktion: HQ/Archives deterministisch in R&D mischen, danach 5 ziehen, Hidden-Zone-safe payload.
  - Data Naga als ICE mit Program-Trash + ETR auf bestehendem legalen Subroutinepfad.

- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_9_2_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 7 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.9.2`
  - V1.9.2 Text-/Numeric-Overrides ergänzt
  - keine automatische Erweiterung von `ai_supported`

- Testabdeckung:
  - neuer V1.9.2-Engine-Testblock für Mechanikpaket K
  - aktualisierte Katalogtests für Runtime-Gate/Manifest-Kette V1.9.2
  - serverseitiger Matchstart-Gate-Test für V1.9.2-Release-Sicht
  - aktualisierte Visibility-Contract-Erwartung für die Webclient-Version
  - bestehender AI-Langlauftest (`packages/ai/src/index.test.ts`, V1.4.3-League-Regression) mit explizitem Test-Timeout (`30_000 ms`) stabilisiert, ohne Engine-/Regelverhalten zu ändern

- Webclient-Release-Status:
  - sichtbare Webclient-Versionsnummer auf `V1.9.2` angehoben (`apps/web/app/page.tsx`)

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.9.2.json`
- `data/scenarios/v192-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.9.2.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/release-assignment-preflight.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/implementation-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/final-review.md`

## No-Scope-Bestätigung

- Keine V2.x-Funktionen
- Keine Trace/Tag-Konsolidierung außerhalb des V1.9.2-Scope
- Keine Damage/Prevention/Core-Erweiterung außerhalb des V1.9.2-Scope
- Kein automatisches `ai_supported`-Upgrade
- Keine Public-Plattformfeatures
