# V1.9.3 Release Assignment Preflight

Stand: 2026-05-10  
Status: abgeschlossen (Scope-Freeze-Eingang)

## Datenbasis

- `docs/derived/V1_9_2_FINAL_REVIEW.md`
- `docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md`
- `docs/derived/V1_9_3_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_L_1_9_3_SPEC.md`
- `C:/Projekte/NETGRID/data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.9.3-Kern laut Freeze: 4 Karten
- V1.9.3-Kern fuer dieses Gate: exakt 4 Karten
- `TKO 2.0` wurde vor Code explizit als `freigabefaehig` entschieden

## Kernkorb V1.9.3 (freigabefähig)

1. `onr_v1_207_netwatch-operations-office`
2. `onr_v1_213_private-cybernet-police`
3. `onr_v1_251_jack-attack`
4. `onr_v1_271_tko-2-0`

## Abhängigkeitsbefund je Kernkarte

| CardId | Name | Primäre Mechaniklücke | Preflight-Entscheidung |
| --- | --- | --- | --- |
| `onr_v1_207_netwatch-operations-office` | Netwatch Operations Office | Scored-Agenda Trace 7 -> Tag | freigabefähig in V1.9.3 |
| `onr_v1_213_private-cybernet-police` | Private Cybernet Police | Scored-Agenda Trace 7 -> Tag | freigabefähig in V1.9.3 |
| `onr_v1_251_jack-attack` | Jack Attack | Run-weites Jack-out-Lock + Trace-Tag-Subroutine | freigabefähig in V1.9.3 |
| `onr_v1_271_tko-2-0` | TKO 2.0 | End-the-run + Next-Action-Verzicht | freigabefähig in V1.9.3 |

## TKO-2.0-Entscheidung (Pflichtpunkt)

`onr_v1_271_tko-2-0` ist in V1.9.3 `freigabefähig`, weil der benötigte Action-Economy-Pfad deterministisch über bestehende Turn-Flags und LegalActions umgesetzt werden kann.

## Deferred in V1.9.3

- `onr_v1_208_on-call-solo-team` / `onr_v1_217_strike-force-kali`: Damage-Fokus bleibt V1.9.4.
- `onr_v1_240_data-darts`: Hidden-Zone + Next-ICE-Break-Restriktion bleibt Folgeplanung V1.9.5+.

## Frozen Scope

In V1.9.3 werden nur die vier Karten aus dem Kernkorb implementiert und freigegeben.  
Keine zusätzlichen Karten aus V1.9.4+ werden vorgezogen.

## No-Scope-Bestätigung

- keine V2.x-Funktionen
- keine Damage/Prevention/Core-Erweiterungen außerhalb V1.9.3
- kein automatisches `ai_supported`-Upgrade
