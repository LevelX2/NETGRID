# Match 5F7924: Abschlussreview der Passivitätskorrektur

Stand: 2026-07-30

Ausgangsmatch: `match_5f7924e4893ba855`

Status: vollständig umgesetzt und verifiziert

## Ausgangslage

Die vollständige Spielanalyse hatte alle 108 Corp-KI-Entscheidungen
nachvollzogen. Der beobachtete alte Stand nahm in 36 von 51 freiwilligen
Corp-Aktionen einen einzelnen Credit, installierte nie eine Agenda, warf sieben
Agendas ab und beendete das Spiel mit 47 Credits sowie null eigenen
Agendapunkten.

Die Ursache war keine einzelne falsche Gewichtung. Score-, Defense-, Economy-
und Handmanagement-Pläne konnten ihre Teillösungen nicht zu einer ausführbaren
Restzuglinie verbinden. Vertretbare ICE-Installationen wurden zu früh
ausgeschlossen, der Economy-Plan erneuerte sein Kreditziel, und bei voller Hand
fehlte die Phase „Platz schaffen, gezielt ziehen, danach neu planen“.

## Umgesetzte sieben Maßnahmen

### 1. Agenda und Defense als zusammenhängende Zuglinie

- Späte Agenda-, Score-Remote- und Defense-Zustände des Matches sind als
  Decision-Checkpoints dauerhaft erfasst.
- Der Defense-Plan kann ein exakt an einen Score-Parent gebundenes ICE
  installieren. Nur ein unmittelbar nachgewiesener
  `score_protection_staging_install`-Schritt darf anschließend genau die
  zugehörige Agenda auf genau diesem Remote fortsetzen.
- Die Bindung verwendet konkrete Karteninstanz- und Server-IDs. Sie ist keine
  allgemeine Freigabe für Agenda-Installationen hinter irgendeinem
  unrezzten ICE.
- ICE-Installation und Rezzen bleiben vollständig im Defense-Plan. Der
  Zugplaner orchestriert lediglich die gebundenen Phasen.

### 2. Endliches, bedarfsgebundenes Liquiditätsziel

- Das frühere selbst erneuernde Ziel „aktueller Kreditstand plus verbleibende
  Aktionen“ ist durch einen sichtbaren, endlichen Bedarf ersetzt.
- Berücksichtigt werden aktuelle Installations-, Rez-, Advance- und
  Score-Reserven sowie konkret gequotete Routen.
- Ist der Bedarf gedeckt, werden Basic Credit und zusätzliche
  Economy-Konversionen nicht im nächsten Zug erneut als neutrales
  Wachstumsziel aufgebaut.
- Ein einzelner Credit bleibt nur dann zulässig, wenn er eine aktuelle
  Finanzierungslücke tatsächlich verkleinert.

### 3. Handplatz schaffen, ziehen, neu planen

- Der Defense-Plan darf bei echtem HQ-Überlauf eine konkrete, vertretbare
  ICE-Installation als `score_material_capacity_release` anbieten.
- Der Turn Planner behandelt diesen Schritt als geplante Vorphase. Der
  folgende Draw ist eine Informationsgrenze; danach wird mit der gezogenen
  Karte neu geplant.
- Eine Agenda in HQ sperrt die generische Kapazitätsfreigabe. Außerdem muss
  noch Agenda-Material im R&D verbleiben und es darf keine bessere exakte
  ICE-Route für denselben Server verdrängt werden.
- Der D88-Sonderzustand mit nur einer verbleibenden Corp-Aktion nutzt einen
  kontrollierten Score-Material-Ersatzdraw statt einer unmöglichen
  Installations-plus-Draw-Folge.

### 4. Future-Encounter-Rez-Support

- Die Engine stellt im passenden Run-Fenster eine servergebundene Quote für
  ein gerootetes Rez-Angebot bereit, das einen späteren zusätzlichen
  ICE-Encounter ermöglicht.
- Der Defense-Plan bewertet den einmaligen Rez-Preis, das angegriffene Fort,
  vorhandenes ICE und den günstigsten aktuell zahlbaren Encounter-Folgeschritt.
- Dr. Dreff wird dadurch im reproduzierten HQ-Fall als Verteidigung erwogen;
  die Gegenprobe auf dem falschen Server bleibt ausgeschlossen.
- Der Vertrag ist funktionsbezogen und enthält keine kartennamenspezifische
  Runtime-Sonderregel.

### 5. Exakte Quote für das aktuell angegangene ICE

- Die Ressourcen-Austauschquote ist nicht mehr auf Server mit genau einer
  ICE-Schicht beschränkt.
- Sie bindet sich an das ICE an der aktuellen Runposition und bewertet nur
  diesen jetzt legalen Encounter.
- Nach jeder Begegnung erzeugt die Engine neue LegalActions und die KI plant
  für die nächste Schicht neu. Eine unsichere Gesamtroute wird nicht
  vorgetäuscht.
- D107/D108 sind dadurch entscheidbar, bleiben aber bewusst keine
  „immer rezzen“-Vorgabe.

### 6. Abnehmender Grenznutzen von Economy-Operationen

- Economy-Operationen verwenden dieselbe noch offene sichtbare
  Liquiditätsnachfrage wie der Basic-Credit-Fallback.
- Zusätzliche Credits erhalten keinen vollen Nutzen mehr, wenn Installation,
  Rez, Advance und Reserve bereits finanziert sind.
- Eine Operation darf weiterhin sinnvoll sein, wenn sie eine konkrete Lücke
  schließt oder als planzertifizierte Handkonversion einen wichtigen Draw
  vorbereitet.
- Sind alle aktuell freiwilligen Corp-Aktionen nach exakten Planverträgen
  unproduktiv, darf der Abschlussplan den Zug begründet beenden, statt eine
  künstliche Credit-Schleife zu erzwingen.

### 7. Corporate-Coup- und Dr.-Dreff-Hint-Verträge

- Corporate Coup weist den tatsächlich konsumierten Vertrag
  `economy.temporary_resource_bank` und den Engine-Modus
  `up_to_amount_if_available` konsistent aus.
- Das redundante, nicht konsumierte Top-Level-`hiddenInfoPolicy`-Feld bei
  Dr. Dreff ist entfernt; die konkrete Zielprofil-Policy bleibt erhalten.
- Hint-Metadaten-, Consumer-, Struktur- und Kartenfunktions-Gates sind grün.

## Qualitative Grenzen gegen Übersteuerung

Die Korrektur erzeugt ausdrücklich keine apodiktische ICE-Regel:

- Unrezztes ICE darf bei fehlender besserer Route als gestufter Schutz,
  Steuerwirkung oder Bluff zählen.
- Zentrale qualitative Abdeckung priorisiert zunächst HQ und R&D.
- Remote-Staging bleibt an einen konkreten Score-Plan gebunden.
- Eine bereits vollständig gequotete Remote-Schicht wird nicht blind um
  weitere unbekannte Schichten ergänzt.
- Ein aktueller Rez-Funding-Gap über drei Credits reicht für generisches
  qualitatives Staging nicht aus.
- Kostenpflichtiges Rezzen muss weiterhin seinen Score- und
  Verteidigungsreserven standhalten; kostenloses Rezzen verbraucht diese
  Reserven nicht.

## Verifikation

- Historische Decision-Checkpoints: 74 Dateien, 415 Tests grün.
- Direkt betroffene Plan-/Runtime-Gruppen: 465 Tests grün.
- Vollständige AI-Suite: 534 Dateien, 4.360 Tests grün.
- Engine: 210 Dateien, 1.824 Tests grün.
- Shared: 1 Datei, 16 Tests grün.
- AI-, Engine- und Shared-Typechecks grün.
- `check:ai`, Package Boundaries, Engine Source Structure und
  Card Function Abstraction grün.
- `format:changed` und `git diff --check` grün.

## Verbleibende qualitative Prüffragen

Diese Punkte sind keine nachgewiesenen klaren Fehlerursachen und wurden daher
nicht mit starren Regeln beantwortet:

1. Ob ein Opening Rush in einer konkreten gleichwertigen Lage begonnen wird,
   bleibt eine qualitative Deckstrategieentscheidung. Ein späterer
   kontrollierter Zufallsanteil zwischen wirklich gleichwertigen Varianten ist
   möglich, aber nicht Teil dieses Fixes.
2. Die Schwelle von höchstens drei fehlenden Rez-Credits für qualitatives
   ICE-Staging ist ein konservativer Startwert. Weitere Playtests können eine
   deck- oder matchupabhängige Kalibrierung rechtfertigen.
3. Die Mehrschichtquote entscheidet absichtlich nur über das aktuell
   angegangene ICE. Eine probabilistische Gesamtroutensimulation könnte später
   Mehrwert bringen, würde aber deutlich mehr Komplexität und
   Unsicherheitsmodellierung einführen.
4. Future-Encounter-Support verwendet die aktuell sichtbare günstigste
   zahlbare Folge. Die langfristige Bewertung mehrerer möglicher
   Encounter-Karten bleibt eine spätere qualitative Verfeinerung.
5. Ob die KI insgesamt ausreichend häufig rusht, blufft und Score-Remotes
   eröffnet, muss an neuen vollständigen Spielen und der Behavior Baseline
   bewertet werden. Dieser Abschluss beweist die beseitigten Ursachen, nicht
   eine universell optimale Spielstärke.

## Führende Evidence

- Ausgangsanalyse:
  `docs/reviews/ai/match-5f7924-complete-old-ai-passivity-analysis-2026-07-30.md`
- Paketprozess:
  `docs/architecture/ai/match-5f7924-passivity-remediation-process-2026-07-30.md`
- Historische Checkpoints:
  `packages/ai/src/evaluation/decision-checkpoints/match-5f7924-passivity-remediation-decision-checkpoints.test.ts`
