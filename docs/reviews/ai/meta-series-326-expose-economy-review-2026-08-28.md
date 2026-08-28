# Metaserie 326: Expose- und Wirtschaftskarten

Stand: 2026-08-28  
Status: abgeschlossen

## Ergebnis

Ghost Circuit gewann die unveränderte 40-Seed-Paarung gegen Mumie mit 32:8.
Alle 40 Spiele endeten terminal. Die Serie enthält 11.226 lückenlos erfasste
KI-Aktionen, 511 Runs und keine Warnflags, Fallbacks oder Timeouts.

Die Siegquote ist wegen neuer Seeds kein kausaler Vorher-/Nachher-Beweis. Für
die beiden reparierten Kartenpfade liegen deshalb zusätzlich exakte Replays
der zuvor auffälligen Seeds vor.

## Smarteye

`runner.expose_information` besitzt die Aufdeckentscheidung als eigenen Plan.
Er deckt ein unbekanntes konkretes ICE einmal auf und erinnert die exakte
ICE-Instanz für denselben Server über spätere Zustände. Bei einer späteren
Begegnung wählt derselbe Plan die gebundene Ablehnung, ohne Run-, Ziel- oder
Choice-Autorität zu übernehmen.

- Exaktes Replay `meta-323-final-v3-028`: Code Corpse wird einmal aufgedeckt;
  vier spätere Fenster werden ausdrücklich abgelehnt. Zuvor wurde dasselbe ICE
  34-mal aufgedeckt.
- Metaserie 326: 10 Aufdeckungen, 12 bewusste Ablehnungen und keine doppelte
  Aufdeckung derselben ICE-Instanz innerhalb einer Partie.

Der Fall `SP-188` ist damit behoben und serienverifiziert.

## BBS Whispering Campaign

`corp.economy` darf eine vollständig finanzierbare, endliche Wirtschaftslinie
nun aufbauen, wenn ihr Nettowert positiv bleibt. Reserve-, Schutz- und
Remote-Bindungen bleiben unverändert. Die Handverwaltung ist kein zweiter
Kartenowner.

- Exaktes Replay `meta-323-final-v3-040`: `corp.economy` installiert und rezzed
  BBS Whispering Campaign und nimmt zweimal zwei Credits.
- Metaserie 326: 13 Installationen, 11 Rez-Aktionen und 32 Auszahlungen in 13
  Spielen.

Der Fall `SP-189` ist damit behoben und serienverifiziert.

## Team Restructuring

Team Restructuring blieb in 846 Angebotszuständen ungespielt. Die gespeicherten
Entscheidungen nennen durchgängig ein fehlendes gebundenes Scoreprojekt. Die
Karte liefert gegenüber normalem Vorrücken erst mit mehreren gleichzeitig
sinnvollen Zielen einen Vorteil. Ein konkret besserer legaler Einsatz wurde
nicht belegt; deshalb entstand kein spekulativer KI-Fix. `SP-187` bleibt ein
Beobachtungsfall.

## Bericht und Qualität

Der HTML-Berichtsentwurf 3 enthält nummerierte, visuell getrennte Abschnitte,
farblich getrennte Runner-/Corp-Flächen, alle 40 Spiele mit Zügen und Aktionen
sowie eine nach Handnutzung sortierte Kartenprüfung. Regeltexte stehen klein
unter der Zahlenzeile. Zusätzliche Kartenbewertungen erscheinen nur für
Smarteye, BBS Whispering Campaign und Team Restructuring; die Plan-Spalte zeigt
die tatsächlichen internen Plannamen.

Die erste versandte Fassung verwendete die Browserdarstellung unverändert als
Mailtext. Gmail entfernte dabei CSS-Variablen und verarbeitete Grid-/Flex-
Layout nur teilweise; dadurch verschwanden Deckflächen und Kennzahlen wurden
untereinander auseinandergezogen. Die reine Browserprüfung war deshalb kein
ausreichender Versandnachweis.

Die korrigierte Versandfassung 4 ist eine getrennte, konservative Mailvorlage:
alle Stile stehen mit konkreten Werten direkt am Element, die Anordnung nutzt
HTML-Tabellen und enthält weder CSS-Variablen noch Grid oder Flexbox. Genau
diese Mailfassung wurde in Chromium bei 914 Pixeln Inhaltsbreite vollständig
und ohne horizontalen Seitenüberlauf geprüft, anschließend an das eigene
Gmail-Konto gesendet und im zentralen Selfplay-Evidenzregister als `sent`
geschlossen. Auf schmalen Mobilansichten benötigen die breiten Spiel- und
Kartentabellen weiterhin eine eigene freizugebende Darstellung. Die Browser-
und Gmail-Darstellung bleiben bis zur Nutzerfreigabe zwei getrennte Entwürfe.

## Verifikation

- fokussierte Plan-First-Tests für Smarteye und BBS Whispering Campaign: grün
- Corp-Economy-, Runner-Taktik-, Coverage- und Portfolio-Tests: grün
- AI-Typecheck: grün
- Formatprüfung und `git diff --check`: grün
- `check:ai`: Struktur-, Reachability- und Hint-Prüfungen grün; der
  Card-ID-Guard meldet zehn bereits bestehende, unabhängige Fundstellen in
  anderen Kartenpfaden. Der neue Expose-Plan enthält keine Karten-ID-Heuristik.
