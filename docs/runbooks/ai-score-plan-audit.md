# Corp-Scorepläne vollständig auditieren

Dieses Runbook ergänzt den [Evidence-Registry-Prozess](ai-selfplay-evidence-registry.md)
für gezielte Audits vorhandener Spiele. Es ändert keine KI-Bewertung und
ersetzt keine Engine- oder Owner-Verträge.

## Einheiten und vollständige Abdeckung

- Agenda-Karteninstanz, Agenda-/Server-Planinstanz und tatsächlich installierten
  Scoreversuch getrennt zählen. Alternative Serverrouten derselben Agenda sind
  keine unabhängigen Scoringchancen.
- Jede Corp-Entscheidung genau einmal im Entscheidungsledger erfassen. Darunter
  alle `corp.score_agenda`-Instanzen aus dem historischen Portfolio aufnehmen,
  auch verworfene oder später inaktive Instanzen.
- Erste Handbeobachtung, Mulligan-Rückgabe, erneuten Draw, erste Planaufnahme,
  gewählte Unterstützung, Installation, Advances und Score/Steal getrennt
  ausweisen. Wartezeit beginnt nicht während einer zurückgegebenen Mulligan-Hand.
- Nicht gewählte Routen erhalten ein eigenes Urteil. Das Ergebnis der Agenda
  darf ihnen nicht als tatsächlich ausgeführter Score oder Steal zugerechnet werden.

## Quellen und Zustandsbezug

Die vollständigen Plansignale aus dem historischen Runtime-Checkpoint über die
read-only Maintenance Analysis API mit dem Entscheidungsportfolio verbinden.
`rootPlanInstanceId`, Executor, tatsächliche Aktion, Ressourcen und legale
Agenda-Angebote gemeinsam prüfen. Bei fehlenden Signalen den Audit sichtbar als
unvollständig kennzeichnen.

Alte Quotes untätiger Instanzen sind gespeichertes Gedächtnis. Ihre Version
gegen den betrachteten Zustand prüfen, bevor sie als aktuelle Sicherheits- oder
Finanzierungsaussage verwendet werden. Ein projizierter verbleibender Advancebedarf
nach dem nächsten Schritt ist vom Score-Reservebetrag der Schutzquote zu trennen.
Ein im eigenen Zug abschließbarer Score benötigt nicht zwingend eine Schutzquote.

Falls Rohdaten bereits bereinigt wurden, denselben Seed auf dem historischen
Verhaltensstand isoliert wiederherstellen. Aktions-/Planledger, Ressourcen,
vorhandene Checkpoint-Hashes und den Endzustand abgleichen. Eine Normalisierung
der Match-ID ausdrücklich dokumentieren. Wiederherstellungen und Fix-Replays
zählen nicht als neue unabhängige Spiele.

## Bewertung eines Plans

1. Scorezeit und verbleibende Runnerfenster bis zum Abschluss bestimmen.
2. Advance-, Install- und Rezfinanzierung gemeinsam prüfen; bereits gerezzte
   ICE und tatsächliche Engine-Kostenreduktionen berücksichtigen.
3. Runner-Guthaben, sichtbares Rig, vorbereitende Kreditklicks und öffentlich
   nutzbare Ressourcen einbeziehen. Unbekannte Handkarten nicht als Wissen der
   Corp behandeln. Modellierte Zugänglichkeit ist keine empirische Gewinnquote.
4. Bei einem belegten Remote die legale Asset-Ersetzung mit Verlust von
   Einkommen, Rabatten und Effekten bewerten. Ein belegter Root schließt eine
   Agenda-Installation nicht grundsätzlich aus.
5. Delegierte Economy-/Defense-Aktionen dem tatsächlichen Parent zuordnen.
   Gemeinsam verfügbare Credits beim Parentwechsel nicht mehrfach als Aufwand
   zählen. Abgebrochene Routen ohne eigene Ausgabe sind keine versenkten Kosten.
6. Verdrängte Advances als vollständige Konversionslinie prüfen. Zwei getrennte
   Unterbrechungen können gemeinsam einen ganzen Scorezug kosten, obwohl jede
   isolierte Gegenprobe keinen früheren Score zeigt.
7. Bei Hand-/Deckoutdruck Steal-Punkte, Matchpoint, zusätzlichen Advancebedarf
   und tatsächlich verbleibende Uhr gemeinsam bewerten. Eine zugelassene
   Notinstallation ist keine Behauptung sicheren Schutzes.

## Aktuelle Referenzevidenz und Grenzen

Der Registry-Bericht `score-plan-audit-426-429` und dessen Kurzfassung
`score-plan-audit-426-429-kurz` decken 63 ursprüngliche Serverrouten für
22 Agenda-Karten ab; der korrigierte Verlauf von 427 hat einen separaten Nenner.
Die lokale [vollständige Auswertung](../../data/local/deep-remote-20260912/score-plan-audit-426-429.html)
enthält die Einzelurteile und Ledger.

- **426, D138/D153:** Kombinierte Advances statt Asset-/Upgrade-Installation
  erlauben Superior Net Barriers T23 statt T25. Die Gegenlinie berücksichtigt
  den notwendigen Discard und opfert die Braindance.
- **427, Fix-Verlauf D413/D423:** Kombinierte Advances statt Schutzsuch-Draw
  und HQ-Upgrade erlauben Corporate Coup T57 vor dem tatsächlichen Steal T58.
- **428, D438:** Coup statt zweiter Tycho plus dieselbe vollständige
  Runner-Antwort ergibt sechs statt acht Runnerpunkte; kein unmittelbares Spielende.
- **429, D171:** Wall of Static an R1 kostet nach Masons-Reduktion einen
  Rezcredit und erhöht den Runnerpreis um zehn Credits. Der Runner kann
  trotzdem 22 von 27 Credits bezahlen und stehlen.

Diese ausgeführten Zweige belegen lokale Zeit-, Punkte- oder Kosteneffekte.
Sie beweisen weder einen universell dominierenden Gesamtplan noch einen anderen
Gesamtsieger. SP-040 und SP-052 bleiben ohne weiteren generischen Ursachenbeweis
Verdachtsfälle; der bereits verifizierte Runner-Fix SP-346 ist davon getrennt.

## Gepaarter Fortsetzungsvergleich

Paarung 431 vergleicht den eingefrorenen Ausgangsstand `96e4c20a0` mit
`0b468d1b1`: vier bekannte und zwölf vorab ausgeloste neue Seeds, jeweils
Vorher/Nachher mit identischem Runner. Der
[Kurzbericht](../../data/local/score-continuity-ab-20260912/score-continuity-431-kurz.html)
und der [vollständige Planledger](../../data/local/score-continuity-ab-20260912/score-continuity-431.html)
enthalten 400 Planinstanzen und 15.138 Plansignale über 32 Ausführungen.

- SP-356 behebt die vorzeitige Übergabe unvollständig projizierter
  Install-/Advance-Meilensteine. Die neue Projektionsgrenze revalidiert den
  Folgezustand; sie ist kein allgemeiner Vorrang für Advancen und noch keine
  vollständige mehrzügige Wertberechnung.
- Die zwölf neuen Seedpaare liefern 49 → 57 Corp-Punkte und unverändert
  fünf Siege. Alle 16 Seedpaare liefern 73 → 75 Punkte, 22 → 24 Scores und
  unverändert sieben Siege. Der positive neue Effekt hängt stark an einem
  Seed mit geänderter Vorbereitung; eine höhere Gewinnquote ist nicht belegt.
- 426 scoret Superior T23 statt T25. Die vollständige KI-Gegenprobe ab dem
  ursprünglichen 427/D412 scoret Coup T57. Das gesamte 427-Replay zweigt
  dagegen bereits D377 ab und verschlechtert sich von 8:5 auf 0:8.
- Bei `new_remote` den tatsächlichen Installationsowner und die physische
  Remote aus dem Ereignis verbinden. Sonst fehlen neu angelegte Scoreversuche
  in der Statistik. Offene Agenden bei Spielende bleiben zensierte Versuche.
- Öffentlich nutzbare Kreditbanken und sichtbare Advances beeinflussen die
  Runner-Antwort. Ein begrenztes Modell aus Guthaben und Basiskreditklicks ist
  keine Garantie gegen einen finanzierten Zugriff im nächsten Runnerzug.

Mehr Scores, kürzere Einzelfenster und mehr Siege bleiben getrennte Kennzahlen.
Ein vermiedener Draw oder eine verschobene Installation ist erst dann ein
Tempoerfolg, wenn sich der vollständige Abschlusszeitpunkt tatsächlich verbessert.

Abschluss: kompakte Einzelurteile und Probe-Grenzen in die bestehende Registry
zurückführen, Bericht samt exaktem Inhalt und Status sichern, Round-trip prüfen
und Backup erzeugen. Erst danach eigene Runtime-Daten bereinigen. Keine rohen
PlayerViews oder vollständigen versteckten Hände in die kompakte Registry kopieren.
