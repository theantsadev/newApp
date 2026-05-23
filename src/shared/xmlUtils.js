import { XMLParser, XMLBuilder } from "fast-xml-parser";

// ─────────────────────────────────────────────
// DOM (utilisé uniquement dans prestashopClient)
// ─────────────────────────────────────────────

export const parseXmlDoc = (xmlText) =>
    new DOMParser().parseFromString(xmlText, "text/xml");

export const getTextContent = (dom, selector) =>
    dom.querySelector(selector)?.textContent?.trim() || "";

// ─────────────────────────────────────────────
// fast-xml-parser (utilisé dans tous les services)
// ─────────────────────────────────────────────

const parserConfig = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: true,
    trimValues: true,
};

export const parseXmlToJson = (xmlString) => {
    const parser = new XMLParser(parserConfig);
    return parser.parse(xmlString);
};

export const buildXmlFromJson = (json) => {
    const builder = new XMLBuilder({ ...parserConfig, format: true });
    return builder.build(json);
};

// ─────────────────────────────────────────────
// Helpers de valeur
// ─────────────────────────────────────────────

/** Extrait la valeur d'un champ parsé par fast-xml-parser. */
export const getValue = (field) => {
    if (field == null)            return "";
    if (typeof field !== "object") return field;
    return field["#text"] || "";
};

/** Génère les balises <language> pour chaque id de langue. */
export const buildLangXml = (languageIds, value) =>
    languageIds
        .map((id) => `<language id="${id}"><![CDATA[${value}]]></language>`)
        .join("");

// ─────────────────────────────────────────────
// Helpers de chaîne
// ─────────────────────────────────────────────

export const slugify = (value) =>
    String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");