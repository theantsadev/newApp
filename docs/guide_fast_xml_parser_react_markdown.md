# XML ↔ JSON avec `fast-xml-parser` (React / JavaScript)

## Installation

```bash
npm install fast-xml-parser
```

---

# 1. XML → JSON

## Exemple simple

```javascript
import { XMLParser } from "fast-xml-parser";

const xml = `
<user>
    <name>Mike</name>
    <age>20</age>
</user>
`;

const parser = new XMLParser();

const json = parser.parse(xml);

console.log(json);
```

## Résultat

```json
{
  "user": {
    "name": "Mike",
    "age": 20
  }
}
```

---

# 2. JSON → XML

## Exemple simple

```javascript
import { XMLBuilder } from "fast-xml-parser";

const json = {
    user: {
        name: "Mike",
        age: 20
    }
};

const builder = new XMLBuilder();

const xml = builder.build(json);

console.log(xml);
```

## Résultat

```xml
<user>
  <name>Mike</name>
  <age>20</age>
</user>
```

---

# 3. Gestion des attributs XML

## XML avec attribut

```xml
<user id="1">
    <name>Mike</name>
</user>
```

## Parser XML → JSON

```javascript
import { XMLParser } from "fast-xml-parser";

const xml = `
<user id="1">
    <name>Mike</name>
</user>
`;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

const json = parser.parse(xml);

console.log(json);
```

## Résultat JSON

```json
{
  "user": {
    "@_id": "1",
    "name": "Mike"
  }
}
```

---

# 4. JSON → XML avec attributs

```javascript
import { XMLBuilder } from "fast-xml-parser";

const json = {
    user: {
        "@_id": "1",
        name: "Mike"
    }
};

const builder = new XMLBuilder({
    ignoreAttributes: false
});

const xml = builder.build(json);

console.log(xml);
```

## Résultat XML

```xml
<user id="1">
  <name>Mike</name>
</user>
```

---

# 5. Utilisation avec Fetch API

```javascript
import { XMLParser } from "fast-xml-parser";

async function loadXML() {

    const response = await fetch("/data.xml");

    const xmlText = await response.text();

    const parser = new XMLParser();

    const data = parser.parse(xmlText);

    console.log(data);
}
```

---

# 6. Options utiles

```javascript
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
    parseTagValue: true,
    trimValues: true
});
```

| Option | Description |
|---|---|
| ignoreAttributes | Lire les attributs XML |
| attributeNamePrefix | Préfixe des attributs |
| allowBooleanAttributes | Support des attributs booléens |
| parseTagValue | Convertit automatiquement nombres/boolean |
| trimValues | Supprime les espaces |

---

# 7. Cas d’utilisation courants

- APIs SOAP
- Import/export XML
- Configuration XML
- Conversion XML ⇄ JSON
- Parsing de flux RSS/XML
- Intégration de services legacy

---

# Documentation officielle

https://github.com/NaturalIntelligence/fast-xml-parser

