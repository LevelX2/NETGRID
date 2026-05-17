# Proteus Variable ICE Contract

Status: planning contract, no runtime implementation
Stand: 2026-05-17

## Scope und Quellen

Dieses Artefakt beschreibt den engen Planungsvertrag fuer Proteus-ICE aus `data/rules/proteus-mechanics-coverage-2026-05-17.json`, insbesondere die Cluster `variable_rez_cost_strength_subroutines`, `installed_ice_relative_counting`, `pass_trigger_uninstall_ice` und `ice_repositioning`.

Der Vertrag ist planning-only. Er erzeugt keine Runtime-Implementierung, keine Proteus-Kartenpromotion, keine Decklegalität, keine Formatlegalität und keine AI-Unterstützung. Proteus-Quelltexte aus `data/card-import/proteus-card-basis-2026-05-17.json` bleiben display-only Planungsinput.

## Kartenliste

| Familie | Karten | Vertragsrelevanz |
| --- | --- | --- |
| Rez-Zusatzkosten ändern Subtyp | `onr_proteus_013_caryatid`, `onr_proteus_017_credit-blocks`, `onr_proteus_023_galatea`, `onr_proteus_028_lesser-arcana`, `onr_proteus_039_sphinx-2006`, `onr_proteus_040_sumo-2008` | Beim Rezzen wird ein zusätzlicher Betrag bezahlt; daraus entsteht ein persistenter alternativer ICE-Subtyp. |
| Rez-Zusatzkosten setzen Stärke | `onr_proteus_020_digiconda`, `onr_proteus_025_homing-missile` | Beim Rezzen wird ein ganzzahliges `X` bezahlt; `X` wird als Stärke gespeichert. Homing Missile nutzt `X` zusätzlich als Trace-Limit/-Basis fuer die eigene Trace-Subroutine. |
| Rez-Zusatzkosten erzeugen Subroutinen | `onr_proteus_022_food-fight`, `onr_proteus_024_gatekeeper`, `onr_proteus_036_sandstorm` | Beim Rezzen erzeugt jeder volle 2-Credit-Zusatz eine öffentliche `End the run`-Subroutine. |
| Rezzed-ICE im Fort zaehlen | `onr_proteus_012_bug-zapper`, `onr_proteus_021_dog-pile`, `onr_proteus_026_hunting-pack`, `onr_proteus_030_mastermind` | Dynamische Stärke, Schaden oder Trace-Subroutinen hängen von der Anzahl anderer gerezzter ICE im selben Fort ab. |
| Pass-Trigger mit Uninstall/HQ | `onr_proteus_018_datacomb`, `onr_proteus_019_death-yo-yo`, `onr_proteus_029_marionette`, `onr_proteus_037_scaffolding`, `onr_proteus_042_tumblers`, `onr_proteus_043_twisty-passages` | Nach dem Passieren entsteht ein öffentliches Korp-Fenster: zahlen oder optional/mandatory deinstallieren und nach HQ legen. |
| ICE-Repositionierung | `onr_proteus_033_mobile-barricade`, `onr_proteus_044_walking-wall` | Start-of-run-Fähigkeit bewegt die ICE innerhalb desselben Forts; unrezzed Nutzung deckt die Karte dabei auf. |

## Kleinster erster Umsetzungsslice

Der kleinste sinnvolle nicht-promotende Runtime-Harness-Slice ist genau:

1. `onr_proteus_020_digiconda` fuer `X` als beim Rezzen festgelegte Stärke mit Obergrenze 6.
2. `onr_proteus_022_food-fight` fuer eine beim Rezzen festgelegte Anzahl zusätzlicher `End the run`-Subroutinen, ein Exemplar je 2 bezahlten Zusatzcredits.

Dieser Slice beweist beide schwersten Basismuster: `selectedChoices`/Kostenbindung fuer variable Rez-Zusatzkosten und persistente, replaybare ICE-Eigenschaften, die spaeter in Encounter, Break-LegalActions, PlayerViews und PublicEvents sichtbar werden. Homing Missile bleibt wegen Trace-Folgeeffekt im zweiten Slice. Subtyp-Wechsler sind fachlich einfacher, sollten aber erst nach dem gemeinsamen Persistenzmodell folgen, damit Subtyp-, Stärke- und Subroutinenwerte dieselbe technische Spur nutzen.

Nicht Teil des ersten Slice:

- keine Pass-Trigger,
- keine ICE-Repositionierung,
- keine relative ICE-Zählung,
- keine Homing-Missile-Trace-Sperre,
- keine Proteus-Decklegalität,
- keine AI-Hints.

## LegalAction-Vertrag

Variable Rez-Werte werden nicht aus Clientlabels gelesen. Die Engine erzeugt frische `rez_ice`-LegalActions aus dem aktuellen State und bindet die variable Entscheidung explizit.

Empfohlene generische Payload-Felder fuer spätere Umsetzung:

| Feld | Bedeutung |
| --- | --- |
| `cardId` | Instanz der zu rezzenden ICE. |
| `proteusVariableRez` | Familien-ID, z. B. `x_strength`, `paid_etr_subroutines`, `alternate_subtype`. |
| `baseRezCost` | aktueller Basis-Rezpreis nach bestehenden Modifikatoren. |
| `variableRezAdditionalCost` | zusätzlich bezahlter Betrag. |
| `rezCostPaid` | Summe aus Basis-Rezpreis und Zusatzkosten. |
| `variableRezValue` | abgeleiteter Wert, z. B. `X` oder Subroutinenanzahl. |
| `variableRezCap` | Obergrenze, falls die Karte eine Obergrenze hat. |
| `effectiveStrengthAfterRez` | nur bei Stärke-Familie. |
| `effectiveSubroutineCountAfterRez` | nur bei Subroutinen-Familie. |
| `selectedSubtypesAfterRez` | nur bei Subtyp-Familie, als stabil sortierte technische Subtype-Liste. |

LegalActions dürfen diese Varianten entweder als mehrere konkrete `rez_ice`-Actions oder als eine `rez_ice`-Action mit `choiceRequirements` anbieten. In beiden Fällen gilt:

- `actionId` ist nur fuer die aktuelle `stateVersion` gültig.
- `expiresAtStateVersion` entspricht exakt der aktuellen `stateVersion`.
- Die Kostenliste enthält die tatsächlich zu zahlenden Credits, nicht nur den Basis-Rezpreis.
- `X` ist ganzzahlig, nicht negativ und hoechstens die Kartenobergrenze.
- Paid-Subroutine-Werte ergeben sich aus ganzzahligen 2-Credit-Schritten; ein Restcredit darf keine halbe Subroutine erzeugen.
- Nicht bezahlbare Varianten werden nicht angeboten.
- Die Runner-View sieht vor dem Rezzen keine private Kartenidentität, keine abgelehnten Varianten und keine nicht öffentliche Choice-Struktur.

## applyAction-Vertrag

`applyAction` revalidiert jede variable Rez-Action vollständig aus frisch berechneten LegalActions und darf keinen vom Client frei gelieferten Wert übernehmen.

Pflichtprüfungen:

1. `matchId`, `side`, `clientKnownStateVersion`, `actionId`, Timingpunkt und aktive Choice-Seite passen.
2. Die Zielkarte ist dieselbe ICE-Instanz, am aktuellen Rez-Timingpunkt legal installiert und noch nicht gerezzed.
3. Der Basis-Rezpreis wird aus dem aktuellen State neu berechnet.
4. Der variable Zusatzbetrag ist im erlaubten Wertebereich und durch aktuelle Korp-Credits bezahlbar.
5. `rezCostPaid` entspricht exakt Basis-Rezpreis plus Zusatzbetrag.
6. Bei `x_strength` wird der persistente Wert als ICE-Instanzzustand gespeichert, nicht bei jeder Anzeige aus Korp-Credits oder PublicPayload neu abgeleitet.
7. Bei `paid_etr_subroutines` wird die erzeugte Subroutinenliste mit stabilen IDs gespeichert oder deterministisch aus einem gespeicherten Wert erzeugt.
8. Bei `alternate_subtype` wird der alternative Subtyp als persistenter öffentlicher Rez-Zustand gespeichert.
9. Nach der Transition bestehen State-Invarianten, Encounter-Daten, PublicEvents und StateHash.

Manipulierte PlayerActions mit falscher Seite, stale Version, nicht angebotener X-Hoehe, zu niedrigem `rezCostPaid`, entfernten Kosten, falschem `cardId`, bereits gerezzter ICE oder geaendertem Timingpunkt müssen side-sicher fehlschlagen. Fehlermeldungen dürfen keine verdeckten Kartennamen, gegnerische LegalActions oder private Choice-Details enthalten.

## Persistenter State

Variable Rez-Ergebnisse sind Engine-State, nicht UI-Zierdaten.

Empfohlenes Zielmodell fuer spätere Implementierung:

- Ein instanzgebundener, StateHash-relevanter Record wie `cardInstances[iceId].proteusVariableIceState`.
- Inhalt nur primitive, deterministische Werte: `family`, `additionalCostPaid`, `value`, `strength`, `subroutineCount`, `selectedSubtypes`.
- Keine Labels, keine UI-Texte, keine sortierungsabhängigen Objekte, keine privaten FullState-Ableitungen.
- Werte bleiben erhalten, bis die ICE derezzed, deinstalliert, getrasht oder anderweitig nach Kartenregel zurückgesetzt wird.

Fuer den ersten Slice genügt:

- Digiconda: `family = x_strength`, `value = X`, `strength = X`, `cap = 6`.
- Food Fight: `family = paid_etr_subroutines`, `additionalCostPaid = 2 * N`, `subroutineCount = N`.

Wenn eine spätere Regel variable Werte beim Derez verlieren lässt, muss der Derez-Pfad diesen Record deterministisch löschen und im PublicPayload nur öffentliche Folgen nennen.

## Encounter- und Sichtbarkeitsvertrag

Nach erfolgreichem Rezzen ist die ICE öffentlich. Daher dürfen side-gefilterte PlayerViews, Reconnect-Payloads, PublicEvents und Replays folgende Daten zeigen:

- Kartenname, Definition-ID, Serverlabel und gerezzter Status,
- bezahlter Gesamt-Rezpreis und variable Zusatzkosten,
- effektive Stärke nach dem Rezzen,
- effektive Subroutinenanzahl und Subroutinenarten,
- öffentlicher alternativer Subtyp bei Subtyp-Familien,
- bei Homing Missile später den öffentlichen Trace-Basiswert aus dem gespeicherten `X`.

Nicht erlaubt:

- unrezzed Kartenidentität in Runner-View vor dem legalen Aufdecken,
- abgelehnte X-/Subroutinen-/Subtyp-Varianten,
- Korp-HQ-, R&D-, Archives-facedown- oder Handkarteninhalte,
- private Debugdaten, FullState, `privatePayload`, AIInput oder DecisionDebug,
- Clientseitiges Erraten aus Labels statt Engine-State.

`VisibleCard.strength` und `PlayerView.run.encounteredIce` müssen nach dem Rezzen den effektiven Wert anzeigen. Bei Food Fight muss die Break-/Resolve-Logik dieselbe deterministische Subroutinenliste verwenden, die auch in PlayerView und PublicEvent sichtbar ist.

## PublicPayload, Reconnect und Replay

PublicPayload fuer variable Rez-Events darf enthalten:

- `actor: "corp"`,
- `actionType: "rez_ice"`,
- `cardDefinitionId`, `title`, `serverLabel`,
- `baseRezCost`,
- `variableRezAdditionalCost`,
- `rezCostPaid`,
- `proteusVariableRez`,
- `variableRezValue`,
- `effectiveStrengthAfterRez` oder `effectiveSubroutineCountAfterRez`,
- `selectedSubtypesAfterRez` nur bei öffentlichem Subtypwechsel.

Reconnect liefert keine gesonderte private Wiederherstellung. Die aktuelle side-gefilterte PlayerView muss aus dem Engine-State dieselben sichtbaren Werte projizieren. EventTail und Public Replay nutzen dieselben redigierten PublicEvents.

Replay muss aus InitialState und EventLog denselben finalen StateHash erzeugen. Variable Rez-Werte dürfen nicht aus aktueller Credit-Höhe, UI-Text, Kartentextparsern oder Reihenfolge nicht kanonischer Objektfelder rekonstruiert werden. Zufall ist in diesem Vertrag nicht beteiligt.

## Unterfamilien nach dem ersten Slice

| Unterfamilie | Handoff-Bedingung |
| --- | --- |
| Subtyp-Wechsler | Nutzt denselben persistenten Rez-Record; Tests prüfen Breaker-Taxonomie und PublicView-Subtype nach Rez. |
| Homing Missile | Zusätzlich Trace-Vertrag: gespeichertes `X` wird Trace-Basis/-Limit; Runner-Run-Sperre nach erfolgreichem Trace braucht eigenen Action-Debt-Vertrag. |
| Relative ICE-Zählung | Muss "andere gerezzte ICE im selben Fort" bei Rez, Derez, Move, Trash und Encounter dynamisch und deterministisch aus Server-ICE-Reihenfolge ableiten. |
| Pass-Trigger | Braucht Post-pass-Timingfenster, Korp-Zahlungs-/Uninstall-Choice, HQ-Rueckfuehrung, Sichtbarkeit und Run-Fortsetzung. |
| Repositionierung | Braucht Start-of-run-Window, öffentliche Positionsziele im selben Fort, unrezzed Reveal, stabile ICE-Reihenfolge und Reconnect-Abbildung. |

## Testanforderungen

| ID | Fall | Erwartung |
| --- | --- | --- |
| P-VICE-T001 | Digiconda mit `X = 0`, `X = 3` und `X = 6` rezzen | Stärke entspricht exakt `X`, Korp zahlt Basis plus `X`, StateHash ist replaystabil. |
| P-VICE-T002 | Digiconda mit `X = 7`, negativem X oder ungenügenden Credits manipulieren | Keine LegalAction oder `applyAction` lehnt side-sicher ab. |
| P-VICE-T003 | Food Fight mit 0, 2 und 6 Zusatzcredits rezzen | 0, 1 bzw. 3 öffentliche `End the run`-Subroutinen entstehen mit stabilen Indizes. |
| P-VICE-T004 | Food Fight mit ungeradem Zusatzbetrag oder geaendertem `rezCostPaid` manipulieren | Action wird nicht akzeptiert; keine halb erzeugte Subroutine. |
| P-VICE-T005 | Runner bricht Food-Fight-Subroutinen nach variablem Rez | Break-LegalActions nutzen dieselbe Subroutinenliste wie PlayerView und PublicEvent. |
| P-VICE-T006 | Reconnect nach variablem Rez im Encounter | Beide PlayerViews zeigen nur öffentliche Werte; keine unrezzed Vorinformationen oder private Choices. |
| P-VICE-T007 | PublicEvent- und EventTail-Prüfung | PublicPayload enthält variable öffentliche Rez-Werte, aber keine FullState-/privatePayload-/Hidden-Zone-Daten. |
| P-VICE-T008 | Replay Digiconda und Food Fight | Replayed StateHash entspricht Original; Werte stammen aus Engine-State/Eventlog. |
| P-VICE-T009 | Derez/Trash eines variablen ICE in Testfixture | Variabler Record wird konsistent entfernt oder regelgemäß zurückgesetzt; kein stale Encounter-Wert bleibt sichtbar. |
| P-VICE-T010 | Subtyp-Folgefamilie mit Caryatid/Credit Blocks | Alternativer Subtyp wird öffentlich gespeichert; Breaker-Matches folgen dem gespeicherten Subtyp. |
| P-VICE-T011 | Relative ICE-Zählung mit Dog Pile/Mastermind | Andere gerezzte ICE im selben Fort werden gezählt; eigene ICE zählt nicht; Move/Derez/Trash ändern deterministisch den Wert. |
| P-VICE-T012 | Pass-Trigger mit Datacomb/Twisty Passages | Nach dem Passieren öffnet nur das korrekte Korp-Fenster; Zahlung oder HQ-Rueckfuehrung ist replay-/visibility-sicher. |
| P-VICE-T013 | Repositionierung mit Walking Wall/Mobile Barricade | Nur Positionen im selben Fort sind legal; unrezzed Nutzung reveal't öffentlich; ICE-Reihenfolge bleibt StateHash-relevant. |

## Handoff

Primärer Folgeagent fuer Umsetzung: `release-implementation-agent`.

Empfohlener naechster Activity-Schnitt: nicht-promotender Engine-Harness fuer genau Digiconda und Food Fight mit LegalAction-/`applyAction`-Revalidierung, PublicPayload, Reconnect, Replay und StateHash. Danach koennen Subtyp-Wechsler, Homing Missile, relative Zählung, Pass-Trigger und Repositionierung separat geschnitten werden.
