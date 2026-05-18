# V1.9.12 Shell Traders Completion Plan

Status: planned
Stand: 2026-05-14
Primärer Agent: card-enablement-ai-knowledge-agent

## Zweck

Dieser Plan beschreibt die Nacharbeit an `The Shell Traders` (`onr_v1_176_the-shell-traders`).

Der Playtest-Befund: Die Karte ist formal seit V1.9.12 als `human_playable`, `deck_legal` und `ai_supported` geführt, bietet im Spiel aber keine Möglichkeit, ihre eigentliche Shell-Counter-Fähigkeit zu nutzen. Aktuell ist sie in Runtime und Katalog nur als vereinfachte Recurring-Credit-Resource modelliert:

- installierbare Runner-Resource,
- `1 recurring credit for run costs`,
- Refresh am Runner-Zugbeginn.

Die gedruckte und erratierte Kernfunktion ist dagegen eine Set-Aside-Installationsschleife für Runner-Programme und Runner-Hardware aus der Hand. Dieser Plan ist deshalb ein Reparatur- und Completion-Plan. Er ersetzt nicht das V1.9.12-Final-Review, sondern ergänzt es um eine präzise Umsetzungsspur für die vollständige Kartenfunktion.

## Führende Quellen

- Aktueller V1.9.12-Abschlussstand: `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md`
- V1.9.12-Implementierungsstand: `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/implementation-review.md`
- V1.9.12 Counter-/Recurring-Vertrag: `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/spec.md`
- Set-Aside-Grundlage: `docs/releases/v1/v1-2-2-special-zones-ownership-control/spec.md`
- Lokale Rohquelle: `docs/source/Runnerspoiler 1.0.txt`
- Lokale Errata-Quelle: `docs/source/Netrunner Errata 1.70.md`

Wichtig: Kartentext bleibt display-only. Engine, LegalActions, `applyAction`, Sichtbarkeit, Replay, StateHash und KI dürfen nicht aus UI-Texten abgeleitet werden.

## Aktueller Befund

### Freigabe- und Datenstand

- `packages/shared/src/index.ts` führt `The Shell Traders` als Runner-Resource mit `installCost: 1`, `recurringCredits: 1` und Regeln für Run-Kosten.
- `packages/catalog/src/index.ts`, `data/manifests/card-implementation-manifest-1.9.12.json`, AI-Hints und AI-Approval behandeln die Karte als Counter-/Recurring-Karte.
- Der V1.9.12-Scope beschreibt nur Counter, Virus, Purge und Recurring Pools.

### Fehlende Funktionsbestandteile

- Keine LegalAction, um `The Shell Traders` als installierte Resource zu aktivieren.
- Keine Zielauswahl für Programm- oder Hardwarekarten aus der Runner-Hand.
- Keine Runtime-Nutzung der kanonischen `set_aside`-Spezialzone für diese Karte.
- Keine `shell`-Counter auf beiseitegelegten Karten.
- Kein Runner-Zugbeginn-Trigger, der Shell-Counter entfernt.
- Keine bezahlte `[1]`-Fähigkeit, um Shell-Counter zu entfernen.
- Keine automatische Installation, wenn der letzte Shell-Counter entfernt wurde.
- Keine Sichtbarkeits-, Replay-/StateHash-, UI- oder KI-Abdeckung für diesen Pfad.

## Zielverhalten

### 1. Installierte Resource

`The Shell Traders` bleibt eine installierbare Runner-Resource. Die bisherige Recurring-Credit-Ersatzfunktion soll im Reparaturschnitt entfernt oder als dokumentierter Legacy-Irrtum bereinigt werden, weil sie nicht der bestätigten Kartenfunktion entspricht.

Empfehlung: `recurringCredits: 1` aus der Runtime-Definition entfernen und den sichtbaren Regeltext auf die Shell-Counter-Funktion korrigieren.

### 2. Click-Fähigkeit

Solange `The Shell Traders` installiert ist, soll der Runner während seiner legalen Hauptaktionsfenster eine LegalAction erhalten:

- Quelle: installierte `The Shell Traders`-Instanz.
- Kosten: 1 Click.
- Ziel: genau eine Runner-Handkarte aus der Grip.
- Zieltyp: `program` oder `hardware`.
- Ziel-Sichtbarkeit: nur für den Runner sichtbar; PublicEvent darf keine private Handidentität leaken, bevor die Karte durch den Effekt sichtbar beiseitegelegt wird.
- Effekt: Zielkarte face-up in `set_aside` bewegen und Shell-Counter in Höhe ihrer Installationskosten auf diese CardInstance legen.

Falls die Installationskosten `0` betragen, muss die Karte nach der Set-Aside-Bewegung sofort ohne normale Credit-Kosten installiert werden. Dieser Sonderfall verhindert, dass eine Karte mit 0 Shell-Countern dauerhaft in Set Aside hängt.

### 3. Shell-Counter-Modell

Neue Counter-Art:

```ts
type CounterType = ... | "shell";
```

Shell-Counter dürfen auf Karten in `special.set_aside` liegen. Sie sind keine Virus-, Power-, Agenda- oder Recurring-Counter.

Sichtbarkeit:

- Die von Shell Traders beiseitegelegte Karte ist face-up und damit für beide Seiten in der PlayerView sichtbar, soweit Set-Aside-Views Kartenidentitäten darstellen.
- Shell-Counter-Anzahl ist öffentlich.
- Die Herkunft aus der Runner-Hand darf vor der Auflösung nicht über Actionlisten, Fehlertexte oder PublicPayloads verraten werden.

### 4. Start-of-turn-Pflichttrigger

Zu Beginn jedes Runner-Zugs entfernt jede installierte `The Shell Traders`-Kopie genau einen Shell-Counter von einer Karte mit Shell-Countern.

Planungsentscheidung für erste Umsetzung:

- Wenn genau eine Karte Shell-Counter hat, entfernt die Engine automatisch einen Counter.
- Wenn mehrere Karten Shell-Counter haben, öffnet die Engine eine Runner-`PendingChoice`.
- Pro installierter Shell-Traders-Kopie wird höchstens ein Counter entfernt.
- Wenn keine Karte Shell-Counter hat, passiert nichts.

Diese Choice ist kein optionales Komfortfenster, sondern die nötige Zielwahl für einen verpflichtenden Effekt.

### 5. Paid-Fähigkeit für 1 Credit

Solange mindestens eine Karte Shell-Counter hat und der Runner mindestens 1 Credit besitzt, soll der Runner in legalen Runner-Special-Effect-/Paid-Fähigkeitsfenstern eine LegalAction erhalten:

- Quelle: eine installierte `The Shell Traders`-Instanz.
- Kosten: 1 Credit.
- Ziel: eine Karte mit Shell-Countern.
- Effekt: genau einen Shell-Counter entfernen.

Erste Umsetzungsempfehlung:

- In der bestehenden Engine zunächst in Runner-Hauptaktionsfenstern und in bereits modellierten run-nahen Runner-Fenstern anbieten, wenn dort auch andere installierte Runner-Spezialaktionen sichtbar sind.
- Keine Reaktion auf Corp-Rez oder Corp-Trash-Fenster einführen, solange diese Timingfenster nicht sauber modelliert sind.
- In der Planungs-/Review-Dokumentation explizit notieren, welche Paid-Fenster abgedeckt und welche deferred sind.

### 6. Installation beim letzten Counter

Wenn der letzte Shell-Counter von einer beiseitegelegten Programm- oder Hardwarekarte entfernt wird:

- Die Karte wird sofort installiert.
- Normale Installations-Creditkosten werden nicht bezahlt.
- Zusätzliche Installationskosten bleiben nach Errata grundsätzlich zahlbar, soweit die Engine sie bereits kennt.
- Programme müssen Memory/MU validieren. Wenn nicht genug MU frei ist, braucht die Engine eine bestehende oder neue Runner-Choice zum Überschreiben eines installierten Programms.
- Hardware wird in das Runner-Rig installiert.
- Die CardInstance verlässt atomar `set_aside`, wird in die passende Rig-Zone geschrieben, `faceup: true`, `rezzed: true`, `controller: runner`, und verliert ihre Shell-Counter.

Erste Umsetzungsempfehlung für komplexe Zusatzkosten:

- Nur Karten ohne zusätzliche Installationskosten automatisch installieren.
- Wenn eine Karte bekannte, nicht abgedeckte Zusatzkosten hätte, wird sie im ersten Reparaturschnitt als Blocker für diese Shell-Traders-Auflösung behandelt und die Zielauswahl beim Set-Aside oder beim letzten Counter entsprechend verhindert.
- Dieser eingeschränkte Vertrag muss in Mechanics-Coverage und Completion-Review sichtbar sein.

## Engine-Design

### Neue LegalAction-Familien

Empfohlene enge Payloads statt generischer Abilities:

```ts
type ShellTradersSetAsidePayload = {
  cardId: CardInstanceId;
  shellTradersAbility: "set_aside_from_grip";
  targetCardId: CardInstanceId;
  shellCounterAmount: number;
};

type ShellTradersRemoveCounterPayload = {
  cardId: CardInstanceId;
  shellTradersAbility: "remove_shell_counter";
  targetCardId: CardInstanceId;
  counterType: "shell";
  removeCounterAmount: 1;
};
```

Mögliche Action-Typen:

- `trigger_ability` für beide Fähigkeiten, mit `shellTradersAbility` als Action-ID-Bestandteil.
- Alternativ ein neuer enger Typ `shell_traders_set_aside` plus `shell_traders_remove_counter`.

Empfehlung: Wenn die bestehende UI `trigger_ability` bereits gut abbildet, `trigger_ability` verwenden und Action-ID-/Context-Bildung um `shellTradersAbility`, `targetCardId` und `counterType` erweitern.

### Revalidierung in `applyAction`

`applyAction` muss mindestens prüfen:

- Side ist Runner.
- `actionId` und `stateVersion` passen.
- Quelle ist eine installierte Runner-Resource mit Definition `onr_v1_176_the-shell-traders`.
- Für Set-Aside:
  - Timingpunkt erlaubt Click-Fähigkeit.
  - Runner hat mindestens 1 Click.
  - Zielkarte liegt in der Runner-Grip.
  - Zieldefinition ist `program` oder `hardware`.
  - Zielkarte ist installierbar oder als bewusst deferred markiert.
  - Shell-Counter-Anzahl entspricht den Installationskosten.
- Für Counter-Removal:
  - Timingpunkt erlaubt bezahlte Runner-Fähigkeit.
  - Runner hat mindestens 1 Credit, außer beim Start-of-turn-Pflichttrigger.
  - Zielkarte liegt in `special.set_aside`.
  - Zielkarte hat mindestens 1 Shell-Counter.
  - Wenn Counter danach 0 sind, wird Installation sofort abgewickelt.

### State- und Zone-Invarianten

- Eine CardInstance darf nie gleichzeitig in Grip und Set Aside oder Set Aside und Rig liegen.
- `removeFromAllZones` oder ein enger Spezialzonen-Helper muss atomar genutzt werden.
- `set_aside` für Shell Traders ist public/face-up, nicht side-private.
- Replay muss aus Eventlog und RandomRecords keine Zusatzinformationen brauchen.
- StateHash muss bei gleichem Seed/Eventlog stabil bleiben.

### PendingChoice

Zwei Choice-Familien sind nötig oder wahrscheinlich:

1. Start-of-turn-Zielwahl, wenn mehrere Shell-Counter-Ziele existieren.
2. MU-Überschreib-Choice, wenn eine automatisch zu installierende Programmkarte nicht in freie MU passt.

Die erste Choice sollte eng typisiert werden:

```ts
type ShellTradersStartTurnChoice = {
  kind: "shell_traders_start_turn_remove_counter";
  sourceCardId: CardInstanceId;
  eligibleTargetIds: CardInstanceId[];
};
```

Wenn mehrere installierte Shell-Traders-Kopien vorhanden sind, kann die Engine die Choices nacheinander öffnen. Nach jeder Counter-Entfernung wird neu berechnet, ob weitere Shell-Traders-Kopien und Shell-Counter-Ziele vorhanden sind.

## Sichtbarkeit und PublicEvents

Pflicht:

- LegalActions für Handziele dürfen dem Corp-Spieler keine Zielidentitäten zeigen.
- PublicEvent für Set-Aside zeigt die Karte erst nach erfolgreicher Bewegung, dann als face-up Set-Aside-Karte.
- PublicEvent für Counter-Removal zeigt Quelle, Ziel, Counter-Typ und verbleibende Counter.
- PublicEvent für Auto-Install zeigt, dass die Karte aus Set Aside installiert wurde und normale Installationskosten 0 betragen haben.
- Fehlertexte dürfen keine verdeckten Grip-Karten nennen.
- Reconnect-Payloads und KI-Inputs folgen ausschließlich PlayerViews.

Empfohlene Event-Kinds:

- `move_card` mit `specialZone: "set_aside"`, `specialZoneVisibility: "public"`, `specialZoneReason: "shell_traders"`.
- `counter_change` oder bestehender Counter-Effekt mit `counterType: "shell"`.
- `install_card` mit Payload-Metadaten `installedFromSpecialZone: "set_aside"` und `installCostPaid: 0`.

## UI-Plan

### Minimal korrekte UI

- Installierte `The Shell Traders` zeigt einen Aktionsbutton: `The Shell Traders: Karte vorbereiten`.
- Nach Klick nutzt die bestehende Zielauswahl/Choice-Oberfläche eine Runner-private Liste aus Programmen und Hardware in der Grip.
- Set-Aside-Zone zeigt face-up Karten mit Shell-Counter-Badge.
- Counter-Badge-Rendering muss `shell` als eigenen Counter-Typ darstellen.
- Entfernen eines Shell-Counters erscheint als Aktionsbutton auf oder bei `The Shell Traders`, nicht als freie UI-Manipulation am Counter.
- Start-of-turn-Choice zeigt die legalen Shell-Counter-Ziele.

### Komfortausbau nach grünem Minimalpfad

- Buttonlabel kann Ziel und Counterzahl vorab anzeigen, falls genau ein Ziel oder eine geöffnete Choice existiert.
- Tooltip: normale Installationskosten werden durch Shell Traders ersetzt; Zusatzkosten können weiterhin relevant sein.
- Chroniktext:
  - `The Shell Traders legt <Karte> mit N Shell-Countern beiseite.`
  - `The Shell Traders entfernt 1 Shell-Counter von <Karte>.`
  - `<Karte> wird durch The Shell Traders kostenlos installiert.`

## KI-Plan

Die KI darf keine privaten Zielinformationen bekommen, die nicht in ihrer PlayerView liegen. Für Runner-KI ist die Zielauswahl eigene Handinformation und damit erlaubt.

Erste Heuristik:

- Installiere `The Shell Traders`, wenn sie günstig ist und mindestens ein Programm oder Hardwareziel in der Hand liegt.
- Nutze die Set-Aside-Fähigkeit bevorzugt auf teure Programme/Hardware mit Installationskosten größer 1.
- Nicht auf Karten mit Installationskosten 0 anwenden, außer wenn sofortige kostenlose Installation strategisch neutral oder positiv ist.
- Entferne bezahlte Shell-Counter nur, wenn genügend Credits vorhanden sind und die Karte dadurch schneller als normale Installation ins Rig kommt.
- Bei Start-of-turn-Pflichtwahl priorisiert die KI Karten mit niedrigstem verbleibendem Shell-Counter-Wert; bei Gleichstand Programme vor Hardware, wenn MU frei ist.

AI-Hints müssen `recurring_credit` entfernen und stattdessen `set_aside_install`, `shell_counter`, `delayed_install` und `start_turn_counter_removal` beschreiben.

## Daten- und Artefaktplan

Nach Umsetzung sind mindestens anzupassen:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/action-board-ui.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`, falls neue Counter-Badge-Klasse nötig ist
- `data/manifests/card-implementation-manifest-1.9.12.json`
- `data/rules/mechanics-coverage-1.9.12.json`
- `data/scenarios/v1912-counter-virus-recurring-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1912.json`
- `data/scenarios/ai-deck-legal-v1912-smokes.json`
- `data/manifests/deck-legal-ai-approval-v1912-manifest.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/implementation-review.md`
- neues Completion Review: `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-review.md`

Das bestehende `V1_9_12_FINAL_REVIEW.md` sollte nicht stillschweigend umgeschrieben werden. Besser ist ein ergänzendes Completion Review, das den Playtest-Befund und die Reparatur dokumentiert.

## Umsetzungsschritte

### Schritt 1: Reproduktions- und Guard-Tests

- Test: Installierte `The Shell Traders` erzeugt eine Set-Aside-LegalAction für legale Runner-Handziele.
- Test: LegalAction existiert nur für installierte Shell Traders, Runner-Seite, Runner-Hauptaktionsfenster und vorhandene Programm-/Hardwareziele in der Grip.
- Test: Corp-PlayerView sieht keine Runner-Handzielidentitäten in LegalActions.

### Schritt 2: Runtime-Definition korrigieren

- `recurringCredits` entfernen.
- Regeltext auf Shell-Counter-Funktion korrigieren.
- Mechanics von `recurring_credit` auf `set_aside`, `shell_counter`, `delayed_install`, `start_turn_counter_removal` umstellen.
- Manifest und AI-Hints zunächst noch nicht final promoten, sondern im Reparaturbranch als WIP/Completion markieren.

### Schritt 3: Set-Aside-Fähigkeit implementieren

- Runner-LegalAction für installierte Shell Traders erzeugen.
- Handzielauswahl side-private halten.
- Zielkarte atomar in public Set Aside bewegen.
- Shell-Counter setzen.
- Zero-cost-Ziele sofort installieren.
- Wrong-side, stale state, falsches Timing, falsche Zielzone und falscher Zieltyp ablehnen.

### Schritt 4: Shell-Counter-Removal implementieren

- Paid-Ability-LegalAction für 1 Credit und ein Shell-Counter-Ziel.
- Start-of-turn-Pflichttrigger mit Auto-Target oder PendingChoice.
- Counter entfernen und bei letztem Counter Auto-Install auslösen.
- Mehrere Shell-Traders-Kopien nacheinander abwickeln.

### Schritt 5: Auto-Install und MU-Fälle härten

- Hardware direkt ins Rig installieren.
- Programme nur installieren, wenn MU frei ist oder eine vorhandene Überschreib-Choice genutzt werden kann.
- Wenn Überschreiben noch nicht vorhanden ist, enges Deferred dokumentieren und Zielauswahl für nicht passende Programme blockieren.
- Zusatzkosten, Hosting- oder Sonderinstallationen explizit erlauben oder blockieren, nicht still ignorieren.

### Schritt 6: UI und Chronik anschließen

- Aktionsbutton sichtbar machen.
- Ziel-/Choice-Oberfläche prüfen.
- Set-Aside-Anzeige und Shell-Counter-Badge anzeigen.
- Chroniktexte für Set Aside, Counter-Removal und Auto-Install ergänzen.
- Mobile/desktop kurze Smoke-Prüfung, dass die neuen Buttons nicht überlaufen.

### Schritt 7: KI und Artefakte korrigieren

- AI-Hints und Runner-KI-Entscheidung an echte Shell-Traders-Funktion anpassen.
- AI-Smoke: Runner installiert Shell Traders, setzt ein geeignetes Ziel beiseite und lässt Counter entfernen.
- Manifest, Mechanics-Coverage und Szenario aktualisieren.
- Completion Review erstellen.

### Schritt 8: Vollverify

Pflichtchecks nach Umsetzung:

- Engine-Pakettests.
- AI-Pakettests.
- Catalog-Pakettests.
- Web-Pakettests.
- Server-Regression, falls PlayerView/Reconnect-Payloads berührt sind.
- Workspace-Typecheck.
- Workspace-Test.
- Lint.
- Build.
- Optional Browser-Smoke mit einem Match, in dem Shell Traders eine Karte beiseitelegt und später installiert.

## Testmatrix

| Bereich | Pflichtnachweis |
| --- | --- |
| Scope | Nur `onr_v1_176_the-shell-traders` wird in dieser Reparaturspur funktional erweitert |
| LegalAction | Set-Aside-Aktion erscheint nur bei installierter Shell Traders und legalen Runner-Zielen |
| Revalidation | `applyAction` prüft Side, actionId, stateVersion, Quelle, Zielzone, Zieltyp, Timing und Kosten |
| Visibility | Corp sieht keine Runner-Handziele vor Auflösung; Set-Aside danach public face-up |
| Counter | Shell-Counter werden in Höhe der Installationskosten gesetzt und korrekt entfernt |
| Start-of-turn | Pro installierter Shell-Traders-Kopie wird ein Shell-Counter verpflichtend entfernt |
| Paid ability | Runner kann für 1 Credit einen Shell-Counter entfernen, nur in erlaubten Fenstern |
| Auto-install | Letzter Shell-Counter installiert Programm/Hardware ohne normale Creditkosten |
| MU | Programm-Installation validiert MU oder nutzt eine explizite Überschreib-Choice |
| Multi-copy | Mehrere Shell-Traders-Kopien erzeugen mehrere Start-of-turn-Entfernungen ohne Duplikate |
| Zero-cost | 0-Kosten-Ziele bleiben nicht mit 0 Shell-Countern in Set Aside hängen |
| Replay/StateHash | Set Aside, Counter-Removal und Auto-Install replayen deterministisch |
| AI | Runner-KI nutzt nur LegalActions und eigene Handinformationen |
| Web | Button, Choice, Counter-Badge und Chronik sind bedienbar und verständlich |

## Kritische Edge Cases

- Shell Traders wird getrasht, während Karten mit Shell-Countern in Set Aside liegen: Karten bleiben in Set Aside; spätere Shell-Traders-Kopien können Counter entfernen.
- Mehrere Karten mit Shell-Countern und mehrere Shell-Traders-Kopien: Zielwahl nacheinander, nach jeder Entfernung neu validiert.
- Zielkarte hat Installationskosten 0: sofortige Installation.
- Zielkarte ist Unique und bereits installiert: Zielauswahl blockieren oder Auto-Install beim letzten Counter ablehnen; Empfehlung ist Blocken bei Set-Aside-Auswahl.
- Programm passt nicht in freie MU: Überschreib-Choice oder Ziel blockieren, bis Überschreib-Flow vorhanden ist.
- Karte mit Zusatzkosten/Hosting/Sonderinstall: nur zulassen, wenn die Zusatzkosten engine-seitig korrekt bezahlbar und revalidierbar sind.
- Runner verliert Credits zwischen LegalAction-Anzeige und paid ability: `applyAction` lehnt ab.
- Start-of-turn-Pflichttrigger erzeugt eine PendingChoice und der Runner versucht andere Aktionen: Engine blockiert bis Choice gelöst ist.
- Undo/Reconnect: Nicht-öffentliche Handzielauswahl bleibt Barriere; public Set Aside bleibt rekonstruierbar.

## No-Scope

- Keine neue breite Paid-Ability-Timing-Engine für alle historischen Spezialeffektfenster.
- Keine Freigabe weiterer Karten außer `The Shell Traders`.
- Kein Kartentextparser.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
- Keine KI-Nutzung verdeckter Corp-Informationen oder zukünftiger Draws.
- Keine automatische Änderung des V1.9.12-Final-Review ohne ergänzendes Completion Review.

## Offene Gestaltungsfragen

Diese Fragen blockieren den Plan nicht, sollten aber vor oder während der Umsetzung entschieden werden:

1. Soll die erste UI-Version eine separate Zielauswahl nach Klick zeigen, oder direkt pro geeignetem Handziel einen eigenen Button anbieten?
2. Soll die bezahlte 1-Credit-Fähigkeit im ersten Schnitt nur im Runner-Hauptfenster erscheinen oder auch sofort in vorhandenen Run-Fenstern?
3. Sollen Programme ohne freie MU im ersten Schnitt per Überschreib-Choice installiert werden, oder blockieren wir solche Ziele bis ein allgemeiner Overwrite-Flow vorhanden ist?
4. Soll `The Shell Traders` sofort aus allen AI-Recurring-Rollen entfernt werden, auch bevor die Reparatur umgesetzt ist, um den aktuellen Fehlstand in AI-Hints nicht weiter zu verstärken?

## Handoff an release-implementation-agent

Empfohlene Handoff-Formulierung:

> Implementiere `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-plan.md` als enge V1.9.12-Reparaturspur. Keine weiteren Karten promoten. Ziel ist die vollständige Shell-Traders-Funktion mit Set Aside aus Runner-Grip, public Shell-Countern, Start-of-turn- und paid Counter-Removal, Auto-Install beim letzten Counter, Hidden-Info-sicherer UI/KI/PlayerView-Abdeckung, Replay/StateHash-Stabilität und ergänzendem Completion Review.

## Abschlusskriterien

Die Nacharbeit gilt erst als abgeschlossen, wenn:

1. `The Shell Traders` keine falsche Recurring-Credit-Ersatzfunktion mehr beschreibt.
2. Runner können Programm- oder Hardwarekarten aus der Grip legal mit Shell-Countern in Set Aside legen.
3. Shell-Counter werden verpflichtend am Runner-Zugbeginn und optional über die 1-Credit-Fähigkeit entfernt.
4. Letzter Shell-Counter installiert die Karte kostenlos und invariantensicher.
5. PlayerViews, PublicEvents, KI-Inputs, Reconnect und Chronik leaken keine privaten Handinformationen.
6. Replay und StateHash sind stabil.
7. Manifest, Mechanics-Coverage, AI-Hints, Szenarien und Completion Review beschreiben den tatsächlichen Stand.
8. Die volle Checkgruppe ist grün oder klar dokumentierte Deferreds sind von Dir akzeptiert.
