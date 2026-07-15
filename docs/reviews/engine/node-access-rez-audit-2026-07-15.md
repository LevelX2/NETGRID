# Node-Zugriffseffekte – Rez-Vertragsaudit

Stand: 2026-07-15  
Status: abgeschlossen und umgesetzt; siehe Final Review

## Kurzfazit

Der aktive Kartenpool enthält 56 Corp-Assets/Nodes: 41 im Originalset V1,
vier in Classic und elf in Proteus. Zehn davon besitzen einen Zugriffseffekt;
alle zehn haben eine semantische `accessEffects`-Implementierung.

Vor der Umsetzung prüfte die Runtime nur Source-Zone, Ignore-Zone und
Kartenbedingung. Der Rez-Zustand einer installierten Quelle war kein Teil von
`accessEffectApplies`. Dadurch lösten sieben installierbare Node-Effekte
regelwidrig auch unrezzed aus. `Virus Test Site` war zwar die belegte
unrezzed-Ausnahme, skalierte aber auch unrezzed mit Advancement-Countern statt
genau 1 Net Damage zu verursachen. Zwei weitere Antibodies wirken
ausschließlich aus R&D beziehungsweise Archives und sind von der
Installiert-Rez-Frage nicht betroffen.

Der Befund ist umgesetzt: Installierte Access-Quellen benötigen jetzt
standardmäßig Rez; `Virus Test Site` besitzt getrennte unrezzed-, rezzed- und
Hidden-Zone-Auflösungen. Der Abschlussnachweis steht in
`docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`.

Classic enthält vier aktive Corp-Assets, aber keinen Node-/Asset-
Zugriffseffekt. Für Classic entsteht daher kein Kartenmigrationsfall.

## Führende Regelquellen

`docs/source/Netrunner Errata 1.70.md`, Abschnitt `Accessing Cards`:

- Ein installierter Node muss gerezzt sein, sofern die Karte nichts anderes
  sagt.
- Für V1.0 und Proteus ist `Virus Test Site` die einzige benannte Wirkung beim
  Zugriff auf eine zugleich installierte und unrezzed Karte.
- Unrezzed verursacht `Virus Test Site` genau 1 Net Damage, unabhängig von
  Advancement-Countern.
- Rezzed verursacht sie 2 Net Damage je Advancement-Counter oder 1 Net Damage
  ohne Counter.

Kartentexte aus `data/cards/originalset-v1-cards.json` und
`data/cards/proteus-cards.json` bestimmen zusätzlich, welche Effekte auch bei
nicht installierten Zugriffen aus HQ, R&D oder Archives wirken.

## Vollständigkeitsmethode

1. Alle aktiven Corp-Assets in den drei Kartendateien gezählt.
2. Assettexte mit `access` gefiltert und manuell gelesen.
3. Alle Dateien mit `accessEffects:` unter
   `packages/engine/src/card-implementations` ermittelt.
4. Asset-Kartendaten und CardImplementation-IDs 1:1 abgeglichen.
5. Source-Zonen, Ignore-/Reveal-Zonen, Kosten, Resolver-Gate und vorhandene
   Tests pro Karte gelesen.

Ergebnis:

| Set | Aktive Assets | Assets mit Zugriffseffekt | CardImplementation vorhanden |
|---|---:|---:|---:|
| Originalset V1 | 41 | 6 | 6 |
| Classic | 4 | 0 | 0 erforderlich |
| Proteus | 11 | 4 | 4 |
| Gesamt | 56 | 10 | 10 |

## Kartenmatrix

| Karte | Aktuelle Source-Zonen | Richtiger Vertrag | Aktueller Befund | P2/P3 |
|---|---|---|---|---|
| Corprunner's Shattered Remains | installed | Installiert nur rezzed; Hardware-Trash je Advancement-Counter | Kein Rez-Gate; bestehender End-to-End-Test lässt das Rez-Fenster verstreichen und erwartet Trash | Default-Rez-Gate; rezzed/unrezzed Regression |
| Experimental AI | installed | Installiert nur rezzed; Program-Trash je Advancement-Counter | Kein Rez-Gate; mehrere Tests bestätigen ausdrücklich die falsche Wirkung nach abgelehntem Rez | Falsche Erwartungen ersetzen; rezzed Wirkung erhalten |
| Setup! | installed, HQ, R&D; Archives ignoriert | Installiert nur rezzed; HQ/R&D ohne Rez; Archives nie | Kein Rez-Gate; Remote-Test erwartet Schaden nach abgelehntem Rez | Zonenabhängiges Default-Rez-Gate; Central- und Archives-Vertrag erhalten |
| TRAP! | installed, HQ, R&D; Archives ignoriert | Installiert nur rezzed; HQ/R&D ohne Rez; Archives nie; Wirkung optional gegen 4 Credits | Kein Rez-Gate; Remote-Test öffnet Payment nach abgelehntem Rez | Unrezzed Remote darf keine Payment-Choice öffnen; Central-Vertrag erhalten |
| Vacant Soulkiller | installed | Installiert nur rezzed; 1 Core/Brain Damage je Advancement-Counter | Kein Rez-Gate; Test erwartet Damage nach abgelehntem Rez | Unrezzed kein Damage; rezzed Skalierung 0/n erhalten |
| Virus Test Site | installed, HQ, R&D; Archives ignoriert | Installiert rezzed: 2 je Counter oder 1 ohne Counter; installiert unrezzed: immer 1; HQ/R&D: 1; Archives nie | Kein Aktivierungsmodus; unrezzed Remote skaliert fälschlich mit Countern | Explizite Ausnahme plus getrennte Damage-Skalierung |
| Bel-Digmo Antibody | R&D | Nur R&D: 1 Net Damage und Reveal; Rez-Lifecycle mischt Quelle vorher in R&D | Kein installierter Accesspfad; Vertrag passend | Nicht-Installiert-Kontrollfall absichern |
| Doppelganger Antibody | installed, HQ, R&D; Archives ignoriert | Installiert nur rezzed; HQ/R&D ohne Rez; Archives nie; optional gegen 2 Credits | Kein Rez-Gate; bestehender Test deckt nur R&D ab | Installed-Rez-Matrix ergänzen; R&D erhalten |
| Pattel Antibody | installed, HQ, R&D; Archives ignoriert | Installiert nur rezzed; HQ/R&D ohne Rez; Archives nie; optional gegen 3 Credits | Kein Rez-Gate; bestehender Test deckt nur R&D ab | Installed-Rez-Matrix ergänzen; R&D erhalten |
| Stereogram Antibody | Archives | Nur Archives: 1 Net Damage und in R&D mischen | Kein installierter Accesspfad; Vertrag passend | Nicht-Installiert-Kontrollfall absichern |

## Vertragsklassen

### A – Installiert standardmäßig nur rezzed

Sieben Karten:

- `Corprunner's Shattered Remains`
- `Experimental AI`
- `Setup!`
- `TRAP!`
- `Vacant Soulkiller`
- `Doppelganger Antibody`
- `Pattel Antibody`

Für diese Klasse muss `accessEffectApplies` bei Source-Zone `installed` den
Rez-Zustand fail-closed berücksichtigen. Die Erlaubnis „even if ... not
installed“ gilt für Zugriffe aus nicht installierten Zonen; sie hebt den
Rez-Default einer tatsächlich installierten Karte nicht auf.

### B – Ausdrückliche installierte Unrezzed-Ausnahme

Eine Karte:

- `Virus Test Site`

Die Ausnahme ist nicht bloß ein `bypass_rez` für denselben Effekt. Sie besitzt
zwei Auflösungen:

- rezzed installiert: advancementskalierend;
- unrezzed installiert: konstant 1 Net Damage.

HQ und R&D haben keine Advancement-Counter und verursachen ebenfalls 1 Net
Damage; Archives ist ausdrücklich ausgeschlossen.

### C – Ausschließlich nicht installierte Source-Zone

Zwei Karten:

- `Bel-Digmo Antibody`: R&D;
- `Stereogram Antibody`: Archives.

Diese Karten belegen, dass das Rez-Gate nur an der Source-Zone `installed`
greifen darf. Ein pauschales „Corp-Asset muss rezzed sein“ würde ihre
regelkonformen Central-/Archives-Effekte zerstören.

## Runtime-Befund

`CardAccessEffectImplementation` beschreibt derzeit:

- `sourceZones`;
- optionale Ignore-/Reveal-Zonen;
- optionale Bedingung und Payment-Kosten;
- Effektschritte und Sichtbarkeit.

Eine Aktivierungsregel für installierte Quellen fehlt. Der zentrale Resolver
`accessEffectApplies` prüft deshalb aktuell ausschließlich:

1. Source-Zone enthalten;
2. Source-Zone nicht ignoriert;
3. Kartenbedingung erfüllt.

Der geeignete generische Fixpunkt liegt damit im semantischen Access-Vertrag,
nicht in sieben Karten-ID-Sonderzweigen. Die Ausnahme muss positiv am
Access-Deskriptor deklariert und in Choices erneut revalidiert werden.

## Testbefund und offene Evidence

Vorhandene Tests belegen Damage-, Trash-, Choice-, Reveal-, Redaction-,
Replay- und StateHash-Aspekte, aber mehrere Remote-Regressionen kodieren den
falschen Rez-Vertrag als erwartetes Verhalten:

- `Experimental AI`: Tests benennen und erwarten die Wirkung nach
  `decline_rez` ausdrücklich.
- `Setup!` und `TRAP!`: gemeinsamer Remote-Test passiert das Root-Rez-Fenster
  und erwartet weiterhin Damage beziehungsweise Payment-Choice.
- `Corprunner's Shattered Remains`, `Vacant Soulkiller` und `Virus Test Site`:
  Remote-Tests passieren das Rez-Fenster und erwarten den vollen Effekt.
- `Doppelganger Antibody` und `Pattel Antibody`: R&D ist abgedeckt, die
  installierte Rez-Matrix fehlt.
- `Bel-Digmo Antibody` und `Stereogram Antibody`: die korrekten nicht
  installierten Lebenszyklus-/Accesspfade sind vorhanden, sollen als
  Kontrollfälle erhalten bleiben.

P2 ersetzt die falschen fokussierten Erwartungen und implementiert den
Vertrag. P3 schließt anschließend die vollständige Kartenmatrix samt
Hidden-Info-, Replay- und StateHash-Evidence.

## P1-Done-Gate

- 56/56 aktive Corp-Assets in der Grundgesamtheit erfasst.
- 10/10 Zugriffseffekt-Assets identifiziert.
- 10/10 Zugriffseffekt-Assets einer belegten Vertragsklasse zugeordnet.
- 10/10 CardImplementation-Pfade gefunden.
- Sieben Default-Rez-Fälle, eine echte Unrezzed-Ausnahme und zwei
  nicht-installierte Kontrollfälle bestimmt.
- Keine ungeklärte Regel- oder Implementierungslücke vor P2.
