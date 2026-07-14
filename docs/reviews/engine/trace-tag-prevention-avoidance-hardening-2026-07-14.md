# Trace-Tag-Prevention und Avoid-Tag-Audit 2026-07-14

Status: abgeschlossen

## Ergebnis

Vermeidbare Tags aus erfolgreichen Traces laufen jetzt im Run- und
Nicht-Run-Pfad über `addRunnerTagsWithPrevention`. Dadurch erzeugt insbesondere
`Fetch 4.0.1` bei einem erfolgreichen 0:0-Trace ein runner-seitiges
`Tag vermeiden`-Choice, bevor der Tag angewendet wird. Der vorhandene
`RunTimelineOverlay` zeigt diese Engine-Choice direkt im Run-Fenster; es wurde
keine UI-eigene Kartenaktion eingeführt.

Auch die direkte gedruckte ICE-Subroutine `give_runner_tag` nutzt nun denselben
Pfad. Öffnet sie ein Choice-Fenster, wird die Subroutine vor der Unterbrechung
als aufgelöst markiert, sodass der Runner sie nach der Entscheidung nicht ein
zweites Mal erhält.

## Trace-Pfade

Folgende vermeidbare Trace-Erfolgstags werden gemeinsam behandelt:

- feste Tagmenge aus `add_tag`;
- Tag plus Counter aus `add_tag_and_counter`;
- Tags aus der erfolgreichen Trace-Marge;
- Resource-Trash plus Tag;
- der zusätzliche Tag aus `Crash Space`-Trace-Auto-Erfolg;
- ICE-Traces während eines Runs und Karten-/Operations-Traces ohne Run.

Nicht-Tag-Anteile kombinierter Trace-Effekte lösen weiterhin genau einmal auf.
Der Trace wird vor dem Tag-Choice abgeschlossen und der aktive Run bleibt am
Encounter fortsetzbar. Pass lässt die noch offenen Tags zu; Vermeidung
verbraucht nur die gewählte Source.

## Mehrere Tags und Quellen

Nach jeder vermiedenen Tag-Einheit werden Restmenge und verfügbare Quellen aus
dem aktuellen State neu berechnet. Entfernte, getappte oder inzwischen nicht
mehr bezahlbare Quellen können dadurch nicht aus einer alten Choice heraus
weiterverwendet werden. Bei zwei Tags können beispielsweise `Fall Guy` und
`Nomad Allies` nacheinander getrasht werden. Ein Pass beendet die
Vermeidungskette und wendet die verbleibende Restmenge an.

## Audit der Avoid-Tag-Karten

Der aktive Registry-Stand enthält genau sieben öffentliche
`tagPreventionSources`:

| Karte                           | Kosten                               | Ergebnis des Audits                                                                                                |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Nasuko Cycle                    | 3 Credits                            | korrekt als `credit` modelliert                                                                                    |
| Fall Guy                        | Source trashen                       | korrekt als `trash_source` modelliert                                                                              |
| Leland, Corporate Bodyguard     | Source trashen                       | korrekt als `trash_source` modelliert                                                                              |
| Nomad Allies                    | Source trashen                       | korrekt als `trash_source` modelliert                                                                              |
| Wilson, Weeflerunner Apprentice | Source trashen                       | korrekt als `trash_source` modelliert                                                                              |
| Expendable Family Member        | 1 Credit und Source trashen          | korrekt als `credit_and_trash_source` modelliert; Hidden-Resource-Reveal und Credit-Revalidation bleiben geschützt |
| Vintage Camaro                  | 1 Credit und nächste Action aufgeben | korrekt als `credit_and_forgo_next_action` modelliert                                                              |

Eine parametrisierte Registry-Regression hält Anzahl, Kosten, Priorität und
öffentliche Source-Sichtbarkeit fest. Verhaltensregressionen decken zusätzlich
Trash-Quellen in einer Mehrtagkette, Expendable Family Member einschließlich
Hidden Info und Vintage Camaros Action-Debt ab.

## Direkte Tag-Zuweisungen

Die Inventur unterscheidet autoritative Auflösung innerhalb des gemeinsamen
Tag-Resolvers von noch umzustellenden kartengetriebenen Einstiegen:

- **In diesem Paket migriert:** Trace-Erfolg im Run, Trace-Erfolg ohne Run,
  Crash-Space-Zusatztag und gedruckte `give_runner_tag`-ICE-Subroutinen.
- **Bereits vorher gemeinsam geroutet:** generische Access-Effekte,
  Operationen, CardImplementation-Resolver für bekannte Tag-Pfade und der
  End-of-turn-Folgetag.
- **Kein Bypass:** die direkten Schreibstellen in `damage-core.ts` sind die
  finale Anwendung eines bereits durchlaufenen Add-Tag-ImminentEvents oder
  der interne One-shot-Avoidance-Pfad.
- **Test-only:** das Damage-Replacement-Harness, das Damage durch Tags ersetzt,
  bleibt ein isolierter Testvertrag.
- **Benötigt eine eigene Continuation-Härtung:** Access-Ambush-Kombinationen,
  generische synchrone `add_tags`-Effektsequenzen, Start-of-turn-Tags,
  Successful-Run-Ersatz-/Aftermath-Tags, Fort-/Breaker-Nebenkosten und weitere
  automatische Lifecycle-/EffectCommand-Pfade. Dort darf ein Choice nicht
  geöffnet werden, während nachfolgende Effekte trotzdem synchron
  weiterlaufen.

Für den letzten Block wurde
`act-2026-07-14-nontrace-tag-prevention-continuations` als eigenes kleines
Folgepaket angelegt. So bleibt die aktuelle Trace-Korrektur geschlossen und
Replay-stabil, ohne asynchrone Fortsetzungen in mehreren unabhängigen
Subsystemen stillschweigend zu vermischen.

## Regressionen

- Echter `Fetch 4.0.1`-Run bei 0 Runner-/0 Korp-Credits mit installiertem
  `Fall Guy`, jeweils mit Vermeiden und Pass, inklusive Run-Fortsetzung,
  Replay und StateHash.
- Gedruckte Nicht-Trace-Tag-Subroutine mit `Fall Guy`, inklusive
  Subroutine-Fortsetzung, Replay und StateHash.
- Zwei Tags mit `Fall Guy` und `Nomad Allies` als sequenzielle Quellen.
- Nicht-Run-Trace und Crash-Space-Zusatztag über denselben Tag-Request.
- Vollständige Registry-Invariante für alle sieben Avoid-Tag-Karten.
- Vintage-Camaro-Kosten aus Credit plus Future-Action-Debt.
- Web-Invariante, dass Engine-`resolve_choice`-Optionen im Run-Fenster als
  Choice-Buttons gerendert werden.

## Leitplanke

Neue vermeidbare Tagquellen dürfen den Runner-State nicht direkt verändern.
Sie müssen einen LegalAction-gebundenen Add-Tag-ImminentEvent-Pfad verwenden.
Wenn der aufrufende Effekt nach dem Tag weitere Schritte besitzt, braucht er
vor der Umstellung einen expliziten suspendierbaren Continuation-Vertrag.
