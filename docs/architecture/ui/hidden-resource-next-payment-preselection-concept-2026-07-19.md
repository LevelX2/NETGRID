# Hidden Resource für die nächste Zahlung vormerken

Status: erster sicherer Umsetzungsschnitt abgeschlossen
Quelle/Vorgabe: Nutzeridee und Playtest-Fund vom 2026-07-19

## Entscheidung

Die Vorwahl wird als optionale, ausschließlich runner-private Bedienhilfe
umgesetzt. Sie ist keine Spielentscheidung und kein Bestandteil des
autoritativen `GameState`. Regelwirksam wird eine Hidden Resource weiterhin
erst dann, wenn der Runner im echten `runner_cost_penalty_support`-Fenster eine
aktuelle, exakt passende `LegalAction` einreicht und die Engine diese erneut
validiert.

Die Karte erhält deshalb keinen pauschalen Karten-Schalter, sondern jede
vorbereitbare Zahlungsfähigkeit einen eigenen Marker
`Für die nächste passende Zahlung vormerken`. Das ist insbesondere für
`Swiss Bank Account` nötig, weil deren zwei Fähigkeiten verschiedene Kosten
und Credit-Erträge haben.

Der Marker ergänzt das zentrale Zahlungsfenster, ersetzt es aber nicht. Nach
einer automatisch eingereichten Support-Fähigkeit wartet der Client auf den
bestätigten neuen Zustand. Bietet dessen frische `LegalActions` genau die zur
ursprünglichen Zahlung und zur Window-ID gehörende Fortsetzungsaktion an, reicht
er auch diese über den normalen Action-Submit-Pfad ein. So umfasst die bewusst
gesetzte Vormerkung den vollständigen Zahlungsvorgang, ohne dass der Client
eine eigene Regelaktion konstruiert.

## Verantwortungsgrenzen

### Engine und private PlayerView

Die Engine bleibt einzige Regelautorität. Damit der Client eine Fähigkeit schon
vor dem Zahlungsfenster anbieten kann, projiziert die private Runner-Ansicht
engine-erzeugte, nicht regelwirksame Fähigkeitsdeskriptoren. Ein Deskriptor
enthält mindestens:

- die Instanz-ID der eigenen Resource,
- den stabilen Ability-Index,
- Timing und einen UI-Text,
- die gedruckten Aktivierungskosten und den Credit-Ertrag, soweit sie für die
  eigene Kartenansicht ohnehin bekannt sind,
- eine Kennzeichnung, dass die Fähigkeit für
  `runner_cost_penalty_support` vorgemerkt werden darf.

Diese Deskriptoren sind keine `LegalActions`: Sie behaupten insbesondere nicht,
dass eine konkrete spätere Zahlung oder die Fähigkeit zu diesem Zeitpunkt
legal ist. Sie dürfen nur in der Ansicht des Runners erscheinen, dem die Karte
gehört. Korp-Ansicht, öffentliche Events, KI-Eingaben, Logs und öffentliche
Replay-Daten erhalten weder Identität noch Vormerkungszustand.

### Webclient

Der Webclient speichert höchstens eine aktive Vormerkung pro Match und Runner.
Ihre Identität lautet
`{matchId, side, sourceCardId, abilityIndex, timing}`. Sie wird lokal in der
Browser-Sitzung gehalten; damit überlebt sie einen Reconnect im selben Tab,
aber nicht Gerätewechsel oder eine andere Browser-Sitzung.

Der Client darf aus dem Deskriptor keine PlayerAction konstruieren. Öffnet die
Engine ein Zahlungsfenster, sucht er ausschließlich unter den aktuellen
`LegalActions` nach genau einer Aktion mit derselben Karteninstanz, demselben
Ability-Index, dem Timing `runner_cost_penalty_support` und der aktuellen
Window-ID. Nur dieser eindeutige Treffer darf automatisch über den normalen
Action-Submit-Pfad eingereicht werden.

## Bedienabläufe

### Chiba Bank Account

1. Der Runner markiert an Chiba die konkrete Fähigkeit
   `1 Credit und Chiba trashen: 4 Credits nehmen`.
2. Das Setzen des Markers bezahlt, tappt, trasht oder revealt nichts.
3. Der Runner wählt Pump, Break oder eine andere kostenpflichtige Aktion.
4. Falls die Engine dafür ein Support-Fenster öffnet und dort genau die
   markierte Chiba-Fähigkeit legal anbietet, reicht der Client genau diese
   `LegalAction` einmal ein.
5. Die Engine validiert Window-ID, StateVersion, Quelle, Kosten und Timing. Nach
   erfolgreicher Nutzung wird die Vormerkung entfernt.
6. Sobald der bestätigte Folgezustand genau die passende Fortsetzungsaktion
   anbietet, reicht der Client sie automatisch ein und die ursprüngliche
   Zahlung wird abgeschlossen.

### Swiss Bank Account

Swiss zeigt zwei getrennte Marker, beispielsweise
`2 Credits nehmen; Swiss trashen` und
`3 Credits zahlen und Swiss trashen: 6 Credits nehmen`. Der Runner markiert
genau eine Fähigkeit; ein Häkchen nur auf Kartenebene gibt es nicht. Im
Zahlungsfenster wird ausschließlich eine LegalAction mit passendem
`abilityIndex` automatisch gewählt. Gleiche Kartennamen oder mehrere Swiss-
Instanzen werden durch `sourceCardId` unterschieden.

### Ungültige oder mehrdeutige Vorwahl

Ist beim nächsten tatsächlich geöffneten Zahlungsfenster kein eindeutiger
Treffer vorhanden, führt der Client nichts automatisch aus. Er löscht die
Vormerkung und zeigt einen lokalen Hinweis wie
`Die vorgemerkte Bankfähigkeit ist hier nicht verfügbar. Bitte wähle im Zahlungsfenster.`
Das normale zentrale Fenster bleibt vollständig bedienbar. Die Vormerkung wird
nicht still auf eine noch spätere Zahlung übertragen.

Ist die Support-Fähigkeit bereits akzeptiert, aber die zugehörige
Fortsetzungsaktion im bestätigten Folgezustand nicht genau einmal vorhanden,
reicht der Client ebenfalls nichts Erfundenes ein. Das zentrale Fenster bleibt
mit den aktuellen Engine-Aktionen sichtbar und bedienbar.

Öffnet die Engine trotz einer begonnenen Zahlung kein Support-Fenster, weil die
Quelle inzwischen unbrauchbar ist oder die Zahlung keinen Support zulässt,
darf der normale Spielablauf nicht blockiert werden. Sobald der Client die
Auflösung der begonnenen Aktion erkennt, entfernt er die Vormerkung ebenfalls
mit einem rein lokalen Hinweis.

## Lebenszyklus und Fehlerfälle

Die Vormerkung wird entfernt bei:

- erfolgreicher Einreichung der passenden Support-LegalAction,
- eindeutigem Fehlschlag oder Ablehnung dieser Einreichung,
- dem nächsten Support-Fenster ohne exakt einen passenden Treffer,
- bewusstem Fortsetzen ohne Support,
- Verschwinden oder Wechsel der Quelleninstanz beziehungsweise des Deskriptors,
- Run-Ende, Runner-Zugende, Matchwechsel oder Seitenwechsel,
- Undo eines Zustands nach dem Setzen der Vormerkung.

Bei einem normalen Reconnect im selben Browser-Tab darf sie erhalten bleiben,
wenn Match, Runner-Seite, Quelleninstanz und Fähigkeitsdeskriptor noch exakt
passen. Nach einem Undo wird sie dagegen konservativ gelöscht; eine Absicht aus
der verworfenen Zeitlinie darf nicht automatisch in die wiederhergestellte
Zeitlinie hineinwirken. Kann der Client Undo und gewöhnlichen Reconnect noch
nicht sicher unterscheiden, ist Löschen in beiden Fällen der sichere erste
Stand.

Ein Submit-Deduplizierungsschlüssel
`{matchId, supportWindowId, actionId}` verhindert eine zweite automatische
Einreichung durch Rerender, Reconnect oder mehrfach empfangene Ansichten. Ein
StateVersion-Konflikt führt nie zu einem Retry mit selbst angepassten Daten,
sondern zurück in das aktuelle zentrale Entscheidungsfenster.

## Determinismus, Replay und KI

Da die Vormerkung außerhalb des `GameState` liegt, verändert sie weder
StateHash noch deterministisches Replay. Nur die tatsächlich akzeptierte
PlayerAction erscheint wie jede manuell gewählte Aktion in der Spielhistorie.
Öffentliche Replays können nicht erkennen, ob diese Auswahl automatisch oder
per Klick eingereicht wurde.

Die KI erhält keine Vormerkung und keine neue Abkürzung. Sie bewertet und
sendet weiterhin ausschließlich aktuelle Engine-`LegalActions`. Auch für den
menschlichen Runner bleibt die Engine-Revalidierung identisch.

## Darstellung

An der eigenen Hidden Resource erscheint je vorbereitbarer Fähigkeit ein
kleiner, beschrifteter Marker. Ein aktiver Marker muss Fähigkeit und erwarteten
Effekt nennen; Farbe allein reicht nicht. Wird eine andere Fähigkeit markiert,
ersetzt sie die bisherige Vormerkung. Ein erneuter Klick entfernt sie.

Während eines offenen Zahlungsfensters bleiben dessen zentrale Aktionen die
maßgebliche Darstellung. Der Marker darf keine aktuelle Legalität suggerieren
und wird deshalb sprachlich als Absicht für die _nächste passende Zahlung_,
nicht als bereits aktive Fähigkeit, bezeichnet.

## Umsetzungsschnitt und Tests

Die Bewertung ist positiv. Ein eigenes Folgepaket setzt den kleinsten sicheren
Schnitt um:

1. side-private Fähigkeitsdeskriptoren aus der Engine-/PlayerView-Projektion,
2. eindeutige Auswahl und lokaler Vormerkungszustand im Webclient,
3. genau einmalige Einreichung nur bei exaktem aktuellem LegalAction-Treffer,
4. sichtbarer Fallback und konservative Bereinigung,
5. Engine-/View-Vertragstests sowie Webtests für Chiba, beide Swiss-Fähigkeiten,
   Stale State, Reconnect-Deduplizierung und Hidden-Info-Grenzen.

Geräteübergreifende Synchronisierung bleibt bewusst außerhalb dieses ersten
Pakets.

## Umsetzungsstand 2026-07-19

Der erste Schnitt ist umgesetzt. Eigene Hidden Resources projizieren die
vormerkbaren Fähigkeiten mit Karteninstanz, Ability-Index, UI-Label, Credit-
Kosten, Credit-Ertrag und Trash-Kennzeichnung. Die Korp erhält diese Felder in
ihrer verdeckten Runner-Rig-Ansicht nicht.

Der Webclient zeigt je Fähigkeit einen eigenen `+Credits`-Marker und hält nur
eine lokale Vormerkung. Im offenen Payment-Support-Fenster wird sie exakt gegen
Quelle, Ability-Index, Timing und Window-ID abgeglichen. Die Einreichung nutzt
den normalen LegalAction-Pfad und einen stabilen Deduplizierungsschlüssel. Bei
Abweichung wird nichts eingereicht; die zentrale Auswahl bleibt sichtbar. Nach
einer akzeptierten Bankaktivierung wartet der Client auf eine höhere
StateVersion und frische `LegalActions`. Genau eine zur ursprünglichen Aktion
und zur Window-ID passende Fortsetzungsaktion wird anschließend automatisch
eingereicht. Dadurch werden beispielsweise die Kosten von `Running
Interference` vollständig abgeschlossen und das Run-Fenster geöffnet; bei
stalen, fehlenden oder mehrdeutigen Daten bleibt die Engine-Auswahl manuell
bedienbar.
