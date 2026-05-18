# V1.9.13 Requirements - Damage, Prevention, Avoid und Replacement Longtail

Stand: 2026-05-13
Status: ready_for_implementation

## Must

- V1913-M01: Genau die 17 V1.9.13-Zielkarten duerfen im Release-Scope bearbeitet werden.
- V1913-M02: Damage-, Prevention-, Avoid- und Replacement-Entscheidungen laufen ueber LegalActions oder bestehende Event-Modification-/Replacement-Fenster.
- V1913-M03: `applyAction` validiert Seite, actionId, stateVersion, Kosten, Timingpunkt, Ziele und Choices erneut.
- V1913-M04: Net-/Meat-/Core-/Brain-Damage, Random-Trash, Flatline und Handlimit-Folgen bleiben replay- und StateHash-stabil.
- V1913-M05: Hidden-Zone-Anteile verwenden nur side-sichere V1.9.11-Pfade und leaken keine verdeckten Daten in PlayerViews, PublicEvents, KI-Inputs, Reconnect-Payloads oder Logs.
- V1913-M06: Counter-Anteile verwenden nur V1.9.12-typed-counter-Vertraege; keine neue generische Counter-Autoritaet entsteht.
- V1913-M07: Jede promotete Karte braucht Engine-/LegalAction-, Visibility-, Replay-/StateHash-, Szenario-, Manifest-, Coverage- und AI-Nachweis.
- V1913-M08: Vor Completion bleiben Katalog-, Web- und AI-Promotion explizit offen dokumentiert.

## Should

- V1913-S01: Gemeinsame Damage-/Prevention-Helfer nutzen statt per-card Sonderzustand zu duplizieren.
- V1913-S02: AI-Fallbacks sollen sichere Pass-/Accept-Entscheidungen treffen koennen, ohne Hidden-Info zu sehen.
- V1913-S03: Display-only Kartentexte werden nach der aktiven Textfinalisierungsregel kurz und ohne WIP-Praefix abgeleitet, falls keine versionierte Volltextquelle vorliegt.

## Completion Gate

V1.9.13 ist erst abgeschlossen, wenn alle Musts nachweisbar erfuellt sind, die volle Checkgruppe gruen ist und `docs/releases/v1/v1-9-originalset-completion/v1-9-13-damage-prevention-replacement/final-review.md` das Gate bestaetigt.
