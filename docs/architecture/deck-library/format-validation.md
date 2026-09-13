# Deckformat-Validierung

Der einzige Validator für bearbeitbare Decks und unveränderliche Match-Snapshots
liegt in `packages/decks/src/index.ts`. Server und Webclient reichen Kartenkatalog
und ausgewähltes `DeckFormatProfile` ein; sie implementieren keine eigene
Agenda-Spanne. Profil-ID, Pool und gegebenenfalls Profilversion werden vor den
Karten- und Größenregeln geprüft.

## Corp-Agenda-Spanne

`agenda.policy: official_size_range` aktiviert die deckgrößenabhängige Spanne.
Sie verlangt mindestens 40 Karten. Die Mindestpunktzahl ist
`2 * floor(Kartenanzahl / 5) + 2`, die Höchstpunktzahl genau einen Punkt höher.

| Deckgröße | Agenda-Punkte |
| --- | --- |
| 40–44 | 18–19 |
| 45–49 | 20–21 |
| 50–54 | 22–23 |
| 55–59 | 24–25 |

Je weitere fünf Karten steigen beide Grenzen um zwei. Höhere Mindestgrößen
des Profils oder der Identität bleiben bindend. Zu kleine Decks erhalten
`minimum_deck_size`; zu wenige bzw. zu viele Punkte liefern getrennt
`agenda_points_too_low` und `agenda_points_too_high`. Diese Policy ersetzt die
statische Agenda-Mindestzahl und die optionale Dichteprüfung für Corp-Decks.
Runner-Decks und nicht aktivierte Profile behalten ihre bisherigen Regeln.

Die vier normalen Profile in `deck-format-profiles-1.3.0.json` aktivieren die
Spanne. Alle aktiven Corp-Standarddecks werden darüber geprüft. Der
Standardkatalogtest enthält keine zweite Größenformel; eine eigene
Grenzwertmatrix testet den gemeinsamen Validator einschließlich beider
zulässiger Punktzahlen und der jeweils angrenzenden unzulässigen Werte.

## Interne Fixtures

Das vorhandene `local-demo-v0.8` bleibt ein ausdrücklich permissives Profil
für kleine Demo-/Mechanikfälle. Die sechs Corp-Snapshots Demo 1.3.0, Origins,
Origins Tag Ops, Proteus Region, Proteus Antibody und Classic in
`deck-snapshots-0.8.json` verwenden dieses Profil. Ihre Kartenlisten bleiben
gleich; Profilmetadaten, Validierung und Hashes sind konsistent neu erzeugt.
Sie sind keine Nachweise normaler Corp-Decklegalität.

Die alten reinen Classic-Corp-Listen und abgeleiteten bearbeitbaren Beispiele
unterschreiten die normale Agenda-Spanne. Der Test erwartet dafür den
konkreten Fehler; die Quelldaten bezeichnen sie als interne Mechanikfixtures.
Es gibt keine automatische Profilumschaltung für ungültige Nutzerdecks und
keinen Kompatibilitätspfad für alte Snapshot-Hashes.

Nachweise: `packages/decks/src/agenda-point-range.test.ts`,
`packages/decks/src/index.test.ts` und die fokussierten Server-Matchstarttests.
