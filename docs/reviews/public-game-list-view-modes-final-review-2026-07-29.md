# Final Review: Matchpunkte und kompakte öffentliche Spieleliste

Stand: 2026-07-29
Status: freigabefähig

## Ergebnis

Die öffentliche Spieleliste besitzt jetzt zwei Darstellungen:

- `Ausführlich` bleibt der Standard und bewahrt die bisherige Kartendarstellung.
- `Kompakt` ordnet Status, Teilnehmer, Metadaten, Ergebnis, Match-ID,
  Aktualisierung und Aktionen als responsive Zeile an.

Ein gemeinsamer Umschalter gilt für offene, laufende und abgeschlossene
Einträge der aktuell gefilterten Liste. Er verwendet echte Buttons,
`aria-pressed` und die Gruppenbeschriftung `Darstellung wählen`.

Abgeschlossene Spiele zeigen vorhandene Matchpunkte jetzt ausdrücklich vor den
Agenda-Punkten. Damit ist die eigentliche Matchwertung nicht länger nur
indirekt über Gewinner und Agenda-Stand erkennbar.

## Implementation Review

### Ergebnisdarstellung

`publicMatchResultScore` liest ausschließlich den bestehenden
`ApiMatchResultSnapshot`. Wenn Runner- und Korp-Matchpunkte vorhanden sind,
werden sie getrennt vom Agenda-Stand formatiert. Fehlt einer der optionalen
Werte, zeigt die UI weiterhin die autoritativen Agenda-Punkte, berechnet aber
keine Matchpunkte aus Gewinner, Endgrund oder Agenda-Stand nach.

### Darstellungsumschalter

`PublicGamesPanel` verwaltet den Modus als lokalen React-Zustand mit
`detailed` als Startwert. Filterung und Sortierung bleiben unabhängig davon.
Jeder sichtbare Eintrag wird weiterhin genau einmal durch `PublicGameCard`
gerendert; der Modus ergänzt nur die CSS-Klasse.

Dadurch bleiben die vorhandenen statusabhängigen Aktionen identisch:

- offen: Beitritt vorbereiten;
- laufend: eigenes Spiel fortsetzen und optional zuschauen oder nur
  zuschauen;
- abgeschlossen: Replay sowie vorhandener Spielprotokoll-Download.

### Responsive Kompaktheit

Auf breiten Viewports verwendet die kompakte Karte eine zweispaltige
Zeilenstruktur aus Inhalt und Aktionen. Metadaten dürfen mit Ellipse gekürzt
werden, ohne Status, Teilnehmer, Ergebnis oder Aktionen auszublenden. Unter
900 Pixeln bricht die Struktur kontrolliert auf eine Spalte um.

## Grenzen

- Keine Änderung an Matchpunktberechnung, Shared-Vertrag, Server, Storage,
  Replay oder Zuschauerprojektion.
- Keine Persistenz der Darstellungswahl über Reloads.
- Keine Änderung am getrennten Bereich `Meine Spiele`.
- Keine neuen privaten Daten im öffentlichen Listenpayload.

## Verifikation

| Prüfung                                  | Ergebnis                                                         |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Spielelistenmodell und Replay-Navigation | 13 Tests bestanden                                               |
| Matchpunkte vorhanden                    | getrennte Ausgabe `Matchpunkte 10 : 3` und `Agenda-Punkte 7 : 3` |
| Matchpunkte fehlen                       | keine abgeleitete Ersatzwertung                                  |
| Web-Typecheck                            | bestanden                                                        |
| Next.js-Produktionsbuild                 | bestanden                                                        |
| Prettier der Paketdateien                | bestanden                                                        |
| `git diff --check`                       | bestanden                                                        |

## Freigabe

Das Paket ist lokal freigabefähig. Führender Prozess ist
`docs/architecture/ui/public-game-list-view-modes-process-2026-07-29.md`.
