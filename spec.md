# Capability Map Renderer – Spezifikation

Status: MVP-Spezifikation v0.3
Stand: 16. Juli 2026
Ziel: Umsetzungsreife Spezifikation für ein erstes MVP

## 1. Produktvision

Das Tool visualisiert hierarchische Capability Maps auf Basis einer strukturierten YAML-Definition. Anwenderinnen und Anwender bearbeiten das YAML direkt in einer statisch deploybaren Webanwendung und sehen eine validierte Live-Vorschau. Die Visualisierung nutzt den verfügbaren Raum dynamisch, unterstützt beliebig verschachtelte Capabilities und erlaubt es, Inhalte zu suchen, zu filtern, ein- und auszuklappen sowie Teilbäume zu fokussieren.

Das Rendering ist deterministisch: Reihenfolge, Hierarchie, Ausrichtung und relative Größen werden ausschließlich aus dem YAML abgeleitet. Die Visualisierung selbst dient im MVP nicht als grafischer Struktureditor.

## 2. Ziele des MVP

Das MVP muss:

1. YAML in einem integrierten Editor bearbeiten und mit kurzer Verzögerung validieren können.
2. die zuletzt gültige Eingabe unmittelbar als verschachtelte Capability Map darstellen.
3. beliebig tiefe, rekursive Capability-Strukturen im Datenmodell unterstützen.
4. ein gemischtes, rekursives Layout aus horizontal gestapelten Elementen und vertikalen Säulen unterstützen.
5. Capabilities ein- und ausklappen, suchen, anhand von Metadaten filtern und als Teilbaum fokussieren können.
6. Details der ausgewählten Capability in einem separaten Panel darstellen.
7. Darstellungswerte vererben und fehlende Werte sinnvoll vorbelegen.
8. den aktuellen YAML-Inhalt lokal im Browser speichern und wiederherstellen.
9. als statische Webanwendung ohne Backend betrieben werden können.
10. eine getrennte Rendering-Schicht besitzen, die später als wiederverwendbare TypeScript-Bibliothek extrahiert oder veröffentlicht werden kann.
11. TypeScript, Linting, automatisierte Tests und Hot Reloading unterstützen.
12. Top-Level-Capabilities optional in rein visuellen, einklappbaren Gruppen strukturieren können.

## 3. Nicht-Ziele des MVP

Nicht Bestandteil des MVP sind:

- Laden per Datei, Build-Konfiguration oder URL;
- Export nach SVG, PNG oder PowerPoint;
- Benutzerkonten, Backend, Cloud-Speicherung oder Zusammenarbeit in Echtzeit;
- grafische Bearbeitung per Drag-and-drop oder Größenänderung in der Map;
- verbindliche Unterstützung von Smartphones;
- ein formales WCAG-Konformitätsziel;
- eine zweite Oberflächensprache;
- garantierte Performance für mehr als 100 Capabilities oder besonders tiefe Strukturen;
- frei referenzierbare Bilder, HTML-Inhalte, Skripte oder externe Icon-URLs.

## 4. Zielgruppen und Nutzungsszenario

Primäre Zielgruppe sind Enterprise- und Business-Architektinnen und -Architekten sowie Personen aus Organisations- und Produktentwicklung in privatwirtschaftlichen Unternehmen.

Primärer Ablauf:

1. Die Anwendung öffnet sich mit dem lokal gespeicherten YAML oder, falls keines vorhanden ist, mit einem kommentierten Beispiel.
2. Die Person ändert das YAML im Editor.
3. Nach einer kurzen Eingabepause wird das Dokument syntaktisch, strukturell und semantisch validiert.
4. Bei gültiger Eingabe aktualisiert sich die Map.
5. Bei ungültiger Eingabe bleiben die letzte gültige Map und ihr Interaktionszustand erhalten; die Vorschau wird als nicht aktuell gekennzeichnet.
6. Die Person sucht, filtert, klappt Capabilities ein oder aus, fokussiert einen Teilbaum und betrachtet Details.

## 5. Bedienoberfläche

### 5.1 Desktop

Die Standardansicht besteht aus:

- einer Kopfzeile mit Suche, Filter, Ansichtssteuerung, Zurücksetzen und Status;
- einem links angeordneten, in der Breite veränderbaren YAML-Editor;
- einer zentralen Map-Fläche;
- einem bei Auswahl eingeblendeten Detailpanel rechts neben der Map.

Das Detailpanel darf die Map-Fläche verkleinern, muss aber schließbar sein. Die Map passt ihren Viewport nach relevanten Layoutänderungen kontrolliert an; reine Detailauswahl darf Zoom und Position nicht verändern.

### 5.2 Tablet

Ab Tablet-Breite wird zwischen „YAML“ und „Map“ umgeschaltet. Das Detailpanel erscheint als Drawer über der Map. Smartphones gehören nicht zum verbindlich unterstützten Umfang.

### 5.3 Map-Steuerung

Die Map bietet:

- Zoom per Mausrad beziehungsweise Trackpad;
- Verschieben des Viewports;
- Schaltflächen für Vergrößern, Verkleinern und „Ansicht einpassen“;
- Auswahl einer Capability;
- Ein- und Ausklappen einer Capability mit Kindern;
- Fokus auf eine Capability als temporäre Wurzel;
- Rückkehr zur übergeordneten beziehungsweise vollständigen Map.

Kacheln sind nicht frei verschiebbar und nicht direkt skalierbar.

## 6. YAML-Datenmodell

### 6.1 Grundsätze

- Technische Feldnamen sind Englisch.
- Freie Inhalte dürfen jede Sprache verwenden.
- YAML ist das führende Format.
- Das Schema besitzt eine explizite Versionsnummer.
- Unbekannte Felder außerhalb von `metadata` sind Validierungsfehler, um Tippfehler früh zu erkennen.
- `metadata` darf frei erweiterte, YAML-/JSON-kompatible Werte enthalten.
- Jede Capability-ID ist innerhalb des gesamten Dokuments eindeutig.
- Die Reihenfolge der Capabilities im YAML bestimmt die Darstellungsreihenfolge.

### 6.2 Vorgeschlagene Struktur

```yaml
version: 1
map:
  id: example-map
  name: Beispiel Capability Map
  description: Kommentiertes Startbeispiel
  theme:
    defaultColor: "#DCE8F5"
  capabilities:
    - id: strategy
      name: Strategy
      description: Defines direction and priorities.
      owner: Corporate Development
      responsibilities:
        - Strategic planning
        - Portfolio governance
      tags: [management, core]
      visualization:
        color: "#B8D8F0"
        icon: compass
      layout:
        direction: horizontal
        weight: 2
        trackWeight: 1
      metadata:
        maturity: established
        criticality: high
      children:
        - id: strategic-planning
          name: Strategic Planning
        - id: portfolio-management
          name: Portfolio Management
    - id: operations
      name: Operations
      layout:
        direction: vertical
```

### 6.3 Dokumentfelder

| Pfad | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `version` | positive Ganzzahl | ja | Version des Eingabeschemas; im MVP ausschließlich `1` |
| `map.id` | String | ja | Technische ID der Map |
| `map.name` | String | ja | Anzeigename der Map |
| `map.description` | String | nein | Kurzbeschreibung der Map |
| `map.theme.defaultColor` | RGB-Hex-String | nein | Standard-Hintergrundfarbe für Capabilities |
| `map.capabilities` | Root-Element-Liste | ja | Geordnete Liste aus Wurzel-Capabilities und/oder Gruppen; mindestens ein Eintrag |

### 6.4 Capability-Felder

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `id` | String | ja | Global eindeutige, stabile technische ID |
| `name` | nicht leerer String | ja | Anzeigename |
| `description` | String | nein | Kurzbeschreibung für Kachel und Detailpanel |
| `owner` | String | nein | Primär verantwortliche Organisation oder Rolle |
| `responsibilities` | String-Liste | nein | Verantwortlichkeiten der Capability |
| `tags` | String-Liste | nein | Such- und Filtermerkmale |
| `visualization.color` | RGB-Hex-String `#RRGGBB` | nein | Eigene Hintergrundfarbe |
| `visualization.icon` | String | nein | Name eines freigegebenen Icons |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical` |
| `layout.weight` | positive Zahl | nein | Standard: `1`; relative Höhe oder Breite gemäß Layoutregel |
| `layout.trackWeight` | positive Zahl | nein | Standard: `1`; relative Breite eines horizontalen Blocks |
| `metadata` | Objekt | nein | Frei erweiterbare Metadaten |
| `children` | Capability-Liste | nein | Rekursive, geordnete Unterfähigkeiten |

Leere optionale Listen und Objekte werden akzeptiert und bei der Normalisierung entfernt. IDs sollen dem Muster `[a-zA-Z0-9][a-zA-Z0-9._-]*` entsprechen.

### 6.5 Gruppenfelder

Gruppen sind ausschließlich als direkte Einträge von `map.capabilities` erlaubt. Sie werden durch `type: group` von normalen Capabilities unterschieden und enthalten mindestens eine Capability.

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `type` | `group` | ja | Kennzeichnet das Root-Element als Gruppe |
| `id` | String | ja | Global gegenüber Gruppen und Capabilities eindeutige ID |
| `name` | nicht leerer String | ja | Sichtbarer Gruppenname im aufgeklappten Zustand |
| `visualization.backgroundColor` | RGB-Hex-String `#RRGGBB` | nein | Dezente Containerfarbe; eingebaute Standardfarbe bei fehlender Angabe |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical`; Root-Anordnung und Position des Gruppennamens |
| `layout.weight` | positive Zahl | nein | Standard: `1`; relative Höhe oder Breite gemäß Root-Layoutregel |
| `layout.trackWeight` | positive Zahl | nein | Standard: `1`; relative Breite eines horizontalen Root-Blocks |
| `capabilities` | Capability-Liste | ja | Mindestens eine direkt enthaltene Capability |

```yaml
- type: group
  id: management-group
  name: Management Capabilities
  visualization:
    backgroundColor: "#E9F1F8"
  layout:
    direction: horizontal
    trackWeight: 1.15
  capabilities:
    - id: strategy
      name: Strategy
    - id: governance
      name: Governance
```

## 7. Layout-Semantik

### 7.1 Begriffe

- **Geschwisterliste:** Die geordnete `capabilities`- oder `children`-Liste eines Containers.
- **Horizontaler Block:** Eine maximal lange Folge direkt aufeinanderfolgender Capabilities mit `layout.direction: horizontal`.
- **Track:** Eine Säule innerhalb des verfügbaren Innenraums eines Containers.

Die Bezeichnung `horizontal` beschreibt, dass eine Capability als horizontale Ebene innerhalb eines gestapelten Blocks angelegt wird. `vertical` beschreibt eine voll hohe Säule.

### 7.2 Deterministischer Algorithmus

Für jede Geschwisterliste wird rekursiv folgender Algorithmus angewendet:

1. Behalte die YAML-Reihenfolge unverändert bei.
2. Fasse jede maximal aufeinanderfolgende Folge von `horizontal`-Capabilities zu genau einem horizontalen Block zusammen.
3. Erzeuge für jede `vertical`-Capability einen eigenen Track.
4. Erzeuge für jeden horizontalen Block einen gemeinsamen Track.
5. Teile die verfügbare Breite proportional auf alle Tracks auf:
   - Für den Track einer `vertical`-Capability gilt deren `layout.weight` als Track-Gewicht.
   - Für einen horizontalen Block gilt `layout.trackWeight` des ersten Blockelements als Track-Gewicht; fehlt es, gilt `1`.
6. Eine `vertical`-Capability belegt die volle nutzbare Höhe ihres Tracks.
7. Teile die Höhe innerhalb eines horizontalen Blocks proportional nach `layout.weight` seiner Elemente auf.
8. Ziehe definierte Abstände, Rahmen, Innenabstände und den Headerbereich ab, bevor Kind-Layouts berechnet werden.
9. Wende denselben Algorithmus auf die sichtbaren Kinder jeder Capability an.

`layout.trackWeight` ist nur beim ersten Element eines horizontalen Blocks erlaubt. An anderen Stellen erzeugt es einen Validierungsfehler mit Lösungshinweis.

### 7.3 Beispiel

Die Folge

```text
Cap 1 horizontal
Cap 2 horizontal
Cap 3 horizontal
Cap 4 vertical
Cap 5 vertical
Cap 6 horizontal
Cap 7 horizontal
```

ergibt vier Tracks:

```text
[Cap 1] | [Cap 4] | [Cap 5] | [Cap 6]
[Cap 2] |         |         | [Cap 7]
[Cap 3] |         |         |
```

Bei Standardgewichten sind die vier Tracks gleich breit; die drei beziehungsweise zwei Elemente der horizontalen Blöcke teilen ihre jeweilige Track-Höhe gleichmäßig.

### 7.4 Platzmangel und semantischer Zoom

- Kacheln besitzen Mindestmaße für sinnvoll darstellbare Inhalte.
- Bei abnehmendem Platz verschwinden in dieser Reihenfolge: Beschreibung, Metadaten-Vorschau, Icon.
- Name und Zustandsindikatoren bleiben möglichst lange sichtbar.
- Reicht der Platz für Kinder nicht aus, werden sie in dieser Ansicht nicht gerendert. Die Elternkachel zeigt die Zahl der momentan nicht dargestellten Nachfahren.
- Die Daten bleiben erhalten; Fokus auf die Elternkachel nutzt die gesamte Map-Fläche für deren Unterbaum.
- Eingeklappte oder weggefilterte Unterbäume werden nicht an das Visualisierungs-Framework übergeben.

Die konkrete Mindestgröße wird in der Implementierung als zentraler Design-Token festgelegt und durch visuelle Tests abgesichert.

### 7.5 Top-Level-Gruppen

- Gruppen nehmen auf Root-Ebene wie Capabilities am bestehenden Track-Algorithmus teil; `direction`, `weight` und `trackWeight` haben dieselbe Platzierungssemantik.
- Die Richtung verändert nicht das interne Layout der enthaltenen Capabilities. Diese behalten ihre eigenen, gemischten Layoutwerte.
- Bei `vertical` steht der Gruppenname in einem reservierten Bereich oberhalb der Capabilities.
- Bei `horizontal` steht der Gruppenname in einem schmalen reservierten Bereich links neben den Capabilities. Im ausgeklappten Zustand wird er vertikal und ohne Umbruch gesetzt.
- Gruppen besitzen außer Name, Layout und Hintergrundfarbe keine fachlichen Inhalte oder Metadaten.
- Die Gruppenfarbe wird nicht an enthaltene Capabilities vererbt.
- Eingeklappte `vertical`-Gruppen bleiben als schmale Säule sichtbar; eingeklappte `horizontal`-Gruppen als flache Ebene.
- Besteht ein horizontaler Root-Track ausschließlich aus eingeklappten Gruppen, wird seine durch `trackWeight` bestimmte Breite freigegeben. Der Track behält nur die für den vollständigen längsten Gruppennamen erforderliche Breite; die übrigen Root-Tracks teilen den frei gewordenen Platz gemäß ihren Gewichten neu untereinander auf.
- Der Gruppenname wird stets vollständig und ohne Ellipse dargestellt. Der reservierte Namensbereich wächst bei Bedarf; in einer eingeklappten vertikalen Gruppe wird der Name platzsparend vertikal gesetzt.
- Im eingeklappten Zustand dient der gesamte farbige Platzhalter samt Gruppenname als Aufklappfläche mit technischem Tooltip beziehungsweise zugänglichem Namen; ein eigener sichtbarer Button oder ein Chevron wird nicht gerendert.
- Gruppen sind nicht auswählbar, nicht fokussierbar und öffnen kein Detailpanel.

## 8. Darstellungsregeln

### 8.1 Vererbung

- `visualization.color` und `visualization.icon` werden vom direkten Elternknoten geerbt.
- Eigene Werte überschreiben geerbte Werte.
- Fehlt eine Farbe in der gesamten Ahnenkette, gilt `map.theme.defaultColor`.
- Fehlt auch diese, gilt ein eingebauter Theme-Standard.
- Layoutwerte werden nicht vererbt.

### 8.2 Farben

- Das MVP akzeptiert RGB-Hex-Werte im Format `#RRGGBB`.
- Text-, Rahmen- und Interaktionsfarben werden automatisch aus der wirksamen Hintergrundfarbe abgeleitet.
- Extrem helle oder dunkle Eingaben dürfen für Text und Zustandsanzeige durch kontrastierende Systemfarben ergänzt werden; die eingegebene Kachelfarbe selbst bleibt unverändert.

### 8.3 Icons

- Icons stammen aus Lucide und werden über ihren normalisierten Namen referenziert.
- Ein unbekannter Icon-Name ist ein Schema-/Semantikfehler.
- Externe Bild- oder Icon-URLs sind im MVP unzulässig.

## 9. Suche, Filter und Sichtbarkeit

### 9.1 Suche

Die Suche berücksichtigt mindestens `name`, `description`, `owner`, `responsibilities`, `tags` und skalare Metadatenwerte. Treffer werden hervorgehoben; ihre Ahnen werden automatisch sichtbar gehalten. Suche allein blendet Nicht-Treffer nicht aus.

### 9.2 Metadatenfilter

- Die Filteroberfläche wird automatisch aus den im gültigen Dokument tatsächlich vorhandenen Kernfeldern und Metadatenwerten erzeugt.
- Eine zusätzliche Filterkonfiguration im YAML ist im MVP weder erforderlich noch vorgesehen.
- Filter können auf Kernfeldern und skalaren beziehungsweise skalaren Listenwerten in `metadata` aufgebaut werden.
- Leere Felder und komplexe Objektwerte werden nicht als auswählbare Filter angeboten.
- Werte innerhalb desselben Felds werden mit ODER verknüpft.
- Unterschiedliche Felder werden mit UND verknüpft.
- Passt ein Nachfahre, bleiben alle notwendigen Ahnen als Kontext sichtbar.
- Ein nur als Kontext sichtbarer Ahne wird optisch von einem direkten Treffer unterschieden.
- Leere Trefferlisten zeigen einen erklärenden Leerzustand und eine Aktion „Filter zurücksetzen“.
- Gruppen sind keine eigenen Filtertreffer. Enthält eine Gruppe keine passenden Capabilities, bleibt sie als kompakter struktureller Platzhalter sichtbar.

### 9.3 Ein-/Ausklappen

Der Einklappzustand wird getrennt über Capability- und Gruppen-IDs verwaltet und als separater UI-Zustand in `localStorage` gespeichert. Er ist kein Bestandteil des YAML und darf beim Speichern oder Exportieren des YAML niemals dort hineingeschrieben werden. Zustände für IDs, die im aktuellen Dokument nicht mehr vorkommen, werden beim Laden verworfen. Filter oder Suche dürfen notwendige Capability-Ahnen und Gruppen temporär öffnen, verändern aber nicht den gespeicherten manuellen Einklappzustand. Gruppen verschwinden niemals vollständig.

### 9.4 Fokusmodus

Der Fokusmodus behandelt die gewählte Capability temporär als Wurzel. Eine Breadcrumb-Navigation zeigt den Pfad zur tatsächlichen Wurzel und ermöglicht schrittweise Rückkehr. Suche und Filter bleiben im Fokusmodus aktiv.

## 10. Detailpanel

Das Detailpanel zeigt für die ausgewählte Capability:

- Name, Icon und wirksame Farbe;
- vollständige Beschreibung;
- Owner und Verantwortlichkeiten;
- Tags;
- frei definierte Metadaten in einer lesbaren Schlüssel-Wert-Darstellung;
- Pfad innerhalb der Capability-Hierarchie;
- direkte Kinder und Zahl aller Nachfahren;
- wirksame und explizit gesetzte Visualisierungswerte.

Es bietet Aktionen für Fokus sowie Ein-/Ausklappen, aber keine Datenbearbeitung.

## 11. Editor, Validierung und Live-Vorschau

### 11.1 Editor

CodeMirror 6 wird als YAML-Editor eingesetzt. Er bietet Syntaxhervorhebung, Zeilennummern, Suchen, Undo/Redo und die Integration eigener Diagnostik. Das Startdokument ist ein gültiges, kommentiertes Beispiel, das alle zentralen Konzepte demonstriert.

### 11.2 Validierungspipeline

Nach einer Eingabepause von ungefähr 250 ms läuft:

1. YAML-Parsing unter Erhalt von Quellpositionen;
2. strukturelle Schema-Validierung;
3. semantische Validierung;
4. Normalisierung von Defaults und Vererbung;
5. Sichtbarkeits- und Layoutberechnung;
6. Aktualisierung der Vorschau.

Semantisch validiert werden mindestens:

- eindeutige Capability-IDs;
- gültige ID-Formate;
- gültige Farben und bekannte Icons;
- positive `weight`- und `trackWeight`-Werte;
- korrekte Position von `trackWeight`;
- mindestens eine Wurzel-Capability;
- ausschließlich unterstützte Schema-Versionen.

### 11.3 Fehlerdarstellung

- Fehler werden im Editor an der möglichst genauen Quellposition markiert.
- Eine Fehlerliste zeigt Schweregrad, YAML-Pfad, verständliche Ursache und Lösungshinweis.
- Syntaxfehler blockieren nachfolgende Schema- und Semantikprüfungen.
- Warnungen dürfen das Rendering nicht blockieren; Fehler blockieren es.
- Bei Fehlern bleibt die zuletzt gültige Map sichtbar und erhält den Status „Vorschau nicht aktuell“.
- Ist noch keine gültige Eingabe vorhanden, zeigt die Map einen erklärenden Fehlerzustand.

## 12. Lokale Speicherung

- Der aktuelle Editorinhalt wird nach Änderungen automatisch in `localStorage` gespeichert.
- YAML-Text und UI-Zustand werden als getrennte Einträge gespeichert.
- Der UI-Zustand des MVP enthält ausschließlich die getrennt gespeicherten, manuell eingeklappten Capability- und Gruppen-IDs.
- Fokus, Auswahl, Suche und aktive Filter werden nicht sitzungsübergreifend gespeichert.
- Gespeicherte Daten tragen jeweils eine interne Speicher- und Schema-Version.
- Beim Start wird zuerst der lokale Stand geladen.
- Nicht lesbare oder inkompatible Daten führen nicht zum Absturz; das Tool bietet das Startbeispiel und einen Hinweis an.
- „Auf Beispiel zurücksetzen“ erfordert eine Bestätigung, wenn ungesicherte Abweichungen bestehen.
- Das Zurücksetzen auf das Beispiel löscht auch den separat gespeicherten Collapse-Zustand.
- Es werden keine Daten an einen Server übertragen.

## 13. Technische Architektur

### 13.1 Technologieentscheidungen

| Bereich | Auswahl | Begründung |
| --- | --- | --- |
| Sprache | TypeScript im Strict Mode | Durchgängige Typisierung von Schema, Normalform, Layout und UI |
| UI | React | Komponentenmodell und direkte Integration mit React Flow und CodeMirror |
| Build/Development | Vite | Schneller Development-Server, TypeScript-Unterstützung und React Fast Refresh |
| Visualisierung | React Flow (`@xyflow/react`) | Verschachtelte Gruppen, Custom Nodes, Zoom/Pan, Fit View, Sichtbarkeit und Interaktionsgrundlagen |
| YAML-Editor | CodeMirror 6 | Modularer Editor mit YAML-Sprache und integrierbarer Diagnostik |
| YAML-Parser | `yaml` | Parsing mit Dokument-/Quellpositionszugriff und verständlichen Syntaxfehlern |
| Laufzeitschema | Zod | TypeScript-nahe Validierung und Ableitung interner Typen |
| Icons | Lucide React | Konsistente Open-Source-Icons ohne externe URLs |
| Unit-/Komponententests | Vitest und Testing Library | Vite-nahe, schnelle Tests |
| End-to-End-Tests | Playwright | Browserübergreifende Kernabläufe und visuelle Regressionstests |
| Linting | ESLint mit `typescript-eslint` | Type-aware TypeScript-Regeln und reproduzierbare Qualitätsprüfung |

React Flow übernimmt Viewport, Eingaben und das Rendering verschachtelter Custom Nodes. Es bestimmt nicht die fachliche Anordnung. Eine eigene, pure TypeScript-Layoutfunktion berechnet aus normalisierten Capabilities absolute, rekursive Rechtecke und übersetzt diese anschließend in React-Flow-Nodes mit Elternbezug.

### 13.2 Schichten

```text
YAML-Text
  -> Parser und Quellpositionsindex
  -> Schema- und Semantikvalidierung
  -> normalisiertes Capability-Modell
  -> Suche, Filter, Collapse und Fokus
  -> deterministische Layout-Engine
  -> React-Flow-Adapter
  -> Map und Detailpanel
```

Vorgesehene interne Module:

- `domain`: Schema, normalisierte Typen und Vererbungsregeln;
- `parser`: YAML-Parsing, Quellpfade und Diagnostik;
- `layout`: pure, rekursive Layoutberechnung;
- `visibility`: Suche, Filter, Collapse, Fokus und Kontext-Ahnen;
- `renderer`: Adapter und Custom Nodes für React Flow;
- `editor`: CodeMirror-Integration;
- `app`: UI-Komposition, lokaler Zustand und Persistenz.

Zwischen `domain`, `layout`, `visibility` und `renderer` dürfen keine React-Abhängigkeiten bestehen, soweit dies fachlich nicht erforderlich ist. Damit bleibt der Rendering-Kern testbar und später wiederverwendbar.

### 13.3 Zustand

Der Zustand wird in klar getrennte Bereiche aufgeteilt:

- Editor: aktueller YAML-Text, Diagnosen, letzte gültige Normalform;
- Ansicht: Suche, Filter, Collapse-Set, Fokus-ID, Auswahl-ID;
- Viewport: Zoom und Pan;
- Persistenz: Speicherstatus und Schema-Version.

Für das MVP genügt React State mit Reducer und Context. Eine zusätzliche globale State-Bibliothek wird nur eingeführt, wenn die Umsetzung einen konkreten Bedarf zeigt.

## 14. Nichtfunktionale Anforderungen

### 14.1 Performance

Verbindliche Testbasis sind bis zu 100 Capabilities und fünf Hierarchieebenen auf einem aktuellen durchschnittlichen Laptop:

- Editoränderung bis Abschluss von Parsing und Validierung: Zielwert unter 150 ms nach Ablauf des Debounce;
- gültige Änderung bis sichtbare Vorschau: Zielwert unter 300 ms;
- Suche oder Filteränderung bis aktualisierte Map: Zielwert unter 200 ms;
- flüssiges Zoomen und Verschieben im üblichen Arbeitsbereich.

Tiefere Strukturen bleiben zulässig, sind aber außerhalb der garantierten Performance-Baseline. Es gibt keine künstliche Tiefenbegrenzung im Schema. Nicht sichtbare Unterbäume werden nicht gerendert.

### 14.2 Browser und Darstellung

- Verbindlich unterstützt werden die jeweils zwei neuesten Hauptversionen von Chrome, Edge, Firefox und Safari auf Desktop-Systemen.
- Die Anwendung bleibt ab Tablet-Breite bedienbar.
- Das Layout füllt die verfügbare Browserfläche ohne feste Seitenabmessungen.
- Helle Oberfläche ist der MVP-Standard; Farben werden über zentrale Design-Tokens definiert.

### 14.3 Sicherheit und Datenschutz

- YAML wird ausschließlich als Datenformat behandelt und niemals ausgeführt.
- Freie Texte werden als Text gerendert, nicht als HTML.
- Externe Ressourcen aus dem YAML werden nicht geladen.
- Icon-Namen werden gegen eine Allowlist geprüft.
- Verarbeitung und Speicherung erfolgen ausschließlich lokal im Browser.

### 14.4 Entwicklungsqualität

Die Implementierung muss mindestens folgende Skripte anbieten:

- Development-Server mit Hot Reloading;
- Produktions-Build;
- Linting;
- Typecheck ohne Ausgabe;
- Unit-/Komponententests;
- End-to-End-Tests.

Der CI-fähige Qualitätslauf umfasst mindestens Linting, Typecheck, Tests und Produktions-Build.

## 15. Teststrategie

### 15.1 Unit-Tests

Besonders vollständig zu testen sind:

- Schema-Defaults und Fehlermeldungen;
- globale ID-Eindeutigkeit;
- Farb- und Icon-Vererbung;
- Gruppierung maximaler horizontaler Blöcke;
- Gewichtung von Tracks und Elementhöhen;
- gemischte Richtungen auf mehreren Ebenen;
- Filterlogik einschließlich Kontext-Ahnen;
- Wechselwirkung zwischen Filter und manuellem Collapse;
- Fokus und Breadcrumb-Pfade;
- semantische Zoom-Entscheidung bei Platzmangel.
- Schema, Vererbung, Ausrichtung und Collapse-Platzhalter von Top-Level-Gruppen.

### 15.2 Komponenten- und Integrationstests

- gültige Änderung aktualisiert die Vorschau;
- ungültige Änderung markiert den Editor und erhält die letzte gültige Vorschau;
- Auswahl öffnet das korrekte Detailpanel;
- Reset und Wiederherstellung aus `localStorage`;
- Filter-, Suche-, Collapse- und Fokusabläufe.
- horizontales und vertikales Gruppen-Rendering einschließlich getrenntem Collapse-Zustand.

### 15.3 End-to-End- und visuelle Tests

- Start mit Beispiel bis zur interaktiven Map;
- fehlerhafte und anschließend korrigierte YAML-Eingabe;
- Referenzbeispiel für das Layout `[H,H,H,V,V,H,H]`;
- horizontale und vertikale Gruppen sowie ihre schmalen Collapse-Platzhalter;
- tiefer verschachtelte Map mit semantischem Zoom;
- Desktopansicht und Tablet-Umschaltung;
- kritische Abläufe in Chromium, Firefox und WebKit.

## 16. Abnahmekriterien des MVP

Das MVP gilt als abgenommen, wenn:

1. die statische Anwendung ohne Backend gebaut und ausgeliefert werden kann;
2. der integrierte Editor das Startbeispiel anzeigt und Änderungen lokal speichert;
3. gültiges YAML nach der definierten Pipeline live gerendert wird;
4. Syntax-, Schema- und Semantikfehler verständlich und quellnah dargestellt werden;
5. bei Fehlern die letzte gültige Vorschau sichtbar und als veraltet markiert bleibt;
6. beliebig rekursive `children` vom Schema akzeptiert werden;
7. das gemischte Layout einschließlich `weight` und `trackWeight` dem beschriebenen Algorithmus entspricht;
8. Farb- und Icon-Vererbung korrekt funktioniert;
9. Suche, Metadatenfilter, Collapse und Fokusmodus korrekt zusammenspielen;
10. Auswahl einer Capability alle definierten Details im Panel zeigt;
11. Zoom, Pan und „Ansicht einpassen“ funktionieren;
12. eine Referenzmap mit 100 Capabilities und fünf Ebenen die Performance-Ziele im vereinbarten Testsystem erfüllt;
13. Desktop-Browser und Tablet-Darstellung gemäß Zielrahmen getestet sind;
14. Linting, Typecheck, automatisierte Tests und Produktions-Build erfolgreich durchlaufen;
15. die Map keine grafische Bearbeitung zulässt und vollständig aus dem YAML reproduzierbar ist.
16. gruppierte und ungruppierte Root-Capabilities gemeinsam darstellbar sind, Gruppenfarben nicht vererbt werden und eingeklappte Gruppen als schmale, vollständig beschriftete Struktur sichtbar bleiben.

## 17. Ausbaustufen

Priorisierte Weiterentwicklung nach dem MVP:

1. Dateiimport und -download, Laden beim Build sowie Laden über URL;
2. Export nach SVG und PNG;
3. PowerPoint-Export, möglichst mit editierbaren Formen und erhaltener Capability-Hierarchie statt eines reinen Screenshots;
4. größere Datenmengen mit Profiling, Virtualisierung oder alternativen Renderstrategien;
5. visuelle Bearbeitung mit kontrollierter Rückschreibung ins YAML;
6. Backend, Versionierung und Zusammenarbeit;
7. mehrere UI-Sprachen;
8. formale Barrierefreiheit und optimierte Smartphone-Nutzung;
9. alternative Darstellungen wie Baum oder Treemap.

Für den späteren PowerPoint-Export sind insbesondere Exportumfang (vollständige oder aktuell gefilterte Map), Seitenaufteilung und Editierbarkeit vor der Umsetzung separat zu spezifizieren.

## 18. Architekturquellen

- [React Flow: Sub Flows](https://reactflow.dev/learn/layouting/sub-flows)
- [React Flow: Layouting](https://reactflow.dev/learn/layouting/layouting)
- [React Flow: Accessibility](https://reactflow.dev/learn/advanced-use/accessibility)
- [CodeMirror Documentation](https://codemirror.net/docs/)
- [Vite Features](https://vite.dev/guide/features.html)

## 19. Bestätigte Detailentscheidungen

1. `owner` ist im MVP genau ein optionaler String für die primäre Verantwortung. `responsibilities` bleibt eine optionale String-Liste; weitere Beteiligte können über `metadata` beschrieben werden.
2. Das MVP liefert ausschließlich ein helles Theme aus. Zentrale Design-Tokens bereiten spätere Themes vor.
3. Metadatenfilter entstehen automatisch aus vorhandenen filterbaren Werten; das YAML enthält im MVP keine Filterkonfiguration.
4. Der manuelle Collapse-Zustand wird separat in `localStorage`, niemals im YAML, gespeichert. Fokus, Auswahl, Suche und Filter werden beim Neuladen zurückgesetzt.
5. Top-Level-Gruppen enthalten mindestens eine Capability, bleiben bei Filtern immer strukturell sichtbar und zeigen ihren vollständigen Namen auch im eingeklappten farbigen Platzhalter.
