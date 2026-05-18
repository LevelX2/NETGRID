# V1.9.4 Release Assignment Preflight

Stand: 2026-05-10  
Status: abgeschlossen (Scope-Freeze-Eingang)

## Datenbasis

- `docs/releases/v1/v1-9-originalset-completion/v1-9-3-mechanikpaket-l/final-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/open-points-grobplan-to-v1-9-8.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/spec.md`
- `C:/Projekte/NETGRID/data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.9.4-Kern laut Freeze: 2 Karten
- V1.9.4-Kern fuer dieses Gate: exakt 2 Karten
- `Data Darts` wurde vor Code explizit als `deferred` entschieden

## Kernkorb V1.9.4 (freigabefähig)

1. `onr_v1_208_on-call-solo-team`
2. `onr_v1_217_strike-force-kali`

## Abhängigkeitsbefund je Kernkarte

| CardId | Name | Primäre Mechaniklücke | Preflight-Entscheidung |
| --- | --- | --- | --- |
| `onr_v1_208_on-call-solo-team` | On-Call Solo Team | Tagged Runner -> Meat Damage als Agenda-Aktion | freigabefähig in V1.9.4 |
| `onr_v1_217_strike-force-kali` | Strike Force Kali | Tagged Runner -> Meat Damage als Agenda-Aktion | freigabefähig in V1.9.4 |

## Data-Darts-Entscheidung (Pflichtpunkt)

`onr_v1_240_data-darts` ist in V1.9.4 `deferred`, weil die Kombination aus Hidden-Zone-Kopplung und Next-ICE-Break-Restriktion als separates Folgepaket V1.9.5+ geführt wird.

## Deferred in V1.9.4

- `onr_v1_240_data-darts`: Deferred nach V1.9.5+.
- Weitere Damage/Prevention/Replacement-Longtail-Pfade: bleiben Folgeplanung.

## Frozen Scope

In V1.9.4 werden nur die zwei Karten aus dem Kernkorb implementiert und freigegeben.  
Keine zusätzlichen Karten aus V1.9.5+ werden vorgezogen.

## No-Scope-Bestätigung

- keine V2.x-Funktionen
- keine V1.9.5+-Effektfamilien
- kein automatisches `ai_supported`-Upgrade
