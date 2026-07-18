# Engine Source Structure Guard

Status: current

## Zweck

`corepack pnpm check:engine-source-structure` schützt die Schichtgrenzen und
Kompositionsstruktur der Rules Engine gegen erneutes unkontrolliertes Wachstum.
Der Guard analysiert ausschließlich produktive TypeScript-Dateien unter
`packages/engine/src` und verwendet dafür den TypeScript-Parser statt
Textheuristiken.

## Geprüfte Verträge

- Relative Imports dürfen nur die zwei im Schuldenledger benannten Altzyklen
  bilden. Neue Zyklen und veraltete Ledger-Einträge sind Fehler.
- Die fünf Runtime-Delegate-Dateien dürfen aktuell zusammen exakt 186
  untypisierte
  Delegate-Signaturen besitzen. Jede Veränderung verlangt eine bewusste
  Reduktion des Ledgers; eine Erhöhung ist kein zulässiger neuer Ausgangswert.
- Die deklarativen Runtime-Portmodule dürfen kein `any`, keine ausführbaren
  Statements und jeweils höchstens 260 Zeilen enthalten.
- Import-Fan-out über 100 interne Module ist ausschließlich für die explizit
  aufgeführten Runtime-Kompositionsdateien zulässig und muss dort exakt dem
  Ledger entsprechen.
- Ability Engine und CardImplementations dürfen keine neuen Rückwärtsimporte in
  die Game-Ausführung erhalten. Die drei vorhandenen Ability-Engine-Kanten sind
  als zu entfernende Altlasten benannt.
- Nur `game/engine-runtime.ts` darf die private Runtime-Kompositionsschicht von
  außen importieren.

## Schuldenabbau

Die Ledger sind keine dauerhaften Ausnahmen. E03 bis E08 reduzieren sie mit
jedem migrierten Vertrags- und Runtime-Cluster. E05 senkte den Ausgangswert von
430 auf 363, E06 auf 186. Sobald eine Altlast entfällt, muss ihr Eintrag im
selben Paket entfernt oder abgesenkt werden. Nach E08 sind Delegate- und
Zyklusledger leer; Import-Fan-out über 100 ist dann unzulässig.

Der Selftest `corepack pnpm check:engine-source-structure:selftest` erzeugt
isolierte Gegenbeispiele für unsichere Delegate-Signaturen, Zyklen, Fan-out und
verbotene Schichtkanten. Er beweist damit, dass jede Fehlerklasse tatsächlich
vom Guard erkannt wird.
