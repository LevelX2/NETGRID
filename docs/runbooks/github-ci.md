# GitHub-Prüfläufe eingrenzen

Für einen fehlgeschlagenen Lauf zuerst Commit, Job und erste konkrete
Fehlermeldung feststellen. Der CI-Job `Test suite` aggregiert die beiden
Pakettestgruppen; sein roter Status ist keine zusätzliche Fehlerursache.

## Browser-Testaufbau

`corepack pnpm e2e` startet über `scripts/run-e2e.mjs` eigene Server- und
Webprozesse auf freien Ports. Der Webprozess erhält die gewählte Serveradresse
über `NETGRID_SERVER_BASE_URL`. Das Root-Layout projiziert diese Adresse in
`data-netgrid-server-origin`; die Browserclients lesen sie dort bei Verwendung.
`NEXT_PUBLIC_NETGRID_SERVER_URL` ist kein Eingang dieses Laufzeitvertrags.

Fehlende Deckoptionen und ein fehlendes Accountformular können dieselbe
Ursache haben: Der Browser erreicht den Testserver nicht. In diesem Fall die
projizierte Adresse gegen den tatsächlich gestarteten Serverport prüfen,
bevor Wartezeiten oder UI-Selektoren geändert werden.

## Paketweise Tests

`pnpm --filter` startet Tests aus dem jeweiligen Paketverzeichnis.
Pfadtests müssen ihre erwartete Projektwurzel unabhängig vom aktuellen
Arbeitsverzeichnis bestimmen, beispielsweise relativ zur Testdatei.

Gezielte Prüfungen für Pfadauflösung und KI-Modulgrenze:

```sh
corepack pnpm --filter @netgrid/server exec vitest run src/runtime-paths.test.ts --maxWorkers=1
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts src/access/runner-access-trash-impact.test.ts --maxWorkers=1 --testTimeout=30000
```

Eine erfolgreiche Teilprüfung belegt ausschließlich ihren Umfang. Andere
Verhaltens- oder Simulationsfehler bleiben bis zu ihrer eigenen fachlichen
Prüfung offen; Testerwartungen und Zeitlimits werden nicht allein für einen
grünen Gesamtstatus geändert.

## Vollständige KI-Spiele und lokale Zeitbudgets

Der Corporate-Downsizing-Test mit Seed `ai-behavior-baseline-v1-03`
simuliert bis zu 500 Aktionen und prüft anschließend das Replay. Der
untersuchte Lauf endete nach 462 Aktionen regulär mit einem Corp-Sieg;
Fehlerlisten und Replay waren sauber. Seine gemessenen 41–45 Sekunden
überschritten das bisherige lokale Limit von 30 Sekunden. Dieser einzelne
Integrationstest erhält deshalb 120 Sekunden Spielraum für CI-Last.
Aktionslimit, terminales Ergebnis, Plan-first-Score und fehlerfreies Replay
bleiben Prüfbedingungen; das globale Testlimit bleibt unverändert.

Beim Checkpoint `cp-5285-140-harmful-non-etr-break` reicht die Vorhersage
allein nicht als Nachweis: Der Regressionstest führt den Run bis zum Zugriff
aus. Er prüft zehn tatsächlich bezahlte Credits einschließlich zweckgebundener
Pools, 14 verbleibende freie Credits, die unveränderte Hand und die Bindung
der freiwilligen Aktionen an Run-Owner, Step und aktuelle Route.
