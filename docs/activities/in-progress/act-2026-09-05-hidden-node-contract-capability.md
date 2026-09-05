---
activityId: act-2026-09-05-hidden-node-contract-capability
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-05
branch: codex/hidden-node-contract-capability
---

# Hidden Node: offene Capability-Abnahme fortsetzen

## Auftrag und Korrektur des bisherigen Abschlusses

Das aktive Nutzer-Goal verlangt die Verbesserung der generischen Spielfähigkeit
und nicht nur einen abgeschlossenen Variantenvergleich. HN-A–E hat keine
produktive Verbesserung übernommen. Der negative Erstinvestitions-Checkpoint
96 ist keine ausreichende Abnahme für vorbereitete, wirtschaftlich sinnvolle
Contract-Zyklen. Diese Lücke wird im selben Goal weiterbearbeitet, ohne die
verworfenenen Deckvarianten zu übernehmen oder eine Verbesserung vorwegzunehmen.

Basis: Main `822d63412a9f4c07562b687ab6db7f9c54221a25`. Die sechs fremden
E2E-Dateiänderungen bleiben unberührt. Kein Remotezugriff, kein Versand.
Der alte, richtlinienbedingt nicht löschbare `_DEL`-Rest bleibt unangetastet;
er ist weiterhin eine eigene offene Cleanup-Bedingung.

## Owner und Invarianten

Engine stellt aktuelle LegalActions, Kosten, Verwendungen und Verfall fest.
`corp.economy` besitzt Counter-Finanzierung; fremde Ressourcenbedarfe müssen
an Parent, Need, Provider und aktuelle Invocation gebunden sein.
`corp.defend_servers` behält ICE-/Server-/Rez-Entscheidungen, Score die Agenda.
Keine allgemeine Liquiditätsbehauptung für Installations-/Rez-Credits,
kein globaler Bonus, kein zweiter Controller oder Choice-Shortcut.
Unknown bleibt lokal. Heutiger Fortschritt und späterer Nutzen werden getrennt.

## Sequenz und Done-Gates

1. **HN-F abgeschlossen – günstigen aktuellen Fehlpfad beweisen.** Reale Engine-
   Actions eines vorbereiteten Contracts mit nutzbarem Verbraucher; Gegenfälle
   ohne Verbraucher, mit unzulässigem Verwendungszweck und nach Verfall.
   Den ersten Verlustpunkt von Quote über Parent/Support bis zur produktiven
   Entscheidung nachweisen. Commit: fokussierter Reproduktionstest.
2. **HN-G aktiv – nachgewiesene Fähigkeit vertikal schließen.** Fehlende Engine-
   Quote/Semantik am erzeugenden Owner ergänzen, benötigte Economy-Route in
   bestehende Parent-/Need-/Head-/Linienverträge einbinden. Aktuelle Auszahlung
   und zweckgebundener Verbrauch, Ende des Supports und Reassessment nach
   Ablauf testen. Aufbau-/Wiederholungsfähigkeit mit allen Kosten bewerten;
   nicht die Existenz einer Auszahlung als vollständige Kampagne ausgeben.
   Keine Verhaltensänderung vor belegtem Owner und aktueller Bindung.
3. **HN-H – Gegenvergleich und Integration.** Direkt betroffene Tests und
   bei geänderten Oberflächen deren Typ-/Strukturgates. Dieselben Original-
   Deck-/Seedkohorten gegen den bewahrten Basisstand vergleichen; Ergebnisse
   und noch fehlende Fähigkeiten transparent in der zentralen Registry sichern.
   Einzelcommits, lokaler Main-Merge, Main-Prüfung, eigener Worktree-/Branch-
   Cleanup. Das gesamte Goal erst schließen, wenn auch seine übrigen echten
   Abschlussbedingungen erfüllt sind.

Genau ein Paket aktiv. Testläufe weiterverfolgen, nicht wegen kurzer Ausgabe-
Zeitfenster neu starten. Kein normaler Serverbetrieb aus dem Worktree.
Ein weiterer ungünstiger Einzelzustand ersetzt nicht die Abnahme des
vollständigen Fähigkeitenumfangs. Echte Regeln-/Wissensgrenzen werden sichtbar
gehalten, nicht mit einem Ersatzpfad überdeckt.

## HN-F: nachgewiesene Verlustpunkte

Real-Engine-Fixture `restricted-credit-rez`, Demo-Corp mit Contract und Wall
of Static, Contract installiert/rezzed mit einem Counter, null allgemeinen
Credits, bestehendes HQ-ICE und Wall in HQ, aktuelles `corp_action.main`:

- Aktuelle Contract-Auszahlung ist legal. Danach ist die vorher unbezahlbare
  HQ-Installation für einen Credit legal und ausführbar; Restbetrag verfällt
  am Zugende. Dies beweist eine zulässige Verwendung, nicht deren strategische
  Überlegenheit gegenüber allen Alternativen.
- Der produktive Chooser scheitert schon bei 87,5 % Coverage:
  `productive_action_without_owner` für die Auszahlung. Der Verlust liegt
  vor Linienvergleich und Prioritätsbewertung. Allgemeine Liquidität ist
  korrekt kein Owner-Nachweis für zweckgebundene Credits.
- Gegenprobe offenbart einen vorgeschalteten Engine-Defekt: `advance_card`
  prüft den Gesamtpool statt den frei verfügbaren Pool und bezahlt ebenfalls
  daraus. Nach Auszahlung/Advancement entstehen Gesamtcredits 2 bei reservierten
  Credits 3 und erneut einem Counter. Beide realen Aktionen wurden akzeptiert.
  HN-G muss zuerst diese falsche Zahlungsautorität korrigieren, bevor eine
  neue KI-Auszahlungsroute aktiv wird.
- `run.approach_ice` bietet derzeit keine allgemeine `corp_paid`-Auszahlung.
  Das ist noch kein nachgewiesener Regelverstoß und wird nicht blind geöffnet.

Die Ownership-Regression ist zunächst ausdrücklich eine Baseline-
Charakterisierung. HN-G ersetzt ihre Fehlererwartung durch die fachliche
Abnahme; die Engine-Gegenprobe ist bereits auf das korrekte Ergebnis umgestellt.

## HN-G: sequenzielle Teilschritte

- **HN-G1 abgeschlossen:** `advance_card` prüft bei Angebot und Ausführung
  dieselbe validierte allgemeine Creditverfügbarkeit. Der reservierte
  Installations-/Rez-Pool wird nicht ausgegeben. Ausführung verweigert vor
  Click-/Credit-/Countermutation. Mischpool, reale Installation/Verfall,
  ungültige Poolwerte und angrenzende Boardpfade geprüft: 37 Engine-Tests,
  drei AI-Real-Engine-Tests grün; Engine-Strukturgate grün (379, keine Zyklen).
  Keine globale Änderung sämtlicher Zahlungen und keine neue KI-Policy.
- **HN-G2 aktiv:** übrige aktuelle Zahlungsgegenproben und vollständige
  zweck-/verfallgebundene Auszahlungsevidence am erzeugenden Engine-Owner.
  Anschließend Economy-Provider nur für exakt gebundene erlaubte aktuelle
  Verbraucher, Nichtausführung ohne nutzbaren Verbraucher und Rückgabe.
  Erster abgeschlossener Teilschritt: isolierte temporäre Auszahlung am
  Engine-Payloadproduzenten vollständig mit Betrag/Zweck/Verfall projiziert,
  vier eng begrenzte LegalAction-DTO-Felder transportiert, vorhandene
  Economy-Art `restricted_credit` befüllt. Kein allgemeiner Liquiditätswert,
  keine andere Source-Bindung, keine behauptete Folgeaction, kein Bonus.
  123 fokussierte AI- und 36 Engine-Tests, AI-/Engine-Typechecks sowie beide
  Strukturgates einschließlich AI-Reachability grün.
  Ownership-Charakterisierung bleibt absichtlich offen/fehlerbeweisend.
  Zweiter Teilschritt: versionierte Engine-Quote für eine aktuelle Auszahlung
  und einen konkret benannten Installations-/Rez-Verbraucher. Die Engine
  prüft die Auszahlung auf ihrer isolierten Zustandskopie und ermittelt das
  tatsächliche folgende LegalAction-Angebot. Herausgegeben werden ausschließlich
  semantische Verbraucherbindung, vollständige Zahlung und Restverfall, keine
  zukünftige Action-ID und kein strategischer Nutzen. Bereits verfügbare
  Verbraucher bleiben von echten Finanzierungslücken unterscheidbar.
  Gegenproben sichern Stale-/Fremdquellen, falschen Zweck, Nullverbrauch,
  unnötige zweite Auszahlung, Hidden-Info-Invarianz und unveränderten StateHash.
  Ein realer Root-Rez-Mischpool ergänzt die Installationsprobe (acht Tests).
  Zusätzliche unprojizierte Auszahlungskosten erhalten keinen Complete-Vertrag.
  Vertikale erste Umsetzung: Actor-privater DTO-Transport, bestehendes
  positives Economy-Rez-Projekt als residenter Parent, genau ein Provider
  je Bedarf mit konkurrierenden aktuellen Auszahlungen, kein pauschaler
  Funding-Readiness-Aufschlag. Die produktive Auswahl bindet Parent/Leaf,
  Need/Assignment und aktuelle Invocation. Nach Auszahlung verschwindet der
  Bedarf und derselbe Parent wählt seine neue echte Rez-Action; ein weiterer
  vorhandener Counter wird nicht ausgegeben. Elf Real-Engine-Tests sichern
  auch DTO-Gegenfälle, lokale Unknown-Disposition und Determinismus.
  Ein dabei bewiesener generischer Rückgabefehler wurde an seinem Erzeuger
  korrigiert: `CorpTurnPlannerShadowResult` transportiert sämtliche bereits
  geprüften Suchlinien an die bestehende Commitment-Fortsetzung, nicht nur
  den neuen Gesamtsieger. Die bisherige Ersatzansicht entfällt. Ownership-,
  Interrupt- und Commitment-Regeln selbst bleiben unverändert.
  Die Finite-Bank-Abnahme endet in diesem Teilschritt am echten Rez-Meilenstein;
  die anschließende Nutzungsplanung bleibt ausdrücklich Bestandteil von G3.
  Verifiziert: 194 Tests in vier direkt betroffenen AI-Dateien, 22 Engine-
  Payloadtests, AI-Typecheck, AI-Struktur/Reachability (658, keine Zyklen),
  Engine-Struktur (380, keine Zyklen), Paketgrenzen (1997) und Diff-Check.
  Kein vollständiger Shard-/Workspace-/Build-/E2E-Lauf für diesen Teilschritt.
  Weitere bewiesene Zahlungsfehler: Standard-/kartenbezogener Resource-Trash,
  Operations und Spy-Counter-Entfernung verbrauchten im isolierten
  Ausführungstest den eingeschlossenen Installations-/Rez-Pool. Angebot und
  Ausführung verwenden jetzt die gemeinsame validierte allgemeine
  Creditverfügbarkeit. Gleichartige Verpflichtungs- und Data-Fort-Lock-
  Zahlungen sind einschließlich Mischpool und Mutation-vor-Ablehnung geprüft.
  Operation-X-Grenzen verwenden ebenfalls nur allgemeine Credits; Installations-
  und Rez-Grenzen bleiben unverändert. Eine reale Contract-Auszahlung bietet
  Scorched Earth mit nur reservierten Credits nicht an, mit drei zusätzlichen
  allgemeinen Credits dagegen schon. 62 Tests über sieben direkt berührte
  Engine-Dateien und zwölf Real-Engine-AI-Tests grün; Engine-Typecheck grün.
  Andere Zahlungsfenster sind damit nicht pauschal als vollständig auditiert
  erklärt. HN-G bleibt für die noch fehlende Fähigkeitenabnahme aktiv.
- **HN-G3 offen:** Setup/Wiederholung nur mit vollständigem Kosten- und
  Verbraucherhorizont; produktiver Chooser, Parent/Leaf, Invocation,
  Reassessment und deterministische Fortsetzung abnehmen.
