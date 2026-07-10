# Root-Rez-Geheimhaltung: Final Review

## Ergebnis

Die Corp-KI hält nicht runrelevante Root-Karten während eines Runner-Runs
verdeckt. Der historische technische Aktionstyp `rez_ice` reicht weder zur
Erzeugung noch zum Abgleich des Tactical Goals
`corp.tactical.rez_relevant_ice` aus. Beide Stellen verlangen jetzt eine
side-safe sichtbare Kartenquelle vom Typ ICE.

Für Root-Karten ohne aktuellen Run-, Successful-Run- oder Zugriffseffekt
liefert die Runtime während eines Runs die explizite Komponente
`corp_root_rez_defer_irrelevant_during_run` mit dem Evidence-Grund
`root_rez_timing:no_current_run_effect`. Außerhalb eines Runs greift diese
Geheimhaltungssperre nicht. Bestehende Sonderverträge für ungerezzte
Access-Ambushes und das letzte sinnvolle Rez-Fenster runrelevanter Root-Karten
bleiben erhalten.

## Rekonstruierter Matchfall

Im Match `match_0fcb17642297a8a2`, StateVersion 150, bewertete die alte Runtime
Vapor Ops mit 1582, Shotgun Wire mit 452 und das Ablehnen des Rez mit -645.
Ursächlich waren ein falscher ICE-Tactical-Goal-Bonus von 760 und ein
pauschaler Affordability-Bonus von 750 für die kostenlose Root-Karte.

Der Regressionstest rekonstruiert Remote 1 mit Cortical Scrub, Keeper,
Shotgun Wire und Vapor Ops mit zwei Advancement-Countern. Nach der Korrektur
liegt Vapor Ops sowohl unter `decline_rez` als auch unter dem tatsächlich
approached Shotgun Wire. Das echte ICE behält seinen Tactical-Goal-Bonus;
Vapor Ops erhält ihn nicht.

## Zusätzliche Quellenkorrektur

Der erste vollständige AI-Lauf deckte einen realistischen Fixture- und
Runtime-Gap auf: Die Source-Definition-Maps enthielten bekannte Karten aus
Hand, Ablage, Scorebereich und Rig, aber keine installierten Serverkarten.
Eine gemeinsame side-safe Funktion bindet jetzt zusätzlich bekannte ICE- und
Root-Karten. Produktivruntime, Strategic Context und Real-Engine-Corpus nutzen
denselben Vertrag. Unbekannte Karten werden ausdrücklich nicht aufgenommen.

Der zunächst rote Shadow-League-Test wurde nicht durch Anpassung seines
Zahlenwerts beruhigt. Nach Behebung der unvollständigen Source-Bindung blieb
sein ursprünglicher Erwartungswert `21.8` wieder unverändert grün.

## Verifikation

- fokussierte Root-Rez-, Tactical-Goal-, Source-Binding- und
  Shadow-League-Regressionen: 114 Tests grün;
- vollständige `@netgrid/ai`-Suite: 284 Testdateien, 1833 Tests grün;
- `@netgrid/ai`-Typecheck: grün;
- `git diff --check`: grün.

## Grenzen

- Keine Änderung an Engine-Rezfenstern, LegalActions oder `applyAction`.
- Keine Karten-ID-Sonderlogik und keine AI-Hint-Änderung.
- Keine Änderung an Replay, StateHash, Randomness oder Kartenregeln.
- Kein Push und kein Pull Request.
