# KI-Kartenhint-Vollbestandsremediation – Prozess vom 18.07.2026

Status: `active`

Quelle:
`docs/reviews/ai/ai-card-hint-full-inventory-audit-2026-07-18.md`

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise. Der Audit benennt konkrete Karten, Signal- und Metadatenflächen,
Runtime-Konsumenten, Qualitätsreste und Verifikationsgates. Die Nutzerregel für
nicht konsumierte Metadaten ist bindend:

- Wenn Entfernen den erkennbaren Kartenzweck oder eine benötigte
  Entscheidungsinformation verliert, wird eine strukturierte Ersatzsemantik
  oder ein produktiver Consumer geschaffen.
- Wenn die Information redundant, wirkungslos oder nicht entscheidungsrelevant
  ist, wird sie entfernt oder ausdrücklich als Evidence-only klassifiziert.

## Gesamtziel

Alle im Vollbestandsaudit erkannten Kartenhint-, Transport-, Consumer-,
Ontologie-, Target- und Qualitätslücken sind fachlich geschlossen. Aktive
Hints, Compiler, Derived Facts, Inspector, Signalcatalog und produktive
Semantic Runtime besitzen danach einen nachvollziehbaren gemeinsamen Vertrag.
Der Arbeitsbranch wird nach grüner Gesamtverifikation lokal nach `main`
integriert; Worktree und Arbeitsbranch werden anschließend verifiziert
entfernt.

## Annahmen

- Regeltext und Engine-Implementierung sind die fachliche Quelle für den
  Kartensinn. Hints dürfen keine neue Regelautorität erzeugen.
- Ein Feld braucht nicht für jeden Einzelwert einen Sonderkonsumenten. Ein
  generischer Consumer ist zulässig, wenn Typ, Scope, Timing und Bedeutung
  geschlossen sind.
- Evidence-only-Daten dürfen erhalten bleiben, wenn Diagnose-, Gate- oder
  Reviewnutzen belegt und ihre fehlende Runtimewirkung ausdrücklich ist.
- Das Testset wird getrennt von produktiven Sets normalisiert.
- Bestehende fachfremde Änderungen auf fortgeschrittenem `main` werden beim
  finalen Abgleich erhalten.

## Nicht-Ziele

- Keine Änderung von Kartenregeln oder LegalActions durch Hints.
- Kein UI-Redesign, keine Server-/Storage-Erweiterung und keine neue
  Hidden-Info-Fläche.
- Keine historische Datenmigration oder Rückwärtskompatibilität für alte
  Hintartefakte ohne aktuellen Nutzen.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Rules Engine und PlayerView-Verträge bleiben alleinige Regel- und
  Informationsautorität.
- Jede neue Runtimeauswertung nutzt ausschließlich side-sichere Informationen.
- Kein Hint darf illegale Actions erzeugen oder LegalActions umgehen.
- Jede erhaltene entscheidungsrelevante Metadatenklasse besitzt nachweisbar
  einen produktiven Consumer.
- Jeder entfernte Wert ist entweder redundant, durch strukturierte Semantik
  ersetzt oder fachlich nicht entscheidungsrelevant.
- Nach jedem Paket folgen Fokuschecks, `git diff --check`, Dokumentation und
  ein eigener Commit.

## Automatische Fehlerbehandlung

- Rote Fokuschecks werden im aktiven Paket eng diagnostiziert und behoben.
- Neue fachfremde Funde werden als Follow-up dokumentiert und erweitern das
  aktive Paket nicht still.
- Ein vorhandenes rotes Baseline-Gate wird nur dann akzeptiert, wenn es auf dem
  Paket-Startcommit reproduzierbar und vom Paketdiff unabhängig ist.
- Konflikte mit neuerem `main` werden inhaltlich aufgelöst; beide kompatiblen
  Intentionen bleiben erhalten.

## Sicherheitsblocker

Der Prozess stoppt mit Blocker-Report, wenn eine Korrektur nur durch
Hidden-Info-Zugriff, Umgehung der LegalActions, Änderung der Regelautorität
oder einen unentscheidbaren fachlichen Kartenvertrag möglich wäre. Removal
Condition ist jeweils ein side-sicherer, LegalAction-konformer und durch
Kartentext/Engine belegter Vertrag.

## State Machine

`prepared -> package_active -> package_verified -> package_committed ->
next_package -> final_verification -> main_integrated -> worktree_removed ->
complete`

Bei roten Paketchecks bleibt der Zustand `package_active`. Bei einem
Sicherheitsblocker wechselt er zu `blocked` und wird nicht automatisch
fortgesetzt.

## Paketfolge

### AIH-00 – Audit- und Prozessbaseline

Ziel: Vollbestandsaudit, Wissensstatus und diesen Prozess als verbindliche
Ausgangsbasis versionieren.

Kernartefakte:

- `docs/reviews/ai/ai-card-hint-full-inventory-audit-2026-07-18.md`
- dieses Prozessartefakt
- aktueller Projektstatus und Betriebslog

Checks: Markdownformat, Link-/Pfadplausibilität, `git diff --check`.

Done-Gate: Scope, Zahlen, Worktree, Branch, Pakete und Nutzerentscheidung sind
dokumentiert; der Hauptworkspace ist sauber.

Commit: `docs(ai): plan full card hint remediation`

### AIH-01 – Eindeutige Kartenhint-Korrekturen

Ziel: Die 17 produktiven Karten aus Auditabschnitt A fachlich korrigieren.

Arbeit:

- falsche Tag-, Damage-, Serverziel-, Coverage- und Condition-Semantik
  entfernen oder ersetzen;
- fehlende Multiaccess-, Programmtrash-, Self-Tag-, Bad-Publicity- und
  Damage-Retaliation-Semantik strukturiert ergänzen;
- aktive und kompilierte Artefakte synchron neu erzeugen;
- fokussierte Hint-, Action-Profile- und Decision-Tests ergänzen.

Checks: Compiler-/Inspector-Checks, betroffene AI-Tests, Kartenszenarien,
`git diff --check`.

Done-Gate: Jede der 17 Karten besitzt kartentextgetreue Semantik und einen
belegten Transport bis zum passenden Consumer oder eine ausdrückliche
Evidence-only-Entscheidung.

Commit: `fix(ai): correct high-confidence card hint semantics`

### AIH-02 – Strukturierter Transport für 28 Karten

Ziel: Die 28 produktiven Karten mit rohen Taktiksignalen ohne `effects` in
einen strukturierten, konsumierbaren Vertrag überführen.

Arbeit:

- Familien Agenden, Damage/Tag/Trace-ICE, ETR/Modus-ICE und
  Random/Run-Rewind getrennt bearbeiten;
- `effects`, `conditions`, Scope, Timing, Target und Beträge aus Kartentext und
  Engine ableiten;
- rohe Signale nur behalten, wenn sie weiterhin Diagnose- oder
  Ableitungsnutzen besitzen.

Checks: pro Familie fokussierte Compiler-, Mapping-, Profile- und AI-Tests;
danach vollständige Hint-/Signalgates.

Done-Gate: Keine produktive Karte besitzt entscheidungsrelevante
`tacticSignals` ohne äquivalenten produktiven Transport oder dokumentierte
No-runtime-Policy.

Commit: `feat(ai): structure remaining productive card hint effects`

### AIH-03 – Offene Taktiksignalverträge

Ziel: Die 24 Signalarten ohne Consumer oder ausdrückliche Policy schließen.

Arbeit:

- 22 aktiv verwendete Signale auf 19 Karten nach Breaker-, Search/Install-,
  Hosting/Backup- und Archives-Replacement-Familien bearbeiten;
- je Signal produktiven Consumer, Ableitung in konsumierte Effects oder
  ausdrückliche No-runtime-/Evidence-only-Policy wählen;
- die unbenutzten Definitionen `breaker.subroutine_prevention` und
  `ice.recovery` entfernen oder zukunftsfest klassifizieren.

Checks: Taktiksignal-Consumer-Gate, Strategy-/Action-Profile-Tests,
Decision-Checkpoints und `git diff --check`.

Done-Gate: Kein Signal mit `consumer_or_explicit_policy_required` bleibt ohne
Consumer-Modus.

Ergebnis:

- Microtech Backup Drive wird über den strukturierten Effekt
  `program_trash_prevention` als Programmschutz in der Runner-Handentwicklung
  erkannt und nicht mehr als zwecklose Hardware behandelt;
- die 22 weiterhin nützlichen Diagnose-Signale sind zentral als
  `readOnlySemanticsSignalIds` klassifiziert, weil ihre produktive Bedeutung
  bereits über Effects, BreakerProfile, TargetProfile oder LegalActions läuft;
- die nie zugewiesenen und durch präzisere Semantik ersetzten Definitionen
  `breaker.subroutine_prevention` und `ice.recovery` wurden entfernt;
- der Consumer-Report weist 671 Signale, 294 coverage-pflichtige Verträge und
  null unverbrauchte Pflichtverträge aus.

Commit: `feat(ai): close tactic signal consumer contracts`

### AIH-04 – Pair- und Value-Ontologie

Ziel: `strategySupportPairs`, `valueHints`, `requiredMechanics` und
`scenarioRefs` auf geschlossene Runtime-/Evidence-Verträge reduzieren.

Arbeit:

- Pair-Zuweisungen auf tatsächlichen Doctrine-/Planbedarf prüfen; notwendige
  Paare generisch konsumieren, redundante entfernen;
- `valueHints` typisieren und den ungesicherten generischen
  `Object.values`-Pfad ersetzen; notwendige Zweckwerte konsumierbar erhalten,
  redundante Long-Tail-Werte entfernen;
- `requiredMechanics` und `scenarioRefs` explizit als Runtime- oder
  Evidence-only-Felder markieren und Gate-/Inspector-Ausgabe daran anpassen.

Checks: Deck-Doctrine-, Opening-Hand-, Remote-, Action-Candidate-,
Hint-Quality- und Consumer-Tests.

Done-Gate: Keine erhaltene Pair-/Value-Zuweisung ist still wirkungslos; das
Entfernen eines Wertes löscht keinen nicht anderweitig erkennbaren
Kartenzweck.

Ergebnis:

- 733 untypisierte und gegenüber Rollen/Effects redundante Value-Zuweisungen
  wurden entfernt; keine der betroffenen Karten war ausschließlich durch
  diesen Zahlenwert funktional beschrieben;
- 102 Corp-Assets/-Upgrades wurden ohne Verlust ihrer bisherigen
  Root-/Trashbewertung auf den eindeutigen Runtime-Schlüssel
  `remoteRootValue` migriert; generisches `Object.values(valueHints)` ist aus
  beiden Remote-Entscheidungspfaden entfernt;
- der verbleibende Vertrag umfasst nur noch 203 schlüsselspezifisch
  konsumierbare Werte (`economy`, `damage`, drei Loan-Werte und
  `remoteRootValue`);
- von 241 `strategySupportPairs` sind 125 über Opening- oder
  Upgrade-Placement-Verträge runtimewirksam und 116 ausdrücklich
  Evidence-only; 46 `requiredMechanics=memory` sind runtimewirksam, die
  übrigen 1.776 Mechanikzuweisungen sowie 628 `scenarioRefs` sind
  Evidence-only;
- ein neues Metadaten-Gate verhindert untypisierte Werte und unzulässige
  `remoteRootValue`-Zuweisungen.

Commit: `refactor(ai): close hint metadata ontology contracts`

### AIH-05 – Qualitäts-, Target- und Testset-Restbestand

Ziel: zurückgestellte Reviews, Target-Profile-Gaps, Singleton-/Synonymrauschen
und synthetische Testset-Fehlrollen bereinigen.

Arbeit:

- 32 Inspector-Reviewfälle und 88 Target-Profile-Gaps kartenweise schließen;
- Rollen-/Planrollen-Singletons familienweise normalisieren;
- zehn klar sachfremde Testset-Planrollen und weitere dadurch sichtbar
  werdende Fixture-Lücken korrigieren;
- Qualitätsflags nur nach belegter Prüfung auf reviewed/geeignete Confidence
  setzen.

Checks: Inspector, Hint-Quality, Target-Profile-, Fixture- und vollständige
AI-Shards.

Done-Gate: keine unbegründeten Deferred-/Target-Warnungen im freigegebenen
Bestand; verbleibende Warnungen sind explizit und fachlich begründet.

Commit: `fix(ai): close card hint quality and target backlog`

### AIH-06 – Gesamtverifikation und Abschlussreview

Ziel: alle Pakete gemeinsam verifizieren, Ergebnisse dokumentieren und lokal
integrieren.

Arbeit:

- aktive/kompilierte Hints, Derived Facts und Inspector neu erzeugen;
- Fokus-, Contract-, AI-Shard-, Full-AI-, Typecheck- und Build-Gates ausführen;
- AI Behavior Baseline in fester Konfiguration erneut ausführen und mit der
  dokumentierten Ausgangsbasis vergleichen;
- Abschlussreview, Projektstatus und Betriebslog aktualisieren.

Done-Gate: Arbeitsbranch sauber, relevante Gates grün oder ein reproduzierbar
fachfremder Baselinefehler präzise dokumentiert; Abschlussreview vollständig.

Commit: `docs(ai): close full card hint remediation`

## Verifikationsregeln

- Paketchecks laufen vor dem Paketcommit.
- Generierte Artefakte werden ausschließlich über die vorgesehenen
  Projektbefehle aktualisiert.
- `git diff --check` ist in jedem Paket Pflicht.
- Tests mit Timeout oder abgebrochenem Prozess gelten als rot.
- Der finale Baselinevergleich verwendet identische Slots, Seeds,
  Aktionslimit und Controllerkonfiguration.

## Worktree-, Git- und Integrationsregeln

- Worktree:
  `C:\Projekte\NETGRID_AI_CARD_HINT_FULL_INVENTORY`
- Branch: `codex/ai-card-hint-full-inventory`
- Integrationsbranch: lokaler `main`
- Jedes abgeschlossene Paket erhält genau einen klar benannten Commit; eng
  notwendige generierte Dateien gehören zum selben Paket.
- Vor der Integration wird aktuelles `main` in den Arbeitsbranch eingebunden,
  falls es weitergelaufen ist.
- Integration bevorzugt per Fast-Forward im Hauptworkspace.
- Nach erfolgreicher Main-Prüfung wird der saubere Worktree ohne `--force`
  entfernt, die Entfernung in Git und Dateisystem geprüft und der vollständig
  gemergte Branch mit `git branch -d` gelöscht.
- Kein Push und kein Pull Request.

## Verbindliches `/Goal`

`/Goal Arbeite die KI-Kartenhint-Vollbestandsremediation vollständig und
sequenziell von AIH-00 bis AIH-06 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die
Pflichtseiten der Wissensbasis, den Vollbestandsaudit und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_CARD_HINT_FULL_INVENTORY auf Branch
codex/ai-card-hint-full-inventory; nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe die Paketchecks aus,
dokumentiere das Ergebnis und committe jedes abgeschlossene Paket. Entscheide
nicht konsumierte Metadaten nach Zwecknotwendigkeit: notwendige Information
erhält strukturierte Semantik oder Consumer, redundante Information wird
entfernt oder ausdrücklich Evidence-only. Bei Sicherheitsblocker stoppe mit
Blocker-Report und Removal Condition. Nach Abschluss final verifizieren,
aktuelles main defensiv integrieren, lokal nach main mergen, main prüfen, den
sauberen Arbeits-Worktree verifiziert entfernen, den gemergten Arbeitsbranch
löschen und das Goal erst dann als complete markieren.`

## Abschlusskriterien

- AIH-00 bis AIH-06 sind jeweils geprüft und committed.
- Die Auditmaßnahmen sind umgesetzt oder mit expliziter, fachlich begründeter
  No-runtime-/Evidence-only-Entscheidung geschlossen.
- Abschlussreview, Wissensstatus und Betriebslog entsprechen dem realen Stand.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree und gemergter Branch sind nachweislich entfernt.
- Das `/Goal` ist erst danach `complete`.
