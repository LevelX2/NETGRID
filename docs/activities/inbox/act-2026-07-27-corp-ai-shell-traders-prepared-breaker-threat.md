---
activityId: act-2026-07-27-corp-ai-shell-traders-prepared-breaker-threat
status: inbox
kind: fix
area: ai
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-27
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
relatedActivities:
  - act-2026-06-23-ai-shell-traders-full-test-gate
  - act-2026-07-26-corp-ice-rez-resource-exchange-value
---

# Corp-KI: vorbereitete Shell-Traders-Breaker vor Score-Install bewerten

## Ziel

Die Corp-KI soll eine Agenda nicht als ausreichend geschützt installieren oder
advancen, wenn der Runner einen für die Corp sichtbaren, mit `The Shell
Traders` vorbereiteten Breaker vor dem nächsten Run ohne zusätzlichen Klick
installieren kann und der verbleibende Kreditbedarf den sichtbaren Runner-
Ressourcen entspricht.

Die Bewertung muss die automatische Shell-Counter-Entfernung zu Beginn des
nächsten Runner-Zugs berücksichtigen: Für einen dann möglichen Soforteinsatz
werden nur die danach noch verbleibenden, bezahlten Counter-Entfernungen und
die vom Engine-Pfad belegten Pump-/Breakkosten gerechnet.

## Kontext und Quellen

- Playtest und gespeichertes Match `match_0c77a1fb8540644a` vom 27.07.2026,
  Corp-Decision D9 an StateVersion 14: Nach `Filter` vor `remote_1`
  installierte die Corp `Corporate Retreat` und avancierte die Agenda.
- Der Corp-seitig sichtbare Runner hatte 11 Credits, `The Shell Traders` im
  Rig und `Rent-I-Con` offen in der öffentlichen Shell-Traders-Sonderzone.
  Die öffentliche Ereignisfolge enthielt bereits
  `The Shell Traders: Rent-I-Con vorbereiten`.
- `Filter` hat Stärke 0 und eine Run-endende Subroutine. `Rent-I-Con` ist ein
  sichtbarer Universal-Breaker; nach der Shell-Counter-Freigabe genügte im
  beobachteten Folgeturn ein Kredit zum Brechen. Der Runner bezahlte insgesamt
  drei Credits für Counter-Entfernungen und Break, lief `remote_1` und stahl
  `Corporate Retreat`.
- Der historische Trace klassifizierte die Route trotzdem als
  `score_protection_satisfied` beziehungsweise
  `corp_funded_protected_score_install:remote_1`; eine sichtbare vorbereitete
  Breaker-Bedrohung erscheint nicht in der Entscheidungsbegründung.
- `docs/reviews/ai/ai-match-efa215-remote-defense-credit-pools-final-review-2026-07-27.md`
  deckt bereits installierte sichtbare Breaker samt begrenzten Credit-Pools ab,
  lässt sichtbare Pools ohne installierten Breaker aber bewusst fail-closed.
  Diese Activity schließt nur die durch einen öffentlichen, zertifizierten
  vorbereiteten Installationspfad belegte Lücke.
- `docs/activities/done/act-2026-06-23-ai-shell-traders-full-test-gate.md`
  bestätigt den aktuellen `delayedInstallAbility`-LegalAction-Vertrag von
  `The Shell Traders`.

## Scope

1. Den historischen Corp-Entscheidungszustand an StateVersion 14 als
   spielgleichen, side-sicheren Decision-Checkpoint sichern. Der Checkpoint
   nutzt ausschließlich das öffentliche Event-Präfix, die aus der Engine
   erzeugte Corp-PlayerView, LegalActions und den damaligen Runtime-Zustand.
2. Die bestehende Corp-Score-Protection-/Run-Projektion um einen kleinen,
   engine-zertifizierten Gegenwarts-Quote für öffentlich vorbereitete
   Shell-Traders-Programme erweitern. Die Quote muss mindestens ausweisen:
   - dass die vorbereitete Karte für die Corp sichtbar und face-up ist;
   - dass sie vor dem nächsten möglichen Runner-Run ohne Klick installierbar
     wird;
   - aktuelle Shell-Counter, die verpflichtende Start-of-turn-Entfernung und
     die danach noch bezahlten Counter-Entfernungen;
   - zulässige Runner-Credits, Memory und die exakten Pump-/Breakkosten des
     konkreten ICE-Pfads;
   - Vollständigkeitsstatus und side-safe Evidence jeder Aussage.
3. Eine Agenda-Install-/Advance-Route nur dann als `protected` oder
   `funded_protected` führen, wenn die sichtbare vorbereitete Breaker-Quote
   den relevanten Zugriffspfad nicht finanziert. Im positiven Fall muss die
   produktive Folgeauswahl sinnvoll bleiben, etwa Agenda zurückhalten,
   Economy aufbauen oder eine tatsächlich bessere Schutzroute wählen.
4. DecisionDebug und `whyNot` um eine knappe, keine Hidden-Info preisgebende
   Evidence für „sichtbarer vorbereiteter Breaker“, dessen verbleibende
   Sofortkosten und den daraus folgenden unsicheren Score-Remote ergänzen.
5. Den Hint-/Consumer-Pfad für `The Shell Traders`, den vorbereiteten
   Breaker und die Corp-Score-Protection bis zur finalen Plan-Arbitration
   prüfen. Kartennamen und Hintdaten dürfen keine Kosten- oder
   Regelautorität ersetzen.

## Nicht im Scope

- Keine Nutzung verdeckter Runner-Grip-, Stack- oder Deckinformationen.
- Keine Spekulation über später gezogene Breaker, mehrere zukünftige Züge
  oder eine allgemeine Monte-Carlo-Prognose.
- Keine Änderung der Regeln von `The Shell Traders`, Shell-Countern,
  Rent-I-Con, ICE, Runs, LegalActions, `applyAction`, Replay oder StateHash.
- Keine neue parallele Defense- oder Score-Planautorität und keine
  kartennamenspezifische Sonderregel für `Rent-I-Con`, `Filter` oder
  `Corporate Retreat`.
- Keine erneute Behandlung bereits installierter Breaker-Credit-Pools oder
  des aktuellen Rez-Ressourcenabtauschs aus den verlinkten erledigten
  Activities, außer soweit deren vorhandene Projektionen wiederverwendet
  werden.

## Akzeptanzkriterien

- [ ] Der historische StateVersion-14-Checkpoint ist auf unverändertem Code
      als echter `behavior_regression` oder als eindeutig bereits grüner
      historischer Fall klassifiziert; Infrastruktur- oder Redaction-Drift
      wird nicht als KI-Fix ausgegeben.
- [ ] Ist eine öffentliche Shell-Traders-Karte vor dem nächsten Runner-Run
      ohne Klick installierbar und kann sie den konkreten Pfad mit den
      sichtbaren Credits finanzieren, zählt ein bloßes ETR-ICE nicht als
      ausreichender Score-Schutz.
- [ ] Die Gegenprobe bleibt grün, wenn die vorbereitete Karte verdeckt,
      unvollständig gequotet, nicht rechtzeitig installierbar, nicht
      break-kompatibel, wegen Memory oder Credits nicht nutzbar oder auf dem
      tatsächlichen Restpfad nicht ausreichend ist.
- [ ] Die Counter-Kosten rechnen die verpflichtende automatische Entfernung
      vor dem nächsten Runner-Run exakt ein; weder die volle ursprüngliche
      Installationskostenanzahl noch ein frei geschätzter Rabatt werden
      verwendet.
- [ ] Nach Ausschluss der unsicheren Agenda-Route wählt die KI eine legale,
      fachlich nachvollziehbare Alternative; die Korrektur verbietet nicht
      pauschal Agenda-Installationen oder Shell-Traders-Interaktionen.
- [ ] Alle Kosten, Timings, Breaker-Kompatibilitäten und der
      Installationszeitpunkt stammen aus aktuellen, engine-zertifizierten,
      Corp-seitig sichtbaren Fakten. Unvollständige Fakten bleiben
      fail-closed.
- [ ] Fokussierte Checkpoint-, Score-Protection-, Shell-Traders- und
      Gegenprobentests sowie `@netgrid/ai`-Typecheck sind grün; bei einem
      erweiterten Engine-/PlayerView-Vertrag laufen zusätzlich die passenden
      Engine-Tests.
- [ ] Der Deck-Hint-/Consumer-Audit des Checkpoints meldet keine neuen
      blockierenden Findings; Hidden-Info-, LegalAction-, Replay- und
      StateHash-Verträge bleiben unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Zuerst die bestehende sichtbare Breaker-/Run-Credit-Projektion und den
  `delayedInstallAbility`-Vertrag verfolgen. Der kleinste passende
  Erweiterungspunkt ist vorzuziehen; keine zweite Berechnung aus gedrucktem
  Kartentext oder Karten-ID einführen.
- Das automatische Shell-Counter-Fenster liegt vor dem ersten nächsten
  Runner-Run. Seine Wirkung muss in der Engine-/PlayerView-Quote explizit
  belegt sein, nicht aus der historischen Ereignisfolge nachgebaut werden.
- Der aktuelle Fall ist zugleich eine Regression gegen das Ergebnis von
  `act-2026-07-26-corp-ice-rez-resource-exchange-value`: Ein sofort
  verbrauchter Breaker kann im aktuellen Run einen positiven
  Ressourcenabtausch begründen, ein vorbereitetes Rent-I-Con ist dagegen
  bereits vor der Agenda-Installation eine akute nächste-Run-Bedrohung.
- Wenn die Analyse einen allgemeinen, aber unabhängigen Vertrag für weitere
  öffentliche verzögerte Installationen nahelegt, dafür eine separate
  Folge-Activity anlegen; dieses Paket bleibt bei Shell Traders.

## Ergebnisnotiz

Noch offen.
