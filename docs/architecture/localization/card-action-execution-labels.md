# Lokalisierte Ausführungstexte für Kartenfähigkeiten

Status: umgesetzt; Vollständigkeitsgate aktiv  
Stand: 2026-09-01  
Quelle: Nutzerfund zu zusammenfallenden Broker-Aktionsbezeichnungen

## Zielprüfung

Der Auftrag ist für eine automatische Abarbeitung ausreichend präzise.

- Endzustand: Unterschiedliche ausführbare Fähigkeiten derselben Karte bleiben
  in Deutsch, Englisch und Französisch unterscheidbar.
- Scope: produktive CardSpecs mit mehreren `capabilityText`-Einträgen, ihre
  kanonischen Fähigkeits-IDs und die normale Web-Aktionsdarstellung.
- Abnahme: vollständige CardSpec-Auditmatrix, Broker-Regression,
  Locale-Differenzierung, fokussierte Webtests und direkt betroffene
  Typechecks.
- Arbeitsmodell: eigener Worktree, Commit je Paket, finaler lokaler Merge nach
  `main` und verifizierter Cleanup.

## Gesamtziel

Die Weboberfläche rendert eine aktivierte Kartenfähigkeit aus ihrer stabilen
kanonischen Identität statt alle Fähigkeiten einer Karte in nichtdeutschen
Locales auf eine generische Bezeichnung zu reduzieren. Die Übersetzung ändert
weder `LegalAction`, `actionId`, `abilityRef`, Legalität noch Ausführung.

## Ursache

CardSpec und Rules Engine unterscheiden die Fähigkeiten bereits korrekt:
`capabilityKey`, kanonische `sourceAbilityId` und deutsches Autorenlabel bleiben
pro `LegalAction` erhalten. Die nichtdeutsche Web-Präsentation verwendet für
`activated_card_ability` dagegen nur Aktionstyp und Kartentitel. Dadurch werden
beispielsweise beide Broker-Fähigkeiten als dieselbe generische Aktion
angezeigt. Der Fehler liegt in der Präsentationsschicht, nicht in Kartenregel
oder Engine-Ausführung.

## Annahmen und Nicht-Ziele

- Deutsch bleibt die Autorenreferenz für `capabilityText.actionLabel`.
- Bestätigte englische und französische Ausführungstexte werden anhand der
  kanonischen `<cardDefinitionId>:<capabilityKey>`-Identität ausgewählt.
- Dynamische Ziel-, Kosten- oder Mengenparameter dürfen nur aus strukturierten,
  side-sicheren `LegalAction`-Daten stammen.
- Einzelne Karten ohne mehrere unterschiedliche Autorenlabels werden nicht
  vorsorglich redaktionell neu übersetzt.
- Engine-Regeln, KI-Entscheidungen, CardSpec-Mechaniken und Kartentooltiptexte
  werden nicht geändert.

## Controller-Invarianten

- Keine Fachlogik parst lokalisierte oder deutsche sichtbare Texte.
- `abilityRef.sourceAbilityId` beziehungsweise die identische strukturierte
  Capability-Bindung ist alleiniger Übersetzungsschlüssel.
- Eine Übersetzung darf `actionId`, `type`, `source`, `payload`, `abilityRef`,
  Kosten, Ziele und Timing nicht verändern.
- Fehlende Übersetzungsdeckung bei einer produktiven Karte mit mehreren
  Fähigkeiten ist ein Gate-Fehler und kein stiller Runtime-Fallback.
- Verdeckte Kartendaten werden weder als Übersetzungsschlüssel noch als
  Interpolationswerte verwendet.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Fokussierte Testfehler werden im aktiven Paket ursachenbezogen behoben.
Unabhängige Baselinefehler werden getrennt ausgewiesen. Der Prozess stoppt,
wenn eine Übersetzung Hidden Information benötigen würde, die kanonische
Fähigkeitsbindung fehlt oder ein neuer `main`-Stand denselben Vertrag
inkompatibel ändert. Removal Condition ist jeweils eine eindeutige,
side-sichere Capability-Bindung beziehungsweise die fachliche Auflösung des
Vertragskonflikts; ein Label-Parser oder stiller Ersatzwert ist unzulässig.

## State Machine

`vorbereitet -> Paket aktiv -> geprüft -> committed -> nächstes Paket -> main abgeglichen -> gemergt -> Worktree entfernt -> Branch entfernt -> complete`

## Paketfolge

| Paket | Inhalt | Done-Gate | Commit |
| --- | --- | --- | --- |
| P00 | Ursache, Vertrag und Auditmatrix | Prozessartefakt benennt Scope, Invarianten und alle betroffenen produktiven Mehrfachfähigkeiten | `docs(i18n): define card action label process` |
| P01 | Kanonischer Übersetzungskatalog und Renderer | Nichtdeutsche Aktionsdarstellung verwendet die gebundene Capability-ID; Broker-Aktionen und alle Auditkarten besitzen bestätigte Texte | `fix(i18n): preserve distinct card ability actions` |
| P02 | Vollständigkeits- und Regressionstore | Gate gleicht produktive CardSpecs gegen den Katalog ab und sichert Identität, Locale-Differenzierung und Broker | `test(i18n): cover multi-ability action translations` |
| P03 | Main-Abgleich, Rechecks, Merge und Cleanup | `main` enthält alle Paketcommits; Worktree und Arbeitsbranch sind nachweislich entfernt | kein Feature-Commit |

## Auditmatrix

Der CardSpec-Preflight findet 21 produktive Karten mit insgesamt 46
`capabilityText`-Einträgen. 20 Karten besitzen mindestens zwei verschiedene
deutsche Ausführungstexte; Sterdroid besitzt zwei timinggetrennte Capabilities
mit bewusst gleichem Text und bleibt zur Identitätsdeckung in der Matrix.

- Classic: Sterdroid; Protected Resources.
- Proteus: Digiconda; LDL Traffic Analyzers; Black Widow; Morphing Tool; Back
  Door to Rivals; Deck, The; Runner Sensei; Swiss Bank Account.
- Originalset: Baedeker’s Net Map; Bakdoor™; Access to Arasaka; Access to
  Kiribati; Back Door to Hilliard; Back Door to Orbital Air; Broker; Ronin
  Around; Submarine Uplink; Department of Truth Enhancement; Vapor Ops.

Das P02-Gate leitet diese Menge weiterhin direkt aus den produktiven
CardSpec-Projektionen ab. Eine neu hinzukommende Mehrfachfähigkeit erweitert
die Liste deshalb nicht still, sondern verlangt bestätigte Übersetzungen.

## Verifikationsregeln

- Pro Paket zuerst der engste betroffene Vitest.
- Bei geänderter Package- oder Typoberfläche die direkt betroffenen
  Typechecks ausführen.
- Vor jedem Commit `git diff --check` ausführen und nur Paketdateien stagen.
- Nach `main`-Abgleich ausschließlich direkt betroffene Checks wiederholen.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_CARD_ACTION_TRANSLATIONS`
- Arbeitsbranch: `codex/card-action-translations`
- Integrationsbranch: lokaler `main`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für Preflight und finalen Merge
- Bevorzugter Merge: Fast-Forward; kein Push und keine PR.
- Nach erfolgreichem Merge werden der saubere Worktree und anschließend der
  vollständig gemergte Branch entfernt; Git-Liste und Dateisystem werden
  separat geprüft.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Lokalisierte Ausführungstexte für Kartenfähigkeiten“
sequenziell von P00 bis P03 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main. Arbeite ausschließlich im dokumentierten Worktree, führe je
Paket nur direkt änderungsnahe Checks und git diff --check aus, committe jedes
abgeschlossene Paket und stoppe bei einem Sicherheitsblocker ohne Fallback.
Gleiche abschließend aktuelles main ab, wiederhole die betroffenen Checks,
merge lokal, prüfe main, entferne Worktree und Branch verifiziert und markiere
das Goal erst danach als complete.
```

## Abschlusskriterien

- Alle produktiven Karten mit mehreren Capability-Texten sind maschinell
  erfasst und in Englisch sowie Französisch vollständig gedeckt.
- Broker zeigt „3 Credits auflegen“ und „alle Credits nehmen“ als zwei
  unterschiedliche Aktionen in allen drei Locales.
- Lokalisierung bleibt reine Darstellung über die kanonische Capability-ID.
- Fokussierte Tests, direkt betroffene Typechecks und `git diff --check` sind
  grün.
- Änderungen sind lokal nach `main` integriert; Worktree und Branch sind
  verifiziert entfernt.

## Umsetzung und Nachweis

- Der Browserkatalog `card-capability-action-translations.ts` deckt alle 46
  kanonischen Fähigkeitsidentitäten der 21 produktiven Mehrfachfähigkeitskarten
  in Englisch und Französisch ab.
- `action-board-ui.ts` wählt diese Texte ausschließlich über die konsistente
  kanonische Bindung aus; Deutsch rendert weiterhin das CardSpec-Autorenlabel.
- Der Vollständigkeitstest leitet die Mehrfachfähigkeitsmenge direkt aus den
  öffentlichen CardSpec-Projektionen ab und prüft Deckung sowie erhaltene
  Differenzierung pro Locale.
- Die Broker-Regression sichert getrennt „3 Credits auflegen“ und „alle Credits
  nehmen“, außerdem die Unverändertheit der `LegalAction`-Identität.
- Verifiziert mit 137 fokussierten Webtests, dem Web-Typecheck und dem
  I18N-Gate mit 2308 ausgerichteten Nachrichten in drei Locales.
