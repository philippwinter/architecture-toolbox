# Capability Map Renderer – Spezifikation

Status: Erweiterungsspezifikation v0.4 (umsetzungsreif)
Stand: 17. Juli 2026
Ziel: Umsetzungsreife Spezifikation für die nächste Ausbaustufe auf Basis des bestehenden MVP

## 1. Produktvision

Das Tool visualisiert hierarchische Capability Maps auf Basis einer strukturierten YAML-Definition. Anwenderinnen und Anwender bearbeiten das YAML direkt in einer statisch deploybaren Webanwendung und sehen eine validierte Live-Vorschau. Die Visualisierung nutzt den verfügbaren Raum dynamisch, unterstützt beliebig verschachtelte Capabilities, zweistufige visuelle Gruppen, explizite Layout-Umbrüche und alternative Capability-Formen. Inhalte lassen sich suchen, filtern, ein- und ausklappen sowie als Teilbäume fokussieren.

Das Rendering ist deterministisch: Reihenfolge, Hierarchie, Ausrichtung und relative Größen werden ausschließlich aus dem YAML abgeleitet. Die Visualisierung selbst dient im MVP nicht als grafischer Struktureditor.

## 2. Ziele des MVP

Das MVP muss:

1. YAML in einem integrierten Editor bearbeiten und mit kurzer Verzögerung validieren können.
2. die zuletzt gültige Eingabe unmittelbar als verschachtelte Capability Map darstellen.
3. beliebig tiefe, rekursive Capability-Strukturen im Datenmodell unterstützen.
4. ein gemischtes, rekursives Layout aus horizontal gestapelten Elementen, vertikalen Säulen und expliziten horizontalen beziehungsweise vertikalen Flushes unterstützen.
5. Capabilities ein- und ausklappen, suchen, anhand von Metadaten filtern und als Teilbaum fokussieren können.
6. Details der ausgewählten Capability in einem separaten Panel darstellen.
7. Darstellungswerte vererben und fehlende Werte sinnvoll vorbelegen.
8. den aktuellen YAML-Inhalt lokal im Browser speichern und wiederherstellen.
9. als statische Webanwendung ohne Backend betrieben werden können.
10. eine getrennte Rendering-Schicht besitzen, die später als wiederverwendbare TypeScript-Bibliothek extrahiert oder veröffentlicht werden kann.
11. TypeScript, Linting, automatisierte Tests und Hot Reloading unterstützen.
12. Capabilities optional in rein visuellen, einklappbaren Gruppen auf zwei Gruppenebenen strukturieren können.
13. Blatt-Capabilities unabhängig vom verfügbaren Containerplatz stets kompakt darstellen.
14. Beschreibungen ausschließlich im Detailpanel und nicht innerhalb der Capability Map anzeigen.
15. Capabilities wahlweise als rechteckige Box oder als Chevron einer Wertstromdarstellung rendern.
16. fehlende `trackWeight`- und `layerWeight`-Werte anhand des rekursiv berechneten Platzbedarfs automatisch bestimmen.
17. den Fokusmodus per Doppelklick ohne explizite Fokus-Schaltfläche aktivieren.
18. eine reproduzierbare komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen für Funktions-, Layout- und Performanceprüfungen bereitstellen.

## 3. Nicht-Ziele des MVP

Nicht Bestandteil des MVP sind:

- Laden per Datei, Build-Konfiguration oder URL;
- Export nach SVG, PNG oder PowerPoint;
- Benutzerkonten, Backend, Cloud-Speicherung oder Zusammenarbeit in Echtzeit;
- grafische Bearbeitung per Drag-and-drop oder Größenänderung in der Map;
- verbindliche Unterstützung von Smartphones;
- ein formales WCAG-Konformitätsziel;
- eine zweite Oberflächensprache;
- mehr als zwei ineinander verschachtelte Gruppenebenen;
- Gruppen innerhalb der `children`-Liste einer Capability;
- frei definierbare Polygonformen oder frei konfigurierbare Chevron-Geometrien;
- frei referenzierbare Bilder, HTML-Inhalte, Skripte oder externe Icon-URLs.

## 4. Zielgruppen und Nutzungsszenario

Primäre Zielgruppe sind Enterprise- und Business-Architektinnen und -Architekten sowie Personen aus Organisations- und Produktentwicklung in privatwirtschaftlichen Unternehmen.

Primärer Ablauf:

1. Die Anwendung öffnet sich mit dem lokal gespeicherten YAML oder, falls keines vorhanden ist, mit einem kommentierten Beispiel.
2. Die Person ändert das YAML im Editor.
3. Nach einer kurzen Eingabepause wird das Dokument syntaktisch, strukturell und semantisch validiert.
4. Bei gültiger Eingabe aktualisiert sich die Map.
5. Bei ungültiger Eingabe bleiben die letzte gültige Map und ihr Interaktionszustand erhalten; die Vorschau wird als nicht aktuell gekennzeichnet.
6. Die Person sucht, filtert, klappt Capabilities ein oder aus, fokussiert einen Teilbaum per Doppelklick und betrachtet Details.

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
- Auswahl einer Capability per einfachem Klick;
- Ein- und Ausklappen einer Capability mit Kindern;
- Fokus auf eine Capability als temporäre Wurzel per Doppelklick auf ihre Box beziehungsweise ihren Chevron;
- Rückkehr zur übergeordneten beziehungsweise vollständigen Map.

Eine separate Fokus-Schaltfläche wird weder auf der Capability noch im Detailpanel angezeigt. Kacheln und Chevrons sind nicht frei verschiebbar und nicht direkt skalierbar.

## 6. YAML-Datenmodell

### 6.1 Grundsätze

- Technische Feldnamen sind Englisch.
- Freie Inhalte dürfen jede Sprache verwenden.
- YAML ist das führende Format.
- Das Schema besitzt eine explizite Versionsnummer.
- Unbekannte Felder außerhalb von `metadata` sind Validierungsfehler, um Tippfehler früh zu erkennen.
- `metadata` darf frei erweiterte, YAML-/JSON-kompatible Werte enthalten.
- Gruppen- und Capability-IDs sind gemeinsam innerhalb des gesamten Dokuments eindeutig.
- Die Reihenfolge der Capabilities, Gruppen und Flushes im YAML bestimmt die Darstellungsreihenfolge.

### 6.2 Vorgeschlagene Struktur

```yaml
version: 1
map:
  id: example-map
  name: Beispiel Capability Map
  description: Auszug aus der komplexen Referenzmap und dem Startbeispiel
  theme:
    defaultColor: "#DCE8F5"
  capabilities:
    - type: group
      id: management
      name: Management Capabilities
      visualization:
        backgroundColor: "#E9F1F8"
      layout:
        direction: horizontal
      capabilities:
        - id: strategy
          name: Strategy
          description: Defines direction and priorities.
          owner: Corporate Development
          visualization:
            color: "#B8D8F0"
            icon: compass
          layout:
            direction: horizontal
            layerWeight: 1.2
        - id: governance
          name: Governance
          layout:
            direction: horizontal
        - type: flush
          direction: horizontal
        - type: group
          id: portfolio-management-group
          name: Portfolio Management
          capabilities:
            - id: portfolio-management
              name: Portfolio Management
              layout:
                direction: vertical
    - type: flush
      direction: vertical
    - id: operations
      name: Operations
      layout:
        direction: vertical
      children:
        - id: production-planning
          name: Production Planning
          visualization:
            shape: box
        - id: order-fulfillment
          name: Order Fulfillment
          visualization:
            shape: chevron
```

### 6.3 Dokumentfelder

| Pfad | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `version` | positive Ganzzahl | ja | Version des Eingabeschemas; im MVP ausschließlich `1` |
| `map.id` | String | ja | Technische ID der Map |
| `map.name` | String | ja | Anzeigename der Map |
| `map.description` | String | nein | Kurzbeschreibung der Map |
| `map.theme.defaultColor` | RGB-Hex-String | nein | Standard-Hintergrundfarbe für Capabilities |
| `map.capabilities` | Root-Element-Liste | ja | Geordnete Liste aus Wurzel-Capabilities, Gruppen und Flushes; mindestens eine Capability direkt oder innerhalb einer Gruppe |

### 6.4 Capability-Felder

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `id` | String | ja | Global eindeutige, stabile technische ID |
| `name` | nicht leerer String | ja | Anzeigename |
| `description` | String | nein | Kurzbeschreibung; ausschließlich im Detailpanel sichtbar, weiterhin durchsuchbar |
| `owner` | String | nein | Primär verantwortliche Organisation oder Rolle |
| `responsibilities` | String-Liste | nein | Verantwortlichkeiten der Capability |
| `tags` | String-Liste | nein | Such- und Filtermerkmale |
| `visualization.color` | RGB-Hex-String `#RRGGBB` | nein | Eigene Hintergrundfarbe |
| `visualization.icon` | String | nein | Offizieller Name eines Icons aus dem installierten Lucide-Katalog |
| `visualization.shape` | `box` oder `chevron` | nein | Standard: `box`; `chevron` ist nur für Blatt-Capabilities zulässig |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical` |
| `layout.layerWeight` | positive Zahl | nein | Optionaler expliziter Höhenfaktor eines horizontalen Layers; ohne Wert erfolgt eine automatische Bedarfsberechnung |
| `layout.trackWeight` | positive Zahl | nein | Optionaler expliziter Track-Faktor; ohne Wert erfolgt eine automatische Bedarfsberechnung |
| `metadata` | Objekt | nein | Frei erweiterbare Metadaten |
| `children` | Capability-/Flush-Liste | nein | Rekursive, geordnete Unterfähigkeiten mit optionalen Layout-Flushes; Gruppen sind hier nicht zulässig |

`layout.layerWeight` ist nur für Elemente mit `layout.direction: horizontal` zulässig. Das bisherige Feld `layout.weight` wird nicht als Alias übernommen und erzeugt einen Validierungsfehler mit dem Hinweis auf `layout.layerWeight`. Leere optionale Listen und Objekte werden akzeptiert und bei der Normalisierung entfernt. IDs sollen dem Muster `[a-zA-Z0-9][a-zA-Z0-9._-]*` entsprechen.

### 6.5 Gruppenfelder

Gruppen werden durch `type: group` von normalen Capabilities unterschieden. Eine Gruppe der ersten Ebene ist ein direkter Eintrag von `map.capabilities`. Eine solche Gruppe darf neben Capabilities und Flushes auch Gruppen der zweiten Ebene enthalten. Gruppen der zweiten Ebene enthalten ausschließlich Capabilities und Flushes; eine dritte Gruppenebene ist ein Validierungsfehler. Gruppen sind innerhalb von Capability-`children` nicht zulässig.

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `type` | `group` | ja | Kennzeichnet das Element als Gruppe |
| `id` | String | ja | Global gegenüber Gruppen und Capabilities eindeutige ID |
| `name` | nicht leerer String | ja | Stets vollständig darzustellender Gruppenname |
| `visualization.backgroundColor` | RGB-Hex-String `#RRGGBB` | nein | Dezente Containerfarbe; eingebaute Standardfarbe bei fehlender Angabe |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical`; Anordnung im direkten Elterncontainer und Position des Gruppennamens |
| `layout.layerWeight` | positive Zahl | nein | Optionaler expliziter Höhenfaktor eines horizontalen Layers; ohne Wert erfolgt eine automatische Bedarfsberechnung |
| `layout.trackWeight` | positive Zahl | nein | Optionaler expliziter Track-Faktor; ohne Wert erfolgt eine automatische Bedarfsberechnung |
| `capabilities` | Element-Liste | ja | Mindestens eine Capability; auf Gruppenebene 1 zusätzlich Gruppenebene 2 sowie auf beiden Ebenen Flushes zulässig |

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
    - type: group
      id: governance-group
      name: Governance
      capabilities:
        - id: enterprise-governance
          name: Enterprise Governance
```

### 6.6 Flush-Felder

Ein Flush ist ein rein strukturelles Layout-Element ohne ID, Namen, fachliche Inhalte oder eigene Darstellung. Flushes dürfen in `map.capabilities`, in Gruppen-`capabilities` und in Capability-`children` vorkommen.

| Feld | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `type` | `flush` | ja | Kennzeichnet einen harten Layout-Umbruch |
| `direction` | `horizontal` oder `vertical` | ja | Achse, auf der nach dem Flush ein neuer Layoutbereich begonnen wird |

```yaml
- id: capability-a
  name: Capability A
  layout:
    direction: horizontal
- id: capability-b
  name: Capability B
  layout:
    direction: horizontal
- type: flush
  direction: horizontal
- id: capability-c
  name: Capability C
  layout:
    direction: vertical
```

Jede Elementliste darf beliebig viele horizontale und vertikale Flushes enthalten und beide Richtungen frei abwechseln. Zwischen zwei Flushes muss jedoch mindestens ein fachliches Element liegen. Flushes am Anfang oder Ende einer Elementliste sowie unmittelbar aufeinanderfolgende Flushes sind Validierungsfehler, weil sie leere Layoutbereiche erzeugen würden. Flushes werden nicht gezählt, gesucht, gefiltert, ausgewählt oder persistiert.

## 7. Layout-Semantik

### 7.1 Begriffe

- **Elementliste:** Die geordnete `capabilities`- oder `children`-Liste eines Containers einschließlich ihrer Flushes.
- **Band:** Ein horizontaler Layoutbereich. Ein `vertical`-Flush beendet das aktuelle Band und beginnt darunter ein neues.
- **Horizontaler Block:** Eine Folge von Elementen mit `layout.direction: horizontal`, die innerhalb eines Tracks vertikal übereinander angeordnet wird.
- **Track:** Eine Säule innerhalb eines Bands. Ein `horizontal`-Flush beendet den aktuellen Track und beginnt rechts daneben einen neuen.
- **Platzbedarf:** Die bevorzugte Breite und Höhe eines Elements beziehungsweise Unterbaums vor der Anpassung an den tatsächlich verfügbaren Raum.

Die Bezeichnung `horizontal` beschreibt weiterhin, dass ein Element als horizontale Ebene innerhalb eines gestapelten Blocks angelegt wird. `vertical` beschreibt einen eigenen Säulen-Track. Flush-Richtungen bezeichnen dagegen die Achse, auf der der nachfolgende Layoutbereich beginnt: `horizontal` rechts daneben, `vertical` darunter.

### 7.2 Deterministischer Algorithmus

Für jede Elementliste wird rekursiv folgender Algorithmus angewendet:

1. Behalte die YAML-Reihenfolge unverändert bei.
2. Berechne zunächst für jedes sichtbare Element seinen bevorzugten Platzbedarf rekursiv von den Blättern zur Wurzel.
3. Teile die Elementliste an jedem `vertical`-Flush in Bänder. Die Höhe eines Bands leitet sich aus dem größten vertikalen Platzbedarf seiner Tracks ab; mehrere Bänder teilen die verfügbare Höhe proportional zu diesem Bedarf.
4. Erzeuge innerhalb jedes Bands für jedes `vertical`-Element einen eigenen Track und fasse aufeinanderfolgende `horizontal`-Elemente zu einem gestapelten Track zusammen.
5. Beende bei einem `horizontal`-Flush den aktuellen Track zwingend. Das nachfolgende Element startet einen neuen Track, auch wenn seine Richtung ansonsten eine Fortsetzung erlaubt hätte.
6. Teile die verfügbare Breite eines Bands anhand der effektiven Track-Gewichte auf. Deren Berechnung ist in Abschnitt 7.3 festgelegt.
7. Ordne Elemente eines horizontalen Blocks vertikal nach YAML-Reihenfolge an. Die Höhe ihrer Layout-Slots wird durch explizite oder automatisch berechnete `layout.layerWeight`-Werte bestimmt.
8. Blatt-Capabilities werden nicht auf die volle Track-Höhe gestreckt, sondern behalten ihre kompakte intrinsische Höhe. Nicht benötigte Resthöhe bleibt innerhalb des Tracks frei.
9. Ziehe definierte Abstände, Rahmen, Innenabstände und den Headerbereich ab, bevor Kind-Layouts berechnet werden.
10. Wende denselben Algorithmus auf Gruppeninhalte und die sichtbaren Kinder jeder Nicht-Blatt-Capability an.

`layout.trackWeight` ist nur am ersten fachlichen Element eines Tracks erlaubt. `layout.layerWeight` ist nur an `horizontal`-Elementen erlaubt. Verstöße erzeugen einen Validierungsfehler mit Lösungshinweis. Flushes selbst besitzen keine Gewichte.

### 7.3 Automatische Platzbedarfs- und Track-Berechnung

Der bevorzugte Platzbedarf wird deterministisch berechnet:

1. Eine Blatt-Capability erhält eine kompakte Mindesthöhe. Ihre bevorzugte Breite ergibt sich aus Icon, vollständigem Namen, Form und horizontalen Innenabständen, begrenzt durch zentrale Mindest- und Höchstwerte.
2. Ein Chevron berücksichtigt zusätzlich seine Pfeilspitze und die Überlappung mit direkt angrenzenden Chevrons.
3. Der Bedarf einer Nicht-Blatt-Capability ergibt sich aus Header, Innenabständen und dem rekursiv berechneten Bedarf ihres Kind-Layouts.
4. Der Bedarf einer Gruppe ergibt sich aus Namensbereich, Innenabständen und dem rekursiv berechneten Bedarf ihrer Inhalte.
5. Der bevorzugte Breitenbedarf eines gestapelten Tracks ist das Maximum seiner Elemente; sein bevorzugter Höhenbedarf ist deren Summe einschließlich Abständen.
6. Der bevorzugte Bedarf eines Bands ergibt sich aus der Summe seiner Track-Breiten und der größten Track-Höhe.

Für die tatsächliche Breitenverteilung gilt:

- Ist `layout.trackWeight` gesetzt, ist dieser Wert das effektive Gewicht des Tracks und überschreibt die automatische Ableitung.
- Fehlt `layout.trackWeight`, wird der bevorzugte Breitenbedarf des Tracks durch den Median der automatisch gewichteten Tracks desselben Bands geteilt.
- Automatisch abgeleitete Gewichte werden über zentrale Layout-Tokens auf einen sinnvollen Korridor begrenzt; initial gilt `0,5` bis `3`. Dadurch beeinflussen große Unterbäume die Breite, ohne einzelne Tracks unverhältnismäßig dominant werden zu lassen.
- Ein explizites Gewicht von `1` entspricht damit ungefähr einem Track mit medianem automatischem Platzbedarf.
- Die verfügbaren Pixel werden anschließend proportional zu allen effektiven Gewichten verteilt und unter Beachtung der Mindestbreiten gerundet. Rundungsreste gehen in YAML-Reihenfolge an die ersten Tracks.
- Die Berechnung wird bei Filter-, Collapse- und Fokusänderungen mit dem jeweils sichtbaren Baum erneut ausgeführt.

Für die Höhenverteilung innerhalb eines horizontal gestapelten Tracks gilt analog:

- Ist `layout.layerWeight` gesetzt, ist dieser Wert das effektive Gewicht des Layers und überschreibt die automatische Ableitung.
- Fehlt `layout.layerWeight`, wird der bevorzugte Höhenbedarf des Elements durch den Median der automatisch gewichteten Layer desselben Tracks geteilt.
- Automatisch abgeleitete `layerWeight`-Werte werden ebenfalls auf den Korridor `0,5` bis `3` begrenzt.
- Ein explizites `layerWeight: 1` entspricht ungefähr einem Layer mit medianem automatischem Höhenbedarf.
- Die verfügbare Track-Höhe wird proportional zu den effektiven Layer-Gewichten verteilt. Eine Blatt-Capability behält innerhalb ihres Slots dennoch ihre kompakte intrinsische Darstellung; zusätzlicher Slot-Platz wird nicht durch eine vergrößerte Blatt-Box gefüllt.
- Das frühere Feld `layout.weight` ist ungültig und wird weder normalisiert noch stillschweigend migriert.

### 7.4 Beispiele für Richtungen und Flushes

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

Bei vergleichbarem automatisch berechnetem Breitenbedarf sind die vier Tracks ähnlich breit. Bei vergleichbarem Höhenbedarf erhalten die drei beziehungsweise zwei Elemente der horizontalen Blöcke ähnliche Layer-Höhen.

Die Folge

```text
Cap A horizontal
Cap B horizontal
Flush horizontal
Cap C vertical
```

ergibt innerhalb eines Bands zwei Säulen:

```text
[Cap A] | [Cap C]
[Cap B] |
```

Ein `vertical`-Flush beginnt dagegen ein neues Band unterhalb des bisherigen Layouts:

```text
[Cap A] | [Cap B]
-----------------
[Cap C] | [Cap D]
```

### 7.5 Kompakte Blätter, Platzmangel und semantischer Zoom

- Blatt-Capabilities besitzen eine zentrale kompakte Höhe und werden ausschließlich mit Name sowie optionalem Icon und Zustandsmarkierungen gerendert.
- Beschreibungen werden unabhängig vom verfügbaren Platz niemals in der Map gerendert.
- Nicht-Blatt-Capabilities und Gruppen besitzen Mindestmaße für sinnvoll darstellbare Inhalte.
- Bei abnehmendem Platz verschwinden in dieser Reihenfolge: Metadaten-Vorschau, Icon.
- Name und Zustandsindikatoren bleiben möglichst lange sichtbar.
- Reicht der Platz für Kinder nicht aus, werden sie in dieser Ansicht nicht gerendert. Die Elternkachel zeigt die Zahl der momentan nicht dargestellten Nachfahren.
- Die Daten bleiben erhalten; Fokus auf die Elternkachel nutzt die gesamte Map-Fläche für deren Unterbaum.
- Eingeklappte oder weggefilterte Unterbäume werden nicht an das Visualisierungs-Framework übergeben.

Die konkrete Mindestgröße wird in der Implementierung als zentraler Design-Token festgelegt und durch visuelle Tests abgesichert.

### 7.6 Gruppen auf zwei Ebenen

- Gruppen nehmen auf beiden zulässigen Gruppenebenen wie Capabilities am bestehenden Track-Algorithmus teil; `direction`, `layerWeight` und `trackWeight` haben dieselbe Platzierungssemantik.
- Die Richtung verändert nicht das interne Layout der enthaltenen Capabilities. Diese behalten ihre eigenen, gemischten Layoutwerte.
- Bei `vertical` steht der Gruppenname in einem reservierten Bereich oberhalb der Capabilities.
- Bei `horizontal` steht der Gruppenname in einem schmalen reservierten Bereich links neben den Capabilities. Im ausgeklappten Zustand wird er vertikal und ohne Umbruch gesetzt.
- Gruppen besitzen außer Name, Layout und Hintergrundfarbe keine fachlichen Inhalte oder Metadaten.
- Die Gruppenfarbe wird nicht an enthaltene Capabilities vererbt.
- Eine Gruppe der zweiten Ebene wird vollständig innerhalb des Inhaltsbereichs ihrer Elterngruppe berechnet und darf deren Namensbereich oder Rahmen nicht überlagern.
- Eingeklappte `vertical`-Gruppen bleiben als schmale Säule sichtbar; eingeklappte `horizontal`-Gruppen als flache Ebene.
- Besteht ein Track ausschließlich aus eingeklappten Gruppen, wird seine zuvor berechnete Breite beziehungsweise Höhe freigegeben. Der Track behält nur den für die vollständige Gruppenbeschriftung erforderlichen Platz; die übrigen Tracks des Elterncontainers teilen den frei gewordenen Platz neu untereinander auf.
- Der Gruppenname wird stets vollständig und ohne Ellipse dargestellt. Der reservierte Namensbereich wächst bei Bedarf; in einer eingeklappten vertikalen Gruppe wird der Name platzsparend vertikal gesetzt.
- Im eingeklappten Zustand dient der gesamte farbige Platzhalter samt Gruppenname als Aufklappfläche mit technischem Tooltip beziehungsweise zugänglichem Namen; ein eigener sichtbarer Button oder ein Chevron wird nicht gerendert.
- Gruppen sind nicht auswählbar, nicht fokussierbar und öffnen kein Detailpanel.

## 8. Darstellungsregeln

### 8.1 Vererbung

- `visualization.color` und `visualization.icon` werden vom direkten Elternknoten geerbt.
- Eigene Werte überschreiben geerbte Werte.
- Fehlt eine Farbe in der gesamten Ahnenkette, gilt `map.theme.defaultColor`.
- Fehlt auch diese, gilt ein eingebauter Theme-Standard.
- `visualization.shape` und Layoutwerte werden nicht vererbt.

### 8.2 Farben

- Das MVP akzeptiert RGB-Hex-Werte im Format `#RRGGBB`.
- Text-, Rahmen- und Interaktionsfarben werden automatisch aus der wirksamen Hintergrundfarbe abgeleitet.
- Extrem helle oder dunkle Eingaben dürfen für Text und Zustandsanzeige durch kontrastierende Systemfarben ergänzt werden; die eingegebene Kachelfarbe selbst bleibt unverändert.

### 8.3 Icons

- Alle Icons der installierten Lucide-Version stehen ohne manuell gepflegte Allowlist zur Verfügung. Sie können über ihren offiziellen PascalCase-Namen oder in Kebab-Case referenziert werden, zum Beispiel `BrainCircuit` oder `brain-circuit`.
- Ein unbekannter Icon-Name ist ein Schema-/Semantikfehler.
- Externe Bild- oder Icon-URLs sind im MVP unzulässig.

### 8.4 Boxen und Wertstrom-Chevrons

- `visualization.shape: box` ist der Standard und verwendet die bestehende abgerundete Rechteckdarstellung.
- Chevrons sind in dieser Ausbaustufe ausschließlich für Blatt-Capabilities zulässig. Ein Chevron mit `children` ist ein Validierungsfehler mit dem Hinweis, entweder die Kinder zu entfernen oder `shape: box` zu verwenden.
- Bei `visualization.shape: chevron` und `layout.direction: vertical` wird die gesamte kompakte Capability als nach rechts gerichteter Chevron dargestellt. Direkt aufeinanderfolgende Chevron-Geschwister werden innerhalb desselben Bands von links nach rechts mit konsistentem Abstand oder leichter geometrischer Überlappung als zusammenhängender Wertstrom dargestellt.
- Bei `visualization.shape: chevron` und `layout.direction: horizontal` bleibt die kompakte Capability-Fläche rechteckig. Ein kleiner, links angebrachter und nach unten gerichteter Chevron deutet den vertikalen Wertstrom an. Die linken Indikatoren aufeinanderfolgender horizontaler Chevron-Capabilities sind ausgerichtet und werden visuell verbunden.
- Auch das letzte Element eines horizontalen Chevron-Wertstroms zeigt seinen linken, nach unten gerichteten Chevron, jedoch ohne weiterführende Verbindung zum nächsten Element.
- Boxen und Flushes unterbrechen eine Chevron-Kette in der jeweiligen Flussrichtung.
- Ein Chevron unterstützt dieselben wirksamen Farben, Icons, Auswahl-, Such-, Filter- und Doppelklick-Interaktionen wie eine Box.
- Der Capability-Name muss vollständig zugänglich bleiben. Reicht die sichtbare Chevron-Breite nicht aus, darf der Name visuell gekürzt werden, muss aber über Tooltip und zugänglichen Namen vollständig verfügbar sein.
- Form, Pfeilwinkel, Überlappung und Innenabstände werden als zentrale Design-Tokens umgesetzt und nicht pro YAML-Element konfiguriert.

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

Ein Doppelklick auf eine Capability-Box oder einen Capability-Chevron behandelt diese Capability temporär als Wurzel. Der Doppelklick darf weder den Collapse-Zustand verändern noch eine gesonderte Fokus-Schaltfläche erfordern. Eine Breadcrumb-Navigation zeigt den Pfad zur tatsächlichen Wurzel und ermöglicht schrittweise Rückkehr. Suche und Filter bleiben im Fokusmodus aktiv. Gruppen und Flushes können nicht fokussiert werden.

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

Es bietet für Nicht-Blatt-Capabilities eine Aktion zum Ein-/Ausklappen, aber weder eine Fokus-Schaltfläche noch Datenbearbeitung. Der Fokus wird ausschließlich durch Doppelklick in der Map aktiviert.

## 11. Editor, Validierung und Live-Vorschau

### 11.1 Editor

CodeMirror 6 wird als YAML-Editor eingesetzt. Er bietet Syntaxhervorhebung, Zeilennummern, Suchen, Undo/Redo und die Integration eigener Diagnostik. Die komplexe Referenzmap gemäß Abschnitt 15.4 ist zugleich das standardmäßig geladene, kommentierte Startdokument. Sie demonstriert die vollständige Varianz der unterstützten Syntax und ist das Ziel der Aktion „Auf Beispiel zurücksetzen“.

### 11.2 Validierungspipeline

Nach einer Eingabepause von ungefähr 250 ms läuft:

1. YAML-Parsing unter Erhalt von Quellpositionen;
2. strukturelle Schema-Validierung;
3. semantische Validierung;
4. Normalisierung von Defaults und Vererbung;
5. Sichtbarkeits- und Layoutberechnung;
6. Aktualisierung der Vorschau.

Semantisch validiert werden mindestens:

- global eindeutige Capability- und Gruppen-IDs;
- gültige ID-Formate;
- gültige Farben und bekannte Icons;
- maximal zwei Gruppenebenen sowie keine Gruppen innerhalb von Capability-`children`;
- gültige Positionen von Flushes und keine leeren Layoutsegmente;
- `shape: chevron` ausschließlich für Blatt-Capabilities;
- positive `layerWeight`- und `trackWeight`-Werte;
- korrekte Position von `layerWeight` und `trackWeight`;
- Verwendung des nicht mehr unterstützten Felds `weight` mit einem konkreten Migrationshinweis auf `layerWeight`;
- mindestens eine Capability direkt oder innerhalb einer Gruppe;
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

React Flow übernimmt Viewport, Eingaben und das Rendering verschachtelter Custom Nodes. Es bestimmt nicht die fachliche Anordnung. Eine eigene, pure TypeScript-Layoutfunktion berechnet in einer Bottom-up-Phase zunächst intrinsische Platzbedarfe und in einer Top-down-Phase die verfügbaren absoluten Rechtecke. Anschließend übersetzt der Adapter Capabilities und Gruppen in React-Flow-Nodes mit Elternbezug; Flushes existieren nur in der Layout-Zwischenrepräsentation.

### 13.2 Schichten

```text
YAML-Text
  -> Parser und Quellpositionsindex
  -> Schema- und Semantikvalidierung
  -> normalisiertes Capability-Modell
  -> Suche, Filter, Collapse und Fokus
  -> intrinsische Bottom-up-Platzbedarfsberechnung
  -> deterministische Top-down-Layout-Engine
  -> React-Flow-Adapter
  -> Map und Detailpanel
```

Vorgesehene interne Module:

- `domain`: Schema, normalisierte Typen und Vererbungsregeln;
- `parser`: YAML-Parsing, Quellpfade und Diagnostik;
- `layout`: pure, rekursive Bedarfs- und Layoutberechnung einschließlich Bändern, Tracks und Flushes;
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

Verbindliche Testbasis ist die komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen auf einem aktuellen durchschnittlichen Laptop:

- Editoränderung bis Abschluss von Parsing und Validierung: Zielwert unter 300 ms nach Ablauf des Debounce;
- gültige Änderung bis sichtbare Vorschau einschließlich Bottom-up-Bedarfsberechnung: Zielwert unter 750 ms;
- Suche, Filter-, Collapse- oder Fokusänderung bis aktualisierte Map: Zielwert unter 350 ms;
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
- Icon-Namen werden ausschließlich gegen den automatisch von `lucide-react` bereitgestellten Katalog aufgelöst; externe Ressourcen werden dabei nicht geladen.
- Verarbeitung und Speicherung erfolgen ausschließlich lokal im Browser.

### 14.4 Entwicklungsqualität

Die Implementierung muss mindestens folgende Skripte anbieten:

- Development-Server mit Hot Reloading;
- Produktions-Build;
- Standalone-Build als einzelne HTML-Datei mit eingebettetem CSS, JavaScript und sonstigen Assets, die direkt über `file://` ohne Webserver lauffähig ist;
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
- Gruppierung maximaler horizontaler Blöcke sowie horizontale und vertikale Flush-Grenzen;
- Bottom-up-Platzbedarf und automatische Track-Gewichtung ohne `trackWeight`;
- Bottom-up-Höhenbedarf und automatische Layer-Gewichtung ohne `layerWeight`;
- gemischte automatische und explizite Track-Gewichte einschließlich Begrenzung und Rundung;
- gemischte automatische und explizite Layer-Gewichte einschließlich Begrenzung und Rundung;
- Validierungsfehler und Migrationshinweis für das entfernte Feld `weight`;
- gemischte Richtungen auf mehreren Ebenen;
- intrinsisch kompakte Blatt-Capabilities in unterschiedlich großen Tracks;
- Box- und Chevron-Auflösung einschließlich ungültiger Chevrons mit Kindern;
- Filterlogik einschließlich Kontext-Ahnen;
- Wechselwirkung zwischen Filter und manuellem Collapse;
- Fokus und Breadcrumb-Pfade;
- semantische Zoom-Entscheidung bei Platzmangel.
- Schema, Vererbung, Ausrichtung und Collapse-Platzhalter von Gruppen auf erster und zweiter Ebene.

### 15.2 Komponenten- und Integrationstests

- gültige Änderung aktualisiert die Vorschau;
- ungültige Änderung markiert den Editor und erhält die letzte gültige Vorschau;
- Auswahl öffnet das korrekte Detailpanel;
- Beschreibungen erscheinen vollständig im Detailpanel, aber niemals in der Map;
- Reset und Wiederherstellung aus `localStorage`;
- Filter-, Suche-, Collapse- und Fokusabläufe.
- Fokus per Doppelklick auf Box und Chevron ohne sichtbare Fokus-Schaltfläche;
- horizontale Chevron-Wertströme mit linkem Abwärtsindikator einschließlich abweichendem Abschluss des letzten Elements;
- horizontales und vertikales Gruppen-Rendering auf zwei Ebenen einschließlich getrenntem Collapse-Zustand.

### 15.3 End-to-End- und visuelle Tests

- Start mit Beispiel bis zur interaktiven Map;
- fehlerhafte und anschließend korrigierte YAML-Eingabe;
- Referenzbeispiel für das Layout `[H,H,H,V,V,H,H]`;
- Referenzbeispiele mit mehreren, gemischt ausgerichteten Flushes innerhalb derselben Root-, Gruppen- und `children`-Liste;
- horizontale und vertikale Gruppen auf zwei Ebenen sowie ihre schmalen Collapse-Platzhalter;
- kompakte Blätter sowie gemischte Box- und Chevron-Wertstromdarstellungen;
- tiefer verschachtelte Map mit semantischem Zoom;
- komplexe 500-Capability-Referenzmap gemäß Abschnitt 15.4;
- Desktopansicht und Tablet-Umschaltung;
- kritische Abläufe in Chromium, Firefox und WebKit.

### 15.4 Komplexe Referenzmap

Für reproduzierbare Funktions-, Layout-, visuelle und Performanceprüfungen wird eine versionierte YAML-Referenzdatei mit folgenden Eigenschaften eingecheckt:

- insgesamt 480 bis 520 Capabilities;
- ein bis vier Capability-Ebenen, wobei nicht jeder Ast dieselbe Tiefe besitzt;
- Gruppen der ersten und zweiten Ebene in horizontaler und vertikaler Richtung;
- ungruppierte Capabilities neben Gruppen;
- horizontale und vertikale Flushes in Root-, Gruppen- und `children`-Listen;
- automatische Track- und Layer-Gewichtung sowie gezielte explizite `trackWeight`- und `layerWeight`-Ausnahmen;
- kompakte Blatt-Capabilities als Boxen und als zusammenhängende Chevron-Wertströme;
- kurze, mittlere und sehr lange deutsche sowie englische Namen, darunter lange zusammengesetzte deutsche Wörter;
- unterschiedlich lange Beschreibungen, die ausschließlich im Detailpanel sichtbar sind;
- variierende Icons, Farben, Verantwortlichkeiten, Tags, Metadaten und Vererbungskonstellationen;
- mehrere bewusst filter- und suchbare Merkmalskombinationen;
- ein deterministischer Inhalt: entweder als statische Datei oder aus einem Generator mit festem Seed, wobei CI und lokale Entwicklung exakt dasselbe Ergebnis verwenden.

Die Referenzmap ist ein versioniertes Test- und Demonstrationsartefakt und zugleich das Startbeispiel des Editors. Beim ersten Start ohne gespeichertes YAML sowie nach „Auf Beispiel zurücksetzen“ wird diese circa 500 Capabilities umfassende Datei geladen.

## 16. Abnahmekriterien des MVP

Das MVP gilt als abgenommen, wenn:

1. die statische Anwendung ohne Backend gebaut und ausgeliefert werden kann;
2. der integrierte Editor das Startbeispiel anzeigt und Änderungen lokal speichert;
3. gültiges YAML nach der definierten Pipeline live gerendert wird;
4. Syntax-, Schema- und Semantikfehler verständlich und quellnah dargestellt werden;
5. bei Fehlern die letzte gültige Vorschau sichtbar und als veraltet markiert bleibt;
6. beliebig rekursive `children` vom Schema akzeptiert werden;
7. das gemischte Layout einschließlich beider Flush-Richtungen, explizitem und automatischem `layerWeight`, explizitem und automatischem `trackWeight` sowie der Bottom-up-Bedarfsberechnung dem beschriebenen Algorithmus entspricht;
8. Farb- und Icon-Vererbung korrekt funktioniert;
9. Suche, Metadatenfilter, Collapse und der ausschließlich per Doppelklick aktivierte Fokusmodus korrekt zusammenspielen;
10. Auswahl einer Capability alle definierten Details im Panel zeigt;
11. Zoom, Pan und „Ansicht einpassen“ funktionieren;
12. die komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen die Performance-Ziele im vereinbarten Testsystem erfüllt;
13. Desktop-Browser und Tablet-Darstellung gemäß Zielrahmen getestet sind;
14. Linting, Typecheck, automatisierte Tests und Produktions-Build erfolgreich durchlaufen;
15. die Map keine grafische Bearbeitung zulässt und vollständig aus dem YAML reproduzierbar ist;
16. gruppierte und ungruppierte Root-Capabilities gemeinsam darstellbar sind, Gruppen bis zur zweiten Gruppenebene funktionieren, Gruppenfarben nicht vererbt werden und eingeklappte Gruppen als schmale, vollständig beschriftete Struktur sichtbar bleiben;
17. Blatt-Capabilities unabhängig vom verfügbaren Raum kompakt bleiben und Beschreibungen ausschließlich im Detailpanel erscheinen;
18. Blatt-Capabilities sowohl als Box als auch richtungsabhängig als vollflächiger Rechts-Chevron oder als rechteckiges Element mit linkem Abwärts-Chevron dargestellt werden können;
19. die Referenzdatei alle in Abschnitt 15.4 definierten Varianzmerkmale reproduzierbar abdeckt.

## 17. Ausbaustufen

Priorisierte Weiterentwicklung nach dem MVP:

1. Dateiimport und -download, Laden beim Build sowie Laden über URL;
2. Export nach SVG und PNG;
3. PowerPoint-Export, möglichst mit editierbaren Formen und erhaltener Capability-Hierarchie statt eines reinen Screenshots;
4. Datenmengen deutlich oberhalb der verbindlichen 500-Capability-Referenzmap mit weitergehendem Profiling, Virtualisierung oder alternativen Renderstrategien;
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
5. Gruppen enthalten mindestens eine Capability, bleiben bei Filtern immer strukturell sichtbar und zeigen ihren vollständigen Namen auch im eingeklappten farbigen Platzhalter.
6. Gruppen der zweiten Ebene sind ausschließlich direkt in einer Root-Gruppe zulässig. Gruppen innerhalb von Capability-`children` und eine dritte Gruppenebene sind verboten.
7. Ein `horizontal`-Flush beginnt rechts einen neuen Track; ein `vertical`-Flush beginnt darunter ein neues Band. Jede Elementliste darf beliebig viele Flushes beider Richtungen enthalten und abwechseln. Führende, abschließende und direkt aufeinanderfolgende Flushes sind ungültig.
8. `visualization.shape: chevron` ist ausschließlich für Blatt-Capabilities zulässig. Vertikale Elemente verwenden einen vollflächigen Rechts-Chevron; horizontal gestapelte Elemente bleiben rechteckig und verwenden links einen Abwärts-Chevron. Das letzte horizontale Element zeigt den Indikator ohne ausgehende Verbindung.
9. Explizite `trackWeight`- und `layerWeight`-Werte überschreiben die jeweilige automatische Bedarfsableitung. Automatische Gewichte werden relativ zum Median normalisiert und initial auf `0,5` bis `3` begrenzt.
10. Das bisherige `layout.weight` wird durch `layout.layerWeight` ersetzt, nicht als Alias unterstützt und als Validierungsfehler mit Migrationshinweis behandelt.
11. Die komplexe Referenzmap mit circa 500 Capabilities ist zugleich das standardmäßig geladene Startbeispiel und das Ziel von „Auf Beispiel zurücksetzen“.
12. Der Fokusmodus wird ausschließlich per Doppelklick auf eine Capability aktiviert; sichtbare Fokus-Schaltflächen entfallen.
