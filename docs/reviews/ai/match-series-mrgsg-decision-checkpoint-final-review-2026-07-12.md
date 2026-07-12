# Matchserie MRGSG: Decision-Checkpoint Final Review

## Ergebnis

Die vorletzte abgeschlossene Side-Swap-Serie `match-mrgsg0px-vvhjh5` wurde
gegen den aktuellen Produktions-Chooser geprüft. Die früher freigegebenen
Fehler bei Score-Konversion, Broker, Draw-Tax, Rush Hour und Handpuffer sind
unter den damaligen Zuständen bereits korrigiert. Genau ein zusätzlicher
Fehler blieb spielgleich reproduzierbar und ist nun geschlossen.

## Analysierte Spiele

- `match_a199d04c94d5a906`: menschlicher Runner gegen Hard-Corp-KI;
- `match_3bb2232dccc0a1da`: menschliche Corp gegen Hard-Runner-KI;
- Datenquelle: lokale SQLite ausschließlich read-only;
- Auditbasis: Snapshots, side-sicherer Event-Prefix, AI-Traces, aktuelles
  Deckstrategieprofil und wiederherstellbarer Runtime-Speicher.

## Roter Vertrag und Korrektur

`CP-MRGSG-01` rekonstruiert Runner-Decision 32 / StateVersion 67. Der Runner
hat 3 Credits und passende Breaker. R&D ist durch zwei bekannte ICE geschützt
und verbraucht beim Durchbruch alle Credits; Archives ist offen und enthält
zwei unbekannte Ablagen. Trotzdem erzwang
`runner.opportunistic_central_run:rd` den mit 453 bewerteten R&D-Run gegen den
mit 1.359 bewerteten Archives-Run.

Vor dem Fix war exakt dieser Zieltest `behavior_regression`; die Gegenprobe
mit leerem Archives, offenem R&D und ausreichenden Credits war grün. Die
Erwartungen und das Fixture wurden nach dem Fix nicht verändert.

Die Plan-Auswahl besitzt jetzt eine enge Zielkorrektur. Ein opportunistischer
Zentralplan darf einem anderen Zentral-Run nur dann weichen, wenn:

- beide Aktionen echte Runs auf verschiedene Server sind;
- der geplante Run einen negativen sichtbaren ICE-Pfadkostenbeitrag besitzt;
- der alternative Run den normalen Plan-Override-Abstand von 600 Punkten
  überschreitet;
- kein sichtbarer Sofortpayoff und keine frische R&D-Evidence das Planziel
  rechtfertigen.

Der TacticalPlan bleibt damit Autorität für sinnvolle Langfrist- und
Iterationsziele. Er verliert lediglich das Recht, einen nach aktueller
Boardbewertung deutlich schlechteren, vollständig besteuerten Zentralpfad
ohne konkreten Payoff zu erzwingen. Debug-Evidence nennt diesen Fall
`inferior_run_target_mapping_yield`.

## Bewusst nicht korrigierte Situationen

- Die Corporate-War-Installationen bei Decisions 88 und 93 führen aktuell
  aus den exakten Zuständen vollständig über `Systematic Layoffs`, Choice,
  Advance und Score. Ein Einzelaktionsverbot wäre eine neue Regression.
- Die kostenlose, verdeckte HQ-Mole-Installation bei Decision 27 mit einem
  verbleibenden Klick ist eine vertretbare Setup-Entscheidung, kein harter
  Fehlervertrag.
- Frühere BBS-, Broker-, Draw-Tax-, Rush-Hour- und Handpuffer-Auffälligkeiten
  wählen auf aktuellem Code bereits die korrigierten Aktionen und benötigen
  keinen weiteren Fix.

## Sicherheits- und Architekturreview

- LegalActions bleiben die einzige Aktionsbasis.
- PlayerView und LegalActions werden aus dem gespeicherten GameState durch die
  Engine neu erzeugt.
- Das Fixture enthält nur Events bis zur Ziel-StateVersion und nutzt keine
  spätere Kartenreihenfolge oder gegnerische Hidden-Zone.
- Die Änderung betrifft weder Engine-Regeln noch PlayerView, Replay oder
  StateHash.
- Es gibt keine Kartenname-Sonderlogik und keine globale Abwertung von R&D.

## Verifikation

```text
Roter Vorher-Lauf: 1 Zieltest rot, 1 Gegenprobe grün
Nachher-Checkpoint: 2/2 grün
Fokussierte angrenzende Gruppe: 7 Dateien, 87/87 Tests grün
Vollständige @netgrid/ai-Suite: 307 Dateien, 2022/2022 Tests grün
@netgrid/ai Typecheck: grün
check:ai: alle Teilgates OK, 0 Fehler; bestehende Warnungen unverändert
Deck-Doctrine-Strategiegate: grün
Prettier und git diff --check: grün
```

## Abschluss

Der Arbeitsbranch `codex/ai-series-mrgsg-checkpoints` wurde lokal nach `main`
integriert. Der Worktree wurde danach verifiziert entfernt und der gemergte
Branch gelöscht. Es erfolgte kein Push und kein Pull Request.
