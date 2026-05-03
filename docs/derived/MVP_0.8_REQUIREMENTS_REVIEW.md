# MVP 0.8 Requirements Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_implementation: true`

Der V0.8 Requirements Freeze ist abgeschlossen. Der Slice ist lokal/fiktiv, klein genug für vollständige Gate-Abdeckung und vermeidet alle riskanten Mechanikgruppen, die eigene Teilgates brauchen.

## Geprüfte Punkte

| Check | Ergebnis |
|---|---|
| V0.6 Eingangsgate | pass |
| V0.7 Eingangsgate | pass |
| Lokaler/fiktiver Slice statt offizieller Quelle | pass |
| Keine offiziellen Assets oder externen APIs | pass |
| Keine automatische Kartentextinterpretation | pass |
| Jede neue Karte mit Resolvernamen | pass |
| Jede neue Karte mit Manifest- und Testspur | pass |
| Damage/Resources/Traces/Multiaccess/Hosting/Viren/Prevention/Replacement ausgeschlossen | pass |
| Import-only bleibt nicht spielbar | pass |
| Jede Must-Anforderung mit Testspur | pass |
| V0.9 KI-Hauptphase nicht vorweggenommen | pass |

## Annahmen

- Die neuen Karten sind lokale Originale und dürfen als Projekt-Demo-Karten in Code, Daten und UI erscheinen.
- Bestehende V0.4-Mechaniken sind belastbar genug, um neue Varianten mit festen Resolvern aufzunehmen.
- V0.8 darf Deck-/Katalog-Artefakte versionieren, ohne den eingefrorenen V0.5-Snapshot umzuschreiben.

## Risiken

- Mehr Karten erhöhen die LegalAction-Anzahl; Performance-Smokes bleiben Pflicht.
- V0.8-Decks könnten in KI-Smokes zu langen Partien führen; Actionlimit- und Multi-Seed-Checks entscheiden das Gate.
- Neue PublicEvents für Rez, Play, Score, Steal und Trash müssen weiterhin bewusst revealen und dürfen keine verdeckten Zonen nennen.

## Nächster Schritt

V0.8 Implementierung starten:

1. Shared-Karten, Baseline und Demo-Decks erweitern.
2. Engine-Resolver explizit registrieren und testen.
3. V0.8-Katalog-/Deck-Snapshots erzeugen und Matchstart anbinden.
4. AI-, Server-, Visibility-, Replay-/StateHash- und Smoke-Tests ergänzen.
