# NETGRID KI-Zielbild – Metaebene v5

## Zweck

Dieses Dokument beschreibt die große Linie der künftigen NETGRID-KI. Es ist kein Aufgabenprotokoll und keine technische Detailbeschreibung einzelner Umsetzungsschritte. Es hält fest, wie die KI grundsätzlich Karten, Decks, Spielsituationen und erlaubte Aktionen verstehen soll.

Die Leitidee ist: Die KI soll nicht mehr hauptsächlich isolierte Einzelaktionen bewerten. Sie soll erst verstehen, was Karten leisten, daraus den Charakter eines Decks ableiten, im Spiel taktische Zwischenziele bilden und danach eine konkrete erlaubte Aktion auswählen.

Die Engine bleibt immer Regelautorität. Die KI erzeugt keine Legalität. Sie bewertet nur Aktionen, die ihr die Engine als legal anbietet.

## 1. Grundkette der KI-Entscheidung

Das Zielmodell folgt dieser Kette:

```text
CardImplementation / Kartendefinition
→ kanonische Kartensemantik
→ Taktiksignale
→ Strategieanker mit Rolle
→ DeckDoctrine / Deckstrategieprofil
→ taktische Zwischenziele im aktuellen Spielzustand
→ semantisch verstandene LegalActions
→ Auswahl einer LegalAction
```

Diese Ebenen müssen getrennt bleiben. Eine Karte kann viele Funktionen haben, ohne eine Strategie zu tragen. Eine Strategie kann im Deck angedeutet sein, ohne vollständig oder belastbar zu sein. Eine LegalAction kann legal sein, aber taktisch trotzdem falsch.

Die zentrale Ergänzung in v5 ist die Action-Semantik-Brücke: Gute Karten- und Decksemantik nützt erst dann für konkrete Entscheidungen, wenn die KI eine angebotene LegalAction semantisch versteht.

## 2. CardImplementation und kanonische Kartensemantik

Die CardImplementation und die Kartendefinition beschreiben, was eine Karte regeltechnisch tut: Effekte, Kosten, Timing, Bedingungen, Zielwahl und Einschränkungen.

Aus dieser Ebene soll eine kanonische, kontrollierte Kartensemantik entstehen. Alte freie Rollen oder historische Hintbegriffe sind nicht das Zielmodell. Sie dürfen nur Übergang und Kompatibilität sein, solange bestehende KI-Pfade sie noch brauchen.

Diese Ebene beantwortet:

```text
Was passiert regeltechnisch?
```

Die kanonische Kartensemantik darf nicht frei geraten werden. Sie muss aus CardImplementation, Kartendefinition, strukturierten Effekten, Bedingungen, Profilen und geprüften Ableitungsregeln entstehen.

## 3. Taktiksignale

Taktiksignale sind die kontrollierte Funktionssprache der KI. Sie übersetzen die Kartentechnik in wiederverwendbare Begriffe, mit denen DeckDoctrine und spätere taktische Entscheidungen arbeiten können.

Diese Ebene beantwortet:

```text
Wofür kann die KI diese Karte funktional nutzen?
```

Beispiele auf Metaebene:

```text
Economy liefern
Breaker-Coverage herstellen
Karten suchen oder installieren
Run-Kosten senken
ICE verstärken oder schwächen
Zugriff verbessern
Remote-Druck erzeugen
Schaden androhen
Tags erzeugen oder ausnutzen
Ambush-/Access-Punish erzeugen
```

Taktiksignale sind keine Strategien. Sie sind Funktionsbausteine. Eine Economy-Karte ist nicht automatisch eine R&D-Strategiekarte. Ein normaler Breaker ist nicht automatisch ein Strategieanker. Solche Karten liefern zuerst taktische Funktion.

Der Taktiksignal-Katalog muss kontrolliert bleiben. Neue Signale dürfen nur ergänzt werden, wenn sie eine wiederverwendbare funktionale Unterscheidung ausdrücken. Spezialfälle sollen nicht zu beliebigen Einzelbegriffen führen; Detailbewertung soll über Kosten, Timing, Bedingungen, Zielprofile und Boardstate erfolgen.

## 4. Strategieanker

Strategieanker beschreiben, ob eine Karte eine größere Decklinie direkt trägt, belegt oder wesentlich ermöglicht.

Diese Ebene beantwortet:

```text
Welche große Deckstrategie unterstützt diese Karte direkt?
```

Strategieanker sind nur für echte Anker-, Payoff-, Engine- oder Schlüsselkarten gedacht. Normale Supportkarten erhalten keinen Strategieanker, auch wenn sie für eine Strategie wichtig sein können.

Beispiele für Strategielinien:

```text
Runner: R&D-Druck, HQ-Druck, Remote-Contest, Breaker-/Programmsuche, Survival
Corp: Remote-Scoring, Fast Advance, Tag/Punish, Damage/Kill, Asset-Economy, ICE-Tax/Glacier
```

Ein Strategieanker ist keine Handlungsanweisung. Er sagt nur, dass eine Karte eine Decklinie belegt oder trägt.

Wichtig: Taktiksignale werden nicht automatisch zu Strategieankern. Viele Taktiksignale sind reine Supportsignale. Strategieanker entstehen nur bei echten Anker-, Payoff-, Engine- oder Schlüsselkarten.

## 5. Rolle innerhalb eines Strategieankers

Eine strategische Rolle ist nur sinnvoll, wenn sie im Kontext eines Strategieankers verstanden wird. Sie beschreibt nicht allgemein die Karte, sondern ihre Funktion innerhalb einer bestimmten strategischen Linie.

Diese Ebene beantwortet:

```text
Welche Funktion erfüllt diese Karte in dieser Strategie?
```

Eine Karte kann mehrere Strategien unterstützen und dort unterschiedliche Rollen haben. Deshalb ist das präzisere Zielmodell kein loses Feld „strategicRole“, sondern ein Paar aus Strategieanker und Rolle.

Beispiel:

```text
corp.tag_trace_punish → punish_payoff
corp.damage_kill → win_condition
```

Oder:

```text
runner.search.breaker → engine_anchor
runner.rig_first → enabler
```

Der Nutzen dieser Rolle liegt in der Deckanalyse: Eine Strategie ist erst belastbar, wenn ihre notwendigen Rollen im Deck vorhanden sind. Ein Tag/Punish-Deck braucht Quellen und Payoffs. Ein Damage/Kill-Deck braucht Schaden oder eine Abschlussmöglichkeit. Eine Suchstrategie braucht eine Engine und sinnvolle Suchziele.

Ohne Rollen sieht DeckDoctrine nur: „Strategie vorhanden.“ Mit Rollen kann sie erkennen: „Die Linie hat Quelle, Engine, Payoff, Support und Abschlussfähigkeit“ oder: „Die Linie ist nur teilweise vorhanden.“

## 6. DeckDoctrine und Deckstrategieprofil

DeckDoctrine betrachtet nicht einzelne Karten isoliert, sondern das gesamte Deck.

Sie aggregiert:

```text
Taktiksignale
+ Strategieanker
+ Rollen innerhalb der Strategieanker
+ Deckzusammensetzung
+ Lücken und Schwächen
```

Daraus entsteht ein Deckstrategieprofil. Dieses Profil beschreibt, welche Strategien das Deck grundsätzlich unterstützt, welche Werkzeuge vorhanden sind und welche Voraussetzungen oder Lücken bestehen.

Diese Ebene beantwortet:

```text
Was kann dieses Deck grundsätzlich?
Welche Spielpläne legt die Deckzusammensetzung nahe?
Was fehlt diesem Deck?
```

Ein Deck kann mehrere Strategien gleichzeitig unterstützen. Strategiegewichte sind keine Befehle. Auch ein R&D-orientiertes Runnerdeck muss einen gefährlichen Remote contesten, wenn die Spielsituation es verlangt.

## 7. Keine Strategie ohne Strategieanker

DeckDoctrine darf aus bloßen Taktiksignalen keine Strategie erfinden.

Wenn ein Deck nur Economy, Draw, einfache Breaker, ICE oder Utility enthält, heißt das nicht automatisch, dass es eine konkrete Deckstrategie trägt. Diese Karten können eine Strategie unterstützen, aber sie belegen sie nicht zwingend.

Ein Deck ohne echte Strategieanker erzeugt daher keine künstliche Strategie. Es erzeugt eine ankerlose oder neutrale Doctrine:

```text
Funktionsbausteine vorhanden,
aber keine belastbare strategische Decklinie erkannt.
```

In diesem Zustand arbeitet die KI mit allgemeinen sicheren Prioritäten der jeweiligen Seite, nicht mit einer erfundenen Strategie.

## 8. NeutralDoctrine / Seiten-Grundprioritäten

Wenn keine belastbare Deckstrategie erkannt wird, braucht die KI trotzdem handlungsfähige Grundprioritäten.

Runner-neutral bedeutet beispielsweise:

```text
überleben
Economy stabilisieren
Karten ziehen
Rig/Coverage aufbauen
sichere Zugriffe nehmen
gefährliche Remotes contesten
bekannt sinnlose Runs vermeiden
```

Corp-neutral bedeutet beispielsweise:

```text
Mandatory Draw berücksichtigen
Economy stabilisieren
HQ/R&D nicht offenlassen
Remote vorbereiten
Scorefenster nutzen
ICE sinnvoll rezzen
Punish nur bei sichtbarer Grundlage nutzen
```

Diese NeutralDoctrine ist keine Deckstrategie. Sie ist ein sicherer Fallback, damit die KI nicht aus Supportsignalen falsche Strategien ableitet.

## 9. Vollständigkeit und Konfidenz von Strategien

Eine Strategie ist nicht einfach „vorhanden“ oder „nicht vorhanden“. Sie kann vollständig, teilweise, angedeutet oder unvollständig sein.

DeckDoctrine muss deshalb prüfen, ob die wesentlichen Rollen einer Linie vorhanden sind.

Beispiele:

```text
Tag-Quellen vorhanden, aber keine Payoffs → keine vollständige Tag/Punish-Strategie.
Damage-Payoff vorhanden, aber keine Tag-Quelle oder kein Kill-Fenster → unvollständige Linie.
R&D-Multiaccess vorhanden, aber keine ausreichende Coverage/Economy → Strategieanker vorhanden, Support lückenhaft.
```

Fehlende Rollen senken Konfidenz. Sie dürfen nicht durch bloße Mengen an Supportsignalen ersetzt werden.

## 10. Rollenstatus im Deck

DeckDoctrine muss unterscheiden, ob eine strategische Rolle im Deck überhaupt existiert, nur aktuell nicht sichtbar ist oder bereits aktiv genutzt werden kann.

Auf Metaebene sind dabei diese Zustände wichtig:

```text
Rolle fehlt im Deck.
Rolle ist im Deck vorhanden, aber aktuell nicht sichtbar/verfügbar.
Rolle ist sichtbar oder installierbar.
Rolle ist bereits aktiv.
Rolle ist unbekannt, weil der Decksnapshot unvollständig ist.
```

Das ist wichtig für Such-, Draw- und Setupentscheidungen. Wenn ein Payoff im Deck existiert, aber noch nicht sichtbar ist, kann Suchen oder Ziehen sinnvoll sein. Wenn er gar nicht im Deck existiert, darf die KI nicht nach einer nicht vorhandenen Linie spielen.

## 11. Taktische Zwischenziele

Aus Deckstrategie, NeutralDoctrine und aktuellem Spielzustand entstehen taktische Zwischenziele.

Diese Ebene beantwortet:

```text
Was sollte die KI jetzt vorbereiten oder erreichen?
```

Beispiele:

```text
Economy aufbauen
fehlende Breaker-Coverage herstellen
eine Schlüsselkarte suchen
ein konkretes ICE-Problem lösen
einen Remote contesten
eine bekannte Bedrohung beseitigen
Tags entfernen
Runner schützen
Punish-Fenster nutzen
Agenda scoren
Rez-Reserve sichern
```

Taktische Zwischenziele sind die Brücke zwischen langfristiger Deckanalyse und konkreter Aktion.

## 12. Zielprofile / TargetProfiles

Manche Karten verlangen bei der Nutzung eine sinnvolle Ziel- oder Moduswahl. Dafür reicht ein Taktiksignal allein nicht aus.

Ein TargetProfile beschreibt, wie die KI unter den legal angebotenen Zielen sinnvoll wählen soll.

Diese Ebene beantwortet:

```text
Wenn mehrere Ziele legal möglich sind, welches Ziel ist taktisch sinnvoll?
```

Beispiele:

```text
Ein Breaker bekommt Bonus gegen ein gewähltes ICE.
Eine Karte wählt einen ICE-Typ.
Eine Suchkarte installiert während eines Encounters ein Programm.
Ein Scoring-Effekt wählt ein ICE.
```

TargetProfiles dürfen keine verdeckte Information voraussetzen. Wenn ein ICE unbekannt ist, darf die KI nicht wissen, ob es ein starkes Sentry ist. Zielpräferenzen dürfen nur sichtbare, bekannte oder legal verfügbare Informationen nutzen.

TargetProfiles sind keine eigene Plannerlogik. Sie liefern Bewertungsinformationen, sobald die Engine konkrete legale Zieloptionen anbietet.

## 13. Semantisch verstandene LegalActions

Die KI wählt am Ende keine abstrakte Strategie und kein Taktiksignal, sondern eine konkrete LegalAction.

Damit die neue Semantik handlungswirksam werden kann, muss eine angebotene LegalAction mit ihrer Bedeutung verbunden werden. Diese Ebene ist die Action-Semantik-Brücke.

Diese Ebene beantwortet:

```text
Welche Bedeutung hat diese konkret angebotene legale Aktion im aktuellen Spielzustand?
```

Das Ziel ist eine read-only Projektion, sinngemäß:

```text
LegalAction
+ Quelle: Karte / Basic Action / Game Rule
+ konkrete Fähigkeit oder Ability
+ Kosten
+ Timing
+ Zielinformationen oder Zieloptionen
+ Boardstate-Kontext
+ Kartensemantik
= semantisch verstandener Aktionskandidat
```

Diese Projektion kann als ActionSemanticCandidate verstanden werden. Sie erzeugt keine Legalität und trifft noch keine Plannerentscheidung. Sie übersetzt nur eine bereits legale Engine-Action in eine Sprache, die die KI mit taktischen Zwischenzielen vergleichen kann.

Für kartenbasierte Aktionen muss die KI erkennen, welche Karte und welche konkrete Fähigkeit hinter der Aktion steht. Dann kann sie die Taktiksignale, Strategieanker, Rollen und TargetProfiles dieser Karte nutzen.

Für allgemeine Aktionen ohne Karte braucht es eigene Basisaktions-Semantik. Ein Credit nehmen, Karte ziehen, Tag entfernen, Run starten, ICE rezzen oder Agenda advancen sind keine Kartenaktionen, müssen aber ebenfalls in taktische Bedeutung übersetzt werden.

## 14. Voraussetzungen der Action-Semantik-Brücke

Damit eine LegalAction semantisch verstanden werden kann, braucht die KI mehrere side-safe Informationen.

### 14.1 Quelle

Die KI muss wissen, ob eine Action aus einer Karte, einer Basisaktion oder einer Spielregel stammt.

Bei kartenbasierten Actions muss die Quellkarte side-safe auflösbar sein. Bei Basic- oder Game-Rule-Actions gibt es keine Quellkarte; sie brauchen eigene Basisaktions-Semantik.

### 14.2 Fähigkeit / Ability

Bei Karten mit mehreren Fähigkeiten reicht die Karte allein nicht. Die KI muss auch wissen, welche konkrete Fähigkeit ausgeführt wird.

Ohne einheitliche Ability-Identität kann eine Karte mehrere Taktiksignale haben, aber die KI weiß nicht sicher, welches Signal zur angebotenen Action gehört.

### 14.3 Ziele und Zieloptionen

TargetProfiles können nur wirken, wenn die konkreten Ziele oder Zieloptionen der LegalAction side-safe sichtbar sind.

`targetRequirements` beschreiben oft nur die Form eines Ziels, nicht dessen konkreten Wert. Für eine sinnvolle Zielbewertung muss die KI wissen, welches konkrete ICE, Programm, Server, Karte oder welcher Modus angeboten wird.

### 14.4 Kosten und Timing

Die KI muss Kosten, Timing und Phase einer Action kennen. Eine Aktion mit gleichem Kartensignal kann je nach Kosten, Zeitfenster und Boardstate gut oder schlecht sein.

### 14.5 Boardstate-Kontext

Die Bedeutung einer Action entsteht erst im aktuellen Spielzustand. Ein Breaker ist wertvoll, wenn er ein relevantes ICE-Problem löst. Ein Damage-Payoff ist wertvoll, wenn der Runner verletzlich ist. Ein Run ist wertvoll, wenn Access erreichbar ist.

## 15. Basic-Action-Semantik

Nicht jede Aktion kommt aus einer Karte. Deshalb braucht die KI neben Kartensemantik auch eine kleine kontrollierte Semantik für Basis- und Systemaktionen.

Beispiele:

```text
Credit nehmen → Basic Economy
Karte ziehen → Basic Setup / Draw
Tag entfernen → Tag-Clear / Survival
Run starten → Run-Start / Access-Versuch
Run fortsetzen → Run-Continuation
Jack out → Run-Abbruch
ICE rezzen → ICE-Aktivierung / Schutz
Agenda advancen → Score-Fortschritt
Agenda scoren → Score-Closeout
```

Diese Semantik darf nicht über Karten-Hints geraten werden. Sie gehört zur Action-Semantik-Brücke und bleibt engine-/regelnah.

## 16. Auswahl einer LegalAction

Erst nach allen vorherigen Ebenen wählt die KI eine konkrete erlaubte Aktion.

Diese Ebene beantwortet:

```text
Welche der aktuell legalen Aktionen erfüllt das wichtigste taktische Ziel am besten?
```

Dabei bleiben harte Gates unverhandelbar:

```text
Legalität
Sichtbarkeit
Kosten
Timing
Reachability
Boardstate
Risiko
Known/Unknown-Information
```

Ein hoher Strategiewert darf keine unerreichbaren oder sinnlosen Aktionen rechtfertigen. Wenn ein Zugriff nachweislich nicht erreichbar ist, wird der Run als Zugriffsziel ausgeschlossen. Dann muss ein Vorbereitungsziel entstehen, zum Beispiel fehlende Coverage herstellen oder Economy aufbauen.

Die KI bewertet nicht rohe LegalActions, sondern semantisch verstandene Aktionskandidaten. Trotzdem bleibt die Engine die einzige Instanz, die entscheidet, ob eine Action wirklich legal ist.

## 17. Legacy-Abgrenzung

Alte Felder wie freie Rollen, Planrollen oder historische Hint-Kategorien können intern noch eine Übergangsrolle haben, solange bestehende KI-Pfade darauf angewiesen sind. Sie sind aber nicht das Zielmodell.

Das Zielmodell ist:

```text
Taktiksignale
Strategieanker mit Rollen
Deckstrategieprofil mit Vollständigkeit/Konfidenz
NeutralDoctrine bei ankerlosen Decks
TargetProfiles
semantisch verstandene LegalActions
```

Legacy darf nicht vorschnell aus Runtime-Pfaden entfernt werden. In fachlichen Oberflächen und zukünftigen Entscheidungsmodellen soll aber das neue Modell im Vordergrund stehen.

## 18. Zentrale Leitplanken

Die KI erzeugt keine Legalität.

Taktiksignale sind keine Aktionen.

Taktiksignale erzeugen nicht automatisch Strategieanker.

Strategieanker sind keine Befehle.

Keine Strategie ohne echte Strategieanker.

Ankerlose Decks erhalten NeutralDoctrine, keine erfundene Strategie.

Rollen beschreiben die Funktion einer Karte innerhalb einer konkreten strategischen Linie.

Strategien brauchen Vollständigkeit und Konfidenz, nicht nur Kartenzählung.

DeckDoctrine muss unterscheiden, ob eine Rolle im Deck fehlt, vorhanden, sichtbar, aktiv oder unbekannt ist.

TargetProfiles bewerten nur legale Zieloptionen und dürfen keine Hidden Information nutzen.

TargetProfiles sind nur handlungsfähig, wenn LegalActions konkrete Zielinformationen side-safe an die KI weitergeben.

LegalActions müssen semantisch projiziert werden, bevor die neue Kartensemantik konkret wirksam werden kann.

Deckstrategie ist Gewichtung, kein Autopilot.

Boardstate, Kosten und Reachability bleiben harte Gates.

Neue Signale müssen kontrolliert und katalogisiert sein.

Die KI darf später nicht jedes einzelne Signal als eigene Spezialregel behandeln. Taktiksignale müssen in wenige Consumer-Gruppen münden, etwa Coverage/Setup, Economy, Run-Kosten, Remote-Contest, Survival, Corp-Scoreline, ICE-Portfolio, Tag/Punish oder Target-Auswahl.

## 19. Voraussetzungen vor Planner-Cutover

Bevor die neue Semantik echte Plannerwirkung bekommt, müssen mehrere Bedingungen erfüllt sein:

```text
Kartensemantik ist für relevante Kartenklassen ausreichend gepflegt.
Taktiksignale sind kontrolliert und nicht widersprüchlich.
Strategieanker sind nur bei echten Anker-/Payoff-/Engine-Karten gesetzt.
TargetProfiles sind schema-seitig geklärt.
LegalActions tragen source-, ability-, target-, cost- und timing-relevante Informationen side-safe in die KI.
BasicActions haben eigene Semantik.
Boardstate-, Kosten- und Reachability-Gates sind vorgeschaltet.
Legacy-Abhängigkeiten sind bekannt oder ersetzt.
```

Ein Planner-Cutover ohne Action-Semantik-Brücke würde bedeuten, dass die KI zwar Karten und Decks besser versteht, aber bei einer konkreten angebotenen Aktion nicht zuverlässig erkennt, welche Bedeutung diese Aktion hat.

## 20. Zielzustand

Der Zielzustand ist erreicht, wenn die KI auf einer einheitlichen, kontrollierten Semantik arbeitet:

```text
Karten liefern Taktiksignale.
Einige Karten tragen Strategieanker.
Rollen erklären ihre Funktion innerhalb einer konkreten Strategie.
DeckDoctrine erkennt Spielpläne, Lücken und unvollständige Linien.
Ankerlose Decks werden neutral, nicht erfunden-strategisch behandelt.
TargetProfiles unterstützen sinnvolle Zielwahl.
Taktische Zwischenziele übersetzen Strategie und Boardstate in Handlungsabsichten.
LegalActions werden semantisch verstanden.
Die Engine bleibt Regelautorität.
```

Damit soll die KI weniger isolierte Einzelaktionen bewerten und stärker zielgerichtet spielen: erst verstehen, was Karten und Deck leisten können, dann erkennen, was die aktuelle Spielsituation verlangt, dann die Bedeutung der legal angebotenen Aktionen verstehen und danach die beste erlaubte Aktion wählen.
