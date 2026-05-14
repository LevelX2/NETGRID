# O:NR v1 Card Attribute Conflict Decisions 2026-05-13

Stand: 2026-05-13
Status: verbindliche Nutzerentscheidungen fuer lokale Kartenattribute

## Zweck

Dieses Artefakt haelt konkrete Nutzerentscheidungen zu lokalen O:NR-v1-Kartenattributen fest, wenn lokale Kontrollquellen oder aeltere Projektartefakte voneinander abweichen.

Maschinenlesbarer Begleiter: `data/rules/onr-v1-card-attribute-conflict-decisions-2026-05-13.json`.

## Entscheidungen

| Karte | Entscheidung | Wirkung |
| --- | --- | --- |
| `Hostile Takeover` (`onr_v1_203_hostile-takeover`) | On-score-Gewinn ist `Gain 5`. | Bestehender Engine-/Catalog-Wert bleibt korrekt; abweichendes `Gain 6` ist verworfen. |
| `Private Cybernet Police` (`onr_v1_213_private-cybernet-police`) | Aktive scored-agenda Faehigkeit ist `Trace 5`. | Bestehender Engine-/Catalog-Wert bleibt korrekt; V1.9.3-Artefakte mit pauschalem `Trace 7` werden korrigiert. |
| `Data Wall 2.0` (`onr_v1_238_data-wall-2-0`) | Rez-Kosten `2`, Staerke `1`. | Bestehender Engine-/Catalog-Wert bleibt korrekt; aeltere Review-Angabe `Staerke 3` ist verworfen. |

## Gate-Hinweis

Diese Entscheidungen aendern keine Kartenfreigabe und erweitern keinen Release-Scope. Sie stabilisieren nur die lokale Attributgrundlage fuer bereits bekannte Karten und fuer spaetere Resolver-/AI-/Dokumentationsarbeit.
