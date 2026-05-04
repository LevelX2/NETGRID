# MVP 0.91 Requirements Review

Status: bestanden fuer private lokale O:NR-1996-Frontbilder
Stand: 2026-05-03

## Ergebnis

`MVP_0.91_requirements_freeze_done: true`

`ready_for_implementation: true`

`ready_for_public_distribution: false`

Der V0.91 Requirements Freeze ist abgeschlossen. Die Anforderungen für Asset-Gate, Quelle, Nutzungsentscheidung, lokalen Cache, Bildmetadaten, APIs, UI-Orte, Fallbacks und Hidden-Info-Grenzen sind testbar formuliert. Jede Must-Anforderung hat Testabdeckung in `docs/derived/MVP_0.91_TEST_MATRIX.md`.

Die Implementierung ist nur für private lokale Original-Netrunner-1996-Frontbilder freigegeben. Der Projektverantwortliche hat am 2026-05-03 erklärt, die physischen O:NR-Karten zu besitzen und die Bilder nur selbst bzw. in der Familie zu nutzen. Das ist eine dokumentierte private lokale Risikoentscheidung, keine öffentliche Lizenz.

## Geprüfte Punkte

| Check | Ergebnis |
|---|---|
| V0.9-Finalgate dokumentiert | pass |
| Keine Implementierung geschrieben | pass |
| Kein Bilddownload durchgeführt | pass |
| Keine offiziellen Assets genutzt | pass |
| Primärquellen geprüft | pass |
| NetrunnerDB als technische Metadatenquelle identifiziert | pass, nicht aktueller O:NR-Scope |
| O:NR-1996-Privatentscheidung dokumentiert | pass |
| Physische Sammlung als bevorzugte Quelle | pass |
| Community-Archive als private Referenz eingeordnet | pass |
| NSG-Card-Art-/Frame-/Back-Freigabe fehlt | weiter gesperrt, nicht blockierend fuer O:NR-Scope |
| Source Registry strukturiert angelegt | pass |
| Asset Policy strukturiert angelegt | pass |
| Bilddaten bleiben außerhalb Engine/KI/Deck/Replay/StateHash | pass |
| Hidden-Card-Regeln gegen URL-/Alt-/DOM-/Ladezustands-Leaks spezifiziert | pass |
| Jede Must-Anforderung hat Testspur | pass |

## Gaps

| ID | Gap | Wirkung |
|---|---|---|
| V091-GAP-001 | Keine öffentliche Lizenz für O:NR-1996-Bilder. | Öffentliche Verteilung bleibt blockiert. |
| V091-GAP-002 | Community-Archive sind keine Lizenz und teils historisch/instabil. | Bevorzugt eigene Scans; Archive nur private Referenz/Gaps. |
| V091-GAP-003 | Card Backs, standalone Frames und Logos sind nicht freigegeben. | Bleiben ausgeschlossen. |

## Annahmen

- Die O:NR-1996-Nutzung bleibt privat, lokal, nicht öffentlich und auf Projektverantwortlichen/Familie beschränkt.
- Eigene Scans aus physischer Sammlung sind die bevorzugte Quelle.
- Community-Archive dürfen nur lokal privat als Referenz oder Gap-Fill genutzt werden.
- Android:Netrunner-, NSG- und NetrunnerDB-Bilder bleiben außerhalb dieses Freigabekorridors.

## Nächster Schritt

Ein separater Implementierungs-Thread darf jetzt vorbereitet werden, aber nur innerhalb dieses Korridors:

1. Lokalen Cache-Pfad `data/local-assets/card-images/onr-1996/` ignoriert halten.
2. Import nur aus eigenen lokalen Dateien oder freigegebenen privaten O:NR-Referenzarchiven.
3. Manifest nur mit lokalen Asset-IDs, Set, Kartennummer, Hash und Status; keine Remote-Bild-URLs.
4. Keine Card Backs, keine standalone Frames/Logos, keine öffentlichen Downloads aus der App.
5. Hidden-Info-, API-, DOM-, Replay-/StateHash- und Git-Asset-Tests vor Anzeige.
