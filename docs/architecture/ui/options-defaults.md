# Standardwerte der Spieloptionen

Die Webanwendung verwendet dieselben Optionsvorgaben im Entwicklungsbetrieb
und im Windows-Release. Neue Installer-Builds übernehmen diese Vorgaben aus
dem Webcode. Bereits installierte Builds ändern sich dadurch nicht.
Gespeicherte Browseroptionen haben Vorrang; es findet kein Zurücksetzen
bestehender persönlicher Einstellungen statt.

Für ein neues Browserprofil gelten:

- Ton an, Lautstärke 45 %.
- Aktions- und automatische Effekthinweise an, schwebend, Dauer 2,5 Sekunden.
  Hinweisposition: benutzerdefiniert bei 37,56 % horizontal und 55,45 % vertikal.
- Automatische Corp-Pflichtziehung, Abwurf und Zugende an.
- Karten-Tooltips als Bild, Verzögerung 1 Sekunde, Größe 135 %;
  übrige Kartengrößen 100 %, Regelübersetzung aus.
- Kartendarstellung `placeholder`, bevorzugte deutsche Kartenbilder aus,
  Setkennzeichen an, Chronik einfach.
- Dunkles Farbschema, fixierte Kopfleiste und Cyberspace-Hintergrund an.
- Ressourcenleiste automatisch, Aktionspanel angedockt,
  Hervorhebung aufgedeckter Karten an.
- KI-Tempo `paced`, private KI-Debuganzeige und KI-Detailinformationen aus.

Initialisierung und Persistenz liegen in `apps/web/app/page.tsx` und den
Karten-Einstellungshooks. Gemeinsame Darstellungsdefaults liegen in
`apps/web/features/settings/settings-model.ts`; Replay und Kartenkontexte
verwenden dieselben Vorgaben. Die Browserwerte werden pro Origin gespeichert.

## Chronik und visuelle Zustandsmarkierungen

Der Chronikknopf im aktiven Spiel schaltet zyklisch zwischen Aus, Breit,
Mittel und Schmal. Anfangszustand ist Breit; die Auswahl gilt für die laufende
Seiteninstanz. Auf Desktopbreiten über 1180 Pixel sind die Chronikspalten
360, 300 beziehungsweise 240 Pixel breit. Darunter bleibt der bestehende
vertikale Aufbau erhalten. Der Tooltip benennt aktuellen und nächsten Zustand.

Ablagekarten bleiben leicht entsättigt und abgedunkelt; der dunkle Verlauf
liegt bei 8–20 % Deckkraft. Ungerezzte Karten behalten ebenfalls eine leichte
Abdunklung. Der helle Modus verwendet zurückhaltendere Zonenfarben, neutralere
Kartenrahmen und weichere Schatten; Aktions- und Auswahlmarkierungen bleiben
erhalten.
