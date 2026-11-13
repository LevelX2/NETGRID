# Internetzugang über Sites und Supabase

Stand: 2026-11-09
Status: geprüfte Machbarkeitseinordnung; kein Umsetzungs- oder Hostingbeschluss

## Ziel und bestehender Stand

NETGRID soll vergleichbar zum bestehenden Wissensquiz über eine Webadresse
ohne lokale Installation und ohne laufenden Betreiber-PC erreichbar sein
können. Die Benutzererfahrung ist technisch erreichbar. Die vollständige
Übernahme des Wissensquiz-Hostingmodells ist noch nicht nachgewiesen.

NETGRID verwendet einen Next.js-Webclient und einen eigenen Node-Spielserver.
Der Server besitzt den vollständigen Spielzustand, serialisiert Aktionen je
Match und lässt die Rules Engine jede Aktion erneut validieren. HTTP,
WebSocket, Wiederverbindung, KI und Persistenz sind bestehende Serveraufgaben.
Match- und Accountdaten liegen derzeit in SQLite; Teile der Web-API verwenden
ebenfalls lokale Dateien. Der aktuelle Webbuild ist kein statischer Export.

Maßgebliche Quellen:

- [Serverregeln](../../apps/server/AGENTS.md) und
  [Webregeln](../../apps/web/AGENTS.md);
- [Aktionspersistenz](maintenance/action-persistence-contract.md);
- [Accountbetrieb](../runbooks/account-alpha-operations.md), insbesondere
  Same-Site-Cookies und das Profil `private_internet`;
- `apps/server/src/storage-sqlite.ts` (`node:sqlite`, `node:fs`),
  `apps/server/src/http-server.ts`, `apps/web/next.config.ts` und
  `apps/web/app/api/decks/library/route.ts`.

## Plattformgrenzen und Optionen

Sites unterstützt statische Ausgaben oder ein Cloudflare-Worker-ES-Modul mit
Fetch-Handler. Der bestehende Node-Server ist damit kein unmittelbar
deploybares Sites-Artefakt. Auch ein Sites-Webclient benötigt einen passenden
Build und eine Prüfung seiner serverseitigen Routen und Dateizugriffe.
Quelle: Sites-Skill 1.1.4, Abschnitte „Hosting manifest“ und „Capabilities“.

Supabase kann Authentifizierung, Postgres, geschützte Speicherung und
Realtime-Nachrichten bereitstellen. Realtime ersetzt weder die Rules Engine
noch die autoritative Verarbeitung einer Matchaktion. Bei einer entsprechenden
Umsetzung dürfen Clients ausschließlich autorisierte Spielerprojektionen
lesen; vollständige Spielzustände bleiben serverprivat. RLS auf einer
vollständigen Matchzeile allein ersetzt keine seitenspezifische Projektion.

Die gehosteten [Supabase Edge Functions](https://supabase.com/docs/guides/functions/limits)
haben am Prüfdatum 256 MB Speicher und zwei Sekunden CPU-Zeit je Anfrage;
asynchrones Warten zählt nicht als CPU-Zeit. Die Worker-Lebensdauer ist auf
150 Sekunden im Free- und 400 Sekunden in bezahlten Plänen begrenzt.
[WebSockets werden unterstützt](https://supabase.com/docs/guides/functions/websockets),
unterliegen aber ebenfalls den Laufzeitgrenzen. Das ist kein Nachweis, dass
NETGRIDs konkrete Engine-/KI-Pfade diese Budgets überschreiten; dafür fehlen
Cloudmessungen. Es begründet eine erforderliche Machbarkeitsprüfung vor einer
vollständigen Edge-Verlagerung.

Zwei mögliche Zuschnitte:

| Zuschnitt | Einordnung |
| --- | --- |
| Sites für die Oberfläche, Supabase für Identität und ausgewählte Daten, separater Node-Dienst für Engine/KI/Matchaktionen | Empfehlung für die weitere Untersuchung: erhält die bestehende Regelautorität und reduziert die Änderungen am Spielruntime. |
| Ausschließlich Sites und Supabase | Zu prüfen: aktionsweise zustandslose Engine-Ausführung, atomare Speicherung und Matchkonkurrenz, Wiederverbindung, sichere Nachrichtenverteilung und KI innerhalb gemessener Edge-Budgets. |

Supabase ist keine Voraussetzung für einen ersten Internetpiloten. Ein
gehosteter Node-Betrieb mit dauerhaftem SQLite-Datenträger und bestehendem
Accountmodell ist eine zusätzliche Option, falls zunächst der geringste
Umbauaufwand entscheidend ist. Kosten und Betriebsfähigkeit dieser Optionen
sind noch nicht verglichen.

## Vor einer Umsetzung zu entscheiden und nachzuweisen

- Zielgruppe: zunächst eingeladene Spieler oder offene Registrierung. Das
  bestehende `private_internet`-Profil erlaubt keine Selbstregistrierung.
- Eine führende Kontoautorität wählen. Supabase Auth wäre eine bewusste
  Änderung des Accountvertrags; bestehende Cookies dürfen nicht ungeprüft
  zwischen einer Sites-Domain und einer anderen Backend-Domain verteilt werden.
- Einen echten Ablauf nachweisen: Anmeldung, Matchstart, menschliche Aktion,
  KI-Antwort, Neuladen und Wiederverbindung, Persistenz und Replay/StateHash.
  CPU, RAM und Antwortzeiten der repräsentativen KI-Pfade messen.
- Matchzustand und Historie atomar versionieren; konkurrierende Aktionen und
  Idempotenz über alle Serverinstanzen sichern. Prozesslokale Locks allein
  reichen bei mehreren Instanzen nicht aus.
- Maintenance und privilegierte KI-Diagnose vom Spielerzugang trennen;
  private Kartenbilder nicht mit dem öffentlichen Build veröffentlichen.
  Für zusätzliche Bildverteilung gilt weiterhin das bestehende Asset-Gate.

Diese Einordnung erteilt keine Freigabe für neue Cloudressourcen,
Veröffentlichung, geänderte Zugriffsrechte oder eine Account-/Storage-Umstellung.
