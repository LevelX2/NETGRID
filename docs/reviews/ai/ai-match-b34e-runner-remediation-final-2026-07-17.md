# AI-Match-B34E – Runner-Remediation Final Review

Status: bestanden und zur lokalen Integration nach `main` freigegeben

## Ergebnis

Die vollständige Analyse von `match_b34e724e4cfc0362` ist umgesetzt. Alle
119 Runner-Entscheidungen wurden geprüft, alle 22 Auffälligkeiten klassifiziert
und die drei bestätigten Fehlergruppen generisch behoben. Die historischen
Erwartungen wurden nicht abgeschwächt; es gab weder Rebase noch Hidden-Info-
Nutzung oder Kartennamen-Sonderregeln.

Der Runner gewann das Ausgangsspiel mit 7 Agenda-Punkten. Das Ergebnis selbst
war kein Qualitätsnachweis: Die Remediation richtet sich gegen falsche
Entscheidungsgründe, verdrängten Closeoutdruck und unnötige Encounter-Kosten.

## Behobene Ursachen

### 1. Search-Consumer-Drift

Die Runner-Antwortrolle verwendet nur noch passende Runner-Action-Familien,
strukturierte Rollen und Mechaniken sowie tatsächlichen Regeltext. Titel-,
Typ- und Subtyprauschen einer Quellkarte kann keine Suche mehr erzeugen.
Dadurch werden weder das Corp-ICE `Tutor` noch das Multiaccess-Run-Event
`Library Search` als Breaker- oder Setup-Suche bewertet.

Der echte Library-Search-Payoff bleibt erhalten: Die Run-Zielbewertung führt
den vorhandenen Multiaccess-Zugriff eng begrenzt als Zugriffsbonus weiter.
Karten- oder Deck-Hints mussten nicht geändert werden.

### 2. Verdrängter Zwei-Punkte-Closeout

Die Matchpoint-Konvertierung umfasst nun sichtbaren Zentraldruck bei höchstens
zwei fehlenden Agenda-Punkten. Damit verdrängen Overflow-Draw und langsames
Setup nicht länger einen kostenlosen oder klar erreichbaren HQ-/R&D-
Closeout. Eine sichtbare mögliche Remote-Score-Gefahr bleibt ausdrücklich
höher priorisiert; deshalb bleibt D104 als Remote-Antwort-Gegenprobe grün.

### 3. Unnötige Viral-15-Sequenzkosten

Eine Programm-Trash-Subroutine darf nur dann ohne Break passieren, wenn genau
ein installiertes Programm gefährdet ist, dessen strukturierter Hint den
Run-Ende-Selbsttrash belegt, alle verbleibenden ICE bekannt sind und keines
dieser ICE genau diesen Breaker für den Zugriffspfad benötigt. Unbekanntes ICE
und zusätzliche Programme werden konservativ geschützt.

Damit setzt D54 den Run ohne Pump und Break fort. Ein zusätzliches wertvolles
Programm, ein später benötigter Rent-I-Con sowie die echte Fire-Wall-Jack-out-
Situation bleiben geschützt.

## Checkpoint- und Gegenprobenbilanz

- Zehn historische Fixtures wurden strict aus dem Match erfasst.
- Für Decisions ab D43 beginnt der Warmup an der nachgewiesenen lokalen
  Watch-Server-Neustartgrenze; alle Captures haben `warmupDriftCount: 0`.
- Neun historische Zielregressionen waren vor der Umsetzung ausschließlich
  `behavior_regression` und sind danach grün.
- Drei spielnahe Kontrollcheckpoints bleiben grün: D104 Remote-Antwortsuche,
  Match 9FEF D92 Jack-out und Viral-15 mit zusätzlichem wertvollem Programm.
- Enge Unit-Gegenproben sichern echte Search-/Draw-Semantik, einen später
  benötigten selbstzerstörenden Breaker und die konservative Safety-Logik.

## Deckweiter Hint- und Consumer-Audit

Der Audit umfasst alle 20 eindeutigen Karten beziehungsweise 45 Karten des
historischen Runner-Decks; es gab keine Ausschlüsse.

- Ergebnis: `ok`, null blockierende Findings, eine Warnung.
- Search-Tools: keine; damit ist die historische Search-Rolle als Runtime-
  Consumer-Drift bestätigt.
- Primärstrategien: `runner.hq_pressure` 100,
  `runner.interface_closeout` 100 und `runner.run_event_tempo` 100.
- Sekundärstrategien: `runner.rnd_pressure` 98,
  `runner.remote_contest` 88, `runner.survival_defense` 80 und
  `runner.rig_first` 60.
- Restwarnung: `onr_classic_029_ms-todon` mit der bestehenden, nicht
  blockierenden `noisy`-Taxonomieklassifikation.

## Verifikation

- `@netgrid/ai` Typecheck: grün.
- Fokussierter Abschlusslauf: 4 Dateien, 47 Tests, grün.
- AI-Shard 1: 124 Dateien, 793 Tests, grün.
- AI-Shard 2: 124 Dateien, 989 Tests, grün.
- AI-Shard 3: 124 Dateien, 796 Tests, grün.
- Gesamt: 372 Testdateien, 2.578 Tests, grün.
- `check:ai:full`: grün; 618 aktive Karten, 528 Implementierungen,
  391 generierte Derived-Fact-Sätze, 6 Overlays, 137 Fallbacks und null
  Fehler.
- AI-Source-Struktur: 667 Produktionsmodule, null Runtime-Zyklen und null
  erlaubnispflichtige Typzyklen.
- Deck-Hint-Consumer-Audit: grün, null blockierende Findings.
- `git diff --check`: grün.

Die katalogweiten Warnungszähler der Hint-/Derived-Facts-Gates sind der
bekannte nicht blockierende Ausgangsbestand. Diese Remediation verändert
keine Hint-Daten und erzeugt keinen Artefaktdrift.

## Review-Urteil

Die drei freigegebenen Befunde sind reproduzierbar, ursachennah und ohne
Abschwächung der Regel-, LegalAction-, PlayerView- oder Hidden-Info-Grenzen
behoben. Der Branch ist fachlich und technisch zur lokalen Integration nach
`main` freigegeben. Push und Pull Request sind nicht Teil dieses Auftrags.
