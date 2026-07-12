# Match 7BFE/B008: Decision-Checkpoint Final Review

## Ergebnis

Die zuvor dokumentierten neun Verhaltensfehler aus den Matches
`match_7bfe82501d0fdcb8` und `match_b0080115bddbce23` sind auf dem aktuellen
KI-Stand geschlossen. Alle Situationen werden als versionierte
Decision-Checkpoints mit echter Engine-State-Wiederherstellung, produktiven
LegalActions, Runtime-Memory und produktivem Chooser ausgeführt.

Vor der Korrektur waren exakt neun Zielverträge rot und alle sechs
Gegenproben grün. Nach der Korrektur sind alle 15 Prüfungen grün. Die
Erwartungen wurden dabei nicht an die neue Auswahl angepasst.

## Generische Korrekturen

1. Aktive finite Economy gibt akuter, höher bewerteter Board-Triage den
   Vordergrund frei. BBS besitzt weiterhin keine pauschale Nutzungssperre.
2. Same-Turn-Advancement berücksichtigt Operationskosten und den Credit für
   den letzten Basic Advance. Eine Advancement-Burst-Aktion wird abgewertet,
   wenn sie den unmittelbar angekündigten Abschluss unfinanziert zurücklässt.
3. Corp-Discard bewertet strukturierte Voraussetzungen und Enabler: aktuell
   unerfüllbare Tag-/Agendapunkt-Payoffs sinken, sichtbare Tagquellen steigen;
   bei erfüllten Voraussetzungen bleibt der Finisher erhalten.
4. Economic Tag-Punish erhält bei null gegnerischen Credits keinen
   Payoff-Bonus, bei positivem marginalem Creditverlust aber weiterhin schon.
5. Matchpoint und belegter HQ-Druck verhindern Agenda-Suche und gewichten
   bezahlbaren HQ-Schutz vor sachfremden ICE-Installationen.
6. Eingebettete Event-Runs verwenden dieselbe bekannte-ICE-Pfadprüfung wie
   direkte Start-Run-Aktionen.
7. Ein RunnerRunPlan lässt bezahlbare Breaks vor einem mit Malus erkannten
   runbeendenden Continue zu. Das vorhandene Creditsparen bleibt erhalten,
   wenn ein Break den restlichen Pfad trotzdem nicht erreichbar macht.
8. Ein sichtbarer Zwei-Karten-Handpuffer darf einen stärkeren Draw gegen einen
   gemappten Credit-Schritt durchsetzen; mit vier Karten greift die Ausnahme
   nicht.
9. Der Checkpoint-Runner ordnet verdeckt präsentierte Discard-Optionen über
   deren side-sichere Instanz-ID dem eigenen sichtbaren Handmodell zu. Dadurch
   prüft der Vertrag tatsächlich die gewählten Kartendefinitionen.

## Verifikation

```text
Decision-Checkpoints: 2 Dateien, 15/15 Tests grün
Fokussierte Runtime-Regressionen: 7 Dateien, 200/200 Tests grün
Vollständige @netgrid/ai-Suite: 305 Dateien, 2015/2015 Tests grün
@netgrid/ai Typecheck: grün
check:ai: grün, alle Teilchecks ohne Fehler
git diff --check: grün
```

Die Gegenproben bestätigen weiterhin:

- Corporate War beginnt den vollständigen Abschluss mit sechs Credits;
- Closed Accounts bleibt gegen drei sichtbare Runner-Credits wertvoll;
- I Got a Rock bleibt mit zwei Tags und ausreichenden Corp-Agendapunkten;
- runbeendende Subroutinen dürfen ohne bezahlbaren Break auslösen;
- Gypsy bleibt gegen einen offenen R&D-Pfad zulässig;
- ein Vier-Karten-Handpuffer erzwingt keinen Draw.

## Abschlussbewertung

Die neue Testzone schützt nicht nur abstrakte Hilfsfunktionen, sondern die
vollständige Entscheidung an den damaligen Spielzuständen. Ein späterer
Umbau der Plan- oder Scoreebene darf intern anders entscheiden; solange das
Fixture-Schema kompatibel bleibt, muss er dieselben fachlichen Verträge
erfüllen. Bei absichtlicher Schemaänderung ist eine explizite Fixture-Migration
erforderlich, keine automatische Erwartungsaktualisierung.
