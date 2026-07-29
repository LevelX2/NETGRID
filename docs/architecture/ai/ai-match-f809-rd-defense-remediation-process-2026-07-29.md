# Match f809 – R&D-Verteidigung und HQ-Behalten-Auswahl

Status: in Arbeit

Stand: 2026-07-29

## Quelle

- vollständige Einzelprüfung aller 46 Corp-KI-Entscheidungen im jüngsten
  nicht abgeschlossenen Match `match_f8096c690c233533`;
- StateVersions 16, 25 bis 27, 71, 96 bis 98 sowie 66 als historische
  Hauptbelege;
- formaler Deck-Hint-Consumer-Audit des tatsächlich gespielten Decks
  `Proteus Korp - Variable ICE Gauntlet`
  (`fnv1a:ee4233bc`, 30 unterschiedliche und 45 Karten);
- Nutzerfreigabe für die Punkte 1 bis 3 einschließlich der Leitplanke, dass
  noch nicht rezbares ICE dosiert als Bluff und vorbereitete Verteidigung
  berücksichtigt werden darf.

## /Goal

Arbeite die Pakete P0 bis P6 sequenziell im Worktree
`C:\Projekte\NETGRID_AI_MATCH_F809_RD_DEFENSE` auf Branch
`codex/ai-match-f809-rd-defense` ab. Sichere die historischen
Fehlentscheidungen zuerst unverändert als rote
`behavior_regression`-Checkpoints, implementiere ausschließlich generische
side-sichere Korrekturen, verifiziere die unveränderten Erwartungen grün,
committe jedes abgeschlossene Paket, merge den fertigen Branch lokal nach
`main` und entferne Worktree sowie Branch erst nach verifiziertem Abschluss.

## Gesamtziel

Die Corp-KI soll unter sichtbarem wiederholtem Zentraldruck eine
nachvollziehbare Verteidigungsentwicklung besitzen:

1. sofort finanzierbare ICE-Installationen dürfen nicht als wirkungslos
   verworfen und von einem einzelnen Basic Credit verdrängt werden;
2. eine noch nicht rezbare ICE-Installation darf einen begrenzten,
   expliziten Wert für Aktionsvorbereitung, künftige Rez-Bereitschaft und
   Bluff besitzen, ohne eine sofort finanzierte Verteidigung oder eine
   höherwertige Route zu verdrängen;
3. ICE-Installation und legale Rez-Hilfe dürfen als revalidierte
   Mehraktionsroute geplant werden;
4. eine HQ-Behalten-Auswahl bewertet ausführbare Kartenpakete statt nur
   unabhängige Einzelkartenwerte.

Rules Engine, `LegalActions`, Plan-first-Ownership, deterministisches Replay,
StateHash und Hidden-Info-Grenzen bleiben unverändert verbindlich.

## Vollständiger Entscheidungsnenner

- erwartete Corp-KI-Aktionsereignisse: 46;
- gefundene Decision-Traces: 46;
- fehlende, doppelte oder verwaiste Entscheidungen: 0;
- Action-Type-Abweichungen: 0.

Die ausführliche Bewertung aller 46 Entscheidungen wird im Abschlussreview
festgehalten. Klare Zielabweichungen liegen bei D10, D13 bis D15, D30 und D34.
D45 wird aufgrund der Nutzerleitplanke zusätzlich als historischer
Staging-/Bluff-Prüfpunkt aufgenommen: Installation bei drei Credits und
anschließendes Ansparen erreicht sechs Credits im folgenden Corp-Zug zum
gleichen Zeitpunkt wie erst Ansparen und späteres Installieren, eröffnet aber
bereits im dazwischenliegenden Runner-Zug eine Bluffwirkung.

## Nachgewiesene Ursachen

### F1: Verteidigungsinstallation verlangt zu früh unmittelbare Wirkung

`corpGlobalDefenseInstallRouteAssessment` und die finanzierte
Score-Protection-Projektion lassen legale zentrale ICE-Installationen
teilweise als
`corp_ice_install_has_no_engine_certified_access_probability_reduction`
beziehungsweise `effect_missing` fallen. Dauerhafter Installationsfortschritt
und der Wert eines sonst schwachen letzten Klicks bleiben dabei unzureichend
vertreten.

### F2: Vorbereitete Verteidigung besitzt keinen dosierten Eigenwert

Eine aktuell nicht rezbare Installation erscheint nur als
`funding_only` und wird an Economy delegiert. Die Bewertung unterscheidet
nicht ausreichend zwischen:

- unmittelbarer finanzierter Verteidigung;
- vorbereiteter, in einem konkreten Horizont finanzierbarer Verteidigung;
- begrenztem Bluffwert während eines sonst offenen Angriffsfensters.

Der Fix darf daraus keine pauschale Installationspräferenz machen.

### F3: Rez-Hilfen besitzen ohne bereits installiertes Ziel keinen Parent

Emergency Rig und Rent-to-Own werden mit
`corp_card_action_has_no_exact_parent_need` ausgeschlossen. Die Runtime
modelliert `ICE installieren → State revalidieren → Rez-Hilfe verwenden`
nicht als zusammengehörige Defense-Route.

### F4: HQ-Behalten-Auswahl bewertet Karten unabhängig

Die Behalten-Auswahl verwendet eine feste Creditreserve und unabhängige
`discardKeepScore`-Werte. Sie konsumiert weder den aktuellen Zentraldruck
noch vollständige Defense-Pakete, Rez-Hilfen, billigere Rez-Alternativen oder
Paar-Synergien. Dadurch behielt D30 zwei teure ICE und warf beide Rez-Hilfen
sowie das billigere Gatekeeper-ICE ab.

## Fachliche Leitplanken

- Sofort rezbare und belegbar wirksame Verteidigung bleibt stärker als
  vorbereitete Verteidigung.
- Vorbereitete Verteidigung erhält nur dann Wert, wenn der Zielserver
  tatsächlich Schutzbedarf besitzt, die Finanzierung in einem endlichen
  Horizont erreichbar ist und keine höherpriorisierte konkrete Route
  verdrängt wird.
- Bluffwert ist endlich, gekappt und als Unsicherheitswert ausgewiesen. Er
  behauptet niemals eine unmittelbare Access-Reduktion.
- Ein letzter Klick kann Installationsfortschritt höher bewerten als einen
  einzelnen Credit, wenn beide Folgen denselben Rez-Zeitpunkt erreichen und
  die Installation vorher ein relevantes Angriffsfenster beeinflusst.
- Installationskosten, bereits vorhandene ICE, HQ-Wert, Duplikate,
  Rez-Horizont und sichtbarer Angriffsdruck begrenzen Staging und Bluff.
- Keine Kartennamen-Sonderregeln im Produktivcode.
- Keine verdeckten Runner-Daten, keine Kenntnis künftiger Runner-Züge.
- Jede Folgeaktion wird aus neuen `LegalActions` nach dem State-Wechsel
  materialisiert; keine unrevalidierte Makroaktion.

## Nicht-Ziele

- keine Änderung der Kartenregeln oder Engine-LegalActions ohne separaten
  Engine-Beleg;
- keine pauschale Regel „ICE immer installieren“;
- keine allgemeine Neugewichtung sämtlicher Corp-Pläne;
- keine Social-Engineering-Gebotsänderung aus nur einem verdeckten Ausgang;
- keine Änderung der öffentlichen Trace-Persistenz für verdeckte
  Choice-Werte;
- keine Veränderung der laufenden Hauptinstanz, ihrer Standardports oder
  ihrer SQLite-Daten.

## Paketfolge

### P0 – Prozessvertrag und Worktree

- isolierten Worktree und Branch anlegen;
- Ziel, Fehler, Leitplanken und Paketfolge festschreiben;
- fremdes unversioniertes `.next`-Artefakt im Hauptcheckout unangetastet
  lassen.

Done: Prozessartefakt ist committed und der Arbeits-Worktree sauber.

Commit: `docs(ai): start match f809 defense remediation`

### P1 – Historische rote Evidence

- unveränderte historische Checkpoints für D10, D13, D30, D34 und D45
  aufnehmen;
- den formalen Deck-Hint-Consumer-Audit erneut gegen das genaue Deck
  protokollieren;
- ausschließlich `behavior_regression` als Ziel-Red akzeptieren;
- kontrollierte Gegenproben für fehlenden Druck, unendlichen
  Finanzierungshorizont, höhere Priorität und bereits ausreichende
  Verteidigung grün halten.

Done: Jeder freigegebene Fehler besitzt roten historischen Beleg; Fixture-,
Redaction-, Replay- oder Runtime-Drift sind ausgeschlossen.

Commit: `test(ai): capture match f809 defense regressions`

### P2 – Dosierte zentrale Staging- und Bluffbewertung

- unmittelbar finanzierte Verteidigung als stärkste Defense-Route erhalten;
- vorbereitete Installation mit endlichem Rez-Horizont als eigene,
  gekappte Defense-Progression modellieren;
- begrenzten Bluffwert nur unter tatsächlichem sichtbarem Druck und offenem
  Angriffsfenster zulassen;
- Last-Click-/Basic-Credit-Vergleich auf den tatsächlichen
  Folge-Rez-Zeitpunkt beziehen;
- Gründe und Kappen side-sicher im Decision-Debug ausweisen.

Done: D10, D34 und D45 werden generisch geschlossen; Gegenproben verhindern
apodiktisches oder wahlloses Installieren.

Commit: `fix(ai): value staged central ice defense`

### P3 – Revalidierte ICE-/Rez-Hilfe-Route

- aus Defense-Hints und aktuellen LegalActions ein exaktes
  Installationsziel und eine mögliche Rez-Hilfe-Folge ableiten;
- nach Installation vollständig revalidieren;
- Kosten, Ziel, Timing, erwartete Dauer und Nachteile der Rez-Hilfe
  berücksichtigen;
- ohne legales Ziel, relevanten Druck oder erreichbare Folgeaktion
  fail-closed bleiben.

Done: D13 bis D15 besitzen eine ausführbare Defense-Route; negative
Rez-Hilfe-Gegenproben bleiben grün.

Commit: `fix(ai): plan revalidated ice rez support`

### P4 – Kontextuelle HQ-Behalten-Sets

- vorhandene Hand- und Domainfakten wiederverwenden;
- zulässige Behalten-Sets als Ganzes bewerten;
- aktuelle Defense-Route, Rez-Kosten, billigere Alternativen,
  Rez-Hilfe-Synergie, Duplikate und verbleibende Creditreserve einbeziehen;
- keine zweite unabhängige Discard-Policy schaffen.

Done: D30 behält ein ausführbares, kontextgerechtes Paket; Economy-,
Agenda-, Combo- und Hidden-Info-Gegenproben bleiben stabil.

Commit: `fix(ai): retain executable corp defense packages`

### P5 – Breite Verifikation und Review

- alle neuen und angrenzenden Checkpoints sowie Unit-/Runtime-Tests;
- AI-Typecheck und paketangemessene vollständige KI-Gates;
- Deck-Hint-Consumer-Audit;
- deterministische Wiederholung, Redaction-/Hidden-Info-Gegenprobe und
  `git diff --check`;
- vollständige 46/46-Einzelentscheidungstabelle, Evidence- und Final-Review
  erstellen;
- dauerhafte Erkenntnisse in die führende Wissensbasis zurückführen.

Done: Ziel-Checkpoints sind unverändert grün; Gegenproben und
Sicherheitsverträge sind belegt.

Commit: `docs(ai): review match f809 defense remediation`

### P6 – Integration und Cleanup

- aktuelles `main` defensiv in den Arbeitsbranch integrieren;
- finale Checks im Arbeitsbranch;
- lokal nach `main` mergen und dort angemessen verifizieren;
- ausschließlich den eigenen sauberen Worktree entfernen;
- Entfernung in Git und Dateisystem prüfen;
- gemergten Branch ohne Force löschen.

Done: `main` enthält alle Paketcommits; fremde Änderungen bleiben erhalten;
Worktree und Branch sind verifiziert bereinigt.

## Sicherheitsblocker

Der Prozess stoppt ohne heuristischen Workaround, wenn:

- ein historischer Zielfall nicht als `behavior_regression` reproduzierbar
  ist;
- eine Maßnahme FullState oder verdeckte Runner-Information benötigt;
- LegalActions oder Engine-Projektionen den historischen Zustand nicht
  korrekt abbilden;
- Bluffwert nur durch behauptete statt belegte unmittelbare Wirkung
  implementierbar wäre;
- die HQ-Auswahl eine parallele zweite Handmanagement-Autorität erfordern
  würde;
- ein Konflikt mit neuer `main`-Arbeit nicht intentionserhaltend lösbar ist.

## Paketstatus

- P0: aktiv.
- P1 bis P6: ausstehend.
