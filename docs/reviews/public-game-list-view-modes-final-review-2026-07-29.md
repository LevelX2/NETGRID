# Final Review: Matchpunkte und kompakte öffentliche Spieleliste

Stand: 2026-07-29
Status: freigabefähig

## Ergebnis

Die öffentliche Spieleliste besitzt jetzt zwei Darstellungen:

- `Ausführlich` bleibt der Standard und bewahrt die bisherige Kartendarstellung.
- `Kompakt` reduziert jeden Eintrag auf eine feste 38-Pixel-Zeile mit Status,
  Teilnehmern, statusrelevanter Kurzinfo und Aktionsicons.

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

Die kompakte Karte verwendet auf allen Viewports eine zweispaltige
Einzeilenstruktur aus Inhalt und Aktionen. Sie ist fest 38 Pixel hoch und
bricht nicht vertikal um. Sekundäre Metadaten, Match-ID, Aktualisierungszeit
und redundanter Gewinnertext sind in diesem Modus ausgeblendet. Zu lange
Teilnehmer- oder Statusinformationen werden innerhalb der verfügbaren Breite
gekürzt.

Alle Aktionen bleiben als 28-Pixel-Icon-Buttons sichtbar. Der ausgeschriebene
Text bleibt in `title` und `aria-label` als Tooltip- und
Barrierefreiheitsvertrag erhalten. Die ausführliche Ansicht zeigt weiterhin
die vollständigen Textbuttons.

## Grenzen

- Keine Änderung an Matchpunktberechnung, Shared-Vertrag, Server, Storage,
  Replay oder Zuschauerprojektion.
- Keine Persistenz der Darstellungswahl über Reloads.
- Keine Änderung am getrennten Bereich `Meine Spiele`.
- Keine neuen privaten Daten im öffentlichen Listenpayload.

## Verifikation

| Prüfung                              | Ergebnis                                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| Spielelistenmodell und UI-Navigation | 15 Tests bestanden                                               |
| Matchpunkte vorhanden                | getrennte Ausgabe `Matchpunkte 10 : 3` und `Agenda-Punkte 7 : 3` |
| Matchpunkte fehlen                   | keine abgeleitete Ersatzwertung                                  |
| Web-Typecheck                        | bestanden                                                        |
| Next.js-Produktionsbuild             | bestanden                                                        |
| Live-Browser-Höhenvergleich          | kompakt 38 px, ausführlich 115 px                                |
| Kompakte Aktionen                    | 28 × 28 px, Tooltip und `aria-label` vorhanden                   |
| Prettier der Paketdateien            | bestanden                                                        |
| `git diff --check`                   | bestanden                                                        |

## Freigabe

Das Paket ist lokal freigabefähig. Führender Prozess ist
`docs/architecture/ui/public-game-list-view-modes-process-2026-07-29.md`.
