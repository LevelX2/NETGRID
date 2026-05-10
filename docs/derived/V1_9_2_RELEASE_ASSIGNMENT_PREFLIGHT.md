# V1.9.2 Release Assignment Preflight

Stand: 2026-05-10  
Status: abgeschlossen (Scope-Freeze-Eingang)

## Datenbasis

- `docs/derived/V1_9_1_FINAL_REVIEW.md`
- `docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md`
- `docs/derived/V1_9_2_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_K_1_9_2_SPEC.md`
- `C:/Projekte/NETGRID/data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.9.2-Kern laut Freeze: 7 Karten
- V1.9.2-Kern für dieses Gate: exakt 7 Karten
- Data Naga wurde vor Code explizit als `freigabefähig` entschieden

## Kernkorb V1.9.2 (freigabefähig)

1. `onr_v1_076_all-nighter`
2. `onr_v1_096_kilroy-was-here`
3. `onr_v1_107_romp-through-hq`
4. `onr_v1_184_top-runners-conference`
5. `onr_v1_188_ai-chief-financial-officer`
6. `onr_v1_211_polymer-breakthrough`
7. `onr_v1_235_data-naga`

## Abhängigkeitsbefund je Kernkarte

| CardId | Name | Primäre Mechaniklücke | Preflight-Entscheidung |
| --- | --- | --- | --- |
| `onr_v1_076_all-nighter` | All-Nighter | Run-Followup ohne zusätzliche Click-Kosten | freigabefähig in V1.9.2 |
| `onr_v1_096_kilroy-was-here` | Kilroy Was Here | Access-Queue mit kostenfreiem Trash auf R&D | freigabefähig in V1.9.2 |
| `onr_v1_107_romp-through-hq` | Romp through HQ | Access-Queue mit kostenfreiem Trash auf HQ | freigabefähig in V1.9.2 |
| `onr_v1_184_top-runners-conference` | Top Runners' Conference | Start-of-turn-Credits plus Trash-on-run-Lifecycle | freigabefähig in V1.9.2 |
| `onr_v1_188_ai-chief-financial-officer` | AI Chief Financial Officer | Hidden-Zone-Shuffle HQ/Archives -> R&D + Draw | freigabefähig in V1.9.2 |
| `onr_v1_211_polymer-breakthrough` | Polymer Breakthrough | Corp Start-of-turn Recurring-Credit-Effekt | freigabefähig in V1.9.2 |
| `onr_v1_235_data-naga` | Data Naga | Trash-installed-program-Subroutine + ETR ohne Hidden-Leak | freigabefähig in V1.9.2 |

## Data-Naga-Entscheidung (Pflichtpunkt)

`onr_v1_235_data-naga` ist in V1.9.2 `freigabefähig`, weil der Engine-Pfad `trash_installed_program` bereits für mehrere ICE produktiv vorhanden ist, deterministisch über LegalActions läuft und ohne zusätzliche Hidden-Info-Exposition auskommt.

## Deferred in V1.9.2

- `onr_v1_243_fetch-4-0-1` / `onr_v1_249_hunter`: Trace/Tag-Fokus bleibt V1.9.3.
- `onr_v1_306_trojan-horse` und weitere Tag-Interaktionen: bleiben V1.9.3.
- Damage/Prevention- und Core-Damage-Erweiterungen: bleiben V1.9.4.

## Frozen Scope

In V1.9.2 werden nur die sieben Karten aus dem Kernkorb implementiert und freigegeben.  
Keine zusätzlichen Karten aus V1.9.3/V1.9.4 werden vorgezogen.

## No-Scope-Bestätigung

- keine V2.x-Funktionen
- keine Trace/Tag-Konsolidierung aus V1.9.3
- keine Damage/Prevention/Core-Erweiterungen aus V1.9.4
- kein automatisches `ai_supported`-Upgrade
