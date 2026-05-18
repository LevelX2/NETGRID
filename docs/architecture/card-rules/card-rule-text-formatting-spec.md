# Card Rule Text Formatting Spec

Stand: 2026-05-05
Status: verbindliches Konzept für nächste Import-/Anzeige-Härtung

## Zweck

Diese Spezifikation definiert, wie Kartentext aus importierten oder manuell gepflegten Kartendaten in einen endgültigen sichtbaren Regeltext überführt wird. Sie trennt Anzeigeformat, semantische Symbole und tatsächliche Engine-Fähigkeiten.

Das Ziel ist ein stabiler Zielzustand: Import, Normalisierung, Katalog, Board, Preview und Tooltips erzeugen denselben sichtbaren Kartentext nach denselben Regeln.

## Leitentscheidung

Kartentext ist nie Regelautorität.

Die Rules Engine bleibt die einzige Regelautorität. Aus Regeltext wird keine spielbare Fähigkeit erzeugt. Aus OCR, Importtext, Katalogtext, Markdown oder HTML darf kein Engine-Verhalten abgeleitet oder ausgeführt werden.

Spielbare Karten brauchen zusätzlich zum sichtbaren Text einen expliziten Engine-Vertrag. Dieser Vertrag kann aus bestehenden strukturierten Feldern und Resolver-Referenzen bestehen, aber nicht aus frei interpretiertem Text.

## Aktueller Projektstand

Der Workspace enthält bereits getrennte Ebenen:

- `rulesText` an `CardDefinition`: sichtbarer Kartentext für bekannte Karten.
- `abilities`, `subroutines`, `modifiers`, `mechanics`: strukturierte Kartendaten für einfache Engine-Fälle.
- Implementierungsmanifest mit `resolver`: expliziter Vertrag, welcher Resolver oder welche Resolverfamilie eine spielbare Karte abdeckt.
- Engine-Code mit Resolvern und generischen Auswertern.
- Import-Snapshots mit `displayOnlyText: true`: Katalogtext darf angezeigt und durchsucht werden, erzeugt aber keine Spielbarkeit.

Es gibt aktuell kein allgemeines per-card JSON-Regelscript, das beliebige Kartentexte interpretiert. Es gibt stattdessen eine Mischung aus strukturierten `CardDefinition`-Feldern, Manifest-Resolvernamen und Engine-Code. Diese Trennung bleibt richtig; der zukünftige Zielbegriff ist nicht `Regelscript`, sondern `Engine-Vertrag`.

## Datenebenen

### Importtext

Importtext ist die niedrigste Ebene.

Erlaubt:

- Originaltext oder bestätigter manueller Text.
- Zeilenumbrüche, Absätze und einfache Textzeichen.
- Markierung als `displayOnlyText`.

Nicht erlaubt:

- HTML als ausführbares Anzeigeformat.
- Skript-, Makro- oder Templateausführung.
- automatische Erzeugung von `playable`, `deck_legal`, Resolvern oder Engine-Effekten.

### Normalisierter Regeltext

Normalisierter Regeltext ist eine semantische Anzeigeform. Er beschreibt, was auf der Karte sichtbar stehen soll, aber nicht, wie die Engine es ausführt.

Zielmodell:

```json
{
  "schemaVersion": "card-rule-text-v1",
  "language": "de",
  "source": "manual_confirmed",
  "blocks": [
    {
      "type": "ability",
      "segments": [
        { "type": "symbol", "symbol": "credit", "amount": 1 },
        { "type": "text", "text": ": +1 Stärke." }
      ]
    }
  ]
}
```

Diese Struktur ist ein Anzeige-AST. Sie wird deterministisch zu Plain Text, UI-Text, Tooltip-Text oder kompakter Karte gerendert.

### Engine-Vertrag

Der Engine-Vertrag definiert die tatsächliche Fähigkeit.

Erlaubte Formen:

- `resolver` im Implementierungsmanifest.
- strukturierte `abilities` für einfache paid abilities wie Pump/Break.
- strukturierte `subroutines` für ICE.
- strukturierte `modifiers` für Setup-/Static-Effekte.
- perspektivisch strukturierte `effects`/`EffectDefinition`, wenn ein Mechanik-Gate das freigibt.

Nicht erlaubt:

- Auswertung des sichtbaren Regeltexts.
- frei eingebettetes JavaScript, TypeScript, JSONata, Regex-Regeln oder ähnliche Mini-Sprachen aus Kartendaten.
- Kartentext als Fallback, wenn kein Resolver existiert.

## Verbindliche Symbol-Tokens

Import und Normalisierung verwenden semantische Tokens. Die UI entscheidet, ob daraus Text, Icon, Chip oder eine kombinierte Darstellung wird.

| Token | Bedeutung | Sichtbarer Standard |
| --- | --- | --- |
| `click` | Aktion/Klick-Kosten | `1 Aktion`, `2 Aktionen` oder eckiger Aktionsslot |
| `credit` | Credit-Kosten oder Credit-Gewinn | Zahl in generischem Credit-Symbol; Plain-Text-Fallback `1 Credit`, `2 Credits` |
| `subroutine` | ICE-Subroutine-Marker | eigene Subroutine-Zeile mit Marker |
| `trash` | Trash-Kosten oder Trash-Effekt | generisches Trash-Symbol oder `Trash` |
| `mu` | Memory Unit | `MU` |
| `link` | Link-Wert | `Link` |
| `tag` | Tag | `Tag` / `Tags` |
| `agenda_point` | Agendapunkt | `Agendapunkt` / `Agendapunkte` |
| `strength` | Stärke | `Stärke` |
| `recurring_credit` | wiederkehrender Credit | `wiederkehrender Credit` oder eigener Credit-Chip |
| `bad_publicity` | Bad Publicity | `Bad Publicity` |
| `virus_counter` | Virus-Counter | `Virus-Counter` |

Offizielle NETGRID-Symbole, offizielle Card Frames, offizielle Card Backs, Logos oder externe Asset-Abhängigkeiten bleiben ausgeschlossen, solange kein späteres Asset-Gate das ausdrücklich ändert. Generische Icons und CSS-Formen sind erlaubt.

## Rendering-Regeln

### Grundform

1. Anzeige entsteht aus normalisierten Blöcken.
2. Absatzreihenfolge bleibt stabil.
3. Text wird als Text gerendert, nicht als HTML.
4. Whitespace wird normalisiert: keine doppelten Leerzeichen, keine führenden oder trailing Spaces.
5. Satzzeichen bleiben am Textsegment, nicht am Symbolsegment.
6. Zahlen bleiben numerisch.

### Ability-Zeilen

Paid abilities werden als eigene Zeile dargestellt:

```txt
1 Credit: +1 Stärke.
1 Credit: Breche 1 Code-Gate-Subroutine.
```

Wenn Kosten mehrere Ressourcen enthalten:

```txt
1 Aktion + 2 Credits: Ziehe 2 Karten.
```

Die UI darf die Kostenseite zusätzlich als Chip darstellen, muss aber denselben Text per Tooltip oder Screenreader verfügbar halten.

### Kanonische Regelbegriffe

Für normalisierte deutsche Kartentexte gelten diese kanonischen Begriffe:

| Mechanik | Kanonischer Text | Nicht verwenden |
| --- | --- | --- |
| `break_subroutine` | `Breche 1 <ICE-Typ>-Subroutine.` | `Brich`, rohe `break_subroutine`-IDs |
| `pump_strength` | `+1 Stärke.` | `pump`, `strength pump` |
| `end_the_run` | `Beende den Run.` | rohes `End the run`, wenn der Text deutsch normalisiert wird |
| `gain_credits` | `Erhalte X Credits.` | `Gain`, rohe Effekt-IDs |
| `draw_card` | `Ziehe X Karten.` | `Draw`, rohe Effekt-IDs |
| `do_damage` | `Verursache X <Schadenstyp>-Schaden.` | rohe Damage-IDs |

Bestätigte originale englische Kartentexte dürfen separat als `originalText` erhalten bleiben. Sobald ein Text als normalisierter deutscher Regeltext ausgegeben wird, gelten die kanonischen Begriffe.

### Symbol- und Kostenformatierung

Kosten stehen immer am Anfang einer Ability-Zeile und werden vom Effekt durch Doppelpunkt getrennt.

Plain-Text-Format:

```txt
<Kosten>: <Effekt>
```

Bei mehreren Kosten wird mit ` + ` verbunden:

```txt
1 Aktion + 2 Credits: Ziehe 2 Karten.
```

Pluralisierung:

- `1 Aktion`, aber `2 Aktionen`
- `1 Credit`, aber `2 Credits`
- `1 Tag`, aber `2 Tags`
- `1 Virus-Counter`, aber `2 Virus-Counter`

UI-Symbole ersetzen nie den semantischen Text vollständig. Jede symbolische Darstellung braucht einen äquivalenten Plain-Text-/ARIA-Text.

#### Credit-Symbol

Credits werden im normalen Kartenregeltext symbolisch dargestellt:

- Kosten: Zahl im oder direkt am generischen Credit-Symbol.
- Gewinne/Verluste: Zahl mit generischem Credit-Symbol im Effekttext.
- Tooltip/ARIA/Plain Text: `1 Credit`, `2 Credits`.

Beispiele:

```txt
[1 Credit-Symbol]: +1 Stärke.
[1 Credit-Symbol]: Breche 1 Barrier-Subroutine.
Erhalte [4 Credit-Symbol].
```

Das Credit-Symbol ist ein projektspezifisches generisches UI-Symbol. Es darf kein offizielles NETGRID-Symbol, kein offizielles Asset und kein Teil eines offiziellen Card Frames sein.

### Zeilenumbrüche

Der Formatter erzeugt verbindliche Zeilenumbrüche:

- Jede paid ability steht auf einer eigenen Zeile.
- Jede triggered ability steht auf einer eigenen Zeile.
- Jede static ability steht als eigener Absatz oder eigene Zeile, wenn sie neben paid abilities steht.
- Jede ICE-Subroutine steht auf einer eigenen Zeile.
- Flavor-/Hinweistext steht nie in derselben Zeile wie Kosten oder Subroutines.
- Zwei Leerzeilen trennen nur unterschiedliche Textblöcke, nicht einzelne Subroutines.

Beispiel für eine Programmkarte:

```txt
[1 Credit-Symbol]: +1 Stärke.
[1 Credit-Symbol]: Breche 1 Barrier-Subroutine.
```

Beispiel für ICE:

```txt
-> Die Corp erhält 1 Credit.
-> Beende den Run.
```

### ICE-Subroutines

Jede Subroutine ist ein eigener Block oder eine eigene Zeile.

```txt
-> Beende den Run.
-> Die Corp erhält 1 Credit.
-> Beende den Run.
```

Der sichtbare Marker darf grafisch sein. In Plain Text wird `->` als stabiler Fallback verwendet. Mehrere Subroutines dürfen nicht zu einem ununterscheidbaren Satz verschmolzen werden.

### Keywords und Typen

Kartentypen, Subtypen und technische Type-IDs werden nicht direkt aus Rohdaten in Endnutzertext geworfen. Sie laufen durch ein UI-Glossar.

Beispiele:

- `code_gate` wird sichtbar `Code-Gate`.
- `end_the_run` wird nicht als roher ActionType angezeigt.
- `trigger_ability` wird nicht sichtbar als Hauptlabel verwendet.

### Sprache

Normale UI-Texte des Projekts verwenden Deutsch. Bestätigte originale Kartentexte dürfen in ihrer Quellsprache erhalten bleiben, wenn sie als Originaltext gelten. Bei importierten O:NR-Texten ist deshalb zwischen `originalText`, `normalizedDisplayText` und optionaler deutscher UI-Erklärung zu unterscheiden.

Für generierte lokale Demo-Karten ist Deutsch bevorzugt, solange bestehende Testfixtures nicht ohne eigenen Migrationsschritt geändert werden.

## Sichtbarkeit und Hidden Info

Regeltext darf nur für bekannte Karten angezeigt werden.

Erlaubt:

- eigene Hand-/Rig-/Boardkarten aus der eigenen PlayerView,
- gerezzte Corp-Karten,
- Karten, die durch Access, Reveal, Expose oder öffentliche Ereignisse korrekt bekannt sind,
- Katalogkarten außerhalb eines laufenden Hidden-Info-Matches.

Nicht erlaubt:

- Regeltext verdeckter ICE aus Runnersicht,
- verdeckte Definition-IDs,
- verdeckte Bildpfade,
- unterscheidbare Platzhalter oder CSS-Klassen, die eine verdeckte Karte identifizieren,
- Text aus Full `GameState` im Client.

## Import-zu-Anzeige-Pipeline

Verbindliche Pipeline für zukünftige Import-/Text-Härtung:

1. Quelle aufnehmen: Originaltext oder bestätigter lokaler Text.
2. Import speichern: `displayOnlyText: true`.
3. Textreview durchführen: OCR- und Symbolfehler manuell bestätigen.
4. Normalisiertes Anzeige-AST erzeugen.
5. Formatter erzeugt deterministisch:
   - `plainText`,
   - `screenReaderText`,
   - `compactText`,
   - optionale UI-Segmente.
6. Falls eine Karte spielbar werden soll, separat Engine-Vertrag anlegen:
   - Resolvername,
   - strukturierte Ability/Subroutine/Modifier/Effect-Daten,
   - Tests,
   - Manifeststatus.
7. Tests vergleichen Anzeigeausgabe gegen Snapshot und Engine-Vertrag gegen Gameplay.

## Akzeptanzkriterien

Diese Spezifikation ist erfüllt, wenn:

- derselbe normalisierte Regeltext in Katalog, Board, Preview und Tooltip konsistent dargestellt wird,
- Symbole nicht als offizielle Assets, sondern als semantische generische Tokens gerendert werden,
- ICE-Subroutines einzeln erkennbar bleiben,
- Kosten und Effekte eindeutig getrennt sind,
- Kartentext niemals Engine-Fähigkeiten erzeugt,
- jede spielbare Karte einen separaten Engine-Vertrag hat,
- Import-only-Karten auch mit vollständig formatiertem Text nicht automatisch spielbar oder decklegal werden,
- Hidden-Info-Tests bestätigen, dass verdeckte Kartentexte nicht leaken.

## Offene Umsetzungsschritte

- `CardRuleTextV1` als Shared-Type ergänzen.
- Formatter mit Snapshot-Tests bauen.
- bestehende `rulesText`-Strings schrittweise in Anzeige-AST migrieren oder daraus bestätigte Legacy-Fixtures erzeugen.
- Katalog, Board, Preview und Tooltip auf denselben Formatter umstellen.
- Manifest um einen klaren `engineContract`-Abschnitt erweitern, ohne freie Scriptsprache einzuführen.
