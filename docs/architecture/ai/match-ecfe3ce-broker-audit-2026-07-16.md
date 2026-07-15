# Broker-Audit zu Match `match_ecfe3ce373a56823`

## Ergebnis vorweg

Der Nutzerverdacht ist teilweise bestätigt:

- Zusätzliche verbleibende Aktionen erlauben **nicht**, denselben Broker im
  selben Zug erneut zu benutzen. Beide Broker-Fähigkeiten teilen laut Karte
  und Engine den Scope `once_per_turn_per_source`; Laden und Entladen sperren
  sich auf derselben installierten Kopie gegenseitig.
- Die KI hat Broker nicht generell zu früh entladen. Drei frühe Auszahlungen
  mit nur drei gespeicherten Credits waren echte Liquiditäts- oder
  Score-Notfälle. Eine weitere frühe Auszahlung an D56 beruhte dagegen sehr
  wahrscheinlich auf der im selben Match bestätigten falschen Run-Pfadquote.
- Es gibt einen echten ausgelassenen Ladezug an D156: Die KI nahm mit dem
  letzten Klick einen Basis-Credit, obwohl das Laden des bereits installierten
  Brokers den höheren Gesamtwert erzeugt hätte.
- Es gibt einen systematischen Mehr-Broker-Fehler: Der erste Ladevorgang einer
  leeren Kopie erhält derzeit `2050` Priorität, das Weiterladen einer bereits
  aufgebauten Kopie nur `720`. Deshalb installiert die KI an D179 eine zweite
  Kopie zu früh und bevorzugt an D180 und D191 den schlechter amortisierten
  neuen Speicherzyklus.

Die Engine-Regel ist korrekt umgesetzt. Die Fehler liegen in Bewertung,
Planabbildung und Mehr-Kopien-Arbitration der KI.

## Regel- und Wirtschaftsbasis

Broker kostet drei Credits zur Installation. Ein Ladevorgang kostet eine
Aktion und legt drei Credits aus der Bank auf genau diese Kopie. Das Entladen
kostet eine weitere Aktion und nimmt alle gespeicherten Credits. Pro Zug darf
jede installierte Kopie nur für **eine** ihrer beiden Fähigkeiten benutzt
werden.

Ohne Installationskosten ergibt sich bei `n` Ladevorgängen und einem Cashout:

| Ladungen vor Cashout | Credits | Aktionen | Credits je Aktion |
| ---: | ---: | ---: | ---: |
| 1 | 3 | 2 | 1,50 |
| 2 | 6 | 3 | 2,00 |
| 3 | 9 | 4 | 2,25 |
| 4 | 12 | 5 | 2,40 |

Für eine neue Kopie einschließlich Installation ist der Nettoertrag
`(3n - 3) / (n + 2)`:

| Ladungen vor Cashout | Netto-Credits | Aktionen inkl. Installation | Netto-Credits je Aktion |
| ---: | ---: | ---: | ---: |
| 1 | 0 | 3 | 0,00 |
| 2 | 3 | 4 | 0,75 |
| 3 | 6 | 5 | 1,20 |
| 4 | 9 | 6 | 1,50 |

Damit ist frühes Entladen in einer Notsituation richtig, aber normalerweise
teuer. Eine zweite Kopie ist besonders rechtfertigungsbedürftig, solange eine
erste Kopie noch sinnvoll weitergeladen werden kann.

## Vollständige Zugfolge

Der Audit deckt alle 208 KI-Entscheidungen und alle legalen Broker-Fenster des
Matches ab. `B1` und `B2` bezeichnen die beiden installierten Kopien.

| Entscheidung | Zug | Zustand vor Entscheidung | Gewählte Aktion | Bewertung |
| --- | ---: | --- | --- | --- |
| D36 / SV70 | 12 | 6 Credits, 4 Aktionen | B1 installieren | Plausibel. Die Installation war Rohwert-Sieger und ließ den direkten ersten Ladevorgang zu. |
| D37 | 12 | B1=0 | B1 auf 3 laden | Richtig. Danach ist B1 für diesen Zug regelbedingt gesperrt; die übrigen Aktionen sind keine ausgelassenen Wiederholungen. |
| D41 | 14 | 0 Credits, B1=3 | B1 auszahlen | Notfall-Cashout. Bei null Liquidität vertretbar. |
| D52 | 16 | B1=0 | B1 auf 3 laden | Plausibler Neuaufbau nach einem gescheiterten Remote-Run. |
| D56 | 18 | 5 Credits, B1=3 | B1 auszahlen | Verdächtig früh. Begründung `concrete_funding_need`; dieser Bedarf hängt an der später bestätigten falschen Run-Pfadquote. Zuerst F1 beheben und danach neu messen. |
| D70 | 20 | 0 Credits, letzter Klick, B1=0 | B1 auf 3 laden | Vertretbare Zukunftsinvestition statt eines einzelnen Basis-Credits. |
| D72 | 22 | 0 Credits, B1=3 | B1 auszahlen | Richtig. Der Cashout ermöglicht das folgende Score-Fenster D75 samt erfolgreichem Steal. |
| D90 | 24 | 0 Credits, B1=0 | B1 auf 3 laden | Plausibler Neuaufbau; die restlichen Aktionen dienen Draw und Liquidität. |
| D95 | 26 | 2 Credits, B1=3 | B1 auszahlen | Richtig. Akute Liquidität vor dem Score-Threat-Run D98. |
| D102 | 28 | 7 Credits, B1=0 | B1 auf 3 laden | Gute Langfristinvestition. |
| D108 | 30 | 6 Credits, 3 Aktionen, B1=3 | B1 auf 6 laden | Richtig: Reiferen Speicher weiter aufbauen. |
| D112 | 32 | 6 Credits, 4 Aktionen, B1=6 | B1 auf 9 laden | Richtig: bessere Amortisation. |
| D133 | 34 | 1 Credit, B1=9 | B1 auszahlen | Als Finanzierung vertretbar. Der anschließend finanzierte Run-Event war wegen F2 illegal angeboten; die Auszahlung selbst ist aber kein pauschaler Drei-Credit-Frühcashout. |
| D155 | 36 | B1=0, vorletzter Klick | Basis-Credit statt B1 laden | Broker hatte Score 2502, Basis-Credit 2619. Kurzfristige Liquidität kann den vorletzten Klick noch erklären. |
| D156 | 36 | B1=0, letzter Klick | Basis-Credit statt B1 laden | **Bestätigter Fehler.** Laden hätte zwei liquide plus drei gespeicherte Credits hinterlassen; Basis-Credit nur drei liquide. Der absolute Plan hält Broker fälschlich auf `hold`. |
| D161 | 38 | 5 Credits, 2 Aktionen, B1=0 | B1 auf 3 laden | Die KI findet den Aufbau zwei Züge später, was D156 aber nicht entlastet. |
| D164 | 40 | 9 Credits, B1=3 | B1 auf 6 laden | Richtig. |
| D169 | 42 | 8 Credits, B1=6 | B1 auf 9 laden | Richtig. |
| D179 | 44 | 10 Credits, 3 Aktionen, B1=9 | B2 installieren | **Verdächtig und strukturell schlecht bewertet.** Zwei Aktionen und drei liquide Credits werden benötigt, um B2 überhaupt auf 3 zu bringen, obwohl B1 bereits reif ist. |
| D180 | 44 | B1=9, B2=0 | B2 auf 3 laden | **Falsche Mehr-Kopien-Priorität.** Die leere Kopie erhält 3462, B1 weiterladen nur 2132. |
| D181 | 44 | B1=9, B2=3 | B1 auf 12 laden | Für sich richtig; nach der unnötig frühen B2-Investition endet der Zug mit B1=12 und B2=3. |
| D183 | 46 | 7 Credits, B1=12, B2=3 | B2 auf 6 laden | Knapp vor Cashout B1 gewählt; langfristig plausibel. |
| D184 | 46 | 7 Credits, B1=12, B2=6 | B1 auszahlen | Kein Notfall, aber praktisch sinnvoll: finanziert R&D Interface und Worm, die im finalen R&D-Run genutzt werden. Die Trace-Begründung `bank_threshold` ist unspezifischer als der reale Nutzen. |
| D191 | 48 | 11 Credits, B1=0, B2=6 | B1 auf 3 laden | **Falsche Mehr-Kopien-Priorität.** B1-Neustart erhält 2562, B2 auf 9 nur 1232. Für die spätere Auszahlung wäre B2 weiterladen klar besser amortisiert. Der anschließende Bonus-Run D192 ist zusätzlich durch F2 kontaminiert. |

## Warum die KI so entscheidet

Der produktive Consumer in
`packages/ai/src/runtime/runner-bank-investment-context.ts` arbeitet mit
festen Zielwerten: erster Aufbau 3, dringender Cashout 6, normaler
Wert-Cashout 12. Diese Grundidee ist brauchbar. Drei Details verzerren sie:

1. `firstLoad ? 2050 : 720` belohnt den Start eines leeren Speichers fast
   dreimal so stark wie das Weiterladen eines bestehenden Speichers. Das ist
   wirtschaftlich genau verkehrt, sobald mehrere Broker sichtbar sind.
2. Die Installationsprojektion prüft nur, ob Installation und anschließendes
   Laden grundsätzlich bezahlbar sind. Sie berücksichtigt weder eine bereits
   installierte Kopie noch Installationskosten, Cashout-Aktion und benötigte
   zukünftige Ladungen der neuen Kopie.
3. `concreteFundingNeed` und die absolute Planabbildung können einen
   Basis-Credit vorziehen, obwohl der letzte Klick als Broker-Ladung den
   größeren Gesamtwert erzeugt. D156 ist der konkrete Beleg.

Die Plan-Hilfsfunktionen betrachten bei mehreren Banken überwiegend die
größte einzelne Bank statt eine gezielte Per-Source-Fortsetzung. Das verstärkt
die fehlende Kopien-Arbitration.

## Konkrete Folgeempfehlung

Ein Broker-Fix sollte nicht pauschal „immer später auszahlen“ lauten. Er sollte
drei mechanische Verträge ergänzen:

- **Fortsetzung vor Neustart:** Bei gleichem Notfallstatus eine bereits
  geladene Kopie weiterladen, bevor eine leere Kopie ihren First-Load-Bonus
  erhält.
- **Installations-Amortisation:** Eine weitere Broker-Kopie nur installieren,
  wenn der aktuelle Zug den ersten Load erlaubt und der geplante Horizont die
  zusätzlichen Installations- und Cashout-Aktionen rechtfertigt; vorhandene
  ausbaufähige Kopien wirken als deutlicher Malus.
- **Letzter-Klick-Gesamtwert:** Ohne akuten Liquiditätsbedarf den letzten
  Basis-Credit gegen `liquide Credits + gespeicherte Credits` vergleichen und
  den höherwertigen Broker-Aufbau nicht durch eine absolute
  `concreteFundingNeed`-Abbildung blockieren.

Cashouts bei 3 oder 6 bleiben erlaubt, wenn ein unmittelbar legaler wichtiger
Run, eine konkrete Installation, ein Score-Fenster oder echte Null-Liquidität
belegt ist. D56 muss nach Reparatur der falschen Pfadquote neu bewertet werden;
erst dann ist er ein eigenständiger Cashout-Policy-Befund.

