# Match 5F7924: Komplettanalyse der alten Corp-KI

Stand: 2026-07-30

Match: `match_5f7924e4893ba855`

Modus: `human_runner_vs_corp_ai`

Ergebnis: Runner-Sieg durch 8 Agendapunkte, StateVersion 255

## Analyseabdeckung

Die Analyse umfasst alle 108 gespeicherten Corp-KI-Entscheidungen. Jede
Entscheidung wurde gegen die damaligen LegalActions, die Corp-PlayerView, den
Plan-first-Debugtrace und die Folgeereignisse geprüft.

- Erwartete Entscheidungen: 108
- Gefundene Traces: 108
- Eindeutig zugeordnete Entscheidungen: 108
- Fehlende, verwaiste, doppelte oder versionsfalsch zugeordnete Traces: 0
- Events/Snapshots: 256/256
- Ergebnis: vollständige und konsistente Evidence-Kette

Die Analyse beschreibt den im Match tatsächlich gelaufenen Stand. Das Spiel
überschnitt sich zeitlich mit späteren lokalen Änderungen; deshalb werden
historische Fehler und bereits auf `main` behobene Ursachen ausdrücklich
getrennt.

## Gesamturteil

Der Eindruck „extrem passiv“ ist richtig. Die KI war nicht bloß vorsichtig,
sondern in einer strukturellen Passivitätsschleife gefangen:

1. Agenda- und Defense-Pläne fanden keine gemeinsame ausführbare Zuglinie.
2. Viele sinnvolle ICE-Installationen galten ohne exakt zertifizierte sofortige
   Zugriffsreduktion als unproduktiv.
3. Der Economy-Fallback setzte sich daraufhin selbst für jeden Zug ein neues,
   höheres Kreditziel.
4. Bei voller Hand wurde Ziehen blockiert, aber es fehlte eine Zuglinie
   „brauchbare Karte installieren/verwenden, Handplatz schaffen, ziehen,
   neuplanen“.
5. Die anschließende Cleanup-Entscheidung warf mehrfach eine Agenda ab.

Das sichtbare Resultat:

- 36 von 51 regulären Corp-Aktionen waren „1 Credit nehmen“: 70,6 Prozent.
- Die Corp beendete das Spiel mit 47 Credits und 0 eigenen Agendapunkten.
- Sie installierte in 17 Corp-Zügen nur fünf Karten und nie eine Agenda.
- Sie warf sieben Agendas ins offene Archives:
  Marked Accounts, Netwatch Operations Office, Data Fort Reclamation,
  drei Hostile Takeover und Corporate Coup.
- Vier dieser Agendas wurden später vom Runner aus Archives beziehungsweise
  R&D gestohlen; die letzten beiden Archives-Zugriffe beendeten das Spiel.

Die Passivität ist daher kein einzelnes falsches Gewicht. Mehrere konservative
Sicherungen blockierten nahezu alle produktiven Alternativen, während der
Kredit-Fallback ohne strategische Obergrenze immer wieder ausführbar blieb.

## Zentrale Befunde und Ursachen

### 1. Agenda plus Defense wurde nicht als gemeinsame Zuglinie verstanden

Die historischen Traces blockierten Agenda-Installationen mit
`corp_score_protection_required:new_remote`,
`corp_score_route_unavailable` oder auf der letzten Aktion mit
`corp_last_click_score_install_deferred:new_remote`. Gleichzeitig wurden
passende ICE-Installationen mit
`corp_ice_install_has_no_engine_certified_access_probability_reduction`
abgelehnt.

Dadurch konnte die KI weder

- Agenda installieren, ICE davor installieren und später advancen,
- zuerst ein Schutz-ICE installieren und danach die gebundene Agenda legen,
- noch Jack Attack als begrenzte Steuer-/Bluffschicht vor HQ oder R&D
  einsetzen, um ein ETR-ICE für den Scoring-Remote freizuhalten.

Die frühe Ursache hinter D23, D28 und D32 wurde im inzwischen aktuellen Stand
bereits generisch behoben: Score- und Defense-Plan können eine konkrete
Agenda-plus-ICE-Restzuglinie binden; Jack Attack darf unter engen
Defense-Plan-Bedingungen als zentrale Steuer-/Disruptionsschicht dienen; die
Cleanup-Logik entwertet redundante Dubletten. Die späteren Agenda-Zustände
dieses Matches sind dafür aber noch keine eigenen Regressions-Checkpoints.

Empfohlene Maßnahme 1:

- Die historischen Zustände mit Netwatch Operations Office, Data Fort
  Reclamation, Hostile Takeover und Corporate Coup als zusätzliche
  Decision-Checkpoints übernehmen.
- Gegen den aktuellen Stand nachweisen, dass die generische Korrektur nicht
  nur D23/D28/D32, sondern auch diese späteren Varianten abdeckt.

### 2. Der begrenzte Economy-Fallback war nur innerhalb eines Zuges begrenzt

Der Plan `economy-liquidity-development` erhielt zwar den Vertrag
`temporary_bounded_liquidity_transition`, setzte sein Ziel aber bei jedem
neuen Corp-Zug erneut auf den aktuellen Kreditstand plus verbleibende
Aktionen. So entstanden nacheinander Ziele wie 15, 18, 27, 30, 33 und 47
Credits.

Bemerkenswert ist, dass die ausgewählten Kreditaktionen im Trace teilweise
`plan_within_class_value:-9999` hatten. Sie gewannen nicht wegen hoher
Qualität, sondern weil Score-, Defense- und Draw-Routen zuvor ausgeschlossen
worden waren.

Empfohlene Maßnahme 2:

- Economy-Nutzen an konkrete offene Kostenlücken koppeln: aktuelle
  Installations-, Rez-, Advance-, Trace- und Reservebedarfe.
- Sobald diese Bedarfe plus eine begrenzte Reserve gedeckt sind, darf ein
  neutrales P6-Kreditziel nicht im nächsten Zug automatisch weiterwachsen.
- Diese Änderung gehört in den Economy-Plan und seine Bewertung durch den
  Zugplaner, nicht als globale Sonderregel gegen „zu viele Credits“.

### 3. Es fehlt eine Handplatz-schaffende Vorphase vor einem wichtigen Draw

Bei Handgröße sechs und Maximum fünf wurde der Score-Material-Draw korrekt als
überlauferzeugend erkannt. Die KI prüfte danach aber keine vollständige
Restzuglinie:

1. ein zumindest sinnvoll nutzbares ICE oder eine andere Karte aus der Hand
   installieren/verwenden,
2. dadurch Handplatz schaffen,
3. nach einer Agenda oder anderem benötigten Material ziehen,
4. wegen der neuen Information neu planen.

Stattdessen nahm sie Credits und warf anschließend eine Karte ab. Dieser
Mechanismus erklärt besonders D67-D69, D73-D75, D79-D81, D88, D91-D93 und
D102-D104.

Empfohlene Maßnahme 3:

- Dem Turn Planner eine eng begrenzte
  `capacity_release -> information_boundary`-Phase geben.
- Die Voraktion muss durch ihr zuständiges Planmodul als wenigstens
  vertretbar bewertet werden. Unrezztes ICE darf dabei als gestufter Schutz,
  Steuerwirkung oder Bluff gelten; es darf nicht blind als Handmüll
  installiert werden.
- Nach dem Draw endet die festgelegte Phase und es erfolgt die bereits
  vorgesehene Neuplanung.

### 4. Dr. Dreff wurde in zwei entscheidenden HQ-Fenstern nicht gerezzt

Bei D64 und D65 konnte Dr. Dreff kostenlos in HQ gerezzt werden. HQ hatte ICE,
und ein erfolgreicher Run auf das Fort hätte durch Dr. Dreff noch einen
temporären ICE-Encounter erhalten können. Die KI lehnte mit
`corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route` ab.
Kurz danach griff der Runner auf HQ zu und zerstörte Dr. Dreff.

Der Kartenhint beschreibt den zukünftigen Encounter bereits. Dem Defense-Plan
fehlt aber ein aktuelles, von der Engine bestätigtes LegalAction-Angebot für
genau diesen Pre-Success-Rez-Nutzen. Das ist eine klare verpasste
Verteidigungschance und kein bloßer Geschmacksfall.

Empfohlene Maßnahme 4:

- Die Engine soll im passenden Run-Fenster eine generische,
  servergebundene Rez-Support-Quote an die LegalAction hängen.
- Der Defense-Plan konsumiert diese Quote und bewertet Kosten, vorhandenes
  ICE im angegriffenen Fort sowie den zusätzlichen Encounter.
- Keine Sonderlogik nach Kartenname; Dr. Dreff ist der konkrete Auslöser,
  nicht die gewünschte Architektur.

### 5. Mehrschichtige Server verlieren beim Rezzen die exakte Bewertung

Bei D107 und D108 lehnte die KI Keeper und Crystal Wall vor Archives mit
`corp_ice_rez_resource_exchange_unknown` ab. Die Engine-Funktion
`visibleCorpIceRezResourceExchangeQuote` liefert absichtlich keine
vollständige Quote, sobald der Server mehr als ein ICE enthält.

Die beiden konkreten Nicht-Rez-Entscheidungen sind trotzdem nicht sicher
falsch: Der Runner hatte sichtbar Rent-I-Con, Invisibility und Vewy Vewy Quiet
sowie neun Credits. Er konnte die beiden ETR-ICE wahrscheinlich überwinden.
„Immer rezzen“ wäre daher ebenfalls keine belastbare Korrektur.

Der strukturelle Fehler bleibt: Die KI konnte nicht feststellen, ob der
Runner die aktuelle Schicht und danach die restliche Route wirklich bezahlen
konnte. Sie scheiterte an fehlender Evidence, nicht an einer qualitativen
Abwägung.

Empfohlene Maßnahme 5:

- Eine Engine-zertifizierte Quote für das aktuell angegangene ICE in einem
  mehrschichtigen Server bereitstellen.
- Verbleibende Runner-Zahlungsmittel und sichtbare Breaker nach jedem
  Encounter neu bewerten.
- Die Entscheidung über die nächste Schicht bleibt beim Defense-Plan.
- D107/D108 zunächst als Prüf- und Architekturfall behandeln, nicht als
  roten „muss rezzen“-Checkpoint.

### 6. Economy-Operationen ignorieren abnehmenden Grenznutzen

Efficiency Experts, Accounts Receivable und Night Shift sind isoliert
aktionsökonomisch sinnvoll. Bei 30 bis 44 Credits blieb ihr Planwert aber
nahezu unverändert. Besonders D97 und D99 erhöhten den bereits übergroßen
Kreditvorrat, während Score-Suche und Handkonversion wichtiger gewesen wären.

Empfohlene Maßnahme 6:

- Auch Operationen nach der noch offenen, exakt begründeten
  Finanzierungs- und Reserve-Lücke bewerten.
- Eine Operation kann weiterhin sinnvoll sein, wenn sie Handplatz schafft
  und danach ein wichtiger Draw folgt; ihr Geldwert darf bei bereits
  gedecktem Bedarf aber nicht so tun, als seien zusätzliche Credits voll
  wertvoll.

### 7. Deck-Hint-Consumer-Audit ist nicht vollständig grün

Der verpflichtende Deck-Audit erfasste 26 eindeutige Kartendefinitionen und
45 Karten. Strategie- und Fähigkeitsconsumer liefen, aber zwei bestehende
blockierende Befunde bleiben:

1. Corporate Coup:
   `hosted_credit_take_hint_mismatch`; Engine-Modus
   `up_to_amount_if_available`.
2. Dr. Dreff:
   `hint_field_without_consumer_contract` für `hiddenInfoPolicy`.

Corporate Coup ist keine Ursache der beobachteten Passivität. Der
Dr.-Dreff-Befund berührt dagegen denselben unvollständigen Consumer-Vertrag
wie die verpassten Rez-Fenster.

Empfohlene Maßnahme 7:

- Corporate-Coup-Hint und Engine-Vertrag separat angleichen.
- Beim generischen Dr.-Dreff-Rez-Support gleichzeitig festlegen, ob
  `hiddenInfoPolicy` gebraucht und konsumiert oder aus dem aktiven Hint
  entfernt wird.

## Bewertung jeder einzelnen KI-Entscheidung

Legende:

- **Korrekt/vertretbar**: lokal sinnvoll oder unter den sichtbaren
  Informationen gut begründbar.
- **Erzwungen**: Pflichtschritt oder Zugende ohne verbleibende Aktion; die
  Qualität des vorherigen Zugplans wird dadurch nicht rehabilitiert.
- **Fehlerfolge**: lokal noch nachvollziehbar, aber durch einen zuvor
  mangelhaften Gesamtzug entstanden.
- **Struktureller Fehler**: Teil einer klar belegten fehlerhaften
  Planungs-/Bewertungskette.
- **Prüffall**: Ergebnis nicht sicher falsch, aber Begründung/Evidence
  unzureichend.

| ID | Zustand | Zug | Gewählte Aktion | Urteil und Begründung |
|---|---:|---:|---|---|
| D1 | SV1 | 1 | Starthand behalten | **Korrekt/vertretbar.** Zwei frühe Zentral-ICE, Geld und Agendas ergaben eine spielbare Hand. |
| D2 | SV2 | 1 | Pflichtkarte ziehen | **Erzwungen.** |
| D3 | SV3 | 1 | Data Wall vor HQ | **Korrekt/vertretbar.** Früher ETR-Schutz für HQ. |
| D4 | SV4 | 1 | 1 Credit | **Korrekt/vertretbar.** Finanzierte die folgende R&D-Verteidigung. |
| D5 | SV5 | 1 | Banpei vor R&D | **Korrekt/vertretbar.** Beide Zentralserver waren nach Zug 1 geschützt. |
| D6 | SV6 | 1 | Zug beenden | **Erzwungen.** |
| D7 | SV9 | 2 | Data Wall rezzen | **Korrekt/vertretbar.** Günstiges ETR im angegriffenen HQ. |
| D8 | SV12 | 2 | Banpei rezzen | **Korrekt/vertretbar.** Konkrete R&D-Verteidigung. |
| D9 | SV16 | 3 | Pflichtkarte ziehen | **Erzwungen.** |
| D10 | SV17 | 3 | Karte ziehen | **Korrekt/vertretbar.** Bei nur einem Credit war Informationsgewinn plausibel. |
| D11 | SV18 | 3 | Dr. Dreff in HQ installieren | **Korrekt/vertretbar.** Schaffte Handplatz und hatte reale HQ-Synergie. |
| D12 | SV19 | 3 | 1 Credit | **Korrekt/vertretbar.** Sinnvolle letzte Aktion. |
| D13 | SV20 | 3 | Zug beenden | **Erzwungen.** |
| D14 | SV26 | 5 | Pflichtkarte ziehen | **Erzwungen.** |
| D15 | SV27 | 5 | 1 Credit | **Struktureller Fehler.** Agenda-/Defense-Linie wurde nicht geprüft. |
| D16 | SV28 | 5 | 1 Credit | **Struktureller Fehler.** Fortsetzung des selbstgesetzten Economy-Fallbacks. |
| D17 | SV29 | 5 | 1 Credit | **Struktureller Fehler.** Dritte passive Aktion trotz entwickelbarer Hand. |
| D18 | SV30 | 5 | Zug beenden | **Erzwungen.** Der vorherige Gesamtzug war schlecht. |
| D19 | SV31 | 5 | Asp abwerfen | **Korrekt/vertretbar.** Kein klarer Agenda-Abwurffehler; die Gesamtlage war bereits passiv. |
| D20 | SV36 | 6 | Nicht rezzen | **Korrekt/vertretbar.** Dr. Dreff lag in HQ, angegriffen war R&D. |
| D21 | SV42 | 7 | Pflichtkarte ziehen | **Erzwungen.** |
| D22 | SV43 | 7 | Efficiency Experts spielen | **Korrekt/vertretbar.** Frühe effiziente Finanzierung. |
| D23 | SV44 | 7 | Karte ziehen | **Struktureller Fehler.** Der Draw verdrängte die verfügbare Agenda-plus-ICE-Linie; hierfür existiert inzwischen eine Korrektur. |
| D24 | SV45 | 7 | 1 Credit | **Fehlerfolge.** Auf der letzten Aktion lokal sicherer als eine ungeschützte Agenda, aber Folge der schlechten D23-Zugplanung. |
| D25 | SV46 | 7 | Zug beenden | **Erzwungen.** |
| D26 | SV47 | 7 | Dedicated Response Team abwerfen | **Korrekt/vertretbar.** Ohne aktive Tag-Lage derzeit schwach; bleibt ein sinnvoller Kontrollfall für die Cleanup-Logik. |
| D27 | SV54 | 9 | Pflichtkarte ziehen | **Erzwungen.** |
| D28 | SV55 | 9 | 1 Credit | **Struktureller Fehler.** Konkrete Agenda-plus-ICE-Linie war verfügbar. |
| D29 | SV56 | 9 | 1 Credit | **Struktureller Fehler.** Passive Fortsetzung statt gebundener Restzuglinie. |
| D30 | SV57 | 9 | 1 Credit | **Struktureller Fehler.** Dritter Credit trotz Scoring- und Defense-Material. |
| D31 | SV58 | 9 | Zug beenden | **Erzwungen.** |
| D32 | SV59 | 9 | Marked Accounts abwerfen | **Struktureller Fehler.** Agenda wurde gegenüber redundanten Karten falsch entwertet; inzwischen korrigierter Ausgangsfall. |
| D33 | SV62 | 10 | Nicht rezzen | **Korrekt/vertretbar.** Archives statt Dr. Dreffs HQ wurde angegriffen. |
| D34 | SV71 | 11 | Pflichtkarte ziehen | **Erzwungen.** |
| D35 | SV72 | 11 | 1 Credit | **Struktureller Fehler.** Netwatch plus reichlich Defense-Material wurde nicht zur Zuglinie. |
| D36 | SV73 | 11 | 1 Credit | **Struktureller Fehler.** Wirtschaftsfallback ohne relevante Geldlücke. |
| D37 | SV74 | 11 | 1 Credit | **Struktureller Fehler.** Dritte passive Aktion. |
| D38 | SV75 | 11 | Zug beenden | **Erzwungen.** |
| D39 | SV76 | 11 | Closed Accounts abwerfen | **Korrekt/vertretbar.** Runner war ungetaggt; aktuell geringe Nutzbarkeit. |
| D40 | SV83 | 13 | Pflichtkarte ziehen | **Erzwungen.** |
| D41 | SV84 | 13 | 1 Credit | **Struktureller Fehler.** Netwatch blieb trotz 15 Credits ungenutzt. |
| D42 | SV85 | 13 | 1 Credit | **Struktureller Fehler.** Selbst erneuertes Kreditziel. |
| D43 | SV86 | 13 | 1 Credit | **Struktureller Fehler.** Keine Entwicklung trotz voller Hand. |
| D44 | SV87 | 13 | Zug beenden | **Erzwungen.** |
| D45 | SV88 | 13 | Netwatch Operations Office abwerfen | **Struktureller Fehler.** Zweite Agenda statt redundanter/geringer nutzbarer Karte entsorgt. |
| D46 | SV94 | 15 | Pflichtkarte ziehen | **Erzwungen.** |
| D47 | SV95 | 15 | Crystal Wall vor Archives | **Korrekt/vertretbar.** Reaktion auf die bereits offengelegte Archives-Gefahr. |
| D48 | SV96 | 15 | Karte ziehen | **Korrekt/vertretbar.** Suche nach Score-Material bei freiem Handplatz. |
| D49 | SV97 | 15 | 1 Credit | **Korrekt/vertretbar.** Letzte Aktion, nach Draw noch keine Agenda. |
| D50 | SV98 | 15 | Zug beenden | **Erzwungen.** |
| D51 | SV99 | 15 | Asp abwerfen | **Korrekt/vertretbar.** Kein Agenda-Abwurf; qualitativ nicht eindeutig schlechter als die übrige Hand. |
| D52 | SV104 | 17 | Pflichtkarte ziehen | **Erzwungen.** |
| D53 | SV105 | 17 | Accounts Receivable spielen | **Korrekt/vertretbar.** Noch vertretbare effiziente Finanzierung und Handkonversion. |
| D54 | SV106 | 17 | Karte ziehen | **Korrekt/vertretbar.** Sinnvoller Informationsschritt; zog Data Fort Reclamation. |
| D55 | SV107 | 17 | 1 Credit | **Fehlerfolge.** Auf der letzten Aktion war eine ungeschützte Agenda riskant; der Zug hätte die Informationsgrenze und Restaktion vorher besser einplanen müssen. |
| D56 | SV108 | 17 | Zug beenden | **Erzwungen.** |
| D57 | SV109 | 17 | Data Fort Reclamation abwerfen | **Struktureller Fehler.** Die gerade gefundene Agenda wurde sofort entsorgt. |
| D58 | SV116 | 19 | Pflichtkarte ziehen | **Erzwungen.** |
| D59 | SV117 | 19 | 1 Credit | **Struktureller Fehler.** Hostile Takeover war vorhanden und finanzierbar. |
| D60 | SV118 | 19 | 1 Credit | **Struktureller Fehler.** Keine Rush-/Remote-Variante. |
| D61 | SV119 | 19 | 1 Credit | **Struktureller Fehler.** Dritter Credit bei bereits 26 Credits. |
| D62 | SV120 | 19 | Zug beenden | **Erzwungen.** |
| D63 | SV121 | 19 | Hostile Takeover abwerfen | **Struktureller Fehler.** Schnelle Agenda ohne Scoring-Versuch entsorgt. |
| D64 | SV128 | 20 | Dr. Dreff nicht rezzen | **Struktureller Fehler.** Kostenlose, serverpassende HQ-Verteidigung wurde mangels Engine-Quote verworfen. |
| D65 | SV132 | 20 | Dr. Dreff weiterhin nicht rezzen | **Struktureller Fehler.** Zweites verpasstes HQ-Rez-Fenster vor erfolgreichem Zugriff. |
| D66 | SV137 | 21 | Pflichtkarte ziehen | **Erzwungen.** |
| D67 | SV138 | 21 | 1 Credit | **Struktureller Fehler.** Kein Handplatz-schaffender Schritt vor Score-Material-Suche. |
| D68 | SV139 | 21 | 1 Credit | **Struktureller Fehler.** Handkapazitäts-/Economy-Schleife. |
| D69 | SV140 | 21 | 1 Credit | **Struktureller Fehler.** Dritter Credit bei voller Hand. |
| D70 | SV141 | 21 | Zug beenden | **Erzwungen.** |
| D71 | SV142 | 21 | Solo Squad abwerfen | **Korrekt/vertretbar.** Kein klarer Agendafehler; aktuell geringe unmittelbare Wirkung. |
| D72 | SV154 | 23 | Pflichtkarte ziehen | **Erzwungen.** |
| D73 | SV155 | 23 | 1 Credit | **Struktureller Fehler.** Hostile Takeover war vorhanden. |
| D74 | SV156 | 23 | 1 Credit | **Struktureller Fehler.** Keine Rush-/Defense-Linie. |
| D75 | SV157 | 23 | 1 Credit | **Struktureller Fehler.** 33 Credits statt Boardentwicklung. |
| D76 | SV158 | 23 | Zug beenden | **Erzwungen.** |
| D77 | SV159 | 23 | Hostile Takeover abwerfen | **Struktureller Fehler.** Zweite schnelle Agenda entsorgt. |
| D78 | SV166 | 25 | Pflichtkarte ziehen | **Erzwungen.** |
| D79 | SV167 | 25 | 1 Credit | **Struktureller Fehler.** Dritte Hostile-Takeover-Gelegenheit nicht verfolgt. |
| D80 | SV168 | 25 | 1 Credit | **Struktureller Fehler.** Wirtschaftsziel erneuerte sich trotz 34 Credits. |
| D81 | SV169 | 25 | 1 Credit | **Struktureller Fehler.** Keine Handkonversion/Remote-Entwicklung. |
| D82 | SV170 | 25 | Zug beenden | **Erzwungen.** |
| D83 | SV171 | 25 | Hostile Takeover abwerfen | **Struktureller Fehler.** Dritte Kopie ohne Scoring-Versuch entsorgt. |
| D84 | SV178 | 26 | Banpei rezzen | **Korrekt/vertretbar.** Direkte R&D-Verteidigung im passenden Fenster. |
| D85 | SV188 | 27 | Pflichtkarte ziehen | **Erzwungen.** |
| D86 | SV189 | 27 | Night Shift spielen | **Korrekt/vertretbar.** Isoliert effizient und schuf eine umsetzbare Folgeaktion; Geldgrenznutzen bereits gering. |
| D87 | SV190 | 27 | Keeper vor Archives | **Korrekt/vertretbar.** Zweite Schutzschicht vor dem inzwischen hochgefährlichen Archives. |
| D88 | SV191 | 27 | 1 Credit | **Struktureller Fehler.** Draw war wegen voller Hand blockiert; ein weiteres vertretbares ICE hätte Platz schaffen und Score-Suche eröffnen können. |
| D89 | SV192 | 27 | Zug beenden | **Erzwungen.** |
| D90 | SV198 | 29 | Pflichtkarte ziehen | **Erzwungen.** |
| D91 | SV199 | 29 | 1 Credit | **Struktureller Fehler.** Corporate Coup blieb ohne Score-/Remote-Plan. |
| D92 | SV200 | 29 | 1 Credit | **Struktureller Fehler.** Keine produktive Handkonversion. |
| D93 | SV201 | 29 | 1 Credit | **Struktureller Fehler.** 37 Credits statt Scoring-Vorbereitung. |
| D94 | SV202 | 29 | Zug beenden | **Erzwungen.** |
| D95 | SV203 | 29 | Corporate Coup abwerfen | **Struktureller Fehler.** Siebter Agenda-Abwurf. |
| D96 | SV219 | 31 | Pflichtkarte ziehen | **Erzwungen.** |
| D97 | SV220 | 31 | Accounts Receivable spielen | **Struktureller Fehler im Gesamtplan.** Effizient isoliert, aber bei 37 Credits ohne offene Finanzlücke überbewertet. |
| D98 | SV221 | 31 | Karte ziehen | **Korrekt/vertretbar.** Informationsgewinn nach geschafftem Handplatz. |
| D99 | SV222 | 31 | Efficiency Experts spielen | **Struktureller Fehler im Gesamtplan.** Noch mehr Geld bei bereits 41 Credits statt strategischer Entwicklung. |
| D100 | SV223 | 31 | Zug beenden | **Erzwungen.** |
| D101 | SV237 | 33 | Pflichtkarte ziehen | **Erzwungen.** |
| D102 | SV238 | 33 | 1 Credit | **Struktureller Fehler.** Kein Agenda-Material, volle Hand und 44 Credits verlangten Handkonversion plus Suche. |
| D103 | SV239 | 33 | 1 Credit | **Struktureller Fehler.** Economy-Fallback erneuerte erneut sein Ziel. |
| D104 | SV240 | 33 | 1 Credit | **Struktureller Fehler.** 47 Credits ohne Fortschritt zum Sieg. |
| D105 | SV241 | 33 | Zug beenden | **Erzwungen.** |
| D106 | SV242 | 33 | Jack Attack abwerfen | **Korrekt/vertretbar.** Redundante Kopie statt wertvollerer Einzelkarte; entspricht der aktuellen Cleanup-Korrektur. |
| D107 | SV247 | 34 | Keeper nicht rezzen | **Prüffall.** Sichtbare Runner-Werkzeuge sprechen möglicherweise fürs Sparen; die KI hatte aber wegen Multi-ICE keine belastbare Austauschquote. |
| D108 | SV249 | 34 | Crystal Wall nicht rezzen | **Prüffall.** Ergebnis möglicherweise rational, Begründung erneut nur `resource_exchange_unknown`; kein „muss rezzen“-Beweis. |

## Entscheidungssummen

- 34 Pflicht-/Endentscheidungen
- 27 lokal korrekte oder vertretbare Entscheidungen
- 43 Entscheidungen als Teil eines klar belegten strukturellen Fehlers
- 2 lokal vertretbare Fehlerfolgen eines zuvor schlechten Gesamtzugs
- 2 echte Prüffälle mit unzureichender Evidence, aber nicht sicher falschem
  Ergebnis

„Struktureller Fehler“ bedeutet nicht, dass jede einzelne Aktion isoliert
illegal oder unter allen Varianten schlechter war. Es bedeutet, dass sie Teil
einer durch Trace, Zustand und Folgeereignis belegten fehlerhaften
Planungskette war.

## Priorisierung für eine mögliche Umsetzung

1. **P1 – aktuelle Korrektur gegen spätere Agenda-Zustände absichern:**
   neue historische Checkpoints und Reproduktion unter aktuellem Code.
2. **P1 – Economy-Sättigung und echte Finanzierungsziele:**
   selbst erneuernde Kreditspirale beenden.
3. **P1 – Handplatz-schaffende Zugphase vor Draw:**
   sinnvolle Konversion, Informationsgrenze, danach Neuplanung.
4. **P1 – generische Dr.-Dreff-/Future-Encounter-Rez-Quote:**
   kostenlose reale Defense nicht mehr mangels Vertrag verwerfen.
5. **P2 – Multi-ICE-Rez-Austauschquote:**
   D107/D108 qualitativ entscheidbar machen, ohne Always-Rez-Regel.
6. **P2 – abnehmender Grenznutzen von Economy-Operationen:**
   mit Punkt 2 gemeinsam oder direkt danach.
7. **P2 – verbleibende Deck-Hint-Verträge:**
   Dr. Dreff im selben Paket wie Punkt 4; Corporate Coup separat.

## Freigabestatus

Diese Datei ist eine Analyse, keine Umsetzungsfreigabe. Es wurden keine
weiteren KI-, Engine-, Hint- oder Teständerungen vorgenommen. Vor einer
Umsetzung sind die Punkte 1 bis 7 einzeln oder gemeinsam freizugeben.
