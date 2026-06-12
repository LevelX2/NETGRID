# Abstrakte Funktionsnamen und Wiederverwendung

## Grundsatz

NETGRID bevorzugt funktionsbeschreibende, abstrakte Namen für Code, Tests, Artefakte und KI-/Engine-Verträge. Namen sollen ausdrücken, welche fachliche Funktion, Regelwirkung, Fähigkeit, Einschränkung oder Risikoklasse gemeint ist, nicht welche konkrete Karte den Anlass für die Implementierung geliefert hat.

Der Grundgedanke ist Wiederverwendung durch begriffliche Zerlegung: Wenn neue Anforderungen nach ihrer Funktion dekonstruiert werden, münden gleichartige Anforderungen eher in gleichartige Namen, Typen, Helper, Tests und Verträge. Dadurch entstehen gemeinsame Bausteine statt isolierter Sonderpfade.

## Ziel

Die Benennung soll dem Projekt helfen, wiederkehrende Mechanikfamilien, KI-Bewertungen und Engine-Prüfungen zu erkennen:

- Eine Funktion wie `visibleUnbrokenRunEffectForSubroutine` beschreibt eine sichtbare Run-Wirkung und bleibt für viele Karten nutzbar.
- Ein Marker wie `causesDamageOrProgramTrash` beschreibt eine Risikoklasse und nicht eine Einzelkarte.
- Ein Grund wie `harmful_unbroken_run_effect` beschreibt, warum ein Pfad unsicher ist, ohne das Ergebnis an eine konkrete Kartenidentität zu koppeln.
- Ein Helper wie `shuffle_hq_into_rd_then_draw_same_count` ist wiederverwendbarer als ein Helper, der nur nach der ersten Karte benannt ist, die diesen Effekt benötigt hat.

## Verbindliche Arbeitsweise

Bei neuer Funktionalität wird zuerst gefragt:

1. Welche Regelwirkung oder Spielerabsicht liegt wirklich vor?
2. Welche sichtbaren, side-sicheren Eingangsdaten braucht die Prüfung?
3. Welche generische Ergebnis- oder Risikoklasse soll entstehen?
4. Welche vorhandene Mechanikfamilie, Bewertungsfamilie oder Helper-Familie passt bereits?
5. Welcher Name beschreibt die Funktion so, dass spätere gleichartige Karten oder Fälle ihn wiederfinden und wiederverwenden können?

Kartennamen, konkrete Setnamen oder erste Beispielkarten sind in allgemeinen Funktions-, Typ-, Helper-, Gate-, Reason- und Prüfungspfaden zu vermeiden. Sie sind Hinweise auf Testfälle oder Quellen, aber nicht der fachliche Name des wiederverwendbaren Bausteins.

## Erlaubte Ausnahmen

Kartennamen sind zulässig, wenn sie nicht die allgemeine Logik tragen:

- in Testnamen und Fixtures, die einen konkreten Repro-Fall beschreiben;
- in Review-, Handoff- und Prozessdokumenten als Herkunfts- oder Nachweisbezug;
- in Debug-, Diagnose- oder UI-Ausgabe, wenn die Karte für den Nutzer sichtbar und side-safe ist;
- in Registry-, Manifest-, CardImplementation- oder Datenartefakten, in denen die konkrete Karte selbst der Gegenstand ist;
- als bewusst gewählter Archetypname, wenn er im Projekt als Mechanikfamilie definiert ist und nicht nur eine zufällige Einzelkarte meint.

Auch in diesen Fällen soll die auswertende Logik möglichst auf IDs, Subtypen, Effect-Klassen, Mechanik-Tags, LegalAction-Daten, PlayerView-Daten oder expliziten Regelverträgen beruhen. Anzeige-Titel sind Ausgabe, nicht Regelautorität.

## Nicht-Ziele

Der Grundsatz bedeutet nicht, dass jede Karte in eine überabstrahierte DSL gezwungen werden muss. Kleine konkrete CardImplementation-Dateien bleiben sinnvoll, wenn sie eine spezifische Karte an generische Runtime-Bausteine anschließen. Entscheidend ist die Schichtgrenze:

- konkrete Karte außen anschließen;
- wiederverwendbare Wirkung innen generisch modellieren;
- KI- und Engine-Prüfungen auf funktionale Merkmale statt auf Kartennamen stützen.

## Warnsignale

Folgende Muster sind Review-Hinweise:

- Branches wie `if title === "Data Wall"` in allgemeiner Bewertungslogik;
- Helpernamen, die nur den ersten Kartenfund beschreiben, obwohl der Effekt generisch ist;
- Tests, die nur Kartenname und Ergebnis prüfen, aber nicht die zugrunde liegende Effektklasse;
- KI-Reasons, die eine Karte als Ursache ausgeben, ohne eine abstrakte Blockerklasse wie `missing_breaker_coverage`, `known_path_unpayable` oder `harmful_unbroken_run_effect` zu führen;
- neue Sonderpfade, obwohl ein bestehender Mechanik-, Risk-, Action- oder Visibility-Vertrag erweitert werden könnte.

## Bezug zu NETGRID-Prinzipien

Der Grundsatz unterstützt die zentralen NETGRID-Invarianten:

- Die Rules Engine bleibt Regelautorität, weil generische Regelwirkungen dort gekapselt und revalidiert werden.
- Hidden-Info-Sicherheit bleibt prüfbar, weil KI- und UI-Schichten auf sichtbare Merkmale statt auf verdeckte konkrete Karten schließen.
- Deterministisches Replay und StateHash bleiben stabil, weil gleiche Funktionen gleiche Wirkungen konsistent abbilden.
- Kartenpool-Erweiterungen bleiben beherrschbar, weil neue Karten vorzugsweise bestehende Mechanikfamilien nutzen.

## Anwendung auf KI- und Run-Bewertung

Für KI-Bewertungen gilt besonders: Die KI soll keine Karte "kennen müssen", um einen sichtbaren Zustand funktional zu bewerten. Ein sichtbarer ICE-Pfad wird daher nach Subtypen, Breaker-Coverage, Kosten, LegalActions, sichtbaren Subroutinen, `unbrokenRunEffect`-Markern und Risikoklassen bewertet. Konkrete Kartentitel dürfen in Diagnoseausgaben erscheinen, dürfen aber nicht die Bedingung sein, warum eine Bewertung blockiert oder erlaubt wird.

Wenn eine konkrete Karte einen neuen Fall sichtbar macht, wird daraus ein funktionaler Vertrag geschnitten. Beispiel: Ein einzelner Playtest-Fund mit einer bestimmten ICE-Kombination soll zu einer allgemeinen Prüfung für schädliche ungebrochene Run-Effekte führen, nicht zu einer Sonderregel für diese Kartenkombination.
