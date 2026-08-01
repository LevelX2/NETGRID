# Match 978d – Final Review der Corp-KI-Remediation

Status: abgeschlossen und lokal nach `main` integriert

Quelle: vollständiges Audit aller 104 KI-Entscheidungen in
`match_978da70c2bd72e61` sowie die vom Projektbetreiber freigegebenen
Remediationspakete.

## Ergebnis

Die Korrektur schließt die im Match sichtbare strukturelle Passivität, ohne
eine kartenspezifische Entscheidungslogik oder eine zweite Planinstanz
einzuführen. `corp.defend_servers` besitzt weiterhin ICE-Allokation,
Installation und Rez. `corp.score_agenda` besitzt weiterhin Agenda,
Zielserver, Rush-Risiko und Scorefortsetzung. Ein Scoreprojekt kann einen
typisierten Schutzbedarf an Defense geben; die ausgeführte ICE-Action bleibt
dennoch vollständig an Defense-Plan, Step, Route, LegalAction und StateVersion
gebunden.

## Abgeschlossene Maßnahmen

1. **Vollständiges Entscheidungsaudit:** Alle 104 KI-Schritte wurden gegen
   LegalActions, PlayerViews, Planstatus und Ausführung geprüft und als
   reproduzierbare Evidence dokumentiert.
2. **Exakte Schutz- und Rezrouten:** Bekannte tragfähige ICE-Teilmengen bleiben
   nutzbar, auch wenn ein Geschwisterpfad unbekannt ist. Unbekannt bleibt als
   sichtbare Unsicherheit erhalten und wird nicht durch einen Schätzwert
   verdeckt.
3. **Materialisierbarer Defense-Draw:** Ein ICE-Draw ist nur produktiv, wenn vor
   dem nächsten Runnerzug noch ein konkreter Schutzschritt möglich ist.
   Andernfalls werden Funding, Advance oder ein anderer Plan verglichen.
4. **Rush- und Scorekonversion:** Öffnungsrush, Agenda-/Matchpointwert,
   sichtbare Runnerressourcen, Scoredauer, vorhandene Remoteinvestition und
   Schutzbudget werden als vollständige Linien verglichen. Eine akute
   Zentralgefahr blockiert Rush nur, wenn ihr Schutz mit exakten aktuellen
   Rezquotes tatsächlich nicht finanzierbar ist.
5. **Globale ICE-Allokation:** Zweite und dritte unrezzte Schichten dürfen als
   Staffelung, Bluff und vorbereitete Investition wertvoll sein. Ihr Grenzwert
   wird gegen andere Server, Liquidität, Scoreentwicklung und bereits
   unrealisierten ICE-Bestand verglichen; es gibt kein hartes Layer-Limit.
6. **Score-Remote-Ownership:** Remote-Härtung läuft als Defense-Child eines
   ausgewählten Scoreprojekts. Unausführbare Geschwisterprojekte und weitere
   nicht akute Zentralschichten verdrängen diese Route nicht. Eine Agenda wird
   dadurch weder vom Defense-Plan installiert noch von einem Resolver gewählt.
7. **Kompositionsabhängige Deckdoktrin:** Eine Strategie wird nur aus einer im
   Deck vorhandenen, gemeinsam ausführbaren Komponentenstruktur primär. Ein
   einzelner Beschleuniger oder Anker erzeugt keine Fast-Advance-, Recycling-
   oder andere Spezialdoktrin.
8. **Observability und Determinismus:** `steal_agenda.totalAgendaPoints`
   enthält den aggregierten Punktestand nach dem Steal. Semantisch gleiche
   Kartenkopien werden durch einen stabilen zustandsgebundenen Tiebreak
   ausgewählt, ohne Kartenidentität zur Strategie zu machen.

## Abnahme

- Fokussierter Abschlusslauf: 15 Testdateien, 85 Tests grün.
- Vollständige AI-Shards: 551 Testdateien, 4.515 Tests grün
  (1.803 + 1.548 + 1.164).
- Betroffener Engine-Test: 6 Tests grün.
- Workspace-Typecheck: alle sieben beteiligten Projekte grün.
- `check:ai`, `check:ai-source-structure`,
  `check:proteus-ai-readiness` und `check:ai-deck-doctrine-strategy`: grün.
- `git diff --check` und Debug-Marker-Prüfung: grün.

Nach dem Fast-Forward auf `main` wurden der saubere Git-Stand, `check:ai`,
drei zentrale KI-Testdateien mit 9 Tests sowie der betroffene Engine-Test mit
6 Tests nochmals erfolgreich geprüft.

Der erste breite Regressionslauf hat zu aggressive ICE-Staffelung und mehrere
veraltete, technisch übergenaue Checkpointerwartungen sichtbar gemacht. Die
Staffelung wurde anschließend auf globale Opportunitätskosten und
Score-Parent-Kohärenz begrenzt; Checkpoints wurden nur dort erweitert, wo die
neue semantisch gleichwertige oder fachlich bessere Route denselben Owner
behält. Der endgültige vollständige Lauf ist grün.

Der AI-Typecheck benötigte wegen der Größe des Pakets ein Node-Heap-Limit von
8 GiB. Das ist eine äußere Laufzeitressource und keine Änderung am Produktcode.

## Bewusst verbleibende Unsicherheit

Unbekannte Encounter-/ICE-Wirkung bleibt fail-closed. Insbesondere wird ein
Score-Rush nicht allein deshalb erzwungen, weil ein Remote-ICE installiert ist,
wenn die aktuelle Schutzprojektion mangels exakter Information keinen
tragfähigen Zugriffspfad belegen kann. Diese konservative Grenze ist ein
Sicherheitsmechanismus, kein verdeckter Fallback. Eine spätere Verbesserung
erfordert zusätzliche generische, side-sichere Effektsemantik und keine
Karten-Sonderregel.

## Architektururteil

Die Umsetzung folgt der generischen Zielrichtung. Sie ergänzt Fakten,
Vergleichshorizonte und Parent/Child-Bindung innerhalb der vorhandenen Pläne.
Es entstand weder eine parallele Defense- oder Scoreautorität noch ein
Choice-Resolver mit eigener Strategieentscheidung. Konkrete Instanz-IDs werden
nur verwendet, um einen bereits gewählten Schritt deterministisch auszuführen.
