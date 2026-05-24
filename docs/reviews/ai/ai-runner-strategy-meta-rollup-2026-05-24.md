# AI Runner Strategy Meta Rollup 2026-05-24

Status: Strategisches Rollup / Arbeitsgrundlage  
Scope: Runner-KI, strategische Phasen, Wissensmodell, Progression, offene Entwicklungsrichtung  
Empfohlener Zielpfad im Repo: `docs/reviews/ai/ai-runner-strategy-meta-rollup-2026-05-24.md`  
Ausgangspunkt: Dialogische Analyse, Codex-Rückmeldungen und Review-Artefakte aus Mai 2026  
Keine Architekturvorgabe, keine Engine-Regeländerung, keine neue Kartenfreigabe

## 1. Kurzfazit

Die NETGRID-KI ist inzwischen in vielen lokalen Punkten deutlich robuster: LegalAction-Orchestrierung, side-safe DTOs, Effective-Run-Projektion, Known-Card-Memory, Benchmark-Decksuite, Frozen Holdouts, Draw-/Duplicate-Discipline, Economy-Reserve, Remote-/Central-Diagnose und Outcome-Follow-up sind erheblich besser instrumentiert und teilweise verbessert.

Trotzdem ist `current_candidate` gegenüber `belief_ai_v1_4_2` noch nicht klar durchgehend spielstärker. Die Safety ist stabil, aber ActionLimit/Stagnation bleibt das Hauptproblem. Die plausibelste Erklärung ist nicht mehr ein einzelnes falsches Action-Gewicht, sondern fehlende Makrostruktur: Der Runner braucht ein klares Verständnis seiner Spielphase, seiner Rig-/Economy-Bereitschaft, seiner Breaker-Coverage und des richtigen Zeitpunkts, von Setup zurück in Druck zu wechseln.

Das wichtigste strategische Ziel für die nächste Entwicklungsrunde ist daher ein Runner-Phasenmodell:

1. Early Opportunistic Pressure: billige/offene Runs nutzen.
2. Rig/Economy Construction: Cashpool, Breaker, Suchkarten und Coverage gezielt aufbauen, wenn einfache Runs nicht mehr profitabel sind.
3. Equipped Pressure / Closeout: mit aufgebautem Rig und Geld wieder in gezielten Druck, Remote-Contest und Zentralserver-Closeout wechseln.

Dieses Modell soll nicht als harte Script-Engine entstehen, sondern als side-sicheres, erklärbares Makro-Signal, das vorhandene Planarten gewichtet und Phasenwechsel stabiler macht.

## 2. Architekturprinzipien, die nicht verletzt werden dürfen

Die KI bleibt ein LegalAction-Entscheider, nicht die Regelautorität. Sie bewertet nur erlaubte Aktionen und gibt eine `actionId` plus gegebenenfalls Choices zurück; die Engine validiert weiter über `applyAction`.

Zentrale Prinzipien:

- Keine Hidden Info.
- Keine echte Corp-Hand, echte R&D-Reihenfolge oder gegnerische Deckliste.
- Keine FullState-Abkürzung im AIInput.
- Keine KI-Sonderlogik, die Kartennamen als Regelquelle verwendet.
- Engine/Projection liefert side-safe effektive Sicht; KI wertet diese Projektion aus.
- AI-Hints und Doctrine beeinflussen Bewertung, aber schalten keine Karten frei und erzeugen keine LegalActions.
- Benchmark-Metriken dürfen aus State/Eventlog abgeleitet werden, aber nicht als Hidden Info in die KI-Entscheidung gelangen.

Die bisherige Ist-Dokumentation beschreibt genau diese Architektur: PlayerView, LegalActions, PublicEvents, DTO-Allowlist, Belief State, Baseline, Planer und finale Engine-Revalidierung bilden die Sicherheitsgrenze.

## 3. Was bisher erreicht wurde

### 3.1 Safety- und Orchestrierungsfixes

Der activeSide-vs-LegalActions-Fehler wurde behoben. Die KI fragt nicht mehr blind `state.activeSide`, wenn in einem Run-/Rez-Fenster tatsächlich die Gegenseite LegalActions hat. Das war ein grundlegender Orchestrierungsfix für Simulation und Live-Serverpfad.

Dieser Fix ist kein Strategie-Tuning, sondern eine notwendige Korrektur der Entscheidungsschleife.

### 3.2 Effective-Run- und ICE-Projektion

Die Run-Kostenbasis wurde erheblich verbessert.

Die KI wertet nicht mehr nur gedruckte ICE-Werte aus, sondern nutzt side-safe Engine-Projektionen:

- `VisibleEffectiveIceRunQuote`
- sichtbare Server-/Root-Modifikatoren wie Crystal-Palace-artige Tax-Effekte
- sichtbare effektive ICE-/Subroutine-Kosten
- `VisibleEffectiveSubroutine.unbrokenRunEffect` für Tutor-/Virizz-artige Effekte, die erst beim Durchlassen einer Subroutine den restlichen Run verändern

Wichtig ist die Trennung:

- Aktive sichtbare Modifikatoren werden über Effective-Quote bewertet.
- Noch nicht ausgelöste, aber sichtbare Subroutine-Folgeeffekte werden über `unbrokenRunEffect` bewertet.
- Die KI kennt keine Sonderfälle wie „Tutor“ oder „Virizz“ als Kartennamenlogik, sondern bewertet generische Signale wie zusätzliche spätere ETR-Subroutinen, höhere Breakkosten, verhindertes Jack-out oder künftige Breakbarkeit.

### 3.3 Known-Card-Memory

Mehrere echte Memory-Lücken wurden geschlossen oder als wichtig identifiziert:

- HQ-Memory speichert bekannte Karten pro Karte, nicht nur pro Definition.
- Full-HQ-Reveals werden side-private in den Runner-AIInput projiziert.
- Vollständig bekanntes HQ ohne Agenda wird abgewertet.
- Bekanntes HQ mit Agenda wird aufgewertet.
- Bekannte R&D-Topkarte wird nach Corp-Draw als bekannte HQ-Karte übernommen.
- R&D-Shuffle/Reorder/Conceal invalidiert konservativ.
- Remote-Access-Memory behält verdeckte Remote-Root-Karten positionsbasiert, wenn sie nach Access nicht entfernt wurden.
- Smarteye-/Expose-Wissen über unrezzed ICE bleibt als bekannte Position erhalten und beeinflusst spätere Run-Kosten/Gefahr.

Diese Fixes sind Infrastruktur, nicht experimentelle Heuristik. Ohne sie können Central Pressure, Remote Contest, Run-Kosten und Closeout nicht korrekt funktionieren.

### 3.4 Benchmark- und Deckbasis

Die frühere Demo-Deck-Basis war nur ein schwacher Benchmark. Es wurde eine bessere Suite aufgebaut:

- Smoke: `demo_runner_008` vs. `demo_corp_008`
- Snapshot-Tuning: `onr_origin_runner_ai_snapshot_v1` / `onr_origin_runner_ai_event_pressure_snapshot_v1` gegen `onr_origin_corp_ai_snapshot_v1`
- Snapshot-Holdout: `onr_origin_runner_ai_event_pressure_snapshot_v1` gegen `onr_origin_corp_ai_tag_ops_snapshot_v1`
- Frozen Local Realistic Holdouts:
  - `Blink Pressure Rig` vs. `Ivory Bastion`
  - `R&D Interface Dig` vs. `Shadoe Tag & Bag`

Lokale Deck-Editor-Decks wurden eingefroren und im Repo versioniert. Die Benchmark-Suite darf nicht live aus `%APPDATA%/NetGrid/Decks` lesen, um reproduzierbar zu bleiben.

### 3.5 AI-Hints und Support-Contract

Der AI-Hints-Support-Contract wurde stabilisiert:

- 410 aktive AI-supported Karten.
- 410 aktive AI-Hints.
- `Toughonium Wall` ist bewusst runtime-sichtbar/human-playable, aber nicht AI-supported.
- Schwache Hints für Breaker, Remote-Upgrades, Scoring-Agendas und Economy wurden gezielt geschärft.

AI-Hints bleiben Doctrine-/Bewertungshilfen, keine Spielbarkeits- oder Regelquelle.

## 4. Was die bisherigen Strategie-Slices gezeigt haben

### 4.1 Corp

Die Corp baut und schützt Remotes besser als am Anfang. Remote-Advances wurden zunächst fälschlich nicht gemessen; nach Korrektur stellte sich heraus, dass die Corp durchaus advancet. Score-Actions werden nicht verpasst: Wenn `score_agenda` legal ist, wird sie zuverlässig genommen.

Das Problem liegt davor:

- Score-Windows entstehen zu selten.
- Advanced Remote Agendas werden oft vor dem Corp-Score gestohlen.
- Protection kann helfen, aber schützt nicht in allen Slots genug.
- Teilweise entstehen Protection-/Economy-/Remote-Build-Ketten ohne klare Score-Konversion.

Die Corp braucht langfristig keine weitere `score_now`-Erhöhung, sondern bessere Remote-Build → Protect → Advance → Score-Ketten.

### 4.2 Runner Draw, Hand und Duplicate-Install

Exzessives Runner-Draw war real und wurde deutlich reduziert. Besonders `local_realistic_pair_1` zeigte vor dem Fix massives Draw-Verhalten. Low-Value-Duplicate-Installs, etwa zweite `Junkyard BBS` ohne Zusatznutzen, wurden abgewertet.

Wichtig: Draw ist nicht pauschal schlecht. Draw ist gut, wenn Antworten fehlen. Es ist schlecht, wenn spielbare Economy, relevante Breaker, Pressure-Karten oder sinnvolle Runs bereits verfügbar sind.

### 4.3 Runner Economy und Reserve

Der Runner hatte kein ausreichend stabiles Cashpool-Modell. Economy-Aktionen allein bedeuten nicht, dass ein nutzbarer Cashpool entsteht; der Runner kann Geld sofort wieder in schwache Runs, redundante Installationen oder zu frühe Trash-/Access-Versuche verbrennen.

Der Reserve-Slice verbesserte:

- Contest-Reserve
- Steal-/Trash-Reserve
- Known-Path-Affordability
- Vermeidung bekannter unbezahlbarer Pfade

Trotzdem bleibt Cashpool-/Tempo-Abwägung ein Makroproblem: Der Runner muss wissen, wann er sparen, wann er installieren und wann er laufen soll.

### 4.4 Runner Remote-Contest und Trash

Remote-Trash war nicht primär ein verpasster Trash-Choice. Wenn eine relevante bezahlbare Trash-LegalAction entsteht, nimmt der Runner sie meist. Das Problem liegt eher darin, die richtigen Remotes zur richtigen Zeit zu erreichen.

Remote-Contest wurde verbessert, aber das wichtigste Restthema ist Timing:

- Welche Remote ist wirklich eine Score-Bedrohung?
- Ist der Run bezahlbar inklusive Steal-/Trash-Reserve?
- Ist Central Pressure gerade besser?
- Ist der Remote leer, low-value, bait oder gefährlich?

### 4.5 Central Pressure, Closeout und No-Fresh

Central Pressure war nicht einfach „zu wenig“ oder „zu viel“. Es war schlecht klassifiziert:

- Closeout-Opportunities waren zu breit gezählt.
- Repeated Central Runs mussten nach frischem Wert unterschieden werden.
- No-Fresh-Central-Fenster wurden später oft bereits durch Economy/Setup ersetzt.

Ergebnis: Die Erklärbarkeit wurde besser, aber der Spielstärkegewinn blieb begrenzt. Weitere isolierte Central-Heuristiken sind nicht mehr der richtige Weg.

### 4.6 Outcome-Follow-up und Gating

Outcome-Follow-up machte Entscheidungen erklärbarer, war aber zunächst zu breit und verursachte Nebenwirkungen. Das spätere Gating schützte Score-Fenster, Steal/Trash und blockierte Effective-Quote-Runs.

Fazit:

- Outcome-Follow-up ist nützlich, wenn es echte Progression erzeugt.
- Es ist schädlich, wenn es nur Setup-/Economy-/Pivot-Ketten ohne Conversion erzeugt.

## 5. Zentrale offene Diagnose

Nach allen lokalen Verbesserungen ist das Restproblem nicht mehr ein einzelner Fehler, sondern fehlende Makro-Planung.

Die KI ist aktuell stark als LegalAction-Scorer und kurzfristiger Planbewerter. Sie rekonstruiert Intent, aber hat keine robuste persistente Mehrzugstrategie. Dadurch kann sie lokal plausible Aktionen wählen, ohne sicherzustellen, dass diese Aktionen in 2–4 Entscheidungen zu einem Ziel führen.

Die wichtigsten offenen Fragen:

1. Wann endet Early Pressure?
2. Wann muss der Runner auf Rig/Economy/Breaker-Suche umschalten?
3. Welche Breaker-Coverage fehlt konkret?
4. Welche Suchkarten können diese Lücke schließen?
5. Wann ist der Runner wieder ready für Runs?
6. Wann muss Setup beendet werden, weil Druck jetzt besser ist?
7. Welche Spielphase ist gerade aktiv?

## 6. Runner-Phasenmodell

### 6.1 Phase 1: Early Opportunistic Pressure

Ziel: billige, offene oder schwach geschützte Server ausnutzen.

Typische Signale:

- HQ/R&D offen oder billig erreichbar.
- Corp hat wenig Credits zum Rezzen.
- ICE unrezzed und für Corp wahrscheinlich teuer.
- Remotes sind ungeschützt oder frisch installiert.
- Runner hat genug Credits für einfache Accesses.
- Early steals oder Information sind plausibel.

Gute Aktionen:

- HQ/R&D-Runs.
- Remote-Contest gegen ungeschützte Remotes.
- Probe-Runs, um ICE zu rezzen oder Informationen zu gewinnen.
- frühe Trashs gegen wertvolle Assets/Upgrades, wenn bezahlbar.

Abbruchsignale:

- Corp rezzed relevante ICE.
- bekannte Pfade werden teuer.
- Runner hat keine passende Breaker-Coverage.
- Runs liefern keinen Wert mehr.
- Runner-Credits fallen unter Contest-/Steal-/Trash-Reserve.

### 6.2 Phase 2: Rig/Economy Construction

Ziel: die Voraussetzungen schaffen, um wieder sinnvoll laufen zu können.

Typische Signale:

- zentrale oder Remote-Pfade sind durch sichtbare ICE blockiert.
- Runner fehlt ein relevanter Breaker-Typ.
- Runner hat nicht genug Cashpool für Pfad + Steal/Trash.
- bekannte/exposed ICE zeigen konkrete Coverage-Lücken.
- Corp baut Scoring-Remote, aber Runner kann ihn noch nicht contesten.

Zu klärende Fragen:

- Fehlt Wall-/Worm-/Fracter-Coverage?
- Fehlt Code-Gate-/Decoder-Coverage?
- Fehlt Sentry-/Killer-Coverage?
- Fehlt AP-/Trace-/Meat-/Net-Schutz?
- Fehlt Memory/MU?
- Fehlt Cashpool?
- Gibt es Suchkarten, die genau diese Lücke schließen?

Wichtige Such-/Setupkarten:

- `Self-Modifying Code`: sucht und installiert ein Programm während eines Runs.
- `Temple Microcode Outlet`: sucht ein Programm und nimmt es auf die Hand.
- `Mantis, Fixer-at-Large`: sucht eine beliebige Karte.
- `Sneak Preview`: sucht oder holt ein Programm und installiert es temporär.
- `Mystery Box`: kann während eines Runs aus den obersten fünf Karten ein Programm installieren.
- `Aujourd'Oui`: kann Programme aus den obersten fünf Karten in die Hand nehmen.
- `If You Want It Done Right . . .`: kann aus den obersten fünf Karten eine Karte nehmen und den Rest ordnen.

Diese Karten sollten nicht generisch als „Setup“ gelten, sondern anhand der aktuellen Coverage-Lücke bewertet werden.

Gute Aktionen:

- Economy, wenn Reserve fehlt.
- passende Breaker suchen/installieren.
- Memory-/Rig-Karten installieren, wenn sie reale Pfade öffnen.
- Probe-/Expose-Effekte nutzen, wenn sie eine konkrete Entscheidung ermöglichen.
- Setup abbrechen, sobald die Coverage reicht.

Schlechte Aktionen:

- Economy-Spam bei bereits erreichter Reserve.
- Rig-Spam ohne neue Pfade.
- Suchkarten ohne klares Ziel.
- Draw for answers, obwohl Such-/Install-/Economy-Linie verfügbar ist.
- teure Installationen, die Contest-Reserve zerstören.

### 6.3 Phase 3: Equipped Pressure / Closeout

Ziel: mit fertiger oder ausreichend fertiger Rig-/Economy-Basis Punkte machen.

Typische Signale:

- Runner hat passende Breaker-Coverage.
- bekannte Pfadkosten sind bezahlbar.
- Runner hält Reserve für Steal/Trash.
- Interface/Multiaccess/Pressure-Karten sind installiert oder spielbar.
- HQ/R&D/Remote-Wissen zeigt konkrete Angriffspunkte.
- Runner ist nahe am Sieg oder kann die Corp unter starken Druck setzen.

Gute Aktionen:

- R&D/HQ-Pressure mit Interface oder Multiaccess.
- Remote-Contest gegen advanced/scoring-relevante Remotes.
- Trash von Economy-/Scoring-Protection-/Punish-Karten.
- Runs auf bekannte HQ-/Remote-Agendas.
- Closeout-Linien.

Abbruchsignale:

- neue ICE blockieren Pfade wieder.
- Cashpool fällt unter Reserve.
- Corp baut neue Scoring-Remote mit anderem ICE-Typ.
- Runner verliert Breaker/Memory/Schutz.

Dann Wechsel zurück in Phase 2.

## 7. Übergangslogik zwischen Phasen

### 7.1 Early Pressure → Setup

Wechsel, wenn:

- letzte Runs keinen Wert erzeugten.
- bekannte Pfade nicht bezahlbar sind.
- relevante ICE-Typen sichtbar fehlen.
- Corp-Rez/Install den einfachen Druck geschlossen hat.
- Runner-Cashpool niedrig ist.

Nicht wechseln, wenn:

- HQ/R&D/Remote noch offen oder hochprofitabel sind.
- bekannte Agenda/Remote-Ziel erreichbar ist.
- Closeout möglich ist.

### 7.2 Setup → Equipped Pressure

Wechsel, wenn:

- mindestens eine relevante Serverlinie bezahlbar ist.
- notwendige Breaker-Coverage vorhanden ist.
- Runner-Reserve reicht.
- Setup-Aktionen keine neuen wesentlichen Pfade mehr freischalten.
- bekannte HQ/R&D/Remote-Information Druck rechtfertigt.

Nicht wechseln, wenn:

- Pfadkosten nach Effective-Quote weiterhin zu hoch sind.
- ein kritischer Breaker fehlt.
- Steal-/Trash-Reserve fehlt.
- Run nur Noop/Probe ohne Wert wäre.

### 7.3 Equipped Pressure → Setup zurück

Wechsel zurück, wenn:

- neue ICE/Upgrades den Pfad schließen.
- Runner-Cashpool verbraucht ist.
- ein wichtiger Breaker verloren geht.
- Smarteye/Expose neue Gefahr offenbart.
- Outcome-Follow-up zeigt: aktuelle Pressure konvertiert nicht.

## 8. Benötigte Bewertungsmodelle

### 8.1 Breaker Coverage Model

Die Runner-KI muss wissen:

- installierte Breaker und deren Coverage.
- Breaker in Hand.
- Breaker im Stack, soweit über Doctrine bekannt.
- Breaker in Trash.
- tutorbare Programme.
- fehlende Coverage nach sichtbarem ICE.

Coverage sollte nicht nur nach groben Typen gehen. Sie muss auch Kosten und Sonderregeln berücksichtigen:

- Wall/Code Gate/Sentry.
- AP/Trace/Tag/Damage/Program-Trash.
- ETR-Anzahl.
- Strength-Pump-Kosten.
- Breakkosten pro Subroutine.
- Noisy-/Stealth-Nachteile.
- Universal- oder Spezialbreaker.
- Effective-Run-Quote und `unbrokenRunEffect`.

### 8.2 Cashpool / Reserve Model

Die Runner-KI braucht eine dynamische Reserve:

- bekannte Pfadkosten.
- erwartete Steal-Kosten.
- erwartete Trash-Kosten.
- Breaker-Pumpkosten.
- Trace-/Tag-/Damage-Schutz.
- zukünftige Remote-Contest-Anforderung.

Reserve darf nicht statisch sein. Ein früher offener HQ-Run braucht weniger Reserve als ein Remote mit zwei rezzed ICE und Red-Herrings-artigen Kosten.

### 8.3 Search/Tutor Model

Suchkarten müssen zielgerichtet bewertet werden:

- Welche Rolle fehlt?
- Gibt es ein passendes Ziel im eigenen Deck/Trash/Top-Search-Bereich?
- Ist die Karte installierbar oder nur auf die Hand suchbar?
- Ist nach dem Suchen noch Geld/MU zum Installieren vorhanden?
- Öffnet das Ziel einen konkreten Serverpfad?
- Wird dadurch eine Remote-/Central-/Closeout-Linie innerhalb kurzer Frist möglich?

Suchkarten ohne Ziel sollten nicht stark sein. Suchkarten mit klarer Coverage-Lücke sollten stark sein.

### 8.4 Known-Information Exploitation

Der Runner muss legal bekanntes Wissen aktiv nutzen:

- bekannte HQ-Karten.
- bekannte HQ-Agenda.
- bekannte R&D-Topkarte.
- R&D-Topkarte nach Draw jetzt in HQ.
- bekannte Remote-Root-Karten.
- bekannte Remote-Agenda oder trashbares Remote-Ziel.
- bekannte unrezzed ICE aus Smarteye/Expose.

Das Wissen muss nicht nur gespeichert, sondern in Run-/Setup-/Breaker-/Trash-/Closeout-Bewertung wirksam sein.

### 8.5 Outcome Follow-up

Nach jedem relevanten Ergebnis sollte die KI prüfen:

- Hat die Aktion Wert erzeugt?
- Hat sie neue Information erzeugt?
- Hat sie gezeigt, dass ein Pfad geschlossen ist?
- Hat sie einen Breaker-/Economy-Bedarf gezeigt?
- Soll der Plan fortgesetzt, abgebrochen oder in Setup überführt werden?

Outcome-Follow-up darf keine generische Pivot-Maschine sein. Es muss in Progression konvertieren.

## 9. Was nicht mehr sinnvoll ist

Nach den bisherigen Slices wirken folgende Ansätze erschöpft oder riskant:

- `score_now` noch höher gewichten.
- Remote-Trash-Choice pauschal erhöhen.
- Central Runs pauschal erhöhen oder senken.
- Outcome-Follow-up weiter boosten.
- Draw pauschal weiter senken.
- Economy pauschal weiter erhöhen.
- Weitere kleine Einzelheuristik auf Local Pair 1 ohne Makromodell.

Diese Punkte wurden bereits untersucht oder kalibriert. Das Restproblem ist strategischer.

## 10. Empfohlene nächste Entwicklungsrichtung

### 10.1 Runner Phase Model / Breaker Coverage / Tutor Usage Audit

Nächster sinnvoller Block:

1. Diagnostizieren, ob der Runner seine Phase erkennt.
2. Diagnostizieren, ob er Coverage-Lücken erkennt.
3. Diagnostizieren, ob er Suchkarten zielgerichtet nutzt.
4. Diagnostizieren, ob Setup-Aktionen in Runs konvertieren.
5. Erst danach einen engen Fix bauen.

Zu messende Metriken:

- `runnerPhaseEstimate`
- `runnerPhaseTransitions`
- `easyRunOpportunities`
- `easyRunsTaken`
- `easyRunMissed`
- `setupPhaseEnteredBecauseRunsClosed`
- `setupPhaseExitedToPressure`
- `setupPhaseOverstayed`
- `requiredBreakerCoverageByVisibleIce`
- `installedBreakerCoverage`
- `missingBreakerCoverage`
- `tutorCardsAvailable`
- `tutorUsedForMissingCoverage`
- `tutorUsedWithoutClearTarget`
- `breakerSearchConvertedToInstall`
- `breakerInstallConvertedToRun`
- `economyConvertedToRun`
- `rigReadyButRunnerStillSetups`
- `runnerPressureReady`
- `runnerPressureReadyRunsTaken`

### 10.2 Minimaler Strategy-Fix danach

Nur wenn Diagnose klar ist:

- Wenn Early Pressure verpasst wird: Easy-run pressure gates verbessern.
- Wenn Setup zu spät beginnt: Phasewechsel zu Setup bei geschlossenen Runs verbessern.
- Wenn Setup ohne Ziel läuft: Tutor-/Coverage-Zielwahl verbessern.
- Wenn Setup zu lange dauert: Pressure-ready exit verbessern.
- Wenn Runner genug Rig/Geld hat, aber nicht läuft: Equipped-pressure boost.

## 11. Beispiel-Prompt für den nächsten Codex-Block

```text
Arbeite im Workspace:

C:\Projekte\NETGRID-ai-optimization-diagnosis

Branch:

codex/ai-legal-action-diagnosis

Aufgabe:
Prüfe und entwickle ein Runner Phase Model / Breaker Coverage / Tutor Usage Audit.

Bitte zuerst Diagnose, keine breite Heuristik.
Keine neuen Decks, keine AI-Hints, keine Engine-Regeländerung, keine Karten-/Support-/Catalog-Daten ändern.

Kontext:
Die KI ist safety-stabil und hat viele lokale Runner-Fixes: Draw-/Duplicate-Discipline, Economy Reserve, Known-Path, Effective-Run-Quote, Known-Card-Memory, Remote-Contest, Central/Closeout/No-Fresh, Plan-/Outcome-Follow-up. Trotzdem bleibt ActionLimit/Stagnation hoch und current_candidate ist gegenüber belief_ai_v1_4_2 nicht klar durchgehend besser.

Hypothese:
Dem Runner fehlt ein Makro-Phasenmodell:
1. Early Opportunistic Pressure
2. Rig/Economy Construction
3. Equipped Pressure / Closeout

Ziel 1: Diagnose
Prüfe pro Benchmark-Slot und Profil:
- Wann gibt es Early easy-run opportunities?
- Nimmt der Runner sie?
- Wann schließen sich einfache Runs?
- Wechselt der Runner dann zu Setup/Economy/Breaker?
- Erkennt er sichtbare ICE-Typen und fehlende Breaker-Coverage?
- Weiß er, welche Breaker/Rig-Tools er installiert, in Hand, im Trash oder tutorbar hat?
- Nutzt er Suchkarten wie Self-Modifying Code, Temple Microcode Outlet, Mantis, Sneak Preview, Mystery Box, Aujourd'Oui oder If You Want It Done Right gezielt für fehlende Coverage?
- Konvertiert Search/Tutor in Install und danach in Run?
- Erkennt der Runner, wann Setup abgeschlossen ist und Druck wieder Vorrang hat?

Ziel 2: Metriken
Ergänze kompakte Diagnosemetriken:
- runnerPhaseEstimate
- runnerPhaseTransitions
- easyRunOpportunities/easyRunsTaken/easyRunMissed
- setupPhaseEnteredBecauseRunsClosed
- setupPhaseExitedToPressure
- setupPhaseOverstayed
- requiredBreakerCoverageByVisibleIce
- installedBreakerCoverage
- missingBreakerCoverage
- tutorCardsAvailable
- tutorUsedForMissingCoverage
- tutorUsedWithoutClearTarget
- breakerSearchConvertedToInstall
- breakerInstallConvertedToRun
- economyConvertedToRun
- rigReadyButRunnerStillSetups
- runnerPressureReady
- runnerPressureReadyRunsTaken

Ziel 3: Nur bei eindeutiger Ursache kleiner Fix
Wenn eine klare Lücke sichtbar ist, implementiere nur einen engen Fix:
- Phasewechsel zu Setup, wenn Runs sichtbar geschlossen sind.
- Tutor-/Search-Zielwahl auf fehlende Breaker-Coverage.
- Setup beenden, wenn Rig/Cashpool ready sind.
- Pressure-ready Runs bevorzugen, wenn Phase 3 erreicht ist.

Grenzen:
- Keine Hidden Info.
- Keine echte Corp-Hand/R&D/HQ.
- Keine gegnerische Deckliste.
- Keine FullState-Abkürzung.
- Keine LegalActions erzeugen.
- applyAction bleibt finale Revalidierung.

Tests:
- Early easy run wird genommen, wenn Server offen/günstig ist.
- Easy run wird nicht genommen, wenn sichtbarer Pfad geschlossen/unbezahlbar ist.
- Nach gerezztem ICE erkennt Runner fehlende Breaker-Coverage.
- Suchkarte wird für fehlenden passenden Breaker genutzt.
- Suchkarte ohne Coverage-Ziel wird nicht überbewertet.
- Nach Breaker-Install wird der freigeschaltete Run bevorzugt.
- Wenn Rig/Cashpool ready sind, beendet Runner Setup und läuft.
- Hidden-State-Invarianz.
- DTO-Safety.

Benchmark:
Lass die Match-Progression-Deck-Suite laufen, falls runtime vertretbar.

Bericht:
1. Erkennt der Runner seine Phase?
2. Erkennt er fehlende Breaker-Coverage?
3. Nutzt er Tutor/Search zielgerichtet?
4. Wechselt er zuverlässig von Setup zurück in Druck?
5. Welche Dateien wurden geändert?
6. Welche Tests sind grün?
7. Hat sich ActionLimit/Stagnation verbessert?
8. Bleibt current_candidate als Default fraglich?
```

## 12. Offene Risiken

- Das Phasenmodell darf nicht zu passiv werden.
- Es darf Early Pressure nicht unterdrücken.
- Es darf Setup nicht endlos verlängern.
- Es darf nicht auf bestimmte Decknamen optimieren.
- Es muss mit Suchkarten umgehen, ohne echte Stack-Inhalte zu kennen, außer diese sind legal bekannt.
- Es muss Doctrine nutzen, darf aber keine gegnerische Deckliste lesen.
- Es muss mit random/spezialisierten Breakern umgehen.
- Es muss bekannte ICE und effective/unbroken run effects einbeziehen.
- Es muss weiterhin LegalActions und applyAction respektieren.

## 13. Entscheidungsnotiz

Die nächste große Verbesserung der Runner-KI wird wahrscheinlich nicht aus einem weiteren lokalen Gewicht kommen. Sie wird daraus entstehen, dass die KI erkennt:

- Wann kann ich sofort Druck machen?
- Wann sind die Runs geschlossen?
- Welche Werkzeuge fehlen?
- Wie suche/installiere ich genau diese Werkzeuge?
- Wann bin ich wieder bereit?
- Wie konvertiere ich readiness in Punkte, Trash oder Closeout?

Dieses Rollup soll verhindern, dass diese Meta-Ebene verloren geht.

## 14. Verweise auf bestehende Artefakte

Relevante Review-/Datenartefakte:

- `docs/reviews/ai/ai-strategy-slices-consolidation-review-2026-05-23.md`
- `docs/reviews/ai/match-progression-deck-suite-benchmark-2026-05-23.md`
- `docs/reviews/ai/ai-benchmark-deck-basis-review-2026-05-23.md`
- `docs/reviews/ai/ai-hints-support-contract-review-2026-05-22.md`
- `docs/reviews/ai/current-ai-logic-documentation-2026-05-22.md` beziehungsweise die hochgeladene Ist-Dokumentation
- `data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json`
- `data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json`

