# V1.9.4 Implementation Review - Mechanikpaket M

Stand: 2026-05-10  
Status: implemented

## Scope

V1.9.4 wurde als gate-konformer Kernrelease umgesetzt. Der im V1.9.4-Preflight eingefrorene 2-Karten-Kernkorb ist vollständig implementiert und freigegeben.

## Umgesetzt

- Neue Corp-Karten:
  - `onr_v1_208_on-call-solo-team`
  - `onr_v1_217_strike-force-kali`

- Engine-Erweiterung:
  - Scored-Agenda-Aktionen für On-Call Solo Team und Strike Force Kali.
  - Damage-Aktion ist nur legal, wenn der Runner aktuell getaggt ist.
  - Bei legaler Aktivierung werden deterministisch 1 Meat Damage (On-Call Solo Team) bzw. 2 Meat Damage (Strike Force Kali) aufgelöst.

- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_9_4_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 2 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.9.4`
  - V1.9.4 Text-/Numeric-Overrides ergänzt
  - keine automatische Erweiterung von `ai_supported`

- Testabdeckung:
  - neuer V1.9.4-Engine-Testblock für Mechanikpaket M
  - aktualisierte Katalogtests für Runtime-Gate/Manifest-Kette V1.9.4
  - serverseitiger Matchstart-Gate-Test für V1.9.4-Kartenstatus
  - Web-Visibility-Test auf sichtbare Versionsnummer `V1.9.4`

- Webclient-Release-Status:
  - sichtbare Webclient-Versionsnummer auf `V1.9.4` angehoben (`apps/web/app/page.tsx`)

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.9.4.json`
- `data/scenarios/v194-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.9.4.json`
- `docs/derived/V1_9_4_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_9_4_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_9_4_FINAL_REVIEW.md`

## No-Scope-Bestätigung

- Keine V2.x-Funktionen
- Keine V1.9.5+-Erweiterung
- Kein automatisches `ai_supported`-Upgrade
- Keine Public-Plattformfeatures
